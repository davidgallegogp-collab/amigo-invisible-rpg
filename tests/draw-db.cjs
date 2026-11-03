// npm install --no-save @electric-sql/pglite en un entorno de pruebas; node tests/draw-db.cjs
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const {prepareDraw,tokenHash,newToken}=await import('../tools/sorteo/core.mjs');
 const db=new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611030001_private_draw.sql'),'utf8'));
 const journal=prepareDraw('test-db',[{id:'a',name:'Prueba A'},{id:'b',name:'Prueba B'},{id:'c',name:'Prueba C'}]);
 const commit=p=>db.query('select draw_private.commit_draw($1::jsonb) as result',[JSON.stringify(p)]);
 assert.equal((await commit(journal.payload)).rows[0].result.alreadyCommitted,false);
 assert.equal((await commit(journal.payload)).rows[0].result.alreadyCommitted,true);
 await assert.rejects(commit(prepareDraw('test-db',journal.payload.participants).payload));
 await assert.rejects(db.exec("update draw_private.draws set locked=false where id='test-db'"));
 await assert.rejects(db.exec("update draw_private.assignments set recipient=giver"));
 await assert.rejects(db.exec("delete from draw_private.participants"));
 const lookup=h=>db.query('select public.reveal_draw($1,$2) as result',['test-db',h]);
 const expected=(await lookup(tokenHash(journal.tokens.a))).rows[0].result;
 assert(expected&&expected.name!=='Prueba A');
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  await assert.rejects(db.exec('select * from draw_private.assignments'));
  await assert.rejects(lookup(tokenHash(journal.tokens.a)));
  await assert.rejects(commit(journal.payload));
  await db.exec('reset role');
 }
 await db.exec('set role service_role');
 await assert.rejects(db.exec('select * from draw_private.assignments'));
 await assert.rejects(commit(journal.payload));
 assert.deepEqual((await lookup(tokenHash(journal.tokens.a))).rows[0].result,expected);
 assert.equal((await lookup('0'.repeat(64))).rows[0].result,null);
 await db.exec('reset role');
 const token=newToken(),rotate=()=>db.query('select draw_private.rotate_invitation($1,$2,$3,$4)',['test-db','a',tokenHash(journal.tokens.a),tokenHash(token)]);
 await rotate();await rotate();assert.equal((await lookup(tokenHash(journal.tokens.a))).rows[0].result,null);
 assert.deepEqual((await lookup(tokenHash(token))).rows[0].result,expected);
 await commit(journal.payload); // Repetir confirmación nunca deshace una rotación.
 assert.deepEqual((await lookup(tokenHash(token))).rows[0].result,expected);
 const broken=prepareDraw('broken',journal.payload.participants);broken.payload.assignments[0].recipient=broken.payload.assignments[0].giver;
 await assert.rejects(commit(broken.payload));assert.equal((await db.query("select count(*)::int as n from draw_private.draws where id='broken'")).rows[0].n,0);
 console.log('PASS PostgreSQL/PGlite: migración, transacción, bloqueo, idempotencia, RLS/permisos anon/auth/service, revocación y rotación sin resorteo');await db.close();
})().catch(e=>{console.error(e);process.exitCode=1});
