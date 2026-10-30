"""Exercise identity binding independently of network access or API secrets."""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
import uuid


class Denied(Exception):
    def __init__(self, status, detail):
        self.status_code = status
        self.detail = detail


class Query:
    def where(self, *args):
        return self


class Result:
    def __init__(self, value):
        self.value = value

    def mappings(self):
        return self

    def one_or_none(self):
        return self.value

    scalar_one_or_none = one_or_none


class DB:
    def __init__(self, mapping, user):
        self.values = iter([mapping, user])

    async def execute(self, *args):
        return Result(next(self.values))


tree = ast.parse(Path(__file__).with_name("supabase_access.py").read_text())
function = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "mapped_user")
namespace = {"uuid": uuid, "URL": "https://identity.example", "HTTPException": Denied,
             "text": lambda v: v, "select": lambda *args: Query(), "User": SimpleNamespace(id="id")}
exec(compile(ast.Module(body=[function], type_ignores=[]), "supabase_access.py", "exec"), namespace)
mapped_user = namespace["mapped_user"]


class MappingTests(unittest.IsolatedAsyncioTestCase):
    async def test_verified_alias_preserves_existing_internal_account(self):
        user = SimpleNamespace(email="internal@example.com", is_active=True)
        result = await mapped_user({"id": str(uuid.uuid4()), "email": "login@example.com"},
            DB({"user_id": uuid.uuid4(), "verified_email": "login@example.com"}, user))
        self.assertIs(result, user)

    async def test_email_change_cannot_reuse_admin_binding(self):
        with self.assertRaises(Denied) as error:
            await mapped_user({"id": str(uuid.uuid4()), "email": "changed@example.com"},
                DB({"user_id": uuid.uuid4(), "verified_email": "login@example.com"},
                   SimpleNamespace(email="internal@example.com", is_active=True)))
        self.assertEqual(error.exception.detail, "ACCOUNT_REQUIRES_ADMIN_LINK")

    async def test_matching_email_without_binding_cannot_claim_account(self):
        with self.assertRaises(Denied) as error:
            await mapped_user({"id": str(uuid.uuid4()), "email": "login@example.com"}, DB(None, None))
        self.assertEqual(error.exception.detail, "ACCOUNT_PENDING_APPROVAL")

    async def test_blocked_account_cannot_exchange_identity(self):
        with self.assertRaises(Denied) as error:
            await mapped_user({"id": str(uuid.uuid4()), "email": "login@example.com"},
                DB({"user_id": uuid.uuid4(), "verified_email": None},
                   SimpleNamespace(email="login@example.com", is_active=False)))
        self.assertEqual(error.exception.detail, "ACCOUNT_DISABLED")

    async def test_standard_same_email_binding_still_works(self):
        user = SimpleNamespace(email="LOGIN@example.com", is_active=True)
        self.assertIs(await mapped_user({"id": str(uuid.uuid4()), "email": "login@example.com"},
            DB({"user_id": uuid.uuid4(), "verified_email": None}, user)), user)


if __name__ == "__main__":
    unittest.main()
