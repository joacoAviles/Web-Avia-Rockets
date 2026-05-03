-- Esquema inicial para RA Revisiones Automaticas
-- Ejecutar en BaseAviaRockets con un usuario con permisos de creacion.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL,
  anio INTEGER,
  competencia TEXT NOT NULL,
  tribunal TEXT,
  tipo_causa TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  last_checked_at TIMESTAMPTZ,
  last_result TEXT,
  last_has_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_causes_user_status ON causes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_causes_status ON causes(status);

CREATE TABLE IF NOT EXISTS cause_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result_hash TEXT,
  result_json JSONB,
  result_text TEXT,
  has_changes BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_checks_cause_checked ON cause_checks(cause_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_user_checked ON cause_checks(user_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_to TEXT,
  frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Usuario demo: admin / admin
-- En produccion, cambiar inmediatamente.
INSERT INTO app_users (email, username, password_hash, full_name, role)
VALUES (
  'admin@aviarockets.cl',
  'admin',
  '$2b$12$6oLOHgIQq0OwD.QN4rGX2eR6B1.YUweNe8H6oLr.NI44XKbe9uaHK',
  'Administrador RA',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO notification_settings (user_id, email_enabled, email_to, frequency)
SELECT id, TRUE, 'admin@aviarockets.cl', 'immediate'
FROM app_users
WHERE username = 'admin'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO causes (user_id, rol, anio, competencia, tribunal, tipo_causa, status, last_checked_at, last_result, last_has_changes)
SELECT id, 'C-1245-2024', 2024, 'Civil', '3° Juzgado Civil de Santiago', 'C', 'active', now(), 'Cambio detectado', TRUE
FROM app_users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO causes (user_id, rol, anio, competencia, tribunal, tipo_causa, status, last_checked_at, last_result, last_has_changes)
SELECT id, 'C-2301-2023', 2023, 'Cobranza', 'Juzgado de Cobranza Laboral', 'C', 'active', now(), 'Sin cambios', FALSE
FROM app_users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO causes (user_id, rol, anio, competencia, tribunal, tipo_causa, status, last_checked_at, last_result, last_has_changes)
SELECT id, 'O-808-2025', 2025, 'Laboral', '2° Juzgado de Letras del Trabajo', 'O', 'paused', now(), 'Pausada', FALSE
FROM app_users WHERE username = 'admin'
ON CONFLICT DO NOTHING;
