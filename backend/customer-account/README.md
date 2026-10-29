# Customer account and referrals — 2026-10-29

## Implemented

- Authenticated account endpoint reads the actual subscription and enabled products. Missing billing data is shown as missing, never as paid. Personal/company preference and theme are persisted.
- Referral codes and single-use invitation linkage. Self referrals and referral claims after a recorded payment are rejected.
- A confirmed first payment earns one non-expiring case-year. Additional payments by the same referred user do not earn additional years.
- Whole-year allocations to accessible causes, serialized against the user, with unique credits and request idempotency. Coverage extends by calendar years (including leap-year handling).
- No public route can submit payments, award credit or select another user's balance.
- `reconcile_payment.py` is an operations-only adapter for independently verified settled receipts. Provider/payment id is unique; conflicting replays are rejected. Run inside the API container only after receipt verification. Never trust a customer's browser status.
- Public PJUD options captured on 29 October, preserving names and identifiers: Civil, Laboral, Penal and Cobranza, 17 courts each. Supreme/appeals default search disables fields as PJUD does. Family displays PJUD's reservation notice and disallows public registration through this form.
- Backend validates competence/court/tribunal/book combinations. Changes to existing identities remain client-scoped, preserving the existing shared-history behavior.

## Integration still required

No payment gateway, verified webhook, card vault, product-level billing contracts or charge/refund engine exists in the deployed API inspected for this change. Accordingly:

1. Connect the chosen payment provider's signed settled-payment events to the same confirmed-payment ledger, and import reconciled historical payments before enabling broad referral enrollment.
2. Consume allocated coverage in billing/renewal calculations. Stored coverage alone does not cancel an external charge or create a payment method.
3. Define refund/chargeback handling before automatic rewards. No unverified or test payment was recorded.
4. Validate extraction for newly added non-Civil competences end to end; this release changes catalog/registration, not the extraction engine. Family private access is not provided.

The user explicitly selected **first payment**, not account confirmation, as the qualification event. A credit is one year for one cause; allocations are final in the customer UI. Operational corrections require an audited procedure.

## Validation and rollback

Tests run against production schema inside an outer rolled-back transaction: create/edit/archive/restore with type V; access denial; code idempotency; self-referral rejection; first payment once; two-year allocation; request replay; insufficient-balance and inaccessible-cause rejection. No fixture, payment or earned credit is retained.

Database migration is additive. Rollback restores the prior API image and frontend commit, retaining ledger/history. Never drop live ledger tables to roll back code. Prior compose and source are saved under `/opt/prod01/customer-account-20261029/`.

Deployment takes the shared PJUD coordinator lock and refuses deployment while an extraction is in flight. Daily and email schedules/recipients are unchanged.

Protected contact/modules hashes were updated only for user-requested spelling/accents, retaining the copy protection workflow.
