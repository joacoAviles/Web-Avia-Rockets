import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth-required.js';
import { readStore, writeStore } from '../lib/store.js';
import { uid } from '../lib/id.js';
import { normalizeCauseStatus, publicCause } from '../lib/app-data.js';

const router = Router();

const causeSchema = z.object({
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(220).optional().nullable(),
  court: z.string().max(220).optional().nullable(),
  status: z.string().max(40).optional(),
  user_status: z.string().max(40).optional()
});

const bulkSchema = z.object({
  causes: z.array(causeSchema).min(1).max(500)
});

const statusSchema = z.object({
  status: z.string().min(3).max(40)
});

const resultSchema = z.object({
  summary: z.string().max(220).optional(),
  result_text: z.string().max(5000).optional(),
  resultText: z.string().max(5000).optional(),
  has_changes: z.boolean().optional(),
  hasChanges: z.boolean().optional(),
  source: z.string().max(80).optional()
});

function normalizeInput(input) {
  const status = normalizeCauseStatus(input.user_status || input.status || 'active');
  return {
    code: input.code.trim(),
    title: input.title?.trim() || 'Causa sin titulo',
    court: input.court?.trim() || '',
    status: status || 'active',
    user_status: status || 'active'
  };
}

function findUserCause(store, userId, id) {
  return store.causes.find((cause) => cause.id === id && cause.userId === userId) || null;
}

function upsertCause(store, userId, input) {
  const now = new Date().toISOString();
  const normalized = normalizeInput(input);
  const existingIndex = store.causes.findIndex(
    (cause) => cause.userId === userId && cause.code.toLowerCase() === normalized.code.toLowerCase()
  );

  if (existingIndex >= 0) {
    store.causes[existingIndex] = {
      ...store.causes[existingIndex],
      ...normalized,
      updatedAt: now
    };
    return { cause: store.causes[existingIndex], created: false };
  }

  const cause = {
    id: uid('cause'),
    userId,
    ...normalized,
    last_checked_at: null,
    last_result: 'Pendiente primera revision',
    last_has_changes: false,
    createdAt: now,
    updatedAt: now
  };
  store.causes.push(cause);
  return { cause, created: true };
}

function addResult(store, userId, cause, input) {
  const now = new Date().toISOString();
  const hasChanges = Boolean(input.has_changes ?? input.hasChanges);
  const text = input.result_text || input.resultText || (hasChanges ? 'Cambio detectado' : 'Sin cambios');
  const result = {
    id: uid('res'),
    causeId: cause.id,
    userId,
    summary: input.summary || (hasChanges ? 'Cambio relevante detectado' : 'Revision sin novedades'),
    result_text: text,
    has_changes: hasChanges,
    source: input.source || 'manual',
    checkedAt: now,
    createdAt: now
  };

  store.causeResults.push(result);
  const index = store.causes.findIndex((item) => item.id === cause.id);
  store.causes[index] = {
    ...store.causes[index],
    last_checked_at: now,
    last_result: text,
    last_has_changes: hasChanges,
    updatedAt: now
  };

  return { result, cause: store.causes[index] };
}

router.get('/', authRequired, (req, res) => {
  const store = readStore();
  const results = store.causeResults.filter((result) => result.userId === req.auth.userId);
  const causes = store.causes
    .filter((cause) => cause.userId === req.auth.userId && normalizeCauseStatus(cause.user_status || cause.status))
    .map((cause) => publicCause(cause, results));

  return res.json(causes);
});

router.post('/', authRequired, (req, res) => {
  const parsed = causeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const store = readStore();
  const saved = upsertCause(store, req.auth.userId, parsed.data);
  writeStore(store);

  return res.status(saved.created ? 201 : 200).json({
    cause: publicCause(saved.cause, store.causeResults),
    created: saved.created
  });
});

