# Avia Rockets Supabase Auth release

This release contains the browser flow, branded email templates, additive PostgreSQL migration, and FastAPI identity bridge. On 2026-10-30 the migration and backend were deployed to PROD01 as `avia_public_api:auth-20261030-e547e13`. The public frontend was merged through PR #22 (04a9702). SMTP, Google and the three branded templates are now saved. The server administrative key remains pending correction before SDK-based user administration can be declared operational.

## Deployment evidence — 2026-10-30

- Complete PostgreSQL custom-format backup: 2,081,507,971 bytes; `pg_restore -l` exited 0. Separate identity-table backup and original Compose/source archives retained on PROD01.
- Seven installer tests, five identity-binding regression tests and eighteen transactional API checks passed. The transactional checks use a controlled identity-verification override and roll back every database write; they do not prove real OTP, Google or email delivery.
- API recreation and a subsequent restart both passed health=200 and identity-without-session=401. The browser-visible public endpoint now returns `MISSING_SESSION` instead of `Not Found`. Python HTTP probes from PROD01 received 403, so their responses are not evidence of browser access.
- Legacy registration is retired with 410 and the expected Avia CORS origin. Legacy login/refresh remain enabled for migration.
- Supabase Site URL is Avia; the three exact verify/callback/reset redirect URLs have been saved. Email confirmation is enabled and anonymous sign-in disabled.
- The platform administrator's verified Auth email differs from the internal legacy email. A verified-email binding was set only after inspecting the actual confirmed UID in the Dashboard. Internal IDs and customer grants are unchanged.
- `configure_admin_secret.py` supports operator-only entry; `rundeck-configure-secret.json` supplies a masked field. The operator must enter and submit the existing key directly. Never put a key in a command, repository, diagnostic or chat.
- PROD01 SSH accepts the single `RD_OPTION_SUPABASE_SECRET` environment variable for this job. The key is delivered over the SSH environment, not interpolated into a temporary script. Do not replace this with `@option...@` substitution: the tested remote script file mode is 755. The script itself contains no key. The final entry still requires an operator.
- SMTP remains disabled in Supabase. Its form is prepared for the existing Zoho sender, port 587; the operator must enter the password and save. Google remains disabled without its client credentials. Branded templates cannot be saved on the current plan until custom SMTP is configured.

## Request paths

The website signs users in through Supabase Auth. The verified Supabase access token is exchanged at `POST /api/v1/identity/exchange` for the short-lived Avia API token already understood by `app.html` and the protected FastAPI routes. Existing organization IDs, role, and product permissions remain in the Avia database. New self-registered accounts start with `role=user` and no product grants. Platform admin operations use a separate allowlist table and never trust browser metadata.

## API integration

### Source installer

Run `python3 backend/auth-release/install.py /path/to/api-source` for a read-only preflight.
Run the same command with `--apply` only against the full production source checkout after the database/image backup.
It mounts the router and guard inside CORS, merges pinned requirements, adds session IDs to login/refresh,
rejects refresh for inactive users, and copies the overlay. It validates all source changes before writing,
backs up affected files with SHA-256 hashes, and restores writes on installation failure.
It refuses reapplication, changed source layouts and conflicting dependencies. It does not execute SQL,
read or install secrets, build images, restart containers or publish the frontend.
Run `python3 backend/auth-release/test_install.py` to verify its safety checks.

When `AUTH_BLOCK_LEGACY_LOGIN=true`, both legacy login and refresh are disabled; trailing slashes are covered.

