"""Prevent old public API credentials from bypassing Supabase Auth."""
import os

from fastapi import Request
from fastapi.responses import JSONResponse

BLOCK_LEGACY_LOGIN = os.getenv("AUTH_BLOCK_LEGACY_LOGIN", "false").strip().lower() == "true"


async def reject_legacy_public_auth(request: Request, call_next):
    path = request.url.path.rstrip("/")
    should_block = path == "/api/v1/auth/register" or (
        path in {"/api/v1/auth/login", "/api/v1/auth/refresh"} and BLOCK_LEGACY_LOGIN
    )
    if request.method == "POST" and should_block:
        return JSONResponse(
            status_code=410,
            content={"detail": "Use the AVIA Rockets login or registration page."},
            headers={"Cache-Control": "no-store"},
        )
    return await call_next(request)
