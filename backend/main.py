import os
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import psycopg
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from psycopg.rows import dict_row

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "RA Revisiones Automaticas")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "15432")
DB_NAME = os.getenv("DB_NAME", "BaseAviaRockets")
DB_USER = os.getenv("DB_USER", "IronMan")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "720"))
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def get_connection():
    return psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        row_factory=dict_row,
    )


class LoginRequest(BaseModel):
    username: str
    password: str


class CauseCreate(BaseModel):
    rol: str = Field(min_length=1)
    anio: int | None = None
    competencia: str = Field(min_length=1)
    tribunal: str | None = None
    tipo_causa: str | None = None
    status: str = "active"


class CauseUpdate(BaseModel):
    rol: str | None = None
    anio: int | None = None
    competencia: str | None = None
    tribunal: str | None = None
    tipo_causa: str | None = None
    status: str | None = None


class NotificationUpdate(BaseModel):
    email_enabled: bool | None = None
    email_to: str | None = None
    frequency: str | None = None


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    payload.update({"exp": expires_at})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, username, full_name, role, is_active
                FROM app_users
                WHERE id = %s AND is_active = TRUE
                """,
                (user_id,),
            )
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
            return user


@app.get("/api/health")
def health():
    return {"status": "ok", "app": APP_NAME}


@app.post("/api/login")
def login(payload: LoginRequest):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, username, password_hash, full_name, role, is_active
                FROM app_users
                WHERE username = %s
                """,
                (payload.username,),
            )
            user = cur.fetchone()

    if not user or not user["is_active"] or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    token = create_access_token({"sub": str(user["id"]), "username": user["username"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
        },
    }


@app.get("/api/me")
def me(user: dict[str, Any] = Depends(get_current_user)):
    return {key: str(value) if isinstance(value, UUID) else value for key, value in user.items()}


@app.get("/api/causas")
def list_causes(user: dict[str, Any] = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, rol, anio, competencia, tribunal, tipo_causa, status,
                       last_checked_at, last_result, last_has_changes, created_at, updated_at
                FROM causes
                WHERE user_id = %s AND status <> 'deleted'
                ORDER BY created_at DESC
                """,
                (user["id"],),
            )
            rows = cur.fetchall()
    return [{key: str(value) if isinstance(value, (UUID, datetime)) else value for key, value in row.items()} for row in rows]


@app.post("/api/causas", status_code=201)
def create_cause(payload: CauseCreate, user: dict[str, Any] = Depends(get_current_user)):
    if payload.status not in {"active", "paused"}:
        raise HTTPException(status_code=400, detail="Estado invalido")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO causes (user_id, rol, anio, competencia, tribunal, tipo_causa, status, last_result)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, rol, anio, competencia, tribunal, tipo_causa, status, created_at
                """,
                (
                    user["id"],
                    payload.rol,
                    payload.anio,
                    payload.competencia,
                    payload.tribunal,
                    payload.tipo_causa,
                    payload.status,
                    "Pendiente primera revision" if payload.status == "active" else "Pausada",
                ),
            )
            row = cur.fetchone()
            conn.commit()
    return {key: str(value) if isinstance(value, (UUID, datetime)) else value for key, value in row.items()}


@app.patch("/api/causas/{cause_id}")
def update_cause(cause_id: UUID, payload: CauseUpdate, user: dict[str, Any] = Depends(get_current_user)):
    fields = []
    values = []
    allowed = payload.model_dump(exclude_unset=True)

    if "status" in allowed and allowed["status"] not in {"active", "paused", "deleted"}:
        raise HTTPException(status_code=400, detail="Estado invalido")

    for field, value in allowed.items():
        fields.append(f"{field} = %s")
        values.append(value)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    fields.append("updated_at = now()")
    values.extend([cause_id, user["id"]])

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE causes
                SET {', '.join(fields)}
                WHERE id = %s AND user_id = %s
                RETURNING id, rol, anio, competencia, tribunal, tipo_causa, status, updated_at
                """,
                tuple(values),
            )
            row = cur.fetchone()
            conn.commit()

    if not row:
        raise HTTPException(status_code=404, detail="Causa no encontrada")

    return {key: str(value) if isinstance(value, (UUID, datetime)) else value for key, value in row.items()}


@app.delete("/api/causas/{cause_id}")
def delete_cause(cause_id: UUID, user: dict[str, Any] = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE causes
                SET status = 'deleted', updated_at = now()
                WHERE id = %s AND user_id = %s
                RETURNING id
                """,
                (cause_id, user["id"]),
            )
            row = cur.fetchone()
            conn.commit()

    if not row:
        raise HTTPException(status_code=404, detail="Causa no encontrada")

    return {"ok": True}


