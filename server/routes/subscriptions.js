import { Router } from 'express';
import { z } from 'zod';
import { plans } from '../lib/plans.js';
import { appendRecord, findRecord, updateRecord } from '../lib/store.js';
import { uid } from '../lib/id.js';

const router = Router();

const subscriptionSchema = z.object({
  planId: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  paymentMethod: z.enum(['card', 'wire', 'manual']).default('card')
});

router.post('/', (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) return res.status(404).json({ error: 'PLAN_NOT_FOUND' });

  const subscription = {
    id: uid('sub'),
    ...input,
    status: plan.priceMonthly > 0 ? 'pending_payment' : 'pending_quote',
    startedAt: new Date().toISOString(),
    renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    planSnapshot: plan
  };

  appendRecord('subscriptions', subscription);

  return res.status(201).json({ subscription });
});

router.get('/:id', (req, res) => {
  const subscription = findRecord('subscriptions', req.params.id);
  if (!subscription) return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });

  return res.json({ subscription });
});

router.post('/:id/cancel', (req, res) => {
  const updated = updateRecord('subscriptions', req.params.id, (sub) => ({
    ...sub,
    status: 'cancelled',
    cancelledAt: new Date().toISOString()
  }));

  if (!updated) return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });

  return res.json({ subscription: updated });
});

export default router;
