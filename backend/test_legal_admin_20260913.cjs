const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app-home.js'),'utf8');
const css=fs.readFileSync(path.join(root,'app-home.css'),'utf8');
const adminUi=fs.readFileSync(path.join(root,'legal-admin.js'),'utf8');
const api=fs.readFileSync(path.join(__dirname,'legal_admin.py'),'utf8');

test('Excel cause identifiers use c-number-year',()=>{
  assert.match(app,/return code && year \? `c-\$\{code\}-\$\{year\}`/);
  assert.match(app,/"Causa": appLegalExportCode\(cause\)/);
});

test('download control stays inside the available width',()=>{
  assert.match(css,/\.legal-export-row \{[^}]*grid-template-columns: minmax\(0,1fr\)/);
  assert.match(css,/\.legal-export-row button \{[^}]*max-width:100%/);
});

test('client punishment is reversible and assignment can be removed without deleting cause',()=>{
  assert.match(adminUi,/Revertir castigo/);
  assert.match(adminUi,/Quitar causa del cliente/);
  assert.match(adminUi,/Agregar causa al cliente/);
  assert.match(adminUi,/solo el proceso PJUD puede publicarla/);
  assert.match(adminUi,/method:'POST'/);
  assert.match(api,/current=='castigo' and target==restored/);
  assert.match(api,/case\.unassign/);
  assert.match(api,/DELETE FROM legal\.legal_portfolio_cases WHERE id=:i/);
  assert.doesNotMatch(api,/DELETE FROM legal\.causes/);
});
