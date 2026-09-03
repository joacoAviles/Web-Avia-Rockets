const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app-home.js','utf8');
function namedFunction(name){
  const start=source.indexOf(`function ${name}(`); assert(start>=0,`${name} missing`);
  const open=source.indexOf('{',start); let depth=0,quote='',escape=false;
  for(let i=open;i<source.length;i++){
    const c=source[i];
    if(quote){ if(escape)escape=false; else if(c==='\\')escape=true; else if(c===quote)quote=''; continue; }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`${name} is incomplete`);
}
let rows,columns,filter,file;
const context={
  appState:{causes:[{code:'7404',year:2023,title:'Carátula SQL',court:'Juzgado',publicada:true}]},
  appPublicationLabel:()=> 'Publicada', appUniqueList:v=>v||'', appStatusLabel:v=>v||'',
  appShow:()=>{throw new Error('Unexpected UI error')}, Date,
  XLSX:{utils:{json_to_sheet:r=>(rows=r,{}),book_new:()=>({}),book_append_sheet:()=>{}},writeFile:(_,f)=>file=f}
};
context.window=context;
vm.createContext(context);vm.runInContext(namedFunction('appDownloadLegalExcel'),context);
context.appDownloadLegalExcel();
assert.strictEqual(rows[0]['Carátula'],'Carátula SQL');
assert(source.includes('<th>Carátula</th>'),'Carátula column missing');
assert(source.includes('appEscape(cause.title || "-")'),'Carátula row missing');
assert(file.startsWith('causas-legales-')&&file.endsWith('.xlsx'));
const admin=fs.readFileSync('legal-admin.js','utf8');
assert(admin.includes('legal-admin-readonly')&&admin.includes('Solo lectura'));
assert(!admin.includes("adminField('title'"),'Title must not be editable');
console.log('PASS: title is visible in table/editor and exported to Excel as read-only.');
