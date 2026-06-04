import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './auth.js';

const dataPath = path.resolve('data/store.json');

const defaultStore = {
  leads: [],
  customers: [],
  users: [],
  causes: [],
  causeResults: [],
  accountDeletionRequests: [],
  billingProfiles: [],
  subscriptions: [],
  subscriptionChanges: [],
  paymentMethods: [],
  paymentAttempts: [],
  webhookEvents: [],
  invoicesLocal: [],
  payments: []
};

function createLegalUser(now) {
  return {
    id: 'usr_usuario1',
    username: 'usuario1',
    role: 'legal',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    emailVerifiedAt: now,
    verificationToken: null,
    name: 'Usuario Legal 1',
    full_name: 'Usuario Legal 1',
    email: process.env.LEGAL_USER_EMAIL || 'usuario1@aviarockets.local',
    phone: '+56900000000',
    type: 'person',
    passwordHash: hashPassword(process.env.LEGAL_USER_PASSWORD || 'usuario1'),
    settings: {
      daily_summary_email_enabled: true,
      ui_theme_preference: 'dark',
      default_payment_method: 'manual'
    },
    terms: {
      accepted: true,
      version: '1.102',
      acceptedAt: now
    }
  };
}

function createLegalCauses(userId, now) {
  return [
    {
      id: 'cause_usuario1_001',
      userId,
      code: 'C-1245-2024',
      title: 'Cobranza ejecutiva',
      court: '3 Juzgado Civil de Santiago',
      status: 'active',
      user_status: 'active',
      last_checked_at: now,
      last_result: 'Cambio detectado: nuevo movimiento en expediente',
      last_has_changes: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'cause_usuario1_002',
      userId,
      code: 'C-2301-2023',
      title: 'Revision de estado procesal',
      court: 'Juzgado de Cobranza Laboral',
      status: 'active',
      user_status: 'active',
      last_checked_at: now,
      last_result: 'Sin cambios desde la ultima revision',
      last_has_changes: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'cause_usuario1_003',
      userId,
      code: 'O-808-2025',
      title: 'Causa laboral pausada',
      court: '2 Juzgado de Letras del Trabajo',
      status: 'inactive',
      user_status: 'inactive',
      last_checked_at: now,
      last_result: 'Pausada por usuario',
      last_has_changes: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'cause_usuario1_004',
      userId,
      code: 'C-5351-2026',
      title: 'Prueba civil usuario1',
      court: '29 Juzgado Civil de Santiago',
      status: 'active',
      user_status: 'active',
      last_checked_at: now,
      last_result: 'Sin cambios entre carga de ayer y carga de hoy',
      last_has_changes: false,
      createdAt: now,
      updatedAt: now
    }
  ];
}

function dayIso(offsetDays) {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString();
}

function resultTextForCause(cause) {
  return cause.status === 'inactive'
    ? 'Causa pausada por usuario. Sin cambios entre cargas.'
    : 'Sin cambios entre carga de ayer y carga de hoy';
}

function createLegalResults(causes) {
  const yesterday = dayIso(-1);
  const today = dayIso(0);

  return causes.flatMap((cause, index) => {
    const resultText = resultTextForCause(cause);
    return [
      {
        id: `res_usuario1_${index + 1}_ayer`,
        causeId: cause.id,
        userId: cause.userId,
        summary: 'Carga de ayer sin novedades',
        result_text: resultText,
        has_changes: false,
        source: 'seed_yesterday',
        checkedAt: yesterday,
        createdAt: yesterday
      },
      {
        id: `res_usuario1_${index + 1}_hoy`,
        causeId: cause.id,
        userId: cause.userId,
        summary: 'Carga de hoy igual a ayer',
        result_text: resultText,
        has_changes: false,
        source: 'seed_today',
        checkedAt: today,
        createdAt: today
      }
    ];
  });
}

function seedLegalData(store) {
  if (process.env.SEED_LEGAL_USER === 'false' || store.users.length > 0) return false;
  const now = new Date().toISOString();
  const user = createLegalUser(now);
  const causes = createLegalCauses(user.id, now);

  store.users.push(user);
  store.causes.push(...causes);
  store.causeResults.push(...createLegalResults(causes));
  return true;
}

function ensureStore() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) {
    const initialStore = structuredClone(defaultStore);
    seedLegalData(initialStore);
    fs.writeFileSync(dataPath, JSON.stringify(initialStore, null, 2));
    return;
  }

  // Auto-migrate: add missing collections if store already existed.
  const current = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  let changed = false;

  Object.entries(defaultStore).forEach(([key, emptyValue]) => {
    if (!(key in current)) {
      current[key] = emptyValue;
      changed = true;
    }
  });

  if (seedLegalData(current)) changed = true;

  if (changed) fs.writeFileSync(dataPath, JSON.stringify(current, null, 2));
}

export function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(store) {
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

export function appendRecord(section, record) {
  const store = readStore();
  store[section].push(record);
  writeStore(store);
  return record;
}

export function updateRecord(section, id, updater) {
  const store = readStore();
  const idx = store[section].findIndex((x) => x.id === id);
  if (idx < 0) return null;
  store[section][idx] = updater(store[section][idx]);
  writeStore(store);
  return store[section][idx];
}

export function findRecord(section, id) {
  const store = readStore();
  return store[section].find((x) => x.id === id) || null;
}

export function findBy(section, predicate) {
  const store = readStore();
  return store[section].find(predicate) || null;
}

export function listBy(section, predicate = () => true) {
  const store = readStore();
  return store[section].filter(predicate);
}
