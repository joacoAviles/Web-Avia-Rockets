import { Router } from 'express';
import { z } from 'zod';
import { uid } from '../lib/id.js';
import { appendRecord, findBy, updateRecord } from '../lib/store.js';
import { hashPassword, issueToken, verifyPassword } from '../lib/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8),
  type: z.enum(['person', 'company']).default('person')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
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
    passwordHash: hashPassword(input.password),
    password: undefined
  };

  appendRecord('users', user);

  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    },
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

  const user = findBy('users', (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const token = issueToken({ userId: user.id, role: user.role, email: user.email });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
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
