// Node.js + Playwright. BROWSER_PATH y SNAPSHOT_DIR opcionales.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright'),{harness}=require('./animations.cjs');
const root=path.resolve(__dirname,'..'),base='e873b35fbcce5b5659f30ea5ec02515d396c8b46';
const oldFile=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:20e6});
const names=['combate_1_mirucha','combate_2_nacho_arturo','combate_3_jefe_final'];
const label='Te llevo al Clot y te enseño los pajaros';
// Todo combate salvo el despacho del fondo sigue idéntico, incluidos los dibujos de reserva.
const combat=fs.readFileSync(path.join(root,'js/combate.js'),'utf8');
assert.equal(combat.replace(/function battleBackdrop\(g\) \{[\s\S]*?function battleBackdropFallback\(g\) \{/,'function battleBackdrop(g) {'),oldFile('js/combate.js').toString());
assert.equal(fs.readFileSync(path.join(root,'js/personajes.js'),'utf8').replace('"'+label+'",','"Yo juego eminencias",'),oldFile('js/personajes.js').toString());
for(const f of ['js/animaciones.js','js/animaciones-heroes.js','js/enemigos.js','js/taberna.js','js/main.js','css/styles.css',...['personajes','enemigos','taberna'].flatMap(d=>fs.readdirSync(path.join(root,'assets',d)).map(n=>'assets/'+d+'/'+n))])assert(fs.readFileSync(path.join(root,f)).equals(oldFile(f)),f);
for(const n of names){const b=fs.readFileSync(path.join(root,'assets/combates',n+'.png'));assert.equal(b.readUInt32BE(16),768);assert.equal(b.readUInt32BE(20),355)}
// Diferencial real de Óscar contra la base, normalizando solo el nombre visible.
const old=harness(),fresh=harness();old.run(oldFile('js/combate.js').toString());old.run('data.find(p=>p[0]==="Óscar")[3]="Yo juego eminencias"');
for(const h of [old,fresh]){h.run('hero=data.findIndex(p=>p[0]==="Óscar");party=[6,2];startBattle()');h.click('battleActions','✨')}
const state='JSON.stringify({combatants,enemies,round,activeTurn,log:$("battleLog").textContent})';
assert.equal(fresh.run(state),old.run(state).replaceAll('Yo juego eminencias',label));
assert.equal(fresh.run('combatants[0].maxmp-combatants[0].mp'),8);
assert(fresh.run('$("battleLog").textContent').includes(label));
console.log('PASS protección de lógica/recursos y habilidad de Óscar idéntica salvo el texto');
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(u==='/')u='/index.html';const f=path.join(root,u);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
for(const mobile of [false,true]){
const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:850},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});const page=await context.newPage(),errors=[],bad=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});page.on('request',r=>requests.push(r.url()));
await page.goto('http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/');await page.evaluate(()=>enemyArtReady);
assert.equal(await page.title(),'La Taberna del Amigo Invisible v1.0.2');
for(const f of ['personajes','recursos','combate'])assert.equal(await page.locator('script[src^="js/'+f+'.js"]').getAttribute('src'),'js/'+f+'.js?v=1.0.2');
await page.selectOption('#pick',String(await page.evaluate(()=>data.findIndex(p=>p[0]==='Óscar'))));await page.locator('#start').click();await page.evaluate(()=>talk(hero));assert((await page.locator('#npcDetail').innerText()).includes(label));await page.getByRole('button',{name:'Cerrar',exact:true}).click();
await page.evaluate(()=>{party=[6,2];update();startBattle()});assert((await page.getByRole('button',{name:/^✨/}).innerText()).includes(label));
await page.getByRole('button',{name:/^✨/}).click();assert((await page.locator('#battleLog').innerText()).includes(label));
for(let stageIndex=0;stageIndex<3;stageIndex++){
const result=await page.evaluate(stageIndex=>{
 stage=stageIndex;startEncounter();
 const img=battleBackgroundArt[battleBackgroundCatalog[stage].key];const c=document.createElement('canvas');c.width=768;c.height=355;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(img,0,0);const expected=c.toDataURL();g.clearRect(0,0,768,355);battleBackdrop(g);const exact=expected===c.toDataURL();
 const calls=[],draw=bctx.drawImage.bind(bctx);bctx.drawImage=(img,...args)=>{calls.push({src:img.src,args,smooth:bctx.imageSmoothingEnabled});draw(img,...args)};battleDraw();bctx.drawImage=draw;
 return {exact,src:img.src,calls: calls.filter(c=>c.src),width:img.naturalWidth,height:img.naturalHeight};
},stageIndex);
assert(result.exact);assert(result.src.includes(names[stageIndex]+'.png?v='));assert.equal(result.calls[0].src,result.src);assert.deepEqual(result.calls[0].args,[0,0,768,355]);assert.equal(result.calls[0].smooth,false);assert(result.calls.slice(1).some(c=>c.src.includes('/enemigos/')));assert(result.calls.slice(1).some(c=>c.src.includes('/personajes/')));
if(process.env.SNAPSHOT_DIR){fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.locator('#battleCanvas').screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'mobile':'desktop')+'-'+stageIndex+'.png')})}
}
for(const n of names)assert.equal(requests.filter(u=>u.includes('/'+n+'.png')).length,1,'carga única');
assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
// Fallan los tres fondos: conserva escenarios originales y permite combatir.
await page.route('**/assets/combates/*.png*',r=>r.abort());await page.reload();await page.evaluate(()=>enemyArtReady);assert(await page.locator('#start').isEnabled());
assert(await page.evaluate(()=>failedSprites.filter(s=>s.startsWith('combates/')).length===3));
assert(await page.evaluate(()=>{hero=0;party=[6,2];startBattle();for(stage=0;stage<3;stage++){startEncounter();const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=768;a.height=b.height=355;battleBackdrop(a.getContext('2d'));battleBackdropFallback(b.getContext('2d'));if(a.toDataURL()!==b.toDataURL())return false;battleDraw()}return true}));assert.deepEqual(errors,[]);
console.log('PASS',mobile?'móvil DPR2':'escritorio','3 fondos exactos, orden de dibujo, caché, Óscar/modal/menú/mensaje y reserva ante fallos');await context.close();
}
}finally{if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
