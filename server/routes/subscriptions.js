import { Router } from 'express';
import { z } from 'zod';
import { plans, pricingPolicy } from '../lib/plans.js';
import { appendRecord, findRecord, updateRecord, findBy } from '../lib/store.js';
import { uid } from '../lib/id.js';
import { authRequired } from '../middleware/auth-required.js';

const router = Router();

const allowedStatuses = ['incomplete', 'trialing', 'active', 'past_due', 'suspended', 'canceled'];

const subscriptionSchema = z.object({
  planId: z.string(),
  paymentMethod: z.enum(['card', 'wire', 'manual']).default('card'),
  provider: z.enum(['mock', 'stripe', 'transbank_oneclick', 'mercadopago']).default('mock')
});

const changePlanSchema = z.object({
  targetPlanId: z.string(),
  reason: z.string().min(3).max(300).default('user_requested_change')
});

router.get('/statuses', (_req, res) => {
  res.json({ statuses: allowedStatuses, policy: pricingPolicy });
});

router.post('/', authRequired, (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) return res.status(404).json({ error: 'PLAN_NOT_FOUND' });

  const existing = findBy(
    'subscriptions',
    (s) => s.userId === req.auth.userId && !['canceled', 'suspended'].includes(s.status)
  );
  if (existing) return res.status(409).json({ error: 'USER_ALREADY_HAS_SUBSCRIPTION', subscription: existing });

  const now = new Date();
  const trialing = plan.hasTrial && pricingPolicy.trialPolicy.enabled;
  const days = plan.billingPeriod === 'annual' ? 365 : 30;

  const subscription = {
    id: uid('sub'),
    userId: req.auth.userId,
    provider: input.provider,
    paymentMethod: input.paymentMethod,
    planId: plan.id,
    status: trialing ? 'trialing' : plan.grossPriceClp === 0 ? 'active' : 'incomplete',
    startedAt: now.toISOString(),
    trialEndsAt: trialing ? new Date(now.getTime() + 1000 * 60 * 60 * 24 * (plan.trialDays || 14)).toISOString() : null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: new Date(now.getTime() + 1000 * 60 * 60 * 24 * days).toISOString(),
    nextBillingAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * days).toISOString(),
    retries: 0,
    graceUntil: null,
    cancelAtPeriodEnd: pricingPolicy.cancellationPolicy === 'cancel_at_period_end',
    planSnapshot: plan,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  appendRecord('subscriptions', subscription);

  return res.status(201).json({ subscription });
});

router.get('/me/current', authRequired, (req, res) => {
  const subscription = findBy('subscriptions', (s) => s.userId === req.auth.userId && s.status !== 'canceled');
  if (!subscription) return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });

  return res.json({ subscription });
});

router.get('/:id', (req, res) => {
  const subscription = findRecord('subscriptions', req.params.id);
  if (!subscription) return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });

  return res.json({ subscription });
});

router.post('/:id/change-plan', authRequired, (req, res) => {
  const parsed = changePlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const targetPlan = plans.find((p) => p.id === parsed.data.targetPlanId);
  if (!targetPlan) return res.status(404).json({ error: 'PLAN_NOT_FOUND' });

  const current = findRecord('subscriptions', req.params.id);
  if (!current || current.userId !== req.auth.userId) {
    return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });
  }

  const updated = updateRecord('subscriptions', current.id, (sub) => ({
    ...sub,
    planId: targetPlan.id,
    planSnapshot: targetPlan,
    updatedAt: new Date().toISOString()
  }));

  appendRecord('subscriptionChanges', {
    id: uid('sch'),
    subscriptionId: current.id,
    userId: req.auth.userId,
    fromPlanId: current.planId,
    toPlanId: targetPlan.id,
    reason: parsed.data.reason,
    changedAt: new Date().toISOString()
  });

  return res.json({ subscription: updated });
});

router.post('/:id/cancel', authRequired, (req, res) => {
  const current = findRecord('subscriptions', req.params.id);
  if (!current || current.userId !== req.auth.userId) {
    return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });
  }

  const updated = updateRecord('subscriptions', current.id, (sub) => {
    const now = new Date().toISOString();
    if (sub.cancelAtPeriodEnd) {
      return {
        ...sub,
        status: sub.status,
        canceledAt: now,
        cancellationMode: 'period_end',
        updatedAt: now
      };
    }

    return {
      ...sub,
      status: 'canceled',
      canceledAt: now,
      cancellationMode: 'immediate',
      updatedAt: now
    };
  });

  return res.json({ subscription: updated });
});

export default router;
