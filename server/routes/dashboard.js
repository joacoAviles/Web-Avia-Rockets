import { Router } from 'express';
import { authRequired } from '../middleware/auth-required.js';
import { readStore } from '../lib/store.js';
import { dashboardForUser } from '../lib/app-data.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  return res.json(dashboardForUser(user, store));
});

export default router;
