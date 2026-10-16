const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={module:{exports:{}},URL,URLSearchParams};
vm.runInNewContext(fs.readFileSync(path.join(root,'identity-client.js'),'utf8'),context);
const {safeNext,normalizedContext}=context.module.exports;
for(const raw of ['javascript:alert(1)','//evil.test','\\\\evil.test','https://evil.test/app.html','/admin','/login.html','/onboarding.html','data:text/html,test','\n//evil.test']) {
 test('reject redirect '+JSON.stringify(raw),()=>assert.equal(safeNext(raw,'https://aviarockets.cl'),'/app.html'));
}
test('allows internal product landing',()=>assert.equal(safeNext('/portada.html?mode=edit','https://aviarockets.cl'),'/portada.html?mode=edit'));
test('normalizes legacy app',()=>assert.equal(safeNext('/app-beta.html','https://aviarockets.cl'),'/app.html'));
test('preserves referral across reload',()=>{
 const first=normalizedContext('?product=legal&ref=abcdefgh2345&next=/app.html',{},'https://aviarockets.cl');
 const second=normalizedContext('',first,'https://aviarockets.cl');assert.equal(second.referral_code,'ABCDEFGH2345');assert.equal(second.product,'legal');
});
test('explicit empty referral clears saved code',()=>assert.equal(normalizedContext('?ref=',{referral_code:'ABCDEFGH2345'},'https://aviarockets.cl').referral_code,''));
test('unknown product does not create a destination',()=>assert.equal(normalizedContext('?product=evil',{},'https://aviarockets.cl').product,'home'));
test('registration never persists or restores password',()=>{
 const html=fs.readFileSync(path.join(root,'register.html'),'utf8');
 assert.doesNotMatch(html,/password:\s*registrationPassword\s*\n/);
 assert.doesNotMatch(html,/registrationPassword=String\(state.password/);
 assert.match(html,/delete next.password/);assert.match(html,/delete state.password/);
});
test('every inline script parses',()=>{
 for(const file of ['login.html','register.html','onboarding.html','auth-complete.html','identity-account.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1],{filename:file});
 }
});
test('new product entry replaces stale saved destination',()=>{
 assert.equal(normalizedContext('?product=portadas',{product:'legal',next:'/app.html'},'https://aviarockets.cl').next,'/portada.html');
 assert.equal(normalizedContext('?product=quant',{},'https://aviarockets.cl').next,'/app.html?product=quant');
});
