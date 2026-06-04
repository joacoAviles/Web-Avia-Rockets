import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pages = [
  {
    file: 'contacto.html',
    next: '/contacto.html?enviado=1',
    submitText: 'Enviar solicitud',
    field: 'interest'
  },
  {
    file: 'trabaja-con-nosotros.html',
    next: '/trabaja-con-nosotros.html?enviado=1',
    submitText: 'Enviar postulación',
    field: 'area'
  }
];

for (const page of pages) {
  test(`${page.file} has an API-backed contact form`, () => {
    const html = fs.readFileSync(page.file, 'utf8');

    assert.match(html, /<form[^>]+data-api-form/);
    assert.match(html, new RegExp(`data-success-url="${page.next.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /name="_honey"/);
    assert.match(html, /name="name"[^>]+minlength="2"[^>]+required/);
    assert.match(html, /name="email"[^>]+type="email"[^>]+required/);
    assert.match(html, new RegExp(`name="${page.field}"[^>]+required`));
    assert.match(html, /name="message"[^>]+minlength="5"[^>]+required/);
    assert.match(html, new RegExp(`type="submit">${page.submitText}</button>`));
  });
}

test('script leaves external FormSubmit forms to native browser submission', () => {
  const script = fs.readFileSync('script.js', 'utf8');
  const setupStart = script.indexOf('function setupContactForms()');
  const setupEnd = script.indexOf('function renderCauses', setupStart);

  assert.ok(setupStart >= 0, 'contact form setup should exist');
  assert.ok(!script.includes('/api/contact'), 'contact forms should not post to the removed API endpoint');
  assert.ok(setupEnd > setupStart, 'contact form setup should stay scoped');
});

test('forms-api posts to the configured backend form endpoint', () => {
  const script = fs.readFileSync('forms-api.js', 'utf8');

  assert.match(script, /AVIA_API_BASE_URL_RESOLVED/);
  assert.match(script, /\/api\/forms\/submit/);
  assert.match(script, /event\.preventDefault\(\)/);
});
