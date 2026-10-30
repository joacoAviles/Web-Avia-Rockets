"""Operator-only secret entry on PROD01; never put the key in command arguments.

Use the Rundeck secure option, or run interactively on PROD01. Validates the
existing project key before saving it. No credential or Auth response is logged.
"""
import getpass
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

ROOT = Path("/opt/prod01/auth-release-20261030")
COMPOSE = Path("/srv/prod01-data/stacks/avia/compose.json")
SECRET = COMPOSE.parent / "secrets/supabase.env"
CONTAINER = "avia-api-final-public-api-1"
VALIDATE = """import sys
from supabase import create_client
from supabase.lib.client_options import ClientOptions
key=sys.stdin.read().strip()
try:
    client=create_client('https://mqlwzfsjmhoeiqizzzwk.supabase.co',key,
        options=ClientOptions(auto_refresh_token=False,persist_session=False))
    user=client.auth.admin.get_user_by_id('389020e7-3f0a-4db6-ab56-30ded03e9fec').user
    assert user and str(user.id)=='389020e7-3f0a-4db6-ab56-30ded03e9fec'
except Exception:
    sys.exit(1)
"""


def main():
    key = os.environ.get("RD_OPTION_SUPABASE_SECRET", "").strip()
    if not key:
        if not sys.stdin.isatty():
            raise RuntimeError("Introduce la clave en el campo seguro de Rundeck.")
        key = getpass.getpass("Clave administrativa existente de Supabase: ").strip()
    if not key.startswith(("sb_secret_", "eyJ")) or any(char.isspace() for char in key):
        raise RuntimeError("Formato de clave administrativa no válido.")
    result = subprocess.run(["docker", "exec", "-i", CONTAINER, "python", "-c", VALIDATE],
                            input=key, text=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if result.returncode:
        raise RuntimeError("No se pudo validar la clave administrativa en el proyecto Supabase.")

    previous = COMPOSE.read_bytes()
    previous_secret = SECRET.read_bytes() if SECRET.exists() else None
    backup = ROOT / "secret-setup-backups" / str(time.time_ns())
    backup.mkdir(parents=True, mode=0o700)
    (backup / "compose.json").write_bytes(previous)
    (backup / "compose.json").chmod(0o600)
    if previous_secret is not None:
        (backup / "supabase.env").write_bytes(previous_secret)
        (backup / "supabase.env").chmod(0o600)
    SECRET.parent.mkdir(mode=0o700, exist_ok=True)
    SECRET.parent.chmod(0o700)
    secret_temp = SECRET.with_suffix(".tmp")
    secret_temp.touch(mode=0o600, exist_ok=False)
    secret_temp.write_text("SUPABASE_SECRET_KEY=" + key + "\n")
    secret_temp.replace(SECRET)
    key = None

    configuration = json.loads(previous)
    service = configuration["services"]["public-api"]
    env_files = service.get("env_file", [])
    if isinstance(env_files, str):
        env_files = [env_files]
    if str(SECRET) not in env_files:
        env_files.append(str(SECRET))
    service["env_file"] = env_files
    environment = service.get("environment", {})
    for name in ("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
        if isinstance(environment, dict):
            environment.pop(name, None)
        elif isinstance(environment, list):
            environment[:] = [v for v in environment if v.split("=", 1)[0] != name]
    args = ["docker", "compose", "-p", "avia-api-final", "-f", str(COMPOSE)]
    try:
        COMPOSE.write_text(json.dumps(configuration, indent=2, ensure_ascii=False) + "\n")
        COMPOSE.chmod(0o600)
        subprocess.run(args + ["config", "--quiet"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(args + ["up", "-d", "--no-deps", "public-api"], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for attempt in range(30):
            try:
                with urllib.request.urlopen("http://127.0.0.1:18001/health", timeout=3) as response:
                    if response.status == 200:
                        break
            except Exception:
                pass
            time.sleep(2)
        else:
            raise RuntimeError("La API no superó el control de salud.")
        check = "from app.api.supabase_access import admin_client; assert admin_client().auth.admin.get_user_by_id('389020e7-3f0a-4db6-ab56-30ded03e9fec').user"
        subprocess.run(["docker", "exec", CONTAINER, "python", "-c", check], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        COMPOSE.write_bytes(previous)
        if previous_secret is not None:
            SECRET.write_bytes(previous_secret)
        else:
            SECRET.unlink(missing_ok=True)
        subprocess.run(args + ["up", "-d", "--no-deps", "public-api"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        raise RuntimeError("No se pudo completar la configuración; se restauró la anterior.") from None
    print("Clave validada y guardada solo en PROD01. API operativa y administración Supabase verificada.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # No exception repr/traceback: SDK or subprocess errors can contain secrets.
        if isinstance(error, RuntimeError):
            print(str(error), file=sys.stderr)
        else:
            print("No se pudo completar la configuración. No se muestran detalles sensibles.", file=sys.stderr)
        sys.exit(1)
