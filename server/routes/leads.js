import { Router } from 'express';
import { z } from 'zod';
import { appendRecord } from '../lib/store.js';
import { uid } from '../lib/id.js';

const router = Router();

const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  interest: z.enum(['people_review', 'fleet', 'custom_dev']),
  preferredLanguage: z.enum(['es', 'en']).default('es'),
  message: z.string().min(5).max(2000)
});

router.post('/', (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parsed.error.flatten()
    });
  }

  const lead = {
    id: uid('lead'),
    ...parsed.data,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  appendRecord('leads', lead);

  return res.status(201).json({ lead, message: 'Lead created successfully' });
});

export default router;
