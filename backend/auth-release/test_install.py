import ast
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("auth_release_install", Path(__file__).with_name("install.py"))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)

MAIN = '''from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aviarockets.cl"],
)
app.include_router(auth.router)
app.include_router(legal.router)
'''
AUTH = '''async def login(payload, db):
    session = Session()
    token = create_access_token(str(user.id), {"org": str(user.organization_id), "role": user.role})
    return token

async def refresh(payload, db):
    session, user = row
    now = clock()
    session.revoked_at = now
    new_session = Session()
    return {"access_token": create_access_token(str(user.id), {"org": str(user.organization_id), "role": user.role})}
'''


class InstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root / "app/api").mkdir(parents=True)
        for name, content in {"app/main.py": MAIN, "app/api/auth.py": AUTH,
                              "app/api/deps.py": "# old deps\n", "requirements.txt": "fastapi==0.115.14\n"}.items():
            (self.root / name).write_text(content)

    def test_preflight_does_not_mutate_source(self):
        before = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        installer.plan(self.root)
        self.assertEqual(before, {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob("*") if p.is_file()})

    def test_applies_session_claims_and_preserves_other_routers(self):
        backup = installer.apply(self.root)
        main = (self.root / "app/main.py").read_text()
        auth = (self.root / "app/api/auth.py").read_text()
        self.assertIn("app.include_router(legal.router)", main)
        self.assertLess(main.index('app.middleware("http")(reject_legacy_public_auth)'), main.index("app.add_middleware("))
        self.assertIn('"sid": str(session.id)', auth)
        self.assertIn('"sid": str(new_session.id)', auth)
        self.assertLess(auth.index("if not user.is_active:"), auth.index("session.revoked_at = now"))
        self.assertEqual((backup / "app/api/auth.py").read_text(), AUTH)
        for path in (self.root / "app").rglob("*.py"):
            ast.parse(path.read_text())

    def test_reapply_refuses_without_changing_source(self):
        installer.apply(self.root)
        before = (self.root / "app/main.py").read_bytes()
        with self.assertRaises(ValueError):
            installer.apply(self.root)
        self.assertEqual(before, (self.root / "app/main.py").read_bytes())

    def test_dependency_conflict_stops_before_first_write(self):
        (self.root / "requirements.txt").write_text("supabase==1.0.0\n")
        with self.assertRaisesRegex(ValueError, "dependency conflict"):
            installer.apply(self.root)
        self.assertEqual((self.root / "app/main.py").read_text(), MAIN)
        self.assertFalse((self.root / "auth-release-backups").exists())

    def test_source_drift_stops_before_first_write(self):
        (self.root / "app/api/auth.py").write_text(AUTH.replace("session.revoked_at = now", "session.revoked_at = clock()"))
        with self.assertRaises(ValueError):
            installer.apply(self.root)
        self.assertEqual((self.root / "app/main.py").read_text(), MAIN)

    def test_partial_write_failure_restores_source(self):
        original = Path.write_text
        failed = False
        def fail_once(path, content, *args, **kwargs):
            nonlocal failed
            if path == self.root / "app/api/auth.py" and not failed:
                failed = True
                original(path, "broken")
                raise OSError("simulated disk error")
            return original(path, content, *args, **kwargs)
        with patch.object(Path, "write_text", fail_once):
            with self.assertRaises(OSError):
                installer.apply(self.root)
        self.assertEqual((self.root / "app/main.py").read_text(), MAIN)
        self.assertEqual((self.root / "app/api/auth.py").read_text(), AUTH)

    def test_overlay_cannot_write_through_symlink(self):
        (self.root / "app/api/identity.py").symlink_to(self.root / "app/main.py")
        with self.assertRaisesRegex(ValueError, "Unsafe target"):
            installer.apply(self.root)
        self.assertEqual((self.root / "app/main.py").read_text(), MAIN)


if __name__ == "__main__":
    unittest.main()
