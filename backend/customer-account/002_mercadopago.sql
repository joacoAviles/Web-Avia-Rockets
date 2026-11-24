BEGIN;
-- Server-created order. Browser amounts, user IDs and returned checkout status are never trusted.
CREATE TABLE IF NOT EXISTS platform.payment_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES platform.users(id),
 product_code text NOT NULL, plan_code text NOT NULL,
 amount numeric(14,2) NOT NULL CHECK(amount>0),
 currency text NOT NULL DEFAULT 'CLP' CHECK(currency='CLP'),
 live_mode boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform.mercadopago_receipts (
 payment_id text PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES platform.payment_orders(id),
 status text NOT NULL, live_mode boolean NOT NULL,
 last_verified_at timestamptz NOT NULL DEFAULT now(),
 requires_review boolean NOT NULL DEFAULT false
);
COMMIT;
