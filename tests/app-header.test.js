import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dashboardForUser, publicUser } from '../server/lib/app-data.js';

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const headerScript = readFileSync(new URL('../header-standard.js', import.meta.url), 'utf8');
const footerScript = readFileSync(new URL('../footer-standard.js', import.meta.url), 'utf8');

test('authenticated header uses Aurora and permission-aware dropdowns', () => {
  assert.match(appHtml, /https:\/\/aviarockets\.cl\/bimi\/logo\.svg/);
  assert.match(appHtml, /class="app-header-dropdown"/);
  assert.match(appHtml, /itemsForLine\(lineId\)/);
  assert.match(appHtml, /permissionProductTokens/);
  assert.match(appHtml, /function allowedLines\(\)\{\s*return Object\.keys\(lines\)/);
  assert.match(appHtml, /Sin productos disponibles/);
  assert.doesNotMatch(appHtml, /class="app-config-wheel"/);
});

test('generic header does not race the authenticated app header', () => {
  assert.match(headerScript, /var isLogged = document\.body\?\.dataset\?\.page === 'app-home' && Boolean\(user\)/);
  assert.match(headerScript, /if \(!token \|\| !raw\) return null/);
  assert.match(
    headerScript,
    /app\.html is the only owner of the authenticated product navigation/
  );
  assert.match(footerScript, /script\[src\^="header-standard\.js"\]/);
});

test('dashboard exposes only products assigned to the current user', () => {
  const user = {
    id: 'usr_test',
    email: 'test@example.com',
    products: ['legal'],
    permissions: { products: ['academy'], lines: [] }
  };
  const store = {
    causeResults: [],
    causes: [],
    subscriptions: []
  };

  const dashboard = dashboardForUser(user, store);
  assert.deepEqual(dashboard.products, ['legal']);
  assert.deepEqual(dashboard.user.products, ['legal']);
  assert.deepEqual(dashboard.user.permissions.products, ['academy']);
});

test('users without assignments do not receive product permissions', () => {
  const user = publicUser({ id: 'usr_none', email: 'none@example.com' });
  assert.deepEqual(user.products, []);
  assert.deepEqual(user.permissions, { products: [], lines: [] });
});
