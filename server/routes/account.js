import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth-required.js';
import { readStore, writeStore } from '../lib/store.js';
import { uid } from '../lib/id.js';
import { accountForUser, defaultSettings } from '../lib/app-data.js';

const router = Router();

const settingsSchema = z.object({
  daily_summary_email_enabled: z.boolean().optional(),
  ui_theme_preference: z.enum(['dark', 'light']).optional(),
  default_payment_method: z.enum(['manual', 'card', 'wire', 'transbank_oneclick', 'mercadopago']).optional()
});

router.patch('/settings', authRequired, (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const store = readStore();
  const user = store.users.find((item) => item.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  user.settings = {
    ...defaultSettings(user),
    ...parsed.data
  };
  user.updatedAt = new Date().toISOString();
  writeStore(store);

  return res.json(accountForUser(user, store));
});

router.post('/delete-request', authRequired, (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  const request = {
    id: uid('del'),
    userId: user.id,
    email: user.email,
    status: 'requested',
    createdAt: new Date().toISOString()
  };
  store.accountDeletionRequests.push(request);
  writeStore(store);

  return res.status(201).json({ ok: true, request });
});

export default router;
