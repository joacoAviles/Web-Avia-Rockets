const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),cat=JSON.parse(fs.readFileSync(path.join(root,'pjud-catalog.json')));
test('official catalog keeps all 17 courts and official book identifiers',()=>{
 for(const id of ['3','4','5','6']){assert.equal(cat.branches[id].cortes.length,17);for(const c of cat.branches[id].cortes)assert.ok(cat.branches[id].tribunales[c.id].length);}
 assert.deepEqual(cat.branches['3'].tipos.map(x=>x.id),['C','V','E','A','F','I']);assert.equal(cat.branches['7'].available,false);
});
test('display uses official spelling while preserving identity and unknown names',async()=>{
 const ctx={fetch:async()=>({ok:true,json:async()=>cat})};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'pjud-case-form.js'),'utf8'),ctx);
 const input=[{id:'a',court:'22° Juzgado Civil de santiago'},{id:'b',court:'3° JUZGADO CIVIL DE CONCEPCION'},{id:'c',court:'Nombre sin correspondencia'}];
 const out=await ctx.pjudCanonicalizeCauses(input);assert.equal(out[0].court,'22º Juzgado Civil de Santiago');assert.equal(out[1].court,'3º Juzgado Civil de Concepción');assert.equal(out[2].court,input[2].court);assert.equal(out[0].id,'a');assert.equal(input[0].court,'22° Juzgado Civil de santiago');
});
