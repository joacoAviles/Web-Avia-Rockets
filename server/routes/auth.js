import { Router } from 'express';
import { z } from 'zod';
import { uid } from '../lib/id.js';
import { appendRecord, findBy, readStore, updateRecord } from '../lib/store.js';
import { hashPassword, issueToken, verifyPassword } from '../lib/auth.js';
import { authRequired } from '../middleware/auth-required.js';
import { publicUser } from '../lib/app-data.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8),
  type: z.enum(['person', 'company']).default('person')
});

const loginSchema = z.object({
  email: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
  password: z.string().min(8)
}).refine((input) => input.email || input.identifier, {
  message: 'Email or username is required',
  path: ['identifier']
});

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;
  const existing = findBy('users', (u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });

  const verificationToken = uid('verify');
  const user = {
    id: uid('usr'),
    role: 'user',
    status: 'pending_verification',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerifiedAt: null,
    verificationToken,
    ...input,
    full_name: input.name,
    settings: {
      daily_summary_email_enabled: true,
      ui_theme_preference: 'dark',
      default_payment_method: 'manual'
    },
    terms: {
      accepted: false,
      version: '1.102',
      acceptedAt: null
    },
    passwordHash: hashPassword(input.password),
    password: undefined
  };

  appendRecord('users', user);

  return res.status(201).json({
    user: publicUser(user),
    verificationToken,
    message: 'User created, verify email to activate account'
  });
});

router.post('/verify-email', (req, res) => {
  const schema = z.object({ token: z.string().min(5) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = findBy('users', (u) => u.verificationToken === parsed.data.token);
  if (!user) return res.status(404).json({ error: 'TOKEN_NOT_FOUND' });

  const updated = updateRecord('users', user.id, (current) => ({
    ...current,
    status: 'active',
    verificationToken: null,
    emailVerifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  return res.json({
    user: {
      id: updated.id,
      email: updated.email,
      status: updated.status,
      emailVerifiedAt: updated.emailVerifiedAt
    }
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const identifier = String(parsed.data.identifier || parsed.data.email || '').trim().toLowerCase();
  const user = findBy('users', (u) => {
    return u.email?.toLowerCase() === identifier || u.username?.toLowerCase() === identifier;
  });
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const token = issueToken({ userId: user.id, role: user.role, email: user.email });

  return res.json({
    token,
    user: publicUser(user)
  });
});

router.get('/me', authRequired, (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  return res.json(publicUser(user));
});

router.post('/logout', (_req, res) => {
  return res.json({ ok: true });
});

router.post('/recover-password', (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = findBy('users', (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) return res.json({ ok: true, message: 'If account exists, recovery instructions were sent' });

  const resetToken = uid('reset');
  updateRecord('users', user.id, (current) => ({
    ...current,
    resetToken,
    updatedAt: new Date().toISOString()
  }));

  return res.json({ ok: true, resetToken });
});

export default router;
