import test from 'node:test';
import assert from 'node:assert/strict';
import { plans } from '../server/lib/plans.js';

test('plans must include at least one paid plan', () => {
  assert.ok(plans.some((p) => p.priceMonthly > 0));
});

test('plans should have unique ids', () => {
  const ids = new Set(plans.map((p) => p.id));
  assert.equal(ids.size, plans.length);
});
