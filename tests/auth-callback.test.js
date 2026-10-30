import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../web-auth/auth.js', import.meta.url), 'utf8')
  .replace(/^import .*\n/, '');

async function callback({ hash = '', session = { access_token: 'test-session' } } = {}) {
  const redirects = [];
  const requests = [];
  const stored = new Map();
  const status = { textContent: '', setAttribute() {} };
  const location = { hash, search: '?code=test-code',
    assign: value => redirects.push(value), replace: value => redirects.push(value) };
  const context = {
    URLSearchParams, location,
    window: { AVIA_SUPABASE_CONFIG: { url: 'https://identity.example', publishableKey: 'public-test-key' } },
    document: { body: { dataset: { page: 'callback' } },
      querySelector: selector => selector === '#status' ? status : null },
    sessionStorage: { removeItem() {} },
    localStorage: { setItem: (key, value) => stored.set(key, value) },
    createClient() {
      // The SDK consumes the URL fragment during initialization.
      location.hash = '';
      return { auth: { getSession: async () => ({ data: { session }, error: null }) } };
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ access_token: 'test-api-token', user: { id: 'existing-user' } }) };
    },
  };
  vm.runInNewContext(source, context);
  await new Promise(setImmediate);
  return { redirects, requests, stored, status };
}

test('invitation survives SDK fragment cleanup and asks for a password before entering Avia', async () => {
  const result = await callback({ hash: '#type=invite&access_token=synthetic' });
  assert.deepEqual(result.redirects, ['reset.html?invited=1']);
  assert.equal(result.requests.length, 0);
  assert.equal(result.stored.size, 0);
});

test('Google callback exchanges the existing session and opens the application', async () => {
  const result = await callback();
  assert.deepEqual(result.redirects, ['../app.html']);
  assert.equal(result.requests.length, 1);
  assert.ok(result.requests[0].url.endsWith('/api/v1/identity/exchange'));
  assert.equal(result.stored.get('avia_auth_token'), 'test-api-token');
});

test('expired invitation cannot enter the app or obtain an API token', async () => {
  const result = await callback({ hash: '#type=invite', session: null });
  assert.deepEqual(result.redirects, []);
  assert.equal(result.requests.length, 0);
  assert.equal(result.stored.size, 0);
  assert.ok(result.status.textContent);
});
