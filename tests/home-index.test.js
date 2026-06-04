import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('index restores the full home journey', () => {
  assert.match(indexHtml, /class="hero hero-marketing home-hero"/);
  assert.match(indexHtml, /id="guided-demo"/);
  assert.match(indexHtml, /id="business-lines"/);
  assert.match(indexHtml, /id="contact"/);
  assert.match(indexHtml, /id="home-product-stage"/);
});

test('index keeps the three core solution cards', () => {
  const titles = [...indexHtml.matchAll(/<h3>(Avia OPS|Avia Intelligence|Avia Labs)<\/h3>/g)].map((match) => match[1]);
  assert.deepEqual(titles, ['Avia OPS', 'Avia Intelligence', 'Avia Labs']);
  assert.equal((indexHtml.match(/data-static-card="true"/g) || []).length, 3);
});

test('index contact form is API-backed', () => {
  assert.match(indexHtml, /<form class="contact-form[^"]*" data-api-form/);
  assert.match(indexHtml, /name="form" value="avia_home_contact"/);
  assert.match(indexHtml, /forms-api\.js/);
});
