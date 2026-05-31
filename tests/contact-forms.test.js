import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pages = [
  {
    file: 'contacto.html',
    action: 'https://formsubmit.co/contactoweb@aviarockets.cl',
    next: 'https://aviarockets.cl/contacto.html?enviado=1',
    submitText: 'Enviar solicitud',
    field: 'interest'
  },
  {
    file: 'trabaja-con-nosotros.html',
    action: 'https://formsubmit.co/trabajo@aviarockets.cl',
    next: 'https://aviarockets.cl/trabaja-con-nosotros.html?enviado=1',
    submitText: 'Enviar postulación',
    field: 'area'
  }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const page of pages) {
  test(`${page.file} has a native FormSubmit contact form`, () => {
    const html = fs.readFileSync(page.file, 'utf8');

    assert.match(
      html,
      new RegExp(`<form[^>]+action="${escapeRegExp(page.action)}"[^>]+method="POST"`),
      'form should post directly to the configured FormSubmit inbox'
    );
    assert.match(html, new RegExp(`name="_next" value="${escapeRegExp(page.next)}"`));
    assert.match(html, /name="_captcha" value="false"/);
    assert.match(html, /name="_template" value="table"/);
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
  const setupContactForms = script.slice(setupStart, setupEnd);

  assert.ok(setupStart >= 0, 'contact form setup should exist');
  assert.ok(!script.includes('/api/contact'), 'contact forms should not post to the removed API endpoint');
  assert.ok(!setupContactForms.includes('event.preventDefault();'), 'FormSubmit forms should use native browser submission');
});

test('only the two expected FormSubmit inboxes are configured', () => {
  const html = pages.map((page) => fs.readFileSync(page.file, 'utf8')).join('\n');
  const actions = [...html.matchAll(/action="(https:\/\/formsubmit\.co\/[^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(actions.sort(), [
    'https://formsubmit.co/contactoweb@aviarockets.cl',
    'https://formsubmit.co/trabajo@aviarockets.cl'
  ].sort());
});
