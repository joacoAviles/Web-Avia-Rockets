# RA Backend - Revisiones Automáticas

Backend inicial para RA usando FastAPI + PostgreSQL.

## Qué hace

- Login con usuario y contraseña.
- Devuelve JWT.
- Lista causas del usuario autenticado.
- Crea causas.
- Pausa, activa o elimina causas con soft delete.
- Lee historial de revisiones.
- Lee y actualiza configuración de correo.
- Incluye endpoint demo para simular revisión.

## Seguridad básica

No subas `.env` real a GitHub.

Cambiar inmediatamente:

- `DB_PASSWORD`
- `JWT_SECRET`
- contraseña del usuario `admin`
- contraseña del contenedor PostgreSQL que pegaste en el chat

## Instalación local / NAS

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edita `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=15432
DB_NAME=BaseAviaRockets
DB_USER=IronMan
DB_PASSWORD=CAMBIAR_EN_SERVIDOR
JWT_SECRET=CAMBIAR_POR_SECRETO_LARGO
```

Si la API corre en otro equipo dentro de la VPN, cambia `DB_HOST` por la IP privada del NAS.

## Crear tablas

Con DBeaver o psql, ejecuta:

```sql
-- contenido de backend/schema.sql
```

Con psql sería algo como:

```bash
psql "postgresql://IronMan:TU_PASSWORD@127.0.0.1:15432/BaseAviaRockets" -f schema.sql
```

## Correr API

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Probar:

```text
http://IP_DEL_NAS:8000/api/health
```

Debe responder:

```json
{"status":"ok","app":"RA Revisiones Automaticas"}
```

## Login

Endpoint:

```http
POST /api/login
Content-Type: application/json
```

Body:

```json
{
  "username": "admin",
  "password": "admin"
}
```

La respuesta trae:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Para llamar endpoints protegidos:

```http
Authorization: Bearer TOKEN
```

## Endpoints principales

```http
GET /api/health
POST /api/login
GET /api/me
GET /api/causas
POST /api/causas
PATCH /api/causas/{cause_id}
DELETE /api/causas/{cause_id}
GET /api/causas/{cause_id}/historial
GET /api/notificaciones
PATCH /api/notificaciones
POST /api/demo/revisar
```

## Ejemplo crear causa

```http
POST /api/causas
Authorization: Bearer TOKEN
Content-Type: application/json
```

```json
{
  "rol": "C-1234-2026",
  "anio": 2026,
  "competencia": "Civil",
  "tribunal": "3° Juzgado Civil de Santiago",
  "tipo_causa": "C",
  "status": "active"
}
```

## Arquitectura esperada

```text
Navegador
→ ra.aviarockets.cl
→ https://api.aviarockets.cl
→ FastAPI
→ PostgreSQL en NAS por VPN o local
```

El navegador nunca debe conectarse directo a PostgreSQL.

## Próximo paso

Cambiar `ra.html` para consumir esta API real en vez de usar datos simulados.
