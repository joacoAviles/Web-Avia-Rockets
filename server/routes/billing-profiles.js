import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth-required.js';
import { appendRecord, findBy, updateRecord } from '../lib/store.js';
import { uid } from '../lib/id.js';
import { isValidRut, normalizeRut } from '../lib/rut.js';

const router = Router();

const schema = z.object({
  customerType: z.enum(['person', 'company']),
  legalName: z.string().min(2),
  rut: z.string().min(8),
  giro: z.string().optional(),
  address: z.string().min(5),
  district: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2).default('Chile')
});

router.post('/', authRequired, (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const normalizedRut = normalizeRut(parsed.data.rut);
  if (!isValidRut(normalizedRut)) return res.status(400).json({ error: 'INVALID_RUT' });

  const existing = findBy('billingProfiles', (b) => b.userId === req.auth.userId);

  const payload = {
    userId: req.auth.userId,
    customerType: parsed.data.customerType,
    legalName: parsed.data.legalName,
    rut: normalizedRut,
    giro: parsed.data.giro || null,
    address: parsed.data.address,
    district: parsed.data.district,
    city: parsed.data.city,
    country: parsed.data.country,
    updatedAt: new Date().toISOString()
  };

  if (!existing) {
    const created = appendRecord('billingProfiles', {
      id: uid('bill'),
      createdAt: new Date().toISOString(),
      ...payload
    });
    return res.status(201).json({ billingProfile: created });
  }

  const updated = updateRecord('billingProfiles', existing.id, (current) => ({
    ...current,
    ...payload
  }));

  return res.json({ billingProfile: updated });
});

router.get('/me', authRequired, (req, res) => {
  const profile = findBy('billingProfiles', (b) => b.userId === req.auth.userId);
  if (!profile) return res.status(404).json({ error: 'BILLING_PROFILE_NOT_FOUND' });
  return res.json({ billingProfile: profile });
});

export default router;
