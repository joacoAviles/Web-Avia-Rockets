import fs from 'node:fs';
import path from 'node:path';

const dataPath = path.resolve('data/store.json');

const defaultStore = {
  leads: [],
  customers: [],
  users: [],
  billingProfiles: [],
  subscriptions: [],
  subscriptionChanges: [],
  paymentMethods: [],
  paymentAttempts: [],
  webhookEvents: [],
  invoicesLocal: [],
  payments: []
};

function ensureStore() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(defaultStore, null, 2));
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
