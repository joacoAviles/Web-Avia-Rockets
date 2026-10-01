const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');
const output=path.resolve(process.env.IDENTITY_ARTIFACT_DIR || path.join(repo,'.identity-artifacts'));fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true});
let checks=[];
for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport});let completed=false;const sent=[];
 await context.addInitScript(()=>{if(!localStorage.getItem('avia_auth_token'))localStorage.setItem('avia_auth_token','test-only-token');});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname==='api.aviarockets.cl'){
   const payload=req.postDataJSON();if(payload)sent.push({path:url.pathname,payload});
   let data={};
   if(url.pathname.endsWith('/config'))data={google_enabled:true,terms_version:'2026-09-25',terms_url:'https://aviarockets.cl/terms',privacy_url:'https://aviarockets.cl/privacy'};
   else if(url.pathname.endsWith('/onboarding')){
    if(req.method()==='POST'){assert.equal(payload.referral_code,'ABCDEFGH2345');assert.equal(payload.accept_terms,true);completed=true;}
    data={completed,code:'ZZZZZZZZ2345',full_name:'',referred_by:null};
   }else if(url.pathname.endsWith('/google/start')||url.pathname.endsWith('/google/link'))data={url:'https://accounts.google.com/o/oauth2/v2/auth?state=test'};
   else if(url.pathname.endsWith('/redeem'))data={access_token:'test-session',user:{id:'test'},onboarding:{completed:false},product:'legal'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  }
  if(url.hostname==='accounts.google.com')return route.fulfill({body:'Google simulado: solicitud recibida'});
  if(url.hostname==='aviarockets.cl'){
   const rel=url.pathname==='/'?'index.html':url.pathname.slice(1);const file=path.resolve(repo,rel);
   if(!file.startsWith(repo+'/')||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
   const ext=path.extname(file);return route.fulfill({contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[ext]||'text/plain',body:fs.readFileSync(file)});
  }
  return route.abort();
 });
 const page=await context.newPage();
 await page.goto('https://aviarockets.cl/onboarding.html?product=legal&ref=ABCDEFGH2345&next=/app.html');
 await page.locator('#profile').waitFor({state:'visible'});
 await page.getByLabel('Tu nombre').fill('Usuario de prueba');
 assert.equal(await page.getByLabel('Código de referido (opcional)').inputValue(),'ABCDEFGH2345');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:path.join(output,'onboarding-'+viewport.width+'.png'),fullPage:true});
 await page.locator('[name=accept_terms]').check();await page.getByRole('button',{name:'Guardar y continuar'}).click();
 await page.waitForURL('https://aviarockets.cl/app.html');assert(completed);
 checks.push('Onboarding '+viewport.width+': referido, consentimiento, guardado y destino');
 await page.goto('https://aviarockets.cl/onboarding.html');await page.waitForURL('https://aviarockets.cl/app.html');
 checks.push('Onboarding completado no se repite '+viewport.width);
 await page.goto('https://aviarockets.cl/login.html?ref=ABCDEFGH2345&product=legal');
 await page.getByRole('button',{name:'Continuar con Google'}).click();await page.waitForURL('https://accounts.google.com/**');
 assert(sent.some(x=>x.path.endsWith('/google/start')&&x.payload.referral_code==='ABCDEFGH2345'&&x.payload.product==='legal'));
 checks.push('Google conserva referido y producto '+viewport.width);
 await page.goto('https://aviarockets.cl/identity-account.html');await page.getByText('Tu código: ZZZZZZZZ2345').waitFor();
 assert((await page.locator('#invite').inputValue()).endsWith('?ref=ZZZZZZZZ2345'));
 await page.getByRole('button',{name:'Vincular mi cuenta de Google'}).click();await page.waitForURL('https://accounts.google.com/**');
 assert(sent.some(x=>x.path.endsWith('/google/link')));checks.push('Cuenta comparte código y vincula Google '+viewport.width);
 completed=false;await page.goto('https://aviarockets.cl/auth-complete.html?ticket=mock-ticket-12345678901234567890');
 await page.waitForURL('https://aviarockets.cl/onboarding.html');
 assert.equal(await page.evaluate(()=>localStorage.getItem('avia_auth_token')),'test-session');
 checks.push('Callback canjea ticket y lleva al onboarding '+viewport.width);
 await context.close();
}
await browser.close();fs.writeFileSync(path.join(output,'identity-browser-checks.json'),JSON.stringify({provider:'simulado, sin tráfico a producción',checks},null,2));console.log(JSON.stringify({passed:checks.length,checks}));
})().catch(error=>{console.error(error);process.exit(1)});
