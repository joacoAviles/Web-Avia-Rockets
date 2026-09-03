"""Read-only inspection of the current lawyer email sources."""
import os
import psycopg2
with psycopg2.connect(os.environ['DATABASE_URL'].replace('postgresql+asyncpg','postgresql')) as db:
    db.set_session(readonly=True)
    with db.cursor() as q:
        q.execute("""SELECT l.id,l.name,l.email,count(pc.id),
          array_agg(DISTINCT nullif(lower(trim(pc.settings->>'assigned_lawyer_email')),'')) AS assigned_emails
          FROM legal.client_lawyers l LEFT JOIN legal.legal_portfolio_cases pc ON pc.lawyer_id=l.id
          JOIN legal.legal_clients c ON c.id=l.client_id WHERE c.code='inversiones_asesorias_now'
          GROUP BY l.id,l.name,l.email ORDER BY l.name""")
        print('LAWYERS / CURRENT EMAIL SOURCES',q.fetchall())
        q.execute("SELECT count(*),array_agg(DISTINCT action) FROM legal.admin_edit_audit")
        print('EXISTING EDITS',q.fetchall())
        q.execute("""SELECT l.name,cr.email,cr.name,cr.recipient_type,count(*)
          FROM legal.legal_portfolio_case_recipients cr JOIN legal.legal_portfolio_cases pc ON pc.id=cr.portfolio_case_id
          JOIN legal.client_lawyers l ON l.id=pc.lawyer_id WHERE cr.is_active
          GROUP BY l.name,cr.email,cr.name,cr.recipient_type ORDER BY l.name,cr.email""")
        print('ACTIVE CASE RECIPIENTS',q.fetchall())
