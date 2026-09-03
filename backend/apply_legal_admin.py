"""Apply the reviewed migration with the existing API database credential."""
import os
import sys
from pathlib import Path
import psycopg2

with psycopg2.connect(os.environ['DATABASE_URL'].replace('postgresql+asyncpg','postgresql')) as db:
    with db.cursor() as q:
        q.execute("SELECT count(*) FROM legal.legal_clients c CROSS JOIN platform.users u WHERE c.code='inversiones_asesorias_now' AND lower(u.email)='fhevia@asesoriasnow.cl' AND u.role='admin' AND u.is_active")
        assert q.fetchone()[0]==1, 'Expected exactly one approved client/user pair'
        migration='legal_admin_emails.sql' if '--emails' in sys.argv else 'legal_admin.sql'
        sql=Path(__file__).with_name(migration).read_text(encoding='utf-8')
        q.execute(sql.replace('BEGIN;','').replace('COMMIT;',''))
        q.execute('SELECT count(*) FROM legal.client_administrators')
        print('Migration applied; explicit admin mappings:',q.fetchone()[0])
