// node tests/draw.mjs — sin servicios ni credenciales reales.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareDraw,derangement,tokenHash,distribution,validateParticipants} from '../tools/sorteo/core.mjs';
import {makeHandler} from '../supabase/functions/reveal-draw/handler.mjs';
assert.throws(()=>derangement(1));
for(const n of [2,3,4,15,27,100,1000])for(let attempt=0;attempt<200;attempt++){
 const permutation=derangement(n);assert.equal(new Set(permutation).size,n);assert(permutation.every((x,i)=>x!==i&&x>=0&&x<n));
}
assert.throws(()=>validateParticipants([{id:'a',name:' Uno '},{id:'b',name:'uno'}]));
assert.throws(()=>validateParticipants([{id:'a',name:'Uno'},{id:'a',name:'Dos'}]));
// Enumerar las rutas equiprobables de Fisher–Yates para n=4: nueve desarreglos,
// cada uno obtenido una sola vez antes del rechazo, sin privilegiar ciclos únicos.
const counts=new Map();for(let a=0;a<4;a++)for(let b=0;b<3;b++)for(let c=0;c<2;c++){
 const choices=[a,b,c];let k=0;try{const p=derangement(4,()=>{if(k===3)throw Error('rechazada');return choices[k++]});const key=p.join();counts.set(key,(counts.get(key)||0)+1)}catch{}
}assert.equal(counts.size,9);assert([...counts.values()].every(n=>n===1));
const participants=[{id:'__proto__',name:'Prueba A',spriteKey:'david'},{id:'b',name:'Prueba B',spriteKey:null},{id:'c',name:'Prueba C',spriteKey:'alba'}];
const journal=prepareDraw('test',participants);assert.equal(Object.keys(journal.tokens).length,3);
const links=distribution(journal,'https://example.test/game/');assert(links.every(x=>Object.keys(x).sort().join()==='link,name'));
assert.equal(new Set(Object.values(journal.tokens)).size,3);assert(Object.values(journal.tokens).every(t=>/^[\w-]{43}$/.test(t)));
assert(!JSON.stringify(journal.payload).includes(journal.tokens.b));
const handler=makeHandler({allowedOrigin:'https://example.test',cryptoImpl:webcrypto,lookup:async(d,h)=>{
 const invite=journal.payload.invitations.find(i=>i.hash===h);if(d!=='test'||!invite)return null;
 const assignment=journal.payload.assignments.find(a=>a.giver===invite.participant);
 return {...participants.find(p=>p.id===assignment.recipient),privateExtra:'NO PUBLICAR'};
}});
function req(body,headers={}){return new Request('https://service.test/',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...headers},body:JSON.stringify(body)})}
for(const p of participants){
 const body={drawId:'test',token:journal.tokens[p.id]},r=await handler(req(body));assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
 const result=await r.json();assert.deepEqual(result,await(await handler(req(body))).json());assert.deepEqual(Object.keys(result),['recipient']);assert.deepEqual(Object.keys(result.recipient).sort(),['name','spriteKey']);assert.notEqual(result.recipient.name,p.name);
}
for(const body of [{},{drawId:'test',token:'x'.repeat(43)},{drawId:'other',token:journal.tokens.b}])assert.equal((await handler(req(body))).status,404);
assert.equal((await handler(req({},{origin:'https://evil.test'}))).status,403);
assert.equal((await handler(req({token:'x'.repeat(3000)}))).status,413);
const down=makeHandler({allowedOrigin:'https://example.test',cryptoImpl:webcrypto,lookup:()=>{throw Error('private error')}});
assert.deepEqual(await(await down(req({drawId:'test',token:journal.tokens.b}))).json(),{error:'unavailable'});
console.log('PASS 1.400 simulaciones, uniformidad enumerada n=4, validación, tokens 256 bits, distribución, consulta estable y mínima, errores y privacidad del handler');
// Preparación local: nunca sobreescribir; archivos y directorio privados, sin DB.
const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path'),{spawnSync}=await import('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draw-private-test-'));
try{
 const input=path.join(dir,'input.json');fs.writeFileSync(input,JSON.stringify(participants));
 const cli=new URL('../tools/sorteo/admin.mjs',import.meta.url).pathname;
 const args=[cli,'prepare',dir,'test-local',input];
 assert.equal(spawnSync(process.execPath,args).status,0);
 const journalPath=path.join(dir,'journal.json'),before=fs.readFileSync(journalPath);
 assert.equal(fs.statSync(journalPath).mode&0o777,0o600);
 assert.equal(fs.statSync(dir).mode&0o777,0o700);
 assert.notEqual(spawnSync(process.execPath,args).status,0);assert(before.equals(fs.readFileSync(journalPath)));
 console.log('PASS administración local: preparación exclusiva, segunda ejecución rechazada, permisos 600/700');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
