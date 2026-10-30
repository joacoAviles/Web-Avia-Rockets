"""Install the identity overlay into an inspected FastAPI source checkout.

Default is a read-only preflight. --apply backs up every affected file first.
Does not run SQL, install secrets, restart services or publish the website.
"""
import argparse
import ast
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil


RELEASE = Path(__file__).resolve().parent


def plan(root):
    root = Path(root).resolve()
    paths = {name: root / name for name in (
        "app/main.py", "app/api/auth.py", "app/api/deps.py", "requirements.txt",
    )}
    for path in paths.values():
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Missing or unsafe source file: {path}")
    auth = paths["app/api/auth.py"].read_text()
    main = paths["app/main.py"].read_text()
    if "app.api.identity" in main or "include_router(identity.router)" in main:
        raise ValueError("Identity router already installed; inspect before reapplying")
    tree = ast.parse(auth)
    edits = []
    lines = auth.splitlines(keepends=True)
    for name, sid in (("login", "session.id"), ("refresh", "new_session.id")):
        functions = [node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == name]
        if len(functions) != 1:
            raise ValueError(f"Unexpected {name} function layout")
        node = functions[0]
        calls = [call for call in ast.walk(node) if isinstance(call, ast.Call)
                 and isinstance(call.func, ast.Name) and call.func.id == "create_access_token"]
        if len(calls) != 1 or len(calls[0].args) != 2 or not isinstance(calls[0].args[1], ast.Dict):
            raise ValueError(f"Unexpected {name} access-token layout")
        claims = calls[0].args[1]
        if any(isinstance(key, ast.Constant) and key.value == "sid" for key in claims.keys):
            raise ValueError(f"{name} already has session claims; inspect before applying")
        offset = sum(len(line) for line in lines[:claims.end_lineno - 1]) + claims.end_col_offset - 1
        edits.append((offset, f', "sid": str({sid})'))
    for offset, value in sorted(edits, reverse=True):
        auth = auth[:offset] + value + auth[offset:]
    refresh_marker = "    session.revoked_at = now\n"
    if auth.count(refresh_marker) != 1:
        raise ValueError("Unexpected refresh revocation layout")
    auth = auth.replace(refresh_marker,
        '    if not user.is_active:\n'
        '        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")\n\n'
        + refresh_marker, 1)
    cors_marker = "app.add_middleware(\n    CORSMiddleware,"
    if main.count(cors_marker) != 1 or main.count("app.include_router(auth.router)") != 1:
        raise ValueError("Unexpected main router/CORS layout")
    # Register the guard inside CORS so error responses retain CORS headers.
    main = main.replace(cors_marker,
        'from app.api import identity\n'
        'from app.api.legacy_auth_guard import reject_legacy_public_auth\n'
        'app.middleware("http")(reject_legacy_public_auth)\n\n' + cors_marker, 1)
    main += "\napp.include_router(identity.router)\n"
    requirements = paths["requirements.txt"].read_text()
    for requirement in (RELEASE / "requirements-auth.txt").read_text().splitlines():
        if not requirement or requirement.startswith("#"):
            continue
        package = requirement.split("==")[0]
        existing = [line.strip() for line in requirements.splitlines()
                    if re.match(r"^" + re.escape(package) + r"(?:\[|[<>=!~;\s]|$)", line.strip(), re.I)]
        if existing and existing != [requirement]:
            raise ValueError(f"Resolve dependency conflict for {package} before applying")
        if not existing:
            requirements = requirements.rstrip() + "\n" + requirement + "\n"
    output = {"app/main.py": main, "app/api/auth.py": auth, "requirements.txt": requirements}
    for source, target in (("identity_routes.py", "identity.py"), ("supabase_access.py", "supabase_access.py"),
                           ("deps.py", "deps.py"), ("legacy_auth_guard.py", "legacy_auth_guard.py")):
        output[f"app/api/{target}"] = (RELEASE / source).read_text()
    for name, content in output.items():
        target = root / name
        if target.is_symlink() or not target.resolve().is_relative_to(root):
            raise ValueError(f"Unsafe target: {name}")
        if name.endswith(".py"):
            ast.parse(content, filename=name)
    return output


def apply(root):
    root = Path(root).resolve()
    output = plan(root)  # Validate everything before making the first write.
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    backup = root / "auth-release-backups" / stamp
    backup.mkdir(parents=True, mode=0o700)
    manifest = {}
    for name, content in output.items():
        path = root / name
        prior = path.read_bytes() if path.exists() else None
        manifest[name] = {"existed": prior is not None,
                          "before_sha256": hashlib.sha256(prior).hexdigest() if prior is not None else None,
                          "after_sha256": hashlib.sha256(content.encode()).hexdigest()}
        if prior is not None:
            destination = backup / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
    (backup / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    written = []
    try:
        for name, content in output.items():
            written.append(name)
            (root / name).write_text(content)
    except BaseException:
        for name in reversed(written):
            path = root / name
            if manifest[name]["existed"]:
                shutil.copy2(backup / name, path)
            else:
                path.unlink(missing_ok=True)
        raise
    return backup


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("api_source", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        if args.apply:
            print(f"Source integration applied. Backup: {apply(args.api_source)}")
            print("SQL, image build, secrets, restart and production checks still required.")
        else:
            print("Preflight passed; no files changed:")
            print("\n".join(plan(args.api_source)))
    except (ValueError, OSError, SyntaxError) as exc:
        parser.exit(1, f"Refusing installation: {exc}\n")
