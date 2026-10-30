"""Transactional API integration checks; no real Auth login or email delivery.

Run in an isolated container with the production image/environment/network.
Supabase verification is overridden with the explicitly approved test identities.
All database writes use savepoints inside an outer transaction that is rolled back.
Never print tokens, credentials, user records or response bodies.
"""
import asyncio
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.api.supabase_access import identity
from app.core.database import get_db, get_engine
from app.models import User


async def main():
    engine = get_engine()
    checks = []
    async with engine.connect() as connection:
        transaction = await connection.begin()
        db = AsyncSession(bind=connection, expire_on_commit=False, join_transaction_mode="create_savepoint")
        external = {}

        async def database():
            yield db

        async def verified_identity():
            return external

        app.dependency_overrides[get_db] = database
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            async def request(label, method, path, expected, **kwargs):
                response = await client.request(method, path, **kwargs)
                assert response.status_code == expected, f"{label}: expected {expected}, got {response.status_code}"
                checks.append(label)
                print("PASS", label, flush=True)
                return response.json()

            try:
                await request("missing_identity_denied", "GET", "/api/v1/identity/me", 401)
                await request("legacy_registration_retired", "POST", "/api/v1/auth/register/", 410, json={})
                app.dependency_overrides[identity] = verified_identity
                admin = (await db.execute(select(User).where(User.email == "admin@aviarockets.cl"))).scalar_one()
                customer = (await db.execute(select(User).where(User.email == "fhevia@asesoriasnow.cl"))).scalar_one()
                # Load aliases established by an operator after Dashboard inspection.
                from sqlalchemy import text
                async def set_identity(user):
                    mapping = (await db.execute(text(
                        "SELECT subject,verified_email FROM platform.supabase_identities WHERE user_id=:id"
                    ), {"id": user.id})).mappings().one()
                    external.clear()
                    external.update(id=str(mapping["subject"]), email=mapping["verified_email"] or user.email)

                await set_identity(admin)
                payload = await request("admin_binding_preserved", "GET", "/api/v1/identity/me", 200)
                assert payload["id"] == str(admin.id)
                await request("platform_admin_authorized", "GET", "/api/v1/identity/admin/users", 200)
                await request("admin_self_change_denied", "PATCH", f"/api/v1/identity/admin/users/{admin.id}", 409,
                              json={"is_active": False, "product_access": {}})
                external["email"] = "changed-address@example.invalid"
                await request("changed_identity_email_denied", "GET", "/api/v1/identity/me", 403)
                await set_identity(customer)
                payload = await request("customer_binding_preserved", "GET", "/api/v1/identity/me", 200)
                assert payload["id"] == str(customer.id)
                assert payload["product_access"] == customer.product_access
                await request("customer_cannot_administer_users", "GET", "/api/v1/identity/admin/users", 403)
                session = await request("identity_session_exchange", "POST", "/api/v1/identity/exchange", 200, json={})
                headers = {"Authorization": "Bearer " + session["access_token"]}
                await request("api_accepts_exchanged_session", "GET", "/api/v1/auth/me", 200, headers=headers)
                customer.is_active = False
                await db.flush()
                await request("disabled_identity_denied", "POST", "/api/v1/identity/exchange", 403, json={})
                await request("disabled_api_session_denied", "GET", "/api/v1/auth/me", 401, headers=headers)
                await request("disabled_refresh_denied", "POST", "/api/v1/auth/refresh", 403,
                              json={"refresh_token": session["refresh_token"]})
                customer.is_active = True
                await db.flush()
                await request("logout_revokes_session", "POST", "/api/v1/identity/logout", 200,
                              json={"api_access_token": session["access_token"]})
                await request("revoked_session_cannot_be_reused", "GET", "/api/v1/auth/me", 401, headers=headers)
                external.clear()
                external.update(id=str(uuid.uuid4()), email=f"auth-smoke-{uuid.uuid4().hex}@aviarockets.cl")
                await request("unlinked_identity_denied", "GET", "/api/v1/identity/me", 403)
                payload = await request("new_profile_has_no_privileges", "POST", "/api/v1/identity/onboarding", 200,
                    json={"full_name": "Transactional smoke test", "company_name": "", "phone": "",
                          "daily_summary_email_enabled": False})
                assert payload["user"]["role"] == "user"
                assert payload["user"]["product_access"] == {}
                await request("new_profile_cannot_administer_users", "GET", "/api/v1/identity/admin/users", 403)
            finally:
                app.dependency_overrides.clear()
                await db.close()
                await transaction.rollback()
    await engine.dispose()
    print(f"PASS {len(checks)} transactional checks; all database changes rolled back.")
    print("NOT TESTED: real Supabase sign-in, OTP, recovery emails, invitation delivery or Google OAuth.")


if __name__ == "__main__":
    asyncio.run(main())
