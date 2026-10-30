# Infraestructura privada de Avia Rockets

The private backend is running on PROD01. Public routing and frontend release
remain pending. api-config.js enables the gateway when this branch is deployed. It adds Infrastructure
to the existing app.html header only after server-side owner authorization.
General, Proxmox, Rundeck, Kuma, Otro 1 and Otro 2 share a single persistent
Chromium desktop. General lists configuration, not fabricated health results.

## Architecture and access

- Gateway verifies the current Supabase bearer with the deployed Avia
  `/api/v1/identity/me`. It requires the exact internal owner UUID and active
  account. Role=admin alone grants nothing. Missing configuration denies all.
- The bearer stays in process memory. The iframe receives only a random
  Secure/HttpOnly/SameSite=Strict cookie, valid for 120 seconds. The active UI
  renews it every 45 seconds. WebSockets recheck expiry every five seconds and
  identity at most every ten seconds. Revocation/outage closes the stream.
- Profile volume persists application cookies across gateway restarts.
  Each application's own expiry/MFA still applies. Initial service login is
  manual. This is not SSO. Multiple devices share one desktop, not isolated tabs.
- noVNC assets and WebSocket routes require the session. CDP, VNC and websockify
  bind only to container loopback. Only the gateway is published, on host loopback.
- Owner can browse the networks reachable from this desktop. Do not grant this
  endpoint to customers or other administrators. Do not expose 5900/6080/9222.
- Gateway uses one worker; restart clears transport sessions but keeps the
  Chromium profile. Do not scale workers without a shared session store.

## Deployment steps

1. Select an always-on Docker host that can reach all target services, including
   the Rundeck Tailscale address. Hosting on PROD01 makes remote recovery depend
   on that VM; use an independent host if shutdown/recovery access is required.
2. Confirm available memory. Compose caps RAM at 768 MiB and CPU at 0.75, with
   256 MiB shared memory and 1 GiB RAM plus swap. Actual consumption must be measured with the panels open.
3. Copy this directory to a private deployment directory. Copy `.env.example`
   to `.env`, chmod 600, and set `INFRA_OWNER_USER_ID` to the verified internal
   Avia UUID of the requested owner. Do not infer the UUID from email or role.
4. Populate `INFRA_TARGETS_JSON` locally with keys proxmox, rundeck, kuma,
   other1, other2 and their supplied URLs. Use the Rundeck project landing
   page if a general view is desired. Omit unknown targets. Never put service
   passwords, API tokens or profile backups in Git.
5. `docker compose build`. Run tests with
   `docker compose run --rm --entrypoint python3 infrastructure -m unittest -v test_policy test_gateway`.
   Then `docker compose up -d`. Inspect health, startup logs and memory.
   Chromium sandbox remains enabled. If the host denies sandbox namespaces,
   diagnose the host security profile; do not silently add --no-sandbox,
   privileged mode or SYS_ADMIN to make the build appear successful.
6. Route `infra.aviarockets.cl` through the existing Cloudflare Tunnel to
   `http://127.0.0.1:8095` when the connector runs on this same host. For a
   containerized connector, use an explicitly shared private Docker network
   and the gateway service port; container localhost is not host localhost.
   Preserve WebSocket support, bypass cache and disable response transformations.
   The gateway enforces Avia identity itself; adding another interactive Access
   login would reintroduce the extra login the user wants to avoid.
7. Verify the tests below before setting
   `window.AVIA_INFRA_GATEWAY = 'https://infra.aviarockets.cl';`
   in api-config.js and deploying the frontend from the same branch.

## Required acceptance before production

- Unauthenticated HTTP and WebSocket connections denied, including direct URLs.
- A real non-owner account (even admin) denied; exact owner accepted.
- Origin forgery from unrelated/subdomain websites rejected.
- Logout, disabled owner, expired token and identity outage terminate active streams.
- Each target reachable from inside the container; Proxmox console works.
- Service cookies survive browser/container restart; first login entered by owner.
- Header stays usable, navigation restores the previous app view, and mobile
  touch/keyboard and reconnect are checked in a real browser.
- No general-status green lights unless a real health check is implemented.
- Profile backup encrypted and private; treat it as live authenticated access.

Rollback: remove AVIA_INFRA_GATEWAY to hide the feature, remove the tunnel route,
then `docker compose stop`. Do not delete the browser-profile volume.

## Sources

- Existing auth contract: ../auth-release/README.md and identity_routes.py.
- noVNC: https://github.com/novnc/noVNC and
  https://github.com/novnc/noVNC/blob/master/docs/EMBEDDING.md
- Chromium DevTools: https://chromedevtools.github.io/devtools-protocol/

Local syntax and policy checks do not replace the live acceptance tests above.

## PROD01 deployment status (2026-10-30)

Image avia-infrastructure:d865b10 is running with restart=unless-stopped,
private owner configuration, the persistent avia-infrastructure-profile volume,
and the approved seccomp profile. Host port 8095 binds only to 127.0.0.1.
The connector and gateway share avia-api-final_default; the planned tunnel
upstream is http://avia-infrastructure:8080. No public route has been saved yet.

Rundeck execution 15964 passed all nine tests, verified unauthenticated asset
rejection, and verified an actual restart. Execution 15972 verified Proxmox,
Rundeck and Kuma reachability, identity endpoint rejection without a token,
Chromium renderer namespaces/NoNewPrivs/seccomp, and the upstream RFB stream.
Idle memory was 280 MiB under the 768 MiB limit. Real service login sessions,
owner UI, non-owner live accounts and mobile interaction remain unverified.

The supervisor holds an exclusive OS file lock for the managed profile, then
archives stale Chromium singleton symlinks left by prior container instances.
Only this supervisor may manage the profile volume.

compose.userns.yaml selects seccomp-chromium.json, derived from moby/profiles
seccomp/default.json (blob 6e5e47e242892aaa290f916ba1045f9213ef0b84, Apache-2.0).
The only added allow rule enables clone/setns/unshare following Playwright's
sandbox pattern. Other syscall restrictions remain; no SYS_ADMIN, privileged
mode or --no-sandbox is used. User approval was received before applying it.

Sources: https://github.com/moby/profiles/blob/main/seccomp/default.json and
https://github.com/microsoft/playwright/blob/main/utils/docker/seccomp_profile.json
