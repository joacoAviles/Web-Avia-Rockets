"""SQLAlchemy async storage, shared PostgreSQL state; no in-memory OAuth sessions."""
import json
from sqlalchemy import Column, String, BigInteger, Boolean, Table, MetaData, select, update, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from .service import IdentityError

metadata = MetaData()
flows = Table('identity_flows', metadata, Column('key', String(64), primary_key=True),
              Column('browser', String(64), nullable=False), Column('expires', BigInteger, nullable=False),
              Column('data', String, nullable=False))
tickets = Table('identity_tickets', metadata, Column('key', String(64), primary_key=True),
                Column('browser', String(64), nullable=False), Column('expires', BigInteger, nullable=False),
                Column('data', String, nullable=False))
links = Table('identity_google_links', metadata, Column('subject', String(255), primary_key=True),
              Column('user_id', String(36), nullable=False, unique=True))
profiles = Table('identity_profiles', metadata, Column('user_id', String(36), primary_key=True),
                 Column('code', String(12), unique=True, nullable=False),
                 Column('referred_by', String(36)), Column('completed', Boolean, nullable=False, default=False),
                 Column('full_name', String(200)), Column('terms_version', String(40)), Column('completed_at', BigInteger))

class Store:
    def insert(self, db, table):
        return (sqlite_insert if db.bind.dialect.name == 'sqlite' else pg_insert)(table)

    async def put(self, db, table, key, data):
        await db.execute(table.insert().values(key=key, browser=data['browser'], expires=data['expires'], data=json.dumps(data)))

    async def peek_flow(self, db, key, browser, now):
        row = (await db.execute(select(flows.c.data).where(flows.c.key==key, flows.c.browser==browser, flows.c.expires>now))).scalar_one_or_none()
        return json.loads(row) if row else None

    async def take(self, db, table, key, browser, now):
        # Atomic consume works across workers and survives restarts.
        row = (await db.execute(delete(table).where(table.c.key==key, table.c.browser==browser, table.c.expires>now).returning(table.c.data))).scalar_one_or_none()
        return json.loads(row) if row else None

    async def put_flow(self, db, key, data): await self.put(db, flows, key, data)
    async def put_ticket(self, db, key, data): await self.put(db, tickets, key, data)
    async def take_flow(self, db, key, browser, now): return await self.take(db, flows, key, browser, now)
    async def take_ticket(self, db, key, browser, now): return await self.take(db, tickets, key, browser, now)

    async def google_user(self, db, subject):
        return (await db.execute(select(links.c.user_id).where(links.c.subject==subject))).scalar_one_or_none()

    async def link_google(self, db, subject, user_id):
        await db.execute(self.insert(db, links).values(subject=subject,user_id=user_id).on_conflict_do_nothing())
        if await self.google_user(db,subject) != user_id:
            raise IdentityError('GOOGLE_ACCOUNT_ALREADY_LINKED',409)

    async def profile(self, db, user_id):
        row = (await db.execute(select(profiles).where(profiles.c.user_id==user_id).with_for_update())).mappings().first()
        return dict(row) if row else None

    async def create_profile(self, db, user_id, code):
        await db.execute(self.insert(db,profiles).values(user_id=user_id,code=code,completed=False).on_conflict_do_nothing())
        if not await self.profile(db,user_id):
            raise IdentityError('REFERRAL_CODE_COLLISION_RETRY',503)

    async def referrer(self, db, code):
        return (await db.execute(select(profiles.c.user_id).where(profiles.c.code==code))).scalar_one_or_none()

    async def attribute(self, db, user_id, owner):
        await db.execute(update(profiles).where(profiles.c.user_id==user_id).values(referred_by=owner))

    async def complete(self, db, user_id, name, version, now):
        await db.execute(update(profiles).where(profiles.c.user_id==user_id,profiles.c.completed==False).values(
            full_name=name,terms_version=version,completed_at=now,completed=True))

    async def cleanup(self, db, now):
        for table in (flows,tickets):
            await db.execute(delete(table).where(table.c.expires<=now))
