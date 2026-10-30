BEGIN;
CREATE TABLE IF NOT EXISTS platform.supabase_identities (
 issuer text NOT NULL,
 subject uuid NOT NULL,
 user_id uuid NOT NULL REFERENCES platform.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(issuer,subject), UNIQUE(issuer,user_id)
);
CREATE TABLE IF NOT EXISTS platform.auth_profiles (
 user_id uuid PRIMARY KEY REFERENCES platform.users(id),
 company_name varchar(200) NOT NULL DEFAULT '',
 phone varchar(30) NOT NULL DEFAULT '',
 daily_summary_email_enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS platform.auth_admin_audit (
 id bigserial PRIMARY KEY, actor_user_id uuid NOT NULL,
 action text NOT NULL, target_user_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Bind only known accounts, without modifying their existing internal IDs.
INSERT INTO platform.supabase_identities(issuer,subject,user_id)
SELECT 'https://mqlwzfsjmhoeiqizzzwk.supabase.co',v.subject::uuid,u.id
FROM (VALUES ('admin@aviarockets.cl','389020e7-3f0a-4db6-ab56-30ded03e9fec'),
 ('fhevia@asesoriasnow.cl','0d2aa5b9-fc00-4fe8-8e69-74d31376566a')) v(email,subject)
JOIN platform.users u ON lower(u.email)=v.email
ON CONFLICT DO NOTHING;
COMMIT;
