"""Fail-closed policy shared by HTTP and WebSocket entry points."""
import time
import uuid


def owner_matches(configured, user):
    try:
        return bool(user.get('is_active')) and uuid.UUID(str(user['id'])) == uuid.UUID(configured)
    except (ValueError, TypeError, KeyError, AttributeError):
        return False


def session_valid(session, now=None):
    now = time.monotonic() if now is None else now
    return bool(session) and session['expires'] > now


def allowed_origin(origin, expected):
    return bool(expected) and origin == expected
