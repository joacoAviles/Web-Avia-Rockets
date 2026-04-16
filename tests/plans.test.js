import test from 'node:test';
import assert from 'node:assert/strict';
import { plans, pricingPolicy } from '../server/lib/plans.js';

test('plans must include at least one paid plan', () => {
  assert.ok(plans.some((p) => p.grossPriceClp > 0));
});

test('plans should have unique ids', () => {
  const ids = new Set(plans.map((p) => p.id));
  assert.equal(ids.size, plans.length);
});

test('pricing policy should be configured for Chile', () => {
  assert.equal(pricingPolicy.country, 'CL');
  assert.equal(pricingPolicy.currency, 'clp');
  assert.equal(pricingPolicy.vatRate, 0.19);
});
