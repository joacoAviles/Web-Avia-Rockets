BEGIN;
CREATE TABLE IF NOT EXISTS platform.referral_program (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), opened_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform.referral_program(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS platform.account_preferences (
 user_id uuid PRIMARY KEY REFERENCES platform.users(id),
 customer_type text CHECK(customer_type IN ('person','company')),
 theme text NOT NULL DEFAULT 'dark' CHECK(theme IN ('dark','light')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform.referral_codes (
 user_id uuid PRIMARY KEY REFERENCES platform.users(id),
 code text UNIQUE NOT NULL DEFAULT upper(replace(gen_random_uuid()::text,'-','')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform.referrals (
 referred_user_id uuid PRIMARY KEY REFERENCES platform.users(id),
 referrer_user_id uuid NOT NULL REFERENCES platform.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(referred_user_id <> referrer_user_id)
);
-- Only a verified payment adapter or a reconciled server-side payment may write here.
-- No customer-facing endpoint accepts payment status, amount or earned credit.
CREATE TABLE IF NOT EXISTS platform.confirmed_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL, provider_payment_id text NOT NULL,
 user_id uuid NOT NULL REFERENCES platform.users(id),
 amount numeric(14,2) NOT NULL CHECK(amount > 0),
 currency text NOT NULL CHECK(length(currency)=3),
 confirmed_at timestamptz NOT NULL,
 evidence_ref text NOT NULL CHECK(length(evidence_ref)>0),
 UNIQUE(provider,provider_payment_id)
);
CREATE TABLE IF NOT EXISTS platform.referral_credits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES platform.users(id),
 referred_user_id uuid NOT NULL UNIQUE REFERENCES platform.referrals(referred_user_id),
 payment_id uuid NOT NULL UNIQUE REFERENCES platform.confirmed_payments(id),
 earned_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform.referral_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 credit_id uuid NOT NULL UNIQUE REFERENCES platform.referral_credits(id),
 user_id uuid NOT NULL REFERENCES platform.users(id),
 cause_id uuid NOT NULL REFERENCES legal.causes(id),
 starts_on date NOT NULL, ends_on date NOT NULL,
 allocated_at timestamptz NOT NULL DEFAULT now(), CHECK(ends_on>starts_on)
);
CREATE OR REPLACE FUNCTION platform.award_first_payment_referral() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 PERFORM id FROM platform.users WHERE id=NEW.user_id FOR UPDATE;
 INSERT INTO platform.referral_credits(user_id,referred_user_id,payment_id)
 SELECT r.referrer_user_id,r.referred_user_id,NEW.id FROM platform.referrals r
 WHERE r.referred_user_id=NEW.user_id AND NEW.confirmed_at>=r.created_at
 ON CONFLICT(referred_user_id) DO NOTHING;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS first_payment_referral ON platform.confirmed_payments;
CREATE TRIGGER first_payment_referral AFTER INSERT ON platform.confirmed_payments
 FOR EACH ROW EXECUTE FUNCTION platform.award_first_payment_referral();
CREATE TABLE IF NOT EXISTS platform.referral_allocation_requests (
 user_id uuid NOT NULL REFERENCES platform.users(id), request_id uuid NOT NULL,
 cause_id uuid NOT NULL REFERENCES legal.causes(id), years int NOT NULL CHECK(years>0),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,request_id)
);
CREATE INDEX IF NOT EXISTS referral_allocations_owner ON platform.referral_allocations(user_id,cause_id);
COMMIT;
