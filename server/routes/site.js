import { Router } from 'express';
import { sitePayload } from './public.js';

const router = Router();

router.get('/', (_req, res) => {
  return res.json(sitePayload());
});

export default router;
