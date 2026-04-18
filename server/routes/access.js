import { Router } from 'express';
import { authRequired } from '../middleware/auth-required.js';
import { findBy } from '../lib/store.js';

const router = Router();

router.get('/entitlements', authRequired, (req, res) => {
  const subscription = findBy('subscriptions', (s) => s.userId === req.auth.userId && s.status !== 'canceled');

  if (!subscription) {
    return res.json({
      hasAccess: false,
      reason: 'NO_ACTIVE_SUBSCRIPTION',
      actions: ['go_to_checkout']
    });
  }

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return res.json({ hasAccess: true, reason: 'SUBSCRIPTION_OK', subscription });
  }

  if (subscription.status === 'past_due' && subscription.graceUntil && new Date(subscription.graceUntil) > new Date()) {
    return res.json({ hasAccess: true, reason: 'GRACE_PERIOD', subscription, showBanner: true });
  }

  return res.json({ hasAccess: false, reason: `STATUS_${subscription.status.toUpperCase()}`, actions: ['update_payment_method'] });
});

export default router;
