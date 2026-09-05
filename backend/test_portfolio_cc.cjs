const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'legal-admin.js'), 'utf8');
const api = fs.readFileSync(path.join(__dirname, 'legal_admin.py'), 'utf8');

test('administration exposes a client-scoped portfolio CC editor', () => {
  assert.match(ui, /CC por portafolio/);
  assert.match(ui, /portfolio_cc/);
  assert.match(ui, /portfolios\/\$\{legalAdmin\.portfolioSelected\}\/cc/);
  assert.match(ui, /method:'DELETE'/);
  assert.match(api, /r\.recipient_type='cc' AND r\.is_active/);
  assert.match(api, /p\.client_id=:c/);
  assert.match(api, /portfolio_cc\.remove/);
  assert.doesNotMatch(ui, /recipient_type.*bcc/);
});
