import unittest
from policy import allowed_origin, owner_matches, session_valid, reusable_tab

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

    def test_restored_service_tab_is_reused(self):
        login = {'id': 'restored', 'type': 'page', 'url': 'http://host:4440/user/login'}
        self.assertIs(reusable_tab([login], None, 'http://host:4440/project/job'), login)
        self.assertIsNone(reusable_tab([login], None, 'http://host:3000'))
        self.assertIsNone(reusable_tab([login], None, 'https://host:4440'))

    def test_remembered_tab_wins_and_external_redirect_is_not_reused(self):
        tabs = [{'id': 'a', 'type': 'page', 'url': 'https://host/'},
                {'id': 'b', 'type': 'page', 'url': 'https://host:443/page'},
                {'id': 'c', 'type': 'page', 'url': 'https://host.attacker.test/'}]
        self.assertEqual(reusable_tab(tabs, 'b', 'https://host/')['id'], 'b')
        self.assertEqual(reusable_tab(tabs, 'c', 'https://host/')['id'], 'a')

    def test_origin_exact_match(self):
        origin = 'https://aviarockets.cl'
        self.assertTrue(allowed_origin(origin, origin))
        for attacker in (None, 'null', 'http://aviarockets.cl', 'https://aviarockets.cl.attacker.test', 'https://evil.aviarockets.cl'):
            self.assertFalse(allowed_origin(attacker, origin))


if __name__ == '__main__':
    unittest.main()
