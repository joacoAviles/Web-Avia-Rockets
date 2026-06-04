import { Router } from 'express';
import { authRequired } from '../middleware/auth-required.js';
import { readStore } from '../lib/store.js';
import { publicCause } from '../lib/app-data.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const store = readStore();
  const userCauseIds = new Set(store.causes.filter((cause) => cause.userId === req.auth.userId).map((cause) => cause.id));
  const results = store.causeResults
    .filter((result) => userCauseIds.has(result.causeId))
    .map((result) => {
      const cause = store.causes.find((item) => item.id === result.causeId);
      return {
        ...result,
        cause: cause ? publicCause(cause, store.causeResults) : null
      };
    })
    .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0));

  return res.json({ results });
});

export default router;