router.post('/bulk', authRequired, (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const store = readStore();
  let created = 0;
  let updated = 0;
  const causes = parsed.data.causes.map((input) => {
    const saved = upsertCause(store, req.auth.userId, input);
    if (saved.created) created += 1;
    else updated += 1;
    return publicCause(saved.cause, store.causeResults);
  });

  writeStore(store);
  return res.status(201).json({ created, updated, created_or_updated: created + updated, causes });
});

router.patch('/:id/status', authRequired, (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const status = normalizeCauseStatus(parsed.data.status);
  if (!status) return res.status(400).json({ error: 'INVALID_STATUS', allowed: ['active', 'inactive'] });

  const store = readStore();
  const cause = findUserCause(store, req.auth.userId, req.params.id);
  if (!cause) return res.status(404).json({ error: 'CAUSE_NOT_FOUND' });

  const now = new Date().toISOString();
  Object.assign(cause, {
    status,
    user_status: status,
    last_result: status === 'inactive' ? 'Pausada por usuario' : cause.last_result,
    updatedAt: now
  });
  writeStore(store);

  return res.json({ cause: publicCause(cause, store.causeResults) });
});

router.patch('/:id', authRequired, (req, res) => {
  const parsed = causeSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const store = readStore();
  const cause = findUserCause(store, req.auth.userId, req.params.id);
  if (!cause) return res.status(404).json({ error: 'CAUSE_NOT_FOUND' });

  const nextStatus = parsed.data.status || parsed.data.user_status;
  const normalizedStatus = nextStatus ? normalizeCauseStatus(nextStatus) : normalizeCauseStatus(cause.user_status || cause.status);
  if (!normalizedStatus) return res.status(400).json({ error: 'INVALID_STATUS', allowed: ['active', 'inactive'] });

  Object.assign(cause, {
    ...(parsed.data.code ? { code: parsed.data.code.trim() } : {}),
    ...(parsed.data.title !== undefined ? { title: parsed.data.title?.trim() || 'Causa sin titulo' } : {}),
    ...(parsed.data.court !== undefined ? { court: parsed.data.court?.trim() || '' } : {}),
    status: normalizedStatus,
    user_status: normalizedStatus,
    updatedAt: new Date().toISOString()
  });
  writeStore(store);

  return res.json({ cause: publicCause(cause, store.causeResults) });
});

router.get('/:id/results', authRequired, (req, res) => {
  const store = readStore();
  const cause = findUserCause(store, req.auth.userId, req.params.id);
  if (!cause) return res.status(404).json({ error: 'CAUSE_NOT_FOUND' });

  const results = store.causeResults
    .filter((result) => result.causeId === cause.id && result.userId === req.auth.userId)
    .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0));

  return res.json({ cause: publicCause(cause, store.causeResults), results });
});

router.post('/:id/results', authRequired, (req, res) => {
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });

  const store = readStore();
  const cause = findUserCause(store, req.auth.userId, req.params.id);
  if (!cause) return res.status(404).json({ error: 'CAUSE_NOT_FOUND' });

  const saved = addResult(store, req.auth.userId, cause, parsed.data);
  writeStore(store);

  return res.status(201).json({ result: saved.result, cause: publicCause(saved.cause, store.causeResults) });
});

router.post('/:id/run', authRequired, (req, res) => {
  const store = readStore();
  const cause = findUserCause(store, req.auth.userId, req.params.id);
  if (!cause) return res.status(404).json({ error: 'CAUSE_NOT_FOUND' });

  const latest = store.causeResults
    .filter((result) => result.causeId === cause.id && result.userId === req.auth.userId)
    .sort((a, b) => new Date(b.checkedAt || b.createdAt || 0) - new Date(a.checkedAt || a.createdAt || 0))[0];
  const resultText = latest?.result_text || cause.last_result || 'Sin cambios en revision manual';
  const saved = addResult(store, req.auth.userId, cause, {
    summary: latest ? 'Revision igual al resultado anterior' : 'Primera revision sin cambios',
    result_text: resultText,
    has_changes: false,
    source: 'manual'
  });
  writeStore(store);

  return res.status(201).json({ result: saved.result, cause: publicCause(saved.cause, store.causeResults) });
});

export default router;
