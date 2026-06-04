import { Router } from 'express';
import { authRequired } from '../middleware/auth-required.js';
import { readStore } from '../lib/store.js';
import { publicUser } from '../lib/app-data.js';

const router = Router();

router.get('/users', authRequired, (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ error: 'ADMIN_REQUIRED' });

  const store = readStore();
  const users = store.users.map((user) => ({
    ...publicUser(user),
    is_active: user.status === 'active',
    createdAt: user.createdAt
  }));

  return res.json(users);
});

export default router;