1. Back up the API source, its Compose configuration and PostgreSQL database. Keep the active image for rollback.
2. Merge `requirements-auth.txt` into the API's pinned requirements and build dependencies into the same image used by the public API and workers.
3. Copy `supabase_access.py` to `app/api/supabase_access.py`, `identity_routes.py` to `app/api/identity.py`, `deps.py` to `app/api/deps.py`, and `legacy_auth_guard.py` to `app/api/legacy_auth_guard.py`. `deps.py` preserves the existing API-key dependency and adds database-backed revocation for newly issued identity sessions.
4. In `app/main.py`, import `identity` from `app.api`, add `app.include_router(identity.router)` next to the existing routers, then mount `reject_legacy_public_auth` from `legacy_auth_guard.py` as HTTP middleware. This immediately retires the old local `/api/v1/auth/register` route. Keep `AUTH_BLOCK_LEGACY_LOGIN=false` during user migration so current customers can still log in; set it to `true` only after every human account and machine client has moved to Supabase.
5. In `app/api/auth.py`, include the newly created `session.id` as the `sid` claim whenever `/login` or `/refresh` issues an access token. This keeps the dual-auth migration compatible with immediate session revocation. Existing tokens without `sid` continue only until normal expiry.
6. Apply `migration.sql` to the API PostgreSQL database. Verify that both seeded users match the displayed emails before continuing; the `INSERT` only links rows whose email exists.
7. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` in the API container's secret environment. The secret key is used only by the official Python Admin SDK. Do not put it in the web root, diagnostics or Git.
8. Build and deploy the new API image first. Confirm `GET /api/v1/identity/me` without a token returns 401 and `/api/v1/identity/exchange` with a valid confirmed session returns the existing internal user and product grants.

The new public website no longer calls local login or registration. The staged guard lets current local login continue while the admin invites and links existing users. Disable `/api/v1/auth/login` and `/refresh` only after the migration inventory proves they are unused. Newly issued Supabase sessions use a `sid` claim and are checked against the sessions table on every protected API call; old local JWT sessions remain accepted only until their existing expiry.

## Website

Deploy the tracked `web-auth/` directory, `web-auth/supabase-config.js`, the root `login.html` and `register.html` redirects, and the three `email-templates/supabase-*.html` files from the same commit. Existing entry points now route to the Avia-branded flow. The browser config contains only the public publishable key.

## Supabase Dashboard settings required

- Site URL: `https://aviarockets.cl`
- Redirect allow list:
  - `https://aviarockets.cl/web-auth/verify.html`
  - `https://aviarockets.cl/web-auth/callback.html`
  - `https://aviarockets.cl/web-auth/reset.html`
- Enable email/password and email confirmation; disable anonymous sign-ins.
- Confirm Signup template: use `email-templates/supabase-confirm-signup.html`, which prints `{{ .Token }}` for `verifyOtp({ type: 'email' })`.
- Reset Password template: use `email-templates/supabase-recovery.html`; it links with `{{ .ConfirmationURL }}` to the Avia reset screen.
- Invite User template: use `email-templates/supabase-invite.html`.
- Configure Supabase custom SMTP with the verified Avia sender and credentials. SMTP values currently present on PROD01 are not automatically inherited by Supabase. Do not put credentials in these files.
- Enable Google provider and add the OAuth client ID/secret. Google authorized redirect URI: `https://mqlwzfsjmhoeiqizzzwk.supabase.co/auth/v1/callback`; authorized web origin: `https://aviarockets.cl`.

## User admin

`/web-auth/admin.html` is restricted by the FastAPI `platform_admin` dependency. It can invite users, migrate an unlinked internal user by invitation or verified UID, disable/reactivate users, and assign products. The database stores every admin action. Test the admin allowlist on PROD01 before exposing this URL to operators.

## Current production gates

These items remain pending:

- Supabase SMTP, email-template and Google provider settings need to be saved in the actual project dashboard.
- A Supabase secret key must be injected into PROD01's server-side environment.
- The API router is mounted in the live service; administrative SDK actions still require the server secret.
- Existing PROD01 local-auth accounts, background workers and session behavior must be inventoried before disabling legacy routes.
- Actual confirmation, recovery, Google callback, invitation, and access-management emails must be tested against Avia's verified sender after dashboard configuration.

Until those gates are completed, do not describe the production login as operational.
