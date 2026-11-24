# Mercado Pago — pending merchant application

User selected Mercado Pago on 2026-10-29 and confirmed that the AVIA application still needs to be created. No provider credentials exist in the deployed API environment. The old Express checkout route creates simulated Mercado Pago IDs and is not an integration; do not reuse it.

## Prepared, not deployed

- Additive migration `002_mercadopago.sql` binds server-created orders to users, products, plans, CLP amounts and environment.
- `mercadopago.py` exposes the proposed `/api/payments/mercadopago/webhook` after its router is explicitly mounted. It is NOT mounted by this change.
- Validate HMAC SHA256 using the documented data.id/request-id/ts manifest; reject malformed, modified or expired signatures.
- Retrieve payment status directly from `https://api.mercadopago.com/v1/payments/{id}` using the server token. Do not trust a notification body, browser redirect, payer email or arbitrary resource URL.
- Match seller, production/sandbox mode, server order, amount and currency. Only an approved production payment with no refund enters confirmed_payments, whose existing transactional trigger awards at most one case-year per referred user.
- Sandbox notifications never award production credits. Refund/chargeback events are review items; automatic financial reversals and entitlement revocation are not implemented.

## Required next steps

1. Merchant signs in at https://www.mercadopago.cl/developers/panel/app using the account that will receive AVIA payments. Create the AVIA application and select the appropriate online checkout/subscription integration after confirming billing model.
2. Store MP_ACCESS_TOKEN and MP_WEBHOOK_SECRET only in PROD01's protected runtime secrets. Configure MP_COLLECTOR_ID and MP_MODE=sandbox. Never send secrets in chat, commit them, or place them in frontend JavaScript. A public key is only needed if the chosen client integration requires it.
3. Confirm current per-product plan prices and monthly/annual billing. Existing repository prices are historical and have not been authorized for this integration. Implement server-side checkout creation and order persistence using that confirmed catalog; never accept a client-supplied amount.
4. Run a signed sandbox payment end to end, including duplicate notifications, pending/rejected payments and refunds. Add route/database integration tests. Pure validation has six passing test methods covering 15+ cases; this does not constitute gateway E2E.
5. Apply migration, mount router, deploy under PJUD's shared lock and configure the public HTTPS webhook URL. Verify delivery and seller identity before changing MP_MODE to production. No production charge is authorized or performed by this preparation.
6. Connect entitlement coverage to invoice/renewal calculations and define refund/chargeback handling before enabling automatic benefits.

## Official references

https://www.mercadopago.cl/developers/en/docs/checkout-pro-preferences/additional-settings/optional-notifications
https://www.mercadopago.cl/developers/en/reference/online-payments/checkout-pro-preferences/overview

## Rollback

No production changes in this preparation. If later deployed, restore the prior API image and retain payment history. Never drop receipt/confirmed-payment tables to undo a code deployment.
