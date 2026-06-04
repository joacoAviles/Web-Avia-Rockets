-- AVIA Rockets web + API complete schema (PostgreSQL 15+)
-- Ejecutar este archivo completo una sola vez por base de datos.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_verification', 'active', 'blocked', 'deleted')),
  user_type TEXT NOT NULL DEFAULT 'person' CHECK (user_type IN ('person', 'company')),
  email_verified_at TIMESTAMPTZ,
  verification_token TEXT,
  reset_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  daily_summary_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ui_theme_preference TEXT NOT NULL DEFAULT 'dark' CHECK (ui_theme_preference IN ('dark', 'light')),
  default_payment_method TEXT NOT NULL DEFAULT 'manual'
    CHECK (default_payment_method IN ('manual', 'card', 'wire', 'transbank_oneclick', 'mercadopago')),
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  terms_version TEXT NOT NULL DEFAULT '1.102',
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('person', 'company')),
  legal_name TEXT NOT NULL,
  rut TEXT NOT NULL,
  giro TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Chile',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  currency TEXT NOT NULL DEFAULT 'clp',
  net_price_clp INTEGER NOT NULL DEFAULT 0,
  vat_clp INTEGER NOT NULL DEFAULT 0,
  gross_price_clp INTEGER NOT NULL DEFAULT 0,
  has_trial BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  provider TEXT NOT NULL DEFAULT 'mock' CHECK (provider IN ('mock', 'stripe', 'transbank_oneclick', 'mercadopago')),
  payment_method TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'suspended', 'canceled')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  grace_until TIMESTAMPTZ,
  retries INTEGER NOT NULL DEFAULT 0,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Causa sin titulo',
  court TEXT,
  user_status TEXT NOT NULL DEFAULT 'active' CHECK (user_status IN ('active', 'inactive')),
  last_checked_at TIMESTAMPTZ,
  last_result TEXT,
  last_has_changes BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, code)
);

CREATE TABLE IF NOT EXISTS cause_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  result_text TEXT NOT NULL,
  has_changes BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'manual',
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'lead',
  name TEXT,
  company TEXT,
  email TEXT,
  interest TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key TEXT NOT NULL,
  destination_email TEXT NOT NULL,
  route_field TEXT,
  route_value TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'clp',
  status TEXT NOT NULL,
  provider_payment_id TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT,
  status TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_user_id ON billing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_causes_user_status ON causes(user_id, user_status);
CREATE INDEX IF NOT EXISTS idx_causes_updated_at ON causes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cause_results_cause_checked ON cause_results(cause_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_cause_results_user_checked ON cause_results(user_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON payment_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

INSERT INTO product_services (slug, name, short_description, full_description)
VALUES
  ('legal', 'OPS Legal', 'Causas judiciales', 'Revisa causas, registra resultados, detecta cambios y mantiene trazabilidad por usuario.'),
  ('flota', 'OPS Flota', 'Vehiculos y vencimientos', 'Ordena vehiculos, mantenciones, documentos criticos y alertas operativas.'),
  ('intelligence', 'Avia Intelligence', 'Riesgo y datos', 'Convierte datos dispersos en senales, scores y tableros de decision.'),
  ('api', 'Avia API', 'Conectores', 'Endpoints para conectar operacion, datos, paneles y automatizaciones internas.'),
  ('lab', 'Avia Lab', 'Apps internas', 'Apps, APIs y automatizaciones a medida para procesos reales.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  is_active = TRUE,
  updated_at = now();

INSERT INTO plans (id, code, name, billing_period, currency, net_price_clp, vat_clp, gross_price_clp, has_trial, trial_days, features)
VALUES
  ('plan_free', 'FREE', 'Free', 'monthly', 'clp', 0, 0, 0, FALSE, NULL, '["1 usuario","Funciones basicas","Sin cobro recurrente"]'::JSONB),
  ('plan_start_monthly', 'START_M', 'Start Mensual', 'monthly', 'clp', 15958, 3032, 18990, TRUE, 14, '["Hasta 3 usuarios","Soporte por correo","API basica"]'::JSONB),
  ('plan_growth_monthly', 'GROWTH_M', 'Growth Mensual', 'monthly', 'clp', 32765, 6225, 38990, TRUE, 14, '["Hasta 15 usuarios","Modulos premium","Soporte prioritario"]'::JSONB),
  ('plan_growth_annual', 'GROWTH_Y', 'Growth Anual', 'annual', 'clp', 330168, 62732, 392900, FALSE, NULL, '["Hasta 15 usuarios","2 meses de ahorro","Soporte prioritario"]'::JSONB),
  ('plan_enterprise', 'ENTERPRISE', 'Enterprise', 'monthly', 'clp', 0, 0, 0, FALSE, NULL, '["Usuarios ilimitados","Integraciones avanzadas","SLA dedicado"]'::JSONB)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  billing_period = EXCLUDED.billing_period,
  currency = EXCLUDED.currency,
  net_price_clp = EXCLUDED.net_price_clp,
  vat_clp = EXCLUDED.vat_clp,
  gross_price_clp = EXCLUDED.gross_price_clp,
  has_trial = EXCLUDED.has_trial,
  trial_days = EXCLUDED.trial_days,
  features = EXCLUDED.features,
  updated_at = now();

COMMIT;
