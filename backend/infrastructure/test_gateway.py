"""Run in the built image: python3 -m unittest -v test_gateway.py."""
import os
import unittest
from unittest.mock import patch

os.environ['INFRA_OWNER_USER_ID'] = 'af9a76db-393c-45d2-b1e9-3398cefe7ca8'
os.environ['INFRA_PUBLIC_ORIGIN'] = 'https://infra.aviarockets.cl'

from fastapi import HTTPException
from fastapi.testclient import TestClient
import gateway as g


async def allow(token):
    if token != 'valid':
        raise HTTPException(403, 'OWNER_REQUIRED')
    return {'id': g.OWNER, 'is_active': True}


class GatewayTests(unittest.TestCase):
    def setUp(self):
        g.sessions.clear()
        self.client = TestClient(g.app, base_url=g.PUBLIC)
        self.verifier = patch.object(g, 'verify', allow)
        self.verifier.start()
        self.addCleanup(self.verifier.stop)

    def login(self):
        return self.client.post('/session', headers={'Origin': g.ORIGIN, 'Authorization': 'Bearer valid'})

    def test_anonymous_assets_denied(self):
        self.assertEqual(self.client.get('/remote/vnc.html').status_code, 401)

    def test_cross_origin_and_wrong_user_denied(self):
        self.assertEqual(self.client.post('/session', headers={'Origin': 'https://evil.test', 'Authorization': 'Bearer valid'}).status_code, 403)
        self.assertEqual(self.client.post('/session', headers={'Origin': g.ORIGIN, 'Authorization': 'Bearer other'}).status_code, 403)

    def test_logout_revokes_cookie(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        cookie = response.headers['set-cookie']
        for attribute in ('Secure', 'HttpOnly', 'SameSite=strict'):
            self.assertIn(attribute, cookie)
        self.assertEqual(self.client.delete('/session', headers={'Origin': g.ORIGIN}).status_code, 200)
        self.assertEqual(self.client.get('/remote/vnc.html').status_code, 401)

    def test_unknown_service_does_not_navigate(self):
        self.login()
        self.assertEqual(self.client.post('/services/attacker/activate', headers={'Origin': g.ORIGIN}).status_code, 404)

    def test_expired_connection_denied(self):
        self.login()
        for session in g.sessions.values():
            session['expires'] = 0
        self.assertEqual(self.client.get('/remote/vnc.html').status_code, 401)


if __name__ == '__main__':
    unittest.main()
