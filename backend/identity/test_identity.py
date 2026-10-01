import uuid
from types import SimpleNamespace
from urllib.parse import urlparse,parse_qs
import pytest
import pytest_asyncio
import httpx
from fastapi import FastAPI, HTTPException, Request
from sqlalchemy import Table,Column,String,Boolean,select
from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker
from .store import Store,metadata
from .service import IdentityService,IdentityError,TERMS_VERSION,referral_code,digest,destination
from .router import Config,create_router,identity_error_handler,COOKIE

users_table=Table('test_existing_users',metadata,Column('id',String,primary_key=True),Column('email',String,unique=True),Column('active',Boolean))

class ExistingUsers:
    async def find_by_email(self,db,email):
        return (await db.execute(select(users_table.c.id).where(users_table.c.email==email.lower()))).scalar_one_or_none()
    async def create_google_user(self,db,*,email,name):
        user=str(uuid.uuid4())
        await db.execute(users_table.insert().values(id=user,email=email.lower(),active=True))
        return user
    async def assert_active(self,db,user_id):
        active=(await db.execute(select(users_table.c.active).where(users_table.c.id==user_id))).scalar_one_or_none()
        if active is not True:raise IdentityError('INACTIVE_ACCOUNT',403)
    async def issue_session(self,db,user_id):
        return {'access_token':'test-only-session-'+user_id,'user':{'id':user_id}}

@pytest_asyncio.fixture
async def setup(tmp_path):
    engine=create_async_engine('sqlite+aiosqlite:///'+str(tmp_path/'identity.db'))
    async with engine.begin() as c:await c.run_sync(metadata.create_all)
    factory=async_sessionmaker(engine,expire_on_commit=False)
    users=ExistingUsers();store=Store();clock=[1000]
    service=IdentityService(store,users,clock=lambda:clock[0])
    async with factory() as db,db.begin():
        first=await users.create_google_user(db,email='first@example.com',name='First')
        await service.ensure_profile(db,first)
    yield factory,service,users,first,clock
    await engine.dispose()

async def google(service,db,*,subject='sub-1',email='new@example.com',browser='browser',referral='',link_user=None,product='legal'):
    state,nonce,verifier=await service.start(db,browser,product,referral,link_user)
    claims={'sub':subject,'email':email,'email_verified':True,'nonce':nonce,'name':'New user'}
    ticket=await service.finish(db,state,browser,claims,None)
    return await service.redeem(db,ticket,browser)

@pytest.mark.asyncio
async def test_new_google_identity_and_repeat_login(setup):
    factory,s,users,first,clock=setup
    async with factory() as db,db.begin():
        data=await google(s,db)
        again=await google(s,db,email='changed@example.com')
        assert data['user']==again['user']
        assert not data['onboarding']['completed']
        assert await users.find_by_email(db,'changed@example.com') is None

@pytest.mark.asyncio
async def test_existing_email_never_implicitly_links(setup):
    factory,s,users,first,clock=setup
    async with factory() as db,db.begin():
        with pytest.raises(IdentityError,match='SIGN_IN_WITH_PASSWORD_TO_LINK_GOOGLE'):
            await google(s,db,email='first@example.com')

@pytest.mark.asyncio
async def test_explicit_link_and_other_user_rejected(setup):
    factory,s,users,first,clock=setup
    async with factory() as db,db.begin():
        data=await google(s,db,email='first@example.com',link_user=first)
        assert data['user']['id']==first
        other=await users.create_google_user(db,email='other@example.com',name='Other')
        with pytest.raises(IdentityError,match='GOOGLE_ACCOUNT_ALREADY_LINKED'):
            await google(s,db,link_user=other)

@pytest.mark.asyncio
@pytest.mark.parametrize('field,value',[('nonce','wrong'),('email_verified',False),('email_verified','true'),('sub',''),('email','')])
async def test_invalid_claims(setup,field,value):
    factory,s,_,_,_=setup
    async with factory() as db,db.begin():
        state,nonce,_=await s.start(db,'browser')
        claims={'sub':'abc','email':'x@example.com','email_verified':True,'nonce':nonce};claims[field]=value
        with pytest.raises(IdentityError,match='INVALID_GOOGLE_IDENTITY'):
            await s.finish(db,state,'browser',claims,None)

@pytest.mark.asyncio
async def test_flow_browser_binding_expiry_and_replay(setup):
    factory,s,_,_,clock=setup
    async with factory() as db,db.begin():
        state,nonce,_=await s.start(db,'browser')
        claims={'sub':'abc','email':'x@example.com','email_verified':True,'nonce':nonce}
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_FLOW'):await s.finish(db,state,'other',claims,None)
        ticket=await s.finish(db,state,'browser',claims,None)
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_FLOW'):await s.finish(db,state,'browser',claims,None)
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_TICKET'):await s.redeem(db,ticket,'other')
        await s.redeem(db,ticket,'browser')
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_TICKET'):await s.redeem(db,ticket,'browser')
        state,nonce,_=await s.start(db,'browser');clock[0]+=601
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_FLOW'):await s.finish(db,state,'browser',claims,None)

