# Avia Rockets Supabase Auth release

This release contains the browser flow, branded email templates, additive PostgreSQL migration, and FastAPI identity bridge. It is source-complete for integration, but it has not been installed on PROD01. It must be built into the existing API image and deployed together with the static site before it can serve traffic.

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

These items cannot be completed from this checkout alone:

- Supabase SMTP, email-template and Google provider settings need to be saved in the actual project dashboard.
- A Supabase secret key must be injected into PROD01's server-side environment.
- The production API source checkout and deployment host are not available to this Work runtime; the FastAPI router is not yet mounted in the live service.
- Existing PROD01 local-auth accounts, background workers and session behavior must be inventoried before disabling legacy routes.
- Actual confirmation, recovery, Google callback, invitation, and access-management emails must be tested against Avia's verified sender after dashboard configuration.

Until those gates are completed, do not describe the production login as operational.