@app.get("/api/causas/{cause_id}/historial")
def cause_history(cause_id: UUID, user: dict[str, Any] = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT cc.id, cc.checked_at, cc.result_hash, cc.result_json, cc.result_text,
                       cc.has_changes, cc.error_message
                FROM cause_checks cc
                JOIN causes c ON c.id = cc.cause_id
                WHERE cc.cause_id = %s AND c.user_id = %s
                ORDER BY cc.checked_at DESC
                LIMIT 50
                """,
                (cause_id, user["id"]),
            )
            rows = cur.fetchall()
    return [{key: str(value) if isinstance(value, (UUID, datetime)) else value for key, value in row.items()} for row in rows]


@app.get("/api/notificaciones")
def get_notifications(user: dict[str, Any] = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email_enabled, email_to, frequency, created_at, updated_at
                FROM notification_settings
                WHERE user_id = %s
                """,
                (user["id"],),
            )
            row = cur.fetchone()
    if not row:
        return {"email_enabled": False, "email_to": None, "frequency": "immediate"}
    return {key: str(value) if isinstance(value, (UUID, datetime)) else value for key, value in row.items()}


@app.patch("/api/notificaciones")
def update_notifications(payload: NotificationUpdate, user: dict[str, Any] = Depends(get_current_user)):
    current = payload.model_dump(exclude_unset=True)
    if "frequency" in current and current["frequency"] not in {"immediate", "daily", "weekly"}:
        raise HTTPException(status_code=400, detail="Frecuencia invalida")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM notification_settings WHERE user_id = %s", (user["id"],))
            exists = cur.fetchone()
            if not exists:
                cur.execute(
                    """
                    INSERT INTO notification_settings (user_id, email_enabled, email_to, frequency)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        user["id"],
                        current.get("email_enabled", True),
                        current.get("email_to", user["email"]),
                        current.get("frequency", "immediate"),
                    ),
                )
            else:
                fields = []
                values = []
                for field, value in current.items():
                    fields.append(f"{field} = %s")
                    values.append(value)
                if fields:
                    fields.append("updated_at = now()")
                    values.append(user["id"])
                    cur.execute(
                        f"UPDATE notification_settings SET {', '.join(fields)} WHERE user_id = %s",
                        tuple(values),
                    )
            conn.commit()
    return get_notifications(user)


@app.post("/api/demo/revisar")
def demo_check(user: dict[str, Any] = Depends(get_current_user)):
    """Simula una revision. Luego se reemplaza por el worker real."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, rol
                FROM causes
                WHERE user_id = %s AND status = 'active'
                """,
                (user["id"],),
            )
            active_causes = cur.fetchall()
            for index, cause in enumerate(active_causes):
                has_changes = index % 2 == 0
                result_text = "Cambio detectado" if has_changes else "Sin cambios"
                cur.execute(
                    """
                    INSERT INTO cause_checks (cause_id, user_id, checked_at, result_text, has_changes, result_json)
                    VALUES (%s, %s, now(), %s, %s, %s)
                    """,
                    (cause["id"], user["id"], result_text, has_changes, psycopg.types.json.Jsonb({"demo": True, "rol": cause["rol"]})),
                )
                cur.execute(
                    """
                    UPDATE causes
                    SET last_checked_at = now(), last_result = %s, last_has_changes = %s, updated_at = now()
                    WHERE id = %s
                    """,
                    (result_text, has_changes, cause["id"]),
                )
            conn.commit()
    return {"ok": True, "checked": len(active_causes)}
