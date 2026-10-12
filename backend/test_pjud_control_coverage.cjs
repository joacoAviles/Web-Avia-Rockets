const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
const source = html.slice(html.indexOf('let pjudControlReportIds ='), html.indexOf('function renderPlaceholderProduct('));

function harness({expected = 118, processed = 97, requeued = 0, contextFails = false, reports, blockers = 0, noAudit = false} = {}) {
  const nodes = {};
  const calls = [];
  let failPreview = false;
  const ctx = vm.createContext({
    document: {getElementById: id => nodes[id] ||= {style: {}, setAttribute(name, value) {this[name] = value;}}},
    window: {confirm: () => true},
    appFetch: async (url, options) => {
      calls.push({url, body: options?.body ? JSON.parse(options.body) : null});
      if (url.endsWith('preparation-context')) {
        if (contextFails) throw Error('Unavailable');
        return {total_causes: expected};
      }
      if (url.endsWith('send-all')) return {queued: 1, duplicates: 0};
      if (failPreview) throw Error('Preview failed');
      return {coverage: noAudit ? null : {incluidas: expected, total_publicadas_activas: 134, excluidas: [{rit:'C-164-2026',tribunal:'Test',motivo:'castigada'}], duplicados_posibles: [], bloqueantes: blockers}, totals: {causas_procesadas: processed}, extraction_recovery: {requeued}, reports: reports || [
        {report_id: 'luna', status: 'draft', portfolio_name: 'Portafolio 1', group_label: 'Luna', group_type: 'lawyer', recipients: ['test@example.invalid'], summary: {con_cambios: 1}, text_preview: 'Fixture'}
      ]};
    }
  });
  vm.runInContext(source, ctx);
  return {ctx, nodes, calls, fail: () => {failPreview = true;}};
}

test('97/118 remains 82% and incomplete daily reports cannot be submitted', async () => {
  const {ctx, nodes, calls} = harness();
  await ctx.preparePjudControlEmail();
  assert.equal(nodes['pjud-control-progress-label'].textContent, '97 de 118 causas');
  assert.equal(nodes['pjud-control-progress-percent'].textContent, '82%');
  assert.match(nodes['pjud-control-status'].textContent, /21 causas fuera/);
  assert.match(nodes['pjud-control-status'].textContent, /Luna: 1/);
  assert.equal(nodes['pjud-control-send'].disabled, true);
  await assert.rejects(ctx.sendPjudControlEmail());
  assert.equal(calls.filter(c => c.url.endsWith('send-all')).length, 0);
});

test('zero is preserved and a pending recovery blocks even matching counts', async () => {
  const zero = harness({processed: 0});
  await zero.ctx.preparePjudControlEmail();
  assert.equal(zero.nodes['pjud-control-progress-label'].textContent, '0 de 118 causas');
  const pending = harness({processed: 118, requeued: 1});
  await pending.ctx.preparePjudControlEmail();
  assert.equal(pending.nodes['pjud-control-send'].disabled, true);
});

test('unknown, invalid or inconsistent coverage cannot enable daily sending', async () => {
  for (const input of [{contextFails: true, noAudit: true}, {expected: null}, {expected: ''}, {processed: null}, {processed: -1}, {processed: 119}, {processed:118, blockers:1}, {processed:118,noAudit:true}]) {
    const h = harness(input);
    await h.ctx.preparePjudControlEmail();
    assert.equal(h.nodes['pjud-control-send'].disabled, true, JSON.stringify(input));
  }
});

test('coverage explains exclusions and supplies an authoritative denominator', async () => {
  const h = harness({contextFails:true, expected:133, processed:97});
  await h.ctx.preparePjudControlEmail();
  assert.equal(h.nodes['pjud-control-progress-label'].textContent, '97 de 133 causas');
  assert.match(h.nodes['pjud-control-preview-text'].textContent, /C-164-2026.*castigada/);
  assert.equal(h.nodes['pjud-control-send'].disabled,true);
});

test('only distinct drafts are sent and old IDs are cleared after sending', async () => {
  const base = {portfolio_name: 'Test', recipients: [], summary: {}, text_preview: ''};
  const h = harness({expected: 1, processed: 1, reports: [
    {...base, report_id: 'draft', status: 'draft'},
    {...base, report_id: 'sent', status: 'sent'},
    {...base, report_id: 'draft', status: 'draft'}
  ]});
  await h.ctx.preparePjudControlEmail();
  assert.equal(h.nodes['pjud-control-send'].disabled, false);
  await h.ctx.sendPjudControlEmail();
  assert.deepEqual(h.calls.at(-1).body.report_ids, ['draft']);
  await assert.rejects(h.ctx.sendPjudControlEmail());
});

test('a failed new preview cannot submit a previous successful preview', async () => {
  const h = harness({processed: 118});
  await h.ctx.preparePjudControlEmail();
  h.fail();
  await assert.rejects(h.ctx.preparePjudControlEmail());
  await assert.rejects(h.ctx.sendPjudControlEmail());
  assert.equal(h.nodes['pjud-control-preview'].disabled, false);
  assert.equal(h.nodes['pjud-control-send'].disabled, true);
  assert.equal(h.nodes['pjud-control-preview-row'].hidden, true);
});

test('weekly preview does not assume daily total is its coverage denominator for sending', async () => {
  const h = harness();
  await h.ctx.preparePjudControlEmail('weekly');
  assert.equal(h.nodes['pjud-control-send'].disabled, false);
});
