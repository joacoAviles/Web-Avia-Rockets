BEGIN;
CREATE TABLE IF NOT EXISTS legal.client_administrators (
 client_id uuid REFERENCES legal.legal_clients(id) ON DELETE CASCADE,
 user_id uuid REFERENCES platform.users(id) ON DELETE CASCADE,
 PRIMARY KEY(client_id,user_id));
INSERT INTO legal.client_administrators(client_id,user_id)
 SELECT c.id,u.id FROM legal.legal_clients c CROSS JOIN platform.users u
 WHERE c.code='inversiones_asesorias_now' AND lower(u.email)='fhevia@asesoriasnow.cl' AND u.role='admin'
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS legal.client_lawyers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES legal.legal_clients(id),
 name text NOT NULL CHECK(length(trim(name))>0), email text, version integer NOT NULL DEFAULT 1,
 UNIQUE(client_id,name));
ALTER TABLE legal.legal_portfolio_cases ADD COLUMN IF NOT EXISTS lawyer_id uuid REFERENCES legal.client_lawyers(id) ON DELETE RESTRICT;
CREATE TABLE IF NOT EXISTS legal.client_cause_settings (
 client_id uuid REFERENCES legal.legal_clients(id), cause_id uuid REFERENCES legal.causes(id),
 castigo boolean NOT NULL DEFAULT false, fields jsonb NOT NULL DEFAULT '{}',
 version integer NOT NULL DEFAULT 1, PRIMARY KEY(client_id,cause_id));
CREATE TABLE IF NOT EXISTS legal.admin_edit_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL, user_id uuid NOT NULL,
 resource_id uuid NOT NULL, action text NOT NULL, before_data jsonb, after_data jsonb,
 created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO legal.client_lawyers(client_id,name)
 SELECT DISTINCT p.client_id,trim(pc.responsible_name) FROM legal.legal_portfolio_cases pc
 JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
 WHERE nullif(trim(pc.responsible_name),'') IS NOT NULL ON CONFLICT DO NOTHING;
UPDATE legal.legal_portfolio_cases pc SET lawyer_id=l.id
 FROM legal.legal_portfolios p, legal.client_lawyers l
 WHERE pc.portfolio_id=p.id AND p.client_id=l.client_id AND trim(pc.responsible_name)=l.name AND pc.lawyer_id IS NULL;
COMMIT;
