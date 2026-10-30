-- Additive PROD01 migration. Run against the API database after taking a backup.
-- Internal IDs, legal causes and existing access are preserved.
BEGIN;

CREATE TABLE IF NOT EXISTS platform.supabase_identities (
    issuer text NOT NULL,
    subject uuid NOT NULL,
    user_id uuid NOT NULL UNIQUE REFERENCES platform.users(id) ON DELETE CASCADE,
    verified_email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (issuer, subject)
);

-- A verified identity can deliberately use a different login email from an
-- existing internal account. Set this only after inspecting the actual Auth UID
-- and confirmed email; never populate it from browser metadata.
ALTER TABLE platform.supabase_identities ADD COLUMN IF NOT EXISTS verified_email text;

CREATE TABLE IF NOT EXISTS platform.auth_profiles (
    user_id uuid PRIMARY KEY REFERENCES platform.users(id) ON DELETE CASCADE,
    company_name varchar(200) NOT NULL DEFAULT '',
    phone varchar(30) NOT NULL DEFAULT '',
    daily_summary_email_enabled boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.auth_platform_admins (
    user_id uuid PRIMARY KEY REFERENCES platform.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.auth_admin_audit (
    id bigserial PRIMARY KEY,
    actor_user_id uuid NOT NULL REFERENCES platform.users(id),
    action varchar(80) NOT NULL,
    target_user_id uuid REFERENCES platform.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Explicit, limited bridge for the two identities already approved in the
-- current PROD01 auth helper. The join preserves each existing Avia user ID.
INSERT INTO platform.supabase_identities(issuer, subject, user_id)
SELECT 'https://mqlwzfsjmhoeiqizzzwk.supabase.co', map.subject::uuid, u.id
FROM (VALUES
  ('admin@aviarockets.cl', '389020e7-3f0a-4db6-ab56-30ded03e9fec'),
  ('fhevia@asesoriasnow.cl', '0d2aa5b9-fc00-4fe8-8e69-74d31376566a')
) AS map(email, subject)
JOIN platform.users AS u ON lower(u.email) = map.email
ON CONFLICT DO NOTHING;

-- The platform administrator is separate from customer organization admins.
INSERT INTO platform.auth_platform_admins(user_id)
SELECT id FROM platform.users WHERE lower(email) = 'admin@aviarockets.cl'
ON CONFLICT DO NOTHING;

COMMIT;
