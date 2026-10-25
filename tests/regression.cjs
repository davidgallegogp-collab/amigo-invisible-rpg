// Development-only: npm install --no-save playwright; node tests/regression.cjs
// BROWSER_PATH may select an installed Chromium/Edge executable.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const baseCommit = 'a01da96fd99852fbe16b8deb3355e16d4c3f0307';
const original = execFileSync('git', ['show', baseCommit + ':index.html'], {cwd: root});
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
for (const name of ['mirucha','nacho','arturo','quico','avionatin','abel']) {
 const file = 'assets/enemigos/' + name + '.png';
 assert.equal(sha(fs.readFileSync(path.join(root,file))),sha(execFileSync('git',['show',baseCommit+':'+file],{cwd:root,maxBuffer:10*1024*1024})));
}
console.log('PASS: los seis PNG son idénticos byte a byte a main de partida');
const server = http.createServer((req,res) => {
 let url = new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');
 if(url === '/baseline.html'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(original);}
 if(url === '/') url = '/index.html';
 const file = path.join(root,url);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.html':'text/html'})[path.extname(file)]+'; charset=utf-8');
 res.end(fs.readFileSync(file));
});
async function ready(page,url){await page.goto(url);await page.evaluate(()=>enemyArtReady);}
async function battleSetup(page,st=0){
 await page.evaluate(st=>{hero=0;party=[1,6];startBattle();stage=st;startEncounter();combatants.forEach(p=>{p.hp=10000;p.maxhp=10000});Math.random=()=>0;},st);
}
async function clickAttack(page){
 await page.getByRole('button',{name:'⚔ Atacar',exact:true}).click();
 const target=page.getByRole('button',{name:/^🎯/});if(await target.count())await target.first().click();
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const failures=[];
 try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:850},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));
  const bad=[];page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
  for(const prefix of ['/','/amigo-invisible-rpg/']){
   await ready(page,base+prefix);
   assert(await page.evaluate(()=>{furniture();const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(tavernArt.tavern_bg,0,0,c.width,c.height);return c.toDataURL()===canvas.toDataURL()}),'Fondo adjunto representado sin elementos antiguos');
   assert.equal(await page.locator('#pick option').count(),15);
   await page.selectOption('#pick','14');await page.locator('#start').click();
   assert.equal(await page.evaluate(()=>data[hero][0]),'Alba');
   const clickNpc=async i=>{
    await page.locator('#game').scrollIntoViewIfNeeded();
    const point=await page.evaluate(i=>{const r=canvas.getBoundingClientRect(),b=npcBounds(i);return {x:r.left+canvas.clientLeft+(b.x+b.w/2)*(r.width-2*canvas.clientLeft)/canvas.width,y:r.top+canvas.clientTop+(b.y+b.h/2)*(r.height-2*canvas.clientTop)/canvas.height}},i);
    if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   };
   assert(await page.locator('#dungeon').isDisabled());
   await clickNpc(-1);assert((await page.locator('#npcTitle').innerText()).includes('Pere'));
   await page.getByRole('button',{name:'Cerrar',exact:true}).click();
   for(const i of [0,6]){await clickNpc(i);await page.getByRole('button',{name:'➕ Reclutar'}).click()}
   assert.equal(await page.evaluate(()=>party.length),2);
   await page.getByRole('button',{name:'⚔ Entrar en la mazmorra',exact:true}).click();
   assert(await page.evaluate(()=>battleActive));
   await page.evaluate(()=>{combatants.forEach(p=>{p.hp=10000;p.maxhp=10000});Math.random=()=>0;window.seen=new Set();const draw=bctx.drawImage.bind(bctx);bctx.drawImage=(img,...a)=>{if(img.src&&img.src.includes("/enemigos/"))window.seen.add(new URL(img.src).pathname.split('/').pop());draw(img,...a)}});
   for(let st=0;st<3;st++){
    await page.evaluate(()=>battleDraw());
    for(let n=0;n<80&&!(await page.evaluate(()=>combatFinished));n++)await clickAttack(page);
    assert(await page.evaluate(()=>combatFinished&&livingEnemies().length===0));
    if(st===1)assert(await page.evaluate(()=>phase2));
    if(st<2)await page.getByRole('button',{name:'🚪 Siguiente encuentro'}).click();
   }
   assert.deepEqual((await page.evaluate(()=>[...window.seen])).sort(),['mirucha.png','nacho.png','arturo.png','quico.png','avionatin.png','abel.png'].sort());
   await page.getByRole('button',{name:'🎁 Abrir cofre'}).click();assert((await page.locator('#battleLog').innerText()).includes('Has completado'));
   await page.getByRole('button',{name:'🍺 Volver a la taberna'}).click();assert.equal(await page.evaluate(()=>battleActive),false);
   assert.deepEqual(bad,[]);
   console.log('PASS',mobile?'móvil emulado':'PC',prefix,'fondo nuevo verificado, controles, Pere, reclutamiento, seis sprites, tres victorias, cofre');
  }
  await context.close();
 }
 const page=await browser.newPage();page.on('pageerror',e=>failures.push(e.message));
 await ready(page,base+'/');await page.locator('#start').click();
 // All playable specials, with original damage/mana/healing rules.
 for(let i=0;i<15;i++){
  await page.evaluate(i=>{battleActive=false;hero=i;party=[(i+1)%15,(i+2)%15];startBattle();Math.random=()=>0;combatants.forEach(p=>p.hp-=25)},i);
  const old=await page.evaluate(()=>({hp:enemies[0].hp,party:combatants.map(p=>p.hp),cls:combatants[0].cls}));
  await page.getByRole('button',{name:/^✨/}).click();
  const now=await page.evaluate(()=>({hp:enemies[0].hp,mp:combatants[0].mp,party:combatants.map(p=>p.hp)}));
  assert.equal(now.mp,24);
  if(old.cls==='Clérigo')assert.deepEqual(now.party,old.party.map(h=>h+24));
  else assert.equal(old.hp-now.hp,old.cls==='Mago'?30:26);
 }
 await page.evaluate(()=>{battleActive=false});await battleSetup(page);
 await page.getByRole('button',{name:'🛡 Defender'}).click();
 assert.equal(await page.evaluate(()=>combatants[0].guard),true);
 assert.equal(await page.evaluate(()=>hitHero(combatants[0],11)),6);
 await page.evaluate(()=>{activeTurn=0;combatants[0].hp=9950;showTurn(true)});
 await page.getByRole('button',{name:'🧪 Poción (1)'}).click();assert.equal(await page.evaluate(()=>combatants[0].hp),9982);
 await page.getByRole('button',{name:'🧪 Poción (1)'}).click();assert((await page.locator('#battleLog').innerText()).includes('ya se ha usado'));
 await page.evaluate(()=>{activeTurn=0;combatants[0].mp=0;showTurn(true)});await page.getByRole('button',{name:/^✨/}).click();assert((await page.locator('#battleLog').innerText()).includes('suficiente maná'));
 await page.evaluate(()=>enemyTurn());assert((await page.locator('#battleLog').innerText()).includes('Mirucha:'));assert(await page.evaluate(()=>combatants.every(p=>!p.guard)));
 for(const victim of [0,1]){
  await battleSetup(page,1);await page.evaluate(()=>enemyTurn());assert((await page.locator('#battleLog').innerText()).includes('COMBO'));
  const result=await page.evaluate(v=>{damageEnemy(enemies[v],1000);const e=livingEnemies()[0];const initial=e.hp;checkPhase();return {enraged:e.enraged,hp:e.hp,initial,atk:e.atk,max:e.maxhp}},victim);
  assert(result.enraged);assert.equal(result.hp,result.initial);assert.equal(result.atk,victim===0?21:19);assert.equal(result.max,victim===0?151:127);
 }
 await battleSetup(page,2);
 for(const text of ['DANZA DE GUERRA','DANZA DEL TERREMOTO','PASO PROHIBIDO']){await page.evaluate(()=>enemyTurn());assert((await page.locator('#battleLog').innerText()).includes(text));}
 await page.evaluate(()=>{combatants.forEach(p=>p.hp=1);round=2;enemyTurn()});assert(await page.evaluate(()=>combatFinished));
 await page.getByRole('button',{name:'🔁 Reintentar encuentro'}).click();assert(await page.evaluate(()=>!combatFinished&&combatants.every(p=>p.hp===p.maxhp)));
 console.log('PASS 15 habilidades, maná, defensa, poción, Mirucha, combo, ambas fases II, tres danzas, derrota/reintento');
 const consoleErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 await page.route('**/nacho.png*',r=>r.abort());await ready(page,base+'/');
 assert((await page.locator('#assetStatus').innerText()).includes('nacho'));
 assert((await page.locator('#battleAssetStatus').innerText()).includes('nacho'));
 assert(consoleErrors.some(s=>s.includes('No se pudo cargar el sprite:')));
 assert(await page.locator('#start').isEnabled());assert.deepEqual(failures,[]);
 console.log('PASS fallo simulado visible y registrado; cero excepciones JavaScript');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
