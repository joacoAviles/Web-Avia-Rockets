import { Router } from 'express';
import { uid } from '../lib/id.js';
import { listBy, appendRecord, updateRecord } from '../lib/store.js';

const router = Router();

router.post('/run-daily-cycle', (_req, res) => {
  const now = new Date();
  const dueSubscriptions = listBy(
    'subscriptions',
    (s) => ['active', 'past_due'].includes(s.status) && new Date(s.nextBillingAt || s.renewalDate) <= now
  );

  const results = dueSubscriptions.map((subscription) => {
    // mock success ratio: 80% approve
    const approved = Math.random() >= 0.2;

    const attempt = appendRecord('paymentAttempts', {
      id: uid('pat'),
      subscriptionId: subscription.id,
      userId: subscription.userId,
      amount: subscription.planSnapshot?.grossPriceClp || subscription.planSnapshot?.priceMonthly || 0,
      currency: subscription.planSnapshot?.currency || 'clp',
      provider: subscription.provider || 'mock',
      status: approved ? 'approved' : 'rejected',
      attemptAt: now.toISOString()
    });

    if (approved) {
      updateRecord('subscriptions', subscription.id, (current) => ({
        ...current,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        nextBillingAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        updatedAt: now.toISOString()
      }));
    } else {
      updateRecord('subscriptions', subscription.id, (current) => ({
        ...current,
        status: 'past_due',
        graceUntil: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        retries: (current.retries || 0) + 1,
        updatedAt: now.toISOString()
      }));
    }

    return attempt;
  });

  return res.json({ processed: results.length, paymentAttempts: results });
});

export default router;