@pytest.mark.asyncio
async def test_ticket_survives_session_restart_and_expires(setup):
    factory,s,_,_,clock=setup
    async with factory() as db,db.begin():
        state,nonce,_=await s.start(db,'browser')
        ticket=await s.finish(db,state,'browser',{'sub':'a','email':'a@example.com','email_verified':True,'nonce':nonce},None)
    async with factory() as db,db.begin():
        clock[0]+=61
        with pytest.raises(IdentityError,match='INVALID_OR_EXPIRED_TICKET'):await s.redeem(db,ticket,'browser')

@pytest.mark.asyncio
async def test_shared_onboarding_referral_and_idempotency(setup):
    factory,s,_,first,_=setup
    async with factory() as db,db.begin():
        ref=(await s.ensure_profile(db,first))['code']
        data=await google(s,db,referral=ref)
        user=data['user']['id']
        payload=dict(full_name='Real Name',accept_terms=True,terms_version=TERMS_VERSION,referral_code=ref)
        result=await s.complete(db,user,payload)
        assert result['completed'] and result['referred_by']==first
        assert await s.complete(db,user,payload)==result
        for product in ['home','legal','quant','aeroclub']:
            assert (await google(s,db,product=product))['onboarding']['completed']

@pytest.mark.asyncio
async def test_no_self_referral_or_reassignment(setup):
    factory,s,users,first,_=setup
    async with factory() as db,db.begin():
        profile=await s.ensure_profile(db,first)
        with pytest.raises(IdentityError,match='SELF_REFERRAL'):await s.attribute(db,first,profile['code'])
        data=await google(s,db,referral=profile['code'])
        other=await users.create_google_user(db,email='other@example.com',name='Other')
        code=(await s.ensure_profile(db,other))['code']
        with pytest.raises(IdentityError,match='REFERRAL_ALREADY_ASSIGNED'):await s.attribute(db,data['user']['id'],code)

@pytest.mark.asyncio
@pytest.mark.parametrize('payload',[{},dict(full_name='Name',accept_terms=False,terms_version=TERMS_VERSION),dict(full_name='Name',accept_terms=True,terms_version='old')])
async def test_onboarding_validation(setup,payload):
    factory,s,_,first,_=setup
    async with factory() as db,db.begin():
        with pytest.raises(IdentityError):await s.complete(db,first,payload)
        assert not (await s.ensure_profile(db,first))['completed']

@pytest.mark.asyncio
async def test_inactive_account_cannot_login(setup):
    factory,s,_,first,_=setup
    async with factory() as db,db.begin():
        await db.execute(users_table.update().where(users_table.c.id==first).values(active=False))
        with pytest.raises(IdentityError,match='INACTIVE_ACCOUNT'):await google(s,db,link_user=first)

@pytest.mark.parametrize('bad',['//evil.com','javascript:alert(1)','../admin','unknown'])
def test_destination_allowlist(bad):
    with pytest.raises(IdentityError):destination(bad)

@pytest.mark.parametrize('bad',['<script>','ABC','A'*13,'ABCD00000000'])
def test_invalid_codes(bad):
    with pytest.raises(IdentityError):referral_code(bad)

