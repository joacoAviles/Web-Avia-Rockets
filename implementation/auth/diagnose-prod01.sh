#!/usr/bin/env bash
set -eu
printf 'Fecha: '; date -u
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
sudo docker inspect avia-api-final-public-api-1 --format 'Compose: {{index .Config.Labels "com.docker.compose.project.config_files"}}'
sudo docker exec -i avia-api-final-public-api-1 python - <<'PY'
import os, importlib.util, hashlib
from pathlib import Path
for name in ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','SMTP_HOST','SMTP_FROM_EMAIL']:
 print(name, 'CONFIGURADA' if os.getenv(name) else 'NO CONFIGURADA')
for file in ['app/api/auth.py','app/api/supabase_identity.py','app/api/deps.py','app/core/security.py']:
 p=Path('/app')/file
 print(file, hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else 'AUSENTE')
for package in ['httpx','fastapi','jose']:
 print(package, bool(importlib.util.find_spec(package)))
PY
for path in /health /api/v1/health /api/v1/auth/me; do
 curl --max-time 15 -sS -o /dev/null -w "$path HTTP %{http_code}\n" "http://127.0.0.1:18001$path" || true
done
