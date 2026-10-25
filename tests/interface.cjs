// BROWSER_PATH=/ruta/chromium; SNAPSHOT_DIR opcional. Node + Playwright.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base='7dcbec9c85f783f54cb322d5a57968a71019a0cb';
const old=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:20e6});
for(const f of ['js/personajes.js','js/estado.js','js/enemigos.js','js/animaciones.js','js/animaciones-heroes.js','js/recursos.js',...fs.readdirSync(path.join(root,'assets'),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>path.relative(root,path.join(e.parentPath,e.name)))])assert(fs.readFileSync(path.join(root,f)).equals(old(f)),f);
const combat=fs.readFileSync(path.join(root,'js/combate.js'),'utf8');assert.equal(combat.slice(combat.indexOf('function nextLiving')),old('js/combate.js').toString().slice(old('js/combate.js').toString().indexOf('function nextLiving')),'reglas, progresión y cofre intactos');
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(u==='/')u='/index.html';const f=path.join(root,u);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try {browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 const shot=async name=>{if(process.env.SNAPSHOT_DIR){await page.waitForTimeout(300);fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'movil':'escritorio')+'-'+name+'.png'),fullPage:true})}};
 const press=async l=>mobile?l.tap():l.click();
 await page.goto('http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/');await page.evaluate(()=>enemyArtReady);
 assert.equal(await page.locator('.character-card').count(),15);
 for(let i=0;i<15;i++){await press(page.locator('.character-card').nth(i));assert.equal(await page.locator('.character-card[aria-pressed="true"]').count(),1);assert.equal(await page.inputValue('#pick'),String(i));assert.equal(await page.locator('#selectionName').innerText(),await page.evaluate(i=>data[i][0],i));assert(await page.evaluate(i=>{const c=$('characterGallery').children[i].children[0];return c.getContext('2d').getImageData(0,0,88,104).data.some(v=>v)},i))}
 await page.locator('.character-card').last().focus();await page.keyboard.press('Home');assert.equal(await page.inputValue('#pick'),'0');await page.keyboard.press('ArrowRight');assert.equal(await page.inputValue('#pick'),'1');await page.keyboard.press('End');assert.equal(await page.inputValue('#pick'),'14');await page.keyboard.press('ArrowRight');assert.equal(await page.inputValue('#pick'),'0');
 await page.locator('#overlay').evaluate(el=>el.scrollTop=0);await shot('seleccion');await press(page.locator('#start'));
 const clickNpc=async i=>{await page.locator('#game').scrollIntoViewIfNeeded();const point=await page.evaluate(i=>{const b=npcBounds(i),r=canvas.getBoundingClientRect();return {x:r.left+canvas.clientLeft+(b.x+b.w/2)*(r.width-2*canvas.clientLeft)/canvas.width,y:r.top+canvas.clientTop+(b.y+b.h/2)*(r.height-2*canvas.clientTop)/canvas.height}},i);if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y)};
 await clickNpc(6);await shot('dialogo');await press(page.getByRole('button',{name:'➕ Reclutar',exact:true}));await clickNpc(2);await press(page.getByRole('button',{name:'➕ Reclutar',exact:true}));assert.equal(await page.locator('.team-slot:not(.vacant)').count(),3);await shot('taberna');await press(page.locator('#dungeon'));
 const verify=async()=>assert(await page.evaluate(()=>{
  return combatants.every((p,i)=>{const c=$('battleStatus').children[i],m=c.querySelectorAll('[role="meter"]');return Number(m[0].getAttribute('aria-valuenow'))===Math.max(0,p.hp)&&Number(m[1].getAttribute('aria-valuenow'))===p.mp&&Number(m[0].getAttribute('aria-valuemax'))===p.maxhp&&c.classList.contains('defeated')===(p.hp<=0)&&c.classList.contains('active')===(i===activeTurn&&!combatFinished&&p.hp>0)})
 }));
 await verify();await shot('combate');
 // Partida funcional: PV/PM originales, azar determinista y acciones mediante botones reales.
 await page.evaluate(()=>Math.random=()=>0);
 let count=0;
 while(count++<200){
  const state=await page.evaluate(()=>({finished:combatFinished,stage,won:!livingEnemies().length,p:combatants[activeTurn],needsHeal:combatants.some(a=>a.hp>0&&a.maxhp-a.hp>=20),usedPotion}));
  if(state.finished){assert(state.won);if(state.stage===2){await press(page.getByRole('button',{name:/^🎁/}));break}await press(page.getByRole('button',{name:/^🚪/}));continue}
  const p=state.p,action=p.cls==='Clérigo'&&p.mp>=8&&state.needsHeal?'✨':p.hp<p.maxhp/2&&!state.usedPotion?'🧪':p.cls!=='Clérigo'&&p.mp>=8?'✨':'⚔';
  await press(page.locator('#battleActions').getByRole('button',{name:new RegExp('^'+action)}));const targets=page.getByRole('button',{name:/^🎯/});if(await targets.count())await press(targets.last());await verify();
 }
 assert(count<200);assert((await page.locator('#battleLog').innerText()).includes('Has completado'));
 // Estados dirigidos: defensa, curación, fase II, derrota y reintento.
 await page.evaluate(()=>{battleActive=false;startBattle();hitHero(combatants[0],10);activeTurn=1;showTurn(true)});await verify();await press(page.getByRole('button',{name:/^✨/}));await verify();
 await page.evaluate(()=>{activeTurn=0;showTurn(true)});await press(page.getByRole('button',{name:/^🛡/}));await verify();
 await page.evaluate(()=>{stage=1;startEncounter();damageEnemy(enemies[0],10000);battleStatus()});await verify();assert((await page.locator('#battleRound').innerText()).includes('FASE II'));await shot('fase-ii');
 await page.evaluate(()=>{hitHero(combatants[0],10000);battleStatus()});await verify();assert.equal(await page.locator('.hero-status.defeated').count(),1);
 await page.evaluate(()=>{combatants.forEach(p=>hitHero(p,10000));finishBattle(false)});await verify();await shot('derrota');await press(page.getByRole('button',{name:/^🔁/}));await verify();assert.equal(await page.locator('.hero-status.defeated').count(),0);
 await page.evaluate(()=>{hero=data.findIndex(p=>p[0]==='Óscar');party=[6,2];battleActive=false;startBattle()});assert((await page.getByRole('button',{name:/^✨/}).innerText()).includes('Te llevo al Clot y te enseño los pajaros'));await shot('habilidad-larga');
 assert(await page.evaluate(()=>[...document.querySelectorAll('#battleActions button,.hero-status,#battleLog')].every(e=>e.scrollWidth<=e.clientWidth+1)));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>{combatants.forEach(p=>hitHero(p,10000));finishBattle(false)});await press(page.getByRole('button',{name:/^🍺/}));assert.equal(await page.evaluate(()=>battleActive),false);await clickNpc(-1);assert((await page.locator('#npcTitle').innerText()).includes('Pere'));await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>modal),false);
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PASS',mobile?'móvil táctil':'escritorio','galería/teclado, partida con botones hasta cofre, barras reales, fases, derrota/reintento, textos largos, retorno y cero errores');await context.close();
}
} finally {if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
