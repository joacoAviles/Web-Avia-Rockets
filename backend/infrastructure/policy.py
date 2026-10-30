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


def reusable_tab(live, remembered, target):
    """Recover restored pages without navigating away from their existing session."""
    from urllib.parse import urlsplit
    def origin(url):
        parsed = urlsplit(url)
        return parsed.scheme, parsed.hostname, parsed.port or (443 if parsed.scheme == 'https' else 80)
    expected = origin(target)
    candidates = []
    for tab in live:
        try:
            if tab.get('type') == 'page' and origin(tab.get('url', '')) == expected:
                candidates.append(tab)
        except ValueError:
            continue
    return next((tab for tab in candidates if tab.get('id') == remembered),
                candidates[0] if candidates else None)
