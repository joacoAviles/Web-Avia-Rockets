from collections import defaultdict, deque
from time import monotonic

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.api import api_keys, auth, external, files, health, jobs, labs, legal, legal_admin, notifications, pjud_distributed, web_compat
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_requests: dict[str, deque[float]] = defaultdict(deque)


@app.get("/", tags=["service"], include_in_schema=False)
async def root() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "documentation": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }


@app.get("/help", include_in_schema=False)
async def help_page() -> RedirectResponse:
    return RedirectResponse(url="/docs", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.get("/api/v1", tags=["service"])
async def api_index() -> dict:
    return {
        "status": "ok",
        "version": settings.app_version,
        "documentation": "/docs",
        "health": "/api/v1/health",
        "resources": {
            "auth": "/api/v1/auth",
            "api_keys": "/api/v1/api-keys",
            "legal": "/api/v1/legal",
            "files": "/api/v1/files",
            "jobs": "/api/v1/jobs/{job_id}",
            "labs": "/api/v1/labs",
            "notifications": "/api/v1/notifications",
            "external": "/api/v1/external",
        },
    }


@app.middleware("http")
async def simple_rate_limit(request: Request, call_next):
    if request.url.path in {"/health", "/api/v1/health"}:
        return await call_next(request)
    limit = settings.external_rate_limit_per_minute if request.url.path.startswith("/api/v1/external") else settings.rate_limit_per_minute
    key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
    now = monotonic()
    window = _requests[key]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= limit:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"},
        )
    window.append(now)
    return await call_next(request)


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(web_compat.router)
app.include_router(api_keys.router)
app.include_router(legal.router)
app.include_router(legal_admin.router)
app.include_router(labs.router)
app.include_router(labs.legal_router)
app.include_router(jobs.router)
app.include_router(files.router)
app.include_router(notifications.router)
app.include_router(external.router)
app.include_router(pjud_distributed.router, prefix="/api/v1/external/legal/pjud")
app.include_router(pjud_distributed.router, prefix="/api/v1/pjud-distributed")
