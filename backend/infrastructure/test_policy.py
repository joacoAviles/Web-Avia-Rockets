import unittest
from policy import allowed_origin, owner_matches, session_valid

OWNER = 'af9a76db-393c-45d2-b1e9-3398cefe7ca8'


class PolicyTests(unittest.TestCase):
    def test_only_active_exact_owner(self):
        self.assertTrue(owner_matches(OWNER, {'id': OWNER, 'is_active': True}))
        self.assertFalse(owner_matches(OWNER, {'id': OWNER, 'is_active': False}))
        self.assertFalse(owner_matches(OWNER, {'id': 'af9a76db-393c-45d2-b1e9-3398cefe7ca9', 'is_active': True, 'role': 'admin'}))

    def test_unconfigured_and_malformed_deny(self):
        for configured in ('', 'admin@aviarockets.cl', None):
            self.assertFalse(owner_matches(configured, {'id': OWNER, 'is_active': True}))
        for user in ({}, None, {'id': 'invalid', 'is_active': True}):
            self.assertFalse(owner_matches(OWNER, user))

    def test_expiration_boundary(self):
        self.assertFalse(session_valid(None, 10))
        self.assertFalse(session_valid({'expires': 10}, 10))
        self.assertTrue(session_valid({'expires': 11}, 10))

    def test_origin_exact_match(self):
        origin = 'https://aviarockets.cl'
        self.assertTrue(allowed_origin(origin, origin))
        for attacker in (None, 'null', 'http://aviarockets.cl', 'https://aviarockets.cl.attacker.test', 'https://evil.aviarockets.cl'):
            self.assertFalse(allowed_origin(attacker, origin))


if __name__ == '__main__':
    unittest.main()
