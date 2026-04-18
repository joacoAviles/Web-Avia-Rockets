import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidRut, normalizeRut } from '../server/lib/rut.js';

test('normalize rut should remove dots and dash', () => {
  assert.equal(normalizeRut('12.345.678-5'), '123456785');
});

test('validates correct rut and rejects invalid', () => {
  assert.equal(isValidRut('12.345.678-5'), true);
  assert.equal(isValidRut('12.345.678-9'), false);
});
