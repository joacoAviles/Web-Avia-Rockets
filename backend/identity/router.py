"""FastAPI routes; caller injects canonical users, authentication and DB sessions."""
import base64
import hashlib
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode, urlparse
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.concurrency import run_in_threadpool
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from .service import IdentityError, IdentityService, digest
from .store import Store

COOKIE = '__Host-avia_google_flow'

@dataclass(frozen=True)
class Config:
    client_id: str
    client_secret: str
    callback_url: str
    web_origin: str
    terms_url: str
    privacy_url: str

    def __post_init__(self):
        for value in (self.callback_url,self.web_origin,self.terms_url,self.privacy_url):
            parsed=urlparse(value)
            if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
                raise ValueError('Identity URLs must be fixed HTTPS URLs')
        if urlparse(self.web_origin).path not in ('','/'):
            raise ValueError('web_origin cannot include a path')
        if not self.client_id or not self.client_secret:
            raise ValueError('Google OAuth credentials are required')

class Start(BaseModel):
    model_config=ConfigDict(extra='forbid')
    product: str='home'
    next_path: str | None=Field(default=None,max_length=2000)
    referral_code: str=Field(default='',max_length=12)

class Complete(BaseModel):
    model_config=ConfigDict(extra='forbid')
    full_name: str=Field(min_length=2,max_length=200)
    accept_terms: bool
    terms_version: str
    referral_code: str=Field(default='',max_length=12)

class Redeem(BaseModel):
    ticket: str=Field(min_length=20,max_length=100)

async def google_claims(code,verifier,config):
    async with httpx.AsyncClient(timeout=15) as client:
        response=await client.post('https://oauth2.googleapis.com/token',data={
            'code':code,'code_verifier':verifier,'client_id':config.client_id,
            'client_secret':config.client_secret,'redirect_uri':config.callback_url,
            'grant_type':'authorization_code'})
    if response.status_code!=200:
        raise IdentityError('GOOGLE_EXCHANGE_FAILED',401)
    token=response.json().get('id_token')
    if not token: raise IdentityError('GOOGLE_TOKEN_MISSING',401)
    try:
        return await run_in_threadpool(id_token.verify_oauth2_token,token,GoogleRequest(),config.client_id)
    except (ValueError,TypeError,GoogleAuthError):
        raise IdentityError('INVALID_GOOGLE_TOKEN',401)


def create_router(*,config,users,get_db,current_user,verify=google_claims):
    router=APIRouter(prefix='/api/v1/identity',tags=['identity'])
    store=Store(); service=IdentityService(store,users)

    def check_origin(request):
        if request.headers.get('origin')!=config.web_origin.rstrip('/'):
            raise HTTPException(403,'ORIGIN_NOT_ALLOWED')

    def no_cache(response):
        response.headers['Cache-Control']='no-store'
        response.headers['Referrer-Policy']='no-referrer'
        return response

    async def begin(request,payload,db,link_user=None):
        check_origin(request)
        browser=secrets.token_urlsafe(32)
        async with db.begin():
            await store.cleanup(db,int(service.clock()))
            state,nonce,verifier=await service.start(db,browser,payload.product,payload.referral_code,link_user,payload.next_path)
        challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
        url='https://accounts.google.com/o/oauth2/v2/auth?'+urlencode({
            'client_id':config.client_id,'redirect_uri':config.callback_url,'response_type':'code',
            'scope':'openid email profile','state':state,'nonce':nonce,
            'code_challenge':challenge,'code_challenge_method':'S256'})
        response=no_cache(JSONResponse({'url':url}))
        response.set_cookie(COOKIE,browser,max_age=660,secure=True,httponly=True,samesite='lax',path='/')
        return response

    @router.get('/config')
    async def public_config():
        return no_cache(JSONResponse({'google_enabled':True,'terms_version':'2026-09-25','terms_url':config.terms_url,'privacy_url':config.privacy_url}))

    @router.post('/google/start')
    async def start(payload:Start,request:Request,db=Depends(get_db)):
        return await begin(request,payload,db)

    @router.post('/google/link')
    async def link(payload:Start,request:Request,user=Depends(current_user),db=Depends(get_db)):
        # current_user must authenticate with the existing Bearer token and return canonical ID.
        return await begin(request,payload,db,str(user.id))

    @router.get('/google/callback')
    async def callback(request:Request,state:str='',code:str='',error:str='',db=Depends(get_db)):
        browser=request.cookies.get(COOKIE,'')
        if not state or not browser:
            raise HTTPException(400,'INVALID_OR_EXPIRED_FLOW')
        async with db.begin():
            flow=await store.peek_flow(db,digest(state),digest(browser),int(service.clock()))
            if not flow: raise HTTPException(400,'INVALID_OR_EXPIRED_FLOW')
        if error:
            async with db.begin():
                await store.take_flow(db,digest(state),digest(browser),int(service.clock()))
            return no_cache(RedirectResponse(config.web_origin+'/login.html?identity_error=GOOGLE_CANCELLED',status_code=303))
        if not code: raise HTTPException(400,'GOOGLE_CODE_MISSING')
        try:
            claims=await verify(code,flow['verifier'],config)
            async with db.begin():
                ticket=await service.finish(db,state,browser,claims,config)
        except IdentityError as exc:
            response=no_cache(RedirectResponse(config.web_origin+'/login.html?'+urlencode({'identity_error':exc.code}),status_code=303))
            response.delete_cookie(COOKIE,path='/',secure=True,httponly=True,samesite='lax')
            return response
        # Ticket is one-use, 60 seconds, bound to the HttpOnly browser cookie; never an access token.
        return no_cache(RedirectResponse(config.web_origin+'/auth-complete.html?'+urlencode({'ticket':ticket}),status_code=303))

    @router.post('/google/redeem')
    async def redeem(payload:Redeem,request:Request,db=Depends(get_db)):
        check_origin(request)
        async with db.begin():
            data=await service.redeem(db,payload.ticket,request.cookies.get(COOKIE,''))
        response=no_cache(JSONResponse(data));response.delete_cookie(COOKIE,path='/',secure=True,httponly=True,samesite='lax')
        return response

    @router.get('/onboarding')
    async def profile(user=Depends(current_user),db=Depends(get_db)):
        async with db.begin():
            data=await service.ensure_profile(db,str(user.id))
        return no_cache(JSONResponse(data))

    @router.post('/onboarding')
    async def complete(payload:Complete,request:Request,user=Depends(current_user),db=Depends(get_db)):
        check_origin(request)
        async with db.begin():
            data=await service.complete(db,str(user.id),payload.model_dump())
        return no_cache(JSONResponse(data))

    return router

async def identity_error_handler(request,exc):
    return JSONResponse({'detail':exc.code},status_code=exc.status,headers={'Cache-Control':'no-store'})
