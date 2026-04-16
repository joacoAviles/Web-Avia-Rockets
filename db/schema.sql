-- Base relational schema proposal for production migration (PostgreSQL)

create table if not exists users (
  id text primary key,
  email text unique not null,
  name text not null,
  phone text,
  role text not null default 'user',
  status text not null,
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists billing_profiles (
  id text primary key,
  user_id text not null references users(id),
  customer_type text not null,
  legal_name text not null,
  rut text not null,
  giro text,
  address text not null,
  district text not null,
  city text not null,
  country text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists plans (
  id text primary key,
  code text unique not null,
  name text not null,
  currency text not null,
  billing_period text not null,
  net_price_clp integer not null,
  vat_clp integer not null,
  gross_price_clp integer not null,
  has_trial boolean not null default false,
  trial_days integer,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null references users(id),
  plan_id text not null references plans(id),
  provider text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_at timestamptz,
  grace_until timestamptz,
  retries integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  canceled_at timestamptz,
  deleted_at timestamptz
);

create table if not exists payment_methods (
  id text primary key,
  user_id text not null references users(id),
  provider text not null,
  provider_method_id text not null,
  is_default boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists payment_attempts (
  id text primary key,
  subscription_id text not null references subscriptions(id),
  user_id text not null references users(id),
  provider text not null,
  amount integer not null,
  currency text not null,
  status text not null,
  provider_payment_id text,
  error_code text,
  created_at timestamptz not null
);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text,
  status text not null,
  payload jsonb,
  received_at timestamptz not null
);

create unique index if not exists ux_webhook_provider_event
  on webhook_events(provider, provider_event_id);

create table if not exists invoices_local (
  id text primary key,
  user_id text not null references users(id),
  payment_attempt_id text references payment_attempts(id),
  dte_type text not null,
  folio text,
  amount integer not null,
  issue_date date not null,
  status text not null,
  pdf_url text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists subscription_changes (
  id text primary key,
  subscription_id text not null references subscriptions(id),
  user_id text not null references users(id),
  from_plan_id text,
  to_plan_id text not null,
  reason text,
  changed_at timestamptz not null
);

create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_next_billing_at on subscriptions(next_billing_at);
create index if not exists idx_payment_attempts_subscription_id on payment_attempts(subscription_id);
create index if not exists idx_payment_attempts_created_at on payment_attempts(created_at);
