"""Apply or transactionally validate the NOW Legal access/lawyer migration."""
import os
import sys
from pathlib import Path
import psycopg2

dry_run='--dry-run' in sys.argv
sql=Path(__file__).with_name('20260913_0018_now_legal_admins_and_lawyers.sql').read_text(encoding='utf-8')
sql=sql.replace('BEGIN;','',1).rsplit('COMMIT;',1)[0]
with psycopg2.connect(os.environ['DATABASE_URL'].replace('postgresql+asyncpg','postgresql')) as db:
    with db.cursor() as q:
        q.execute(sql)
        q.execute("""SELECT count(*) FROM platform.users u JOIN legal.client_administrators a ON a.user_id=u.id
          JOIN legal.legal_clients c ON c.id=a.client_id WHERE c.code='inversiones_asesorias_now'
          AND lower(u.email) IN ('fhevia@asesoriasnow.cl','procurador@asesoriasnow.cl','rluna@asesoriasnow.cl')
          AND u.role='admin' AND u.is_active""")
        admins=q.fetchone()[0]
        q.execute("""SELECT l.name,count(pc.id) FROM legal.client_lawyers l
          JOIN legal.legal_clients c ON c.id=l.client_id LEFT JOIN legal.legal_portfolio_cases pc ON pc.lawyer_id=l.id
          WHERE c.code='inversiones_asesorias_now' GROUP BY l.id,l.name ORDER BY lower(l.name)""")
        lawyers=q.fetchall()
        assert admins==3,admins
        assert {name.casefold() for name,_ in lawyers}=={'fhevia','luna'},lawyers
        print({'admins':admins,'lawyers':lawyers,'dry_run':dry_run})
    if dry_run: db.rollback()
    else: db.commit()
