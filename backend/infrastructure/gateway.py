"""Private persistent browser. One Uvicorn worker; no credentials on disk."""
import asyncio
import contextlib
import json
import os
import secrets
import time
from pathlib import Path
from urllib.parse import urlsplit, quote

import httpx
import websockets
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from policy import owner_matches, session_valid, allowed_origin

OWNER = os.environ.get('INFRA_OWNER_USER_ID', '')
ORIGIN = os.environ.get('INFRA_APP_ORIGIN', 'https://aviarockets.cl')
PUBLIC = os.environ.get('INFRA_PUBLIC_ORIGIN', '')
IDENTITY = 'https://api.aviarockets.cl/api/v1/identity/me'
COOKIE = '__Host-avia-infra'
ROOT = Path('/usr/share/novnc').resolve()
LABELS = {'proxmox': 'Proxmox', 'rundeck': 'Rundeck', 'kuma': 'Kuma', 'other1': 'Otro 1', 'other2': 'Otro 2'}
TARGETS = json.loads(os.environ.get('INFRA_TARGETS_JSON', '{}'))
for key, value in TARGETS.items():
    parsed = urlsplit(value)
    if key not in LABELS or parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
        raise RuntimeError('Invalid infrastructure target configuration')

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[ORIGIN], allow_credentials=True,
                   allow_methods=['GET', 'POST', 'DELETE'], allow_headers=['Authorization', 'Content-Type'])
sessions = {}
tabs = {}
navigation_lock = asyncio.Lock()


async def verify(token):
    if not OWNER or not PUBLIC.startswith('https://'):
        raise HTTPException(503, 'INFRA_NOT_CONFIGURED')
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            result = await client.get(IDENTITY, headers={'Authorization': 'Bearer ' + token})
        if result.status_code != 200:
            raise HTTPException(401, 'SESSION_EXPIRED')
        user = result.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, 'IDENTITY_UNAVAILABLE')
    if not owner_matches(OWNER, user):
        raise HTTPException(403, 'OWNER_REQUIRED')
    return user


def csrf(request):
    if not allowed_origin(request.headers.get('origin'), ORIGIN):
        raise HTTPException(403, 'ORIGIN_DENIED')


async def authenticated(cookie):
    session = sessions.get(cookie)
    if not session_valid(session):
        sessions.pop(cookie, None)
        raise HTTPException(401, 'SESSION_EXPIRED')
    # Identity checks are shared between assets and streams, at most every 10s.
    async with session['lock']:
        if time.monotonic() - session['checked'] > 10:
            try:
                await verify(session['token'])
            except HTTPException:
                sessions.pop(cookie, None)
                raise
            session['checked'] = time.monotonic()
    return session


@app.middleware('http')
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "frame-ancestors " + ORIGIN + "; object-src 'none'; base-uri 'self'"
    return response


@app.get('/health')
async def health():
    return {'ok': True}


@app.post('/session')
async def session(request: Request):
    csrf(request)
    header = request.headers.get('authorization', '')
    if not header.startswith('Bearer ') or len(header) > 16384:
        raise HTTPException(401, 'MISSING_SESSION')
    token = header[7:]
    await verify(token)
    now = time.monotonic()
    for key in list(sessions):
        if not session_valid(sessions[key], now):
            del sessions[key]
    cookie = request.cookies.get(COOKIE)
    if cookie not in sessions:
        if len(sessions) >= 8:
            raise HTTPException(429, 'TOO_MANY_SESSIONS')
        cookie = secrets.token_urlsafe(48)
    sessions[cookie] = {'token': token, 'expires': now + 120, 'checked': now, 'lock': asyncio.Lock()}
    response = JSONResponse({'services': [{'id': k, 'label': v, 'configured': k in TARGETS} for k, v in LABELS.items()]})
    response.set_cookie(COOKIE, cookie, secure=True, httponly=True, samesite='strict', max_age=120, path='/')
    return response


@app.delete('/session')
async def disconnect(request: Request):
    csrf(request)
    sessions.pop(request.cookies.get(COOKIE), None)
    response = JSONResponse({'ok': True})
    response.delete_cookie(COOKIE, path='/', secure=True, httponly=True, samesite='strict')
    return response


@app.post('/services/{service}/activate')
async def activate(service: str, request: Request):
    csrf(request)
    await authenticated(request.cookies.get(COOKIE))
    if service not in TARGETS:
        raise HTTPException(404, 'SERVICE_NOT_CONFIGURED')
    async with navigation_lock:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                live = (await client.get('http://127.0.0.1:9222/json/list')).json()
                tab = next((t for t in live if t.get('id') == tabs.get(service)), None)
                if tab is None:
                    tab = (await client.put('http://127.0.0.1:9222/json/new?' + quote(TARGETS[service], safe=''))).json()
                    tabs[service] = tab['id']
                result = await client.get('http://127.0.0.1:9222/json/activate/' + quote(tab['id'], safe=''))
                result.raise_for_status()
        except (httpx.HTTPError, ValueError, KeyError):
            raise HTTPException(503, 'BROWSER_UNAVAILABLE')
    return {'ok': True}


@app.get('/remote/{asset:path}')
async def asset(asset: str, request: Request):
    await authenticated(request.cookies.get(COOKIE))
    path = (ROOT / asset).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise HTTPException(404)
    return FileResponse(path)


@app.websocket('/stream')
async def stream(ws: WebSocket):
    # noVNC runs on PUBLIC, inside an iframe whose ancestors are restricted.
    if not allowed_origin(ws.headers.get('origin'), PUBLIC):
        await ws.close(code=1008)
        return
    cookie = ws.cookies.get(COOKIE)
    try:
        await authenticated(cookie)
    except HTTPException:
        await ws.close(code=1008)
        return
    await ws.accept(subprotocol='binary' if 'binary' in ws.scope.get('subprotocols', []) else None)
    tasks = []
    try:
        async with websockets.connect('ws://127.0.0.1:6080', subprotocols=['binary'], max_size=8*1024*1024) as upstream:
            async def send():
                while True:
                    await upstream.send(await ws.receive_bytes())
            async def receive():
                async for data in upstream:
                    await ws.send_bytes(data)
            async def guard():
                while True:
                    await asyncio.sleep(5)
                    await authenticated(cookie)
            tasks = [asyncio.create_task(fn()) for fn in (send, receive, guard)]
            done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                task.result()
    except Exception:
        pass  # Never log cookies, browser data, or credentials.
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        with contextlib.suppress(Exception):
            await ws.close(code=1008)