@pytest.mark.asyncio
async def test_full_http_flow_cookie_csrf_pkce_and_one_time_redemption(setup):
    factory,s,users,first,_=setup
    async def db_dep():
        async with factory() as db:yield db
    async def current(request:Request):
        if request.headers.get('authorization')!='Bearer existing':raise HTTPException(401)
        return SimpleNamespace(id=first)
    config=Config('client','secret','https://api.test/api/v1/identity/google/callback','https://web.test', 'https://web.test/terms','https://web.test/privacy')
    captured={}
    async def verify(code,verifier,config):
        assert code=='google-code' and len(verifier)>40
        return {'sub':'test-sub','email':'test@example.com','email_verified':True,'nonce':captured['nonce']}
    app=FastAPI();app.add_exception_handler(IdentityError,identity_error_handler)
    app.include_router(create_router(config=config,users=users,get_db=db_dep,current_user=current,verify=verify))
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='https://api.test') as client:
        assert (await client.post('/api/v1/identity/google/start',json={})).status_code==403
        response=await client.post('/api/v1/identity/google/start',json={},headers={'Origin':'https://web.test'})
        assert response.status_code==200
        cookie=response.headers['set-cookie'];assert 'HttpOnly' in cookie and 'Secure' in cookie and 'SameSite=lax' in cookie
        params=parse_qs(urlparse(response.json()['url']).query);captured['nonce']=params['nonce'][0]
        assert params['code_challenge_method']==['S256'] and 'code_challenge' in params
        response=await client.get('/api/v1/identity/google/callback',params={'code':'google-code','state':params['state'][0]})
        assert response.status_code==303 and 'no-store' in response.headers['cache-control']
        ticket=parse_qs(urlparse(response.headers['location']).query)['ticket'][0]
        response=await client.post('/api/v1/identity/google/redeem',json={'ticket':ticket},headers={'Origin':'https://web.test'})
        assert response.status_code==200 and response.json()['access_token'].startswith('test-only-')
        assert (await client.post('/api/v1/identity/google/redeem',json={'ticket':ticket},headers={'Origin':'https://web.test'})).status_code==401
        assert (await client.get('/api/v1/identity/onboarding')).status_code==401
        assert (await client.get('/api/v1/identity/onboarding',headers={'Authorization':'Bearer existing'})).status_code==200

@pytest.mark.asyncio
@pytest.mark.parametrize('mutation',['valid','audience','issuer','expired','signature'])
async def test_real_google_token_verifier_offline(monkeypatch,mutation):
    # Cryptographic verification runs for real; only network/token exchange is replaced.
    import json,time,datetime
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes,serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID
    from google.auth import jwt,crypt
    from . import router as module
    key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'test.invalid')])
    now=datetime.datetime.now(datetime.timezone.utc)
    cert=x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key()).serial_number(1).not_valid_before(now-datetime.timedelta(days=1)).not_valid_after(now+datetime.timedelta(days=1)).sign(key,hashes.SHA256())
    signing_key=rsa.generate_private_key(public_exponent=65537,key_size=2048) if mutation=='signature' else key
    private=signing_key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption())
    signer=crypt.RSASigner.from_string(private,key_id='test-key')
    payload={'iss':'https://accounts.google.com','aud':'client','sub':'subject','email':'verified@example.com','email_verified':True,'nonce':'nonce','iat':int(time.time())-10,'exp':int(time.time())+300}
    if mutation=='audience':payload['aud']='attacker'
    if mutation=='issuer':payload['iss']='https://attacker.invalid'
    if mutation=='expired':payload['exp']=int(time.time())-100
    token=jwt.encode(signer,payload).decode()
    class CertResponse:
        status=200
        data=json.dumps({'test-key':cert.public_bytes(serialization.Encoding.PEM).decode()}).encode()
    monkeypatch.setattr(module,'GoogleRequest',lambda:lambda *a,**kw:CertResponse())
    client_type=httpx.AsyncClient
    transport=httpx.MockTransport(lambda request:httpx.Response(200,json={'id_token':token}))
    monkeypatch.setattr(module.httpx,'AsyncClient',lambda **kw:client_type(transport=transport,**kw))
    config=Config('client','secret','https://api.test/callback','https://web.test','https://web.test/terms','https://web.test/privacy')
    if mutation=='valid':
        assert (await module.google_claims('code','verifier',config))['sub']=='subject'
    else:
        with pytest.raises(IdentityError,match='INVALID_GOOGLE_TOKEN'):
            await module.google_claims('code','verifier',config)

@pytest.mark.parametrize('bad',['https://evil.test','//evil.test','javascript:alert(1)','/login.html','/app.html\\evil','/app.html\n'])
def test_server_rejects_unsafe_destination(bad):
    from .service import safe_destination
    with pytest.raises(IdentityError):safe_destination('legal',bad)

@pytest.mark.asyncio
async def test_server_preserves_destination(setup):
    factory,s,_,_,_=setup
    async with factory() as db,db.begin():
        state,nonce,_=await s.start(db,'browser','portadas',next_path='/portada.html?mode=edit')
        ticket=await s.finish(db,state,'browser',{'sub':'p','email':'p@example.com','email_verified':True,'nonce':nonce},None)
        assert (await s.redeem(db,ticket,'browser'))['destination']=='/portada.html?mode=edit'

@pytest.mark.asyncio
async def test_returning_completed_user_ignores_new_referral(setup):
    factory,s,_,first,_=setup
    async with factory() as db,db.begin():
        data=await google(s,db)
        await s.complete(db,data['user']['id'],dict(full_name='A User',accept_terms=True,terms_version=TERMS_VERSION))
        code=(await s.ensure_profile(db,first))['code']
        again=await google(s,db,referral=code)
        assert again['onboarding']['completed'] and again['onboarding']['referred_by'] is None
