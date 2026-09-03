# Client-scoped Legal administration

The production API lives in `avia-web-api`; the small deployment overlay is
versioned here alongside its frontend. `backend/main.py` is the older standalone
backend and is not the production entry point.

Deployment mapping:

- `legal_admin.py` → `app/api/legal_admin.py`
- `web_compat.py` → `app/api/web_compat.py`
- `api_main.py` → `app/main.py`
- Apply `legal_admin.sql` before restarting the API.

Use the existing database connection via `DATABASE_URL`. Never commit secrets.
`apply_legal_admin.py` verifies the approved Hevia/NOW pair and applies the SQL
transactionally. It does not move users between organizations or grant access to
other clients. New client administrators require explicit records in
`legal.client_administrators`; being an admin alone grants no client access.

Case identity corrections and Castigo live in `legal.client_cause_settings`, keyed
by client and cause. Global PJUD identity and publication columns are never
modified. Group and lawyer edits target one portfolio
assignment. Castigo disables batch email inclusion on every assignment of that
cause for the selected client only. Existing global collection eligibility is
unchanged. Administration does not create website accounts or grant authentication
permissions.

## Simplified operational editor

The case write contract now accepts only number (`code`), year, court, email group
(`portfolio_id`), lawyer, client publication state and the concurrency version.
Title, competence, corte, tipo, notes, comments, priority, assignment status and
recipient selections are rejected, not silently reset. Existing values and
unrelated contacts remain intact. `admin_lawyer_edited` controls the lawyer display
independently of the legacy visibility flag.

`legal_admin_emails.sql` imports missing catalog email addresses only when existing
assignments agree on one address. Run `apply_legal_admin.py --emails` with the
existing secured connection. No addresses are inferred and no existing catalog
email is overwritten.

Lawyer edits write through to `responsible_name` and
`settings.assigned_lawyer_email`, which the existing daily/weekly mailer consumes.
Existing case recipient rows matching the previous assigned lawyer email are
updated (or deactivated when removed). Unrelated recipient rows are preserved.
Changing the assigned lawyer on one cause follows the same rule. No mail is sent
by the administration endpoints. Test coverage executes the actual
`PORTFOLIO_GROUPS_SQL` consumer without creating or dispatching mail reports.

Only Publicada → Castigo is supported; publishing and rehabilitation are rejected
by the API. Lawyer deletion requires first removing/reassigning all case links.
Optimistic versions protect against stale edits; successful mutations are audited.

Run `test_legal_admin.py` with `API_SOURCE` pointing at the production API source
and `DATABASE_URL` supplied securely. It tests authorization, forbidden
transitions, edits, optimistic locking, lawyer CRUD, deletion guards, dashboard
projection, and three clients sharing a case. ALL test writes and schema changes
are enclosed in an outer transaction that is rolled back, including on failure.
