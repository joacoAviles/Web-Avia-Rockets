import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, issueToken, readToken } from '../server/lib/auth.js';

test('hash + verify password should work', () => {
  const hash = hashPassword('supersegura123');
  assert.equal(verifyPassword('supersegura123', hash), true);
  assert.equal(verifyPassword('incorrecta', hash), false);
});

test('token should be readable and expire-aware', () => {
  const token = issueToken({ userId: 'usr_1', role: 'user' }, 60);
  const payload = readToken(token);
  assert.equal(payload.userId, 'usr_1');
  assert.equal(payload.role, 'user');
});
