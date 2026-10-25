// npm install --no-save playwright; npx playwright install chromium
// BROWSER_PATH opcional; SNAPSHOT_DIR opcional para capturas de revisión.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base='f602fc48d723d57c15e1ea4cf2a565f5b27eb537';
const original=vm.createContext({});vm.runInContext(execFileSync('git',['show',base+':js/personajes.js'],{cwd:root,encoding:'utf8'}),original);
const expected=JSON.parse(vm.runInContext('JSON.stringify(data.filter(p=>!["Juan","Fran","Martín"].includes(p[0])))',original));
expected.find(p=>p[0]==='Alba')[2]='¿Sale piti?';
for(const file of ['js/animaciones.js','js/enemigos.js','js/estado.js',...fs.readdirSync(path.join(root,'assets/enemigos')).map(n=>'assets/enemigos/'+n)]){
 assert(fs.readFileSync(path.join(root,file)).equals(execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:10e6})),file+' ha cambiado');
}
const server=http.createServer((req,res)=>{
 let url=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(url==='/')url='/index.html';
 const file=path.join(root,url);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.png':'image/png','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:850},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
 const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await page.goto('http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/');await page.evaluate(()=>enemyArtReady);
 assert.equal(await page.locator('#pick option').count(),15);
 assert.deepEqual(await page.evaluate(()=>data),expected);
 assert.deepEqual(await page.evaluate(()=>Object.values(heroArt).map(img=>[img.complete,img.naturalWidth,img.naturalHeight])),Array(15).fill([true,384,450]));
 await page.locator('#start').click();
 const checks=await page.evaluate(()=>{
  const assert=(v,m)=>{if(!v)throw new Error(m)};
  const keys=new Set();
  for(let i=0;i<data.length;i++){
   const c=heroSpriteCatalog[data[i][0]];assert(c,'catálogo');keys.add(c.key);
   assert(!c.flip,'orientación izquierda original');
  }
  assert(keys.size===15,'IDs únicos');
  // Interacción por ID y selección directa, sin requisitos de proximidad.
  for(let protagonist=0;protagonist<15;protagonist++){
   hero=protagonist;party=[];
   for(let i=0;i<15;i++)if(i!==hero){
    close();talk(i);
    assert($('npcTitle').textContent.startsWith(data[i][0]),'NPC confundido');
    $('actions').querySelector('button').click();assert(party.includes(i),'reclutamiento');party=[];close();
   }
  }
  // Todas las combinaciones ordenadas: identidad estable, también misma clase.
  let combinations=0;
  for(let a=0;a<15;a++)for(let b=0;b<15;b++)for(let c=0;c<15;c++)if(a!==b&&a!==c&&b!==c){
   battleActive=false;hero=a;party=[b,c];startBattle();
   assert(combatants.every((p,i)=>p.spriteKey===heroSpriteCatalog[data[[a,b,c][i]][0]].key),'sprite intercambiado');combinations++;
  }
  // Los 16 se dibujan en cada slot, con alfa y dimensiones válidos.
  const draw=bctx.drawImage.bind(bctx);const calls=[];
  bctx.drawImage=(img,...args)=>{calls.push({src:img.src,args,alpha:bctx.globalAlpha,smooth:bctx.imageSmoothingEnabled});draw(img,...args)};
  for(let a=0;a<15;a++)for(let i=0;i<3;i++){
   const p={name:data[a][0],spriteKey:heroSpriteCatalog[data[a][0]].key,cls:data[a][1],hp:10};
   calls.length=0;battleHero(bctx,p,i);assert(calls.length===1,'PNG no dibujado');
   const d=calls[0];assert(d.src.includes('/'+p.spriteKey+'.png'),'imagen incorrecta');assert(!d.smooth,'suavizado');assert(d.alpha===1,'alfa vivo');
   const [x,y,w,h]=d.args,anchor=489+i*96;assert(anchor+x>=430&&anchor+x+w<=768&&205+(i%2)*19+y>=0,'fuera de canvas');assert(w===88&&Math.abs(w/h-384/450)<1e-6,'proporción');
   p.hp=0;calls.length=0;battleHero(bctx,p,i);assert(calls[0].alpha===0.45,'derrota');assert(bctx.globalAlpha===1,'alfa sin restaurar');
  }
  bctx.drawImage=draw;
  return {combinations,npcChecks:15*14};
 });
 assert.equal(checks.combinations,2730);assert.equal(checks.npcChecks,210);
 if(process.env.SNAPSHOT_DIR){
  fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});
  for(let a=0;a<15;a+=3){
   await page.evaluate(a=>{battleActive=false;hero=a;party=[(a+1)%15,(a+2)%15];startBattle();stage=2;startEncounter();visualPulse=0;battleDraw()},a);
   await page.locator('#battleCanvas').screenshot({path:path.join(process.env.SNAPSHOT_DIR,`${mobile?'mobile':'desktop'}-${a}.png`)});
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log('PASS',mobile?'móvil emulado DPR2':'escritorio','15 PNG, fichas originales, 210 interacciones, 2730 equipos, 45 dibujos, derrota, tamaños, rutas Pages y cero excepciones');
 // Recorrido con estadísticas normales: semilla determinista, solo botones del juego.
 const ending=await page.evaluate(()=>{
  battleActive=false;hero=0;party=[6,2];Math.random=()=>0;startBattle();
  const click=prefix=>{const b=[...$("battleActions").children].find(b=>b.textContent.startsWith(prefix));if(!b)throw Error(prefix);b.click()};
  let actions=0;
  while(actions++<200){
   if(combatFinished){if(livingEnemies().length)throw Error("Derrota");if(stage===2){click('🎁');break}click('🚪');continue}
   const p=combatants[activeTurn];
   const label=p.cls==='Clérigo'&&p.mp>=8&&combatants.some(a=>a.hp>0&&a.maxhp-a.hp>=20)?'✨'
    :p.hp<p.maxhp/2&&!usedPotion?'🧪':p.cls!=='Clérigo'&&p.mp>=8?'✨':'⚔';
   click(label);const targets=[...$("battleActions").children].filter(b=>b.textContent.startsWith('🎯'));if(targets.length)targets.at(-1).click();
  }
  return {actions,log:$("battleLog").textContent,hp:combatants.map(p=>p.maxhp)};
 });
 assert(ending.log.includes('Has completado'));assert.deepEqual(ending.hp,[66,62,78]);assert(ending.actions<200);
 console.log('PASS cofre con PV/PM normales: David, Carlos y Jordux, azar determinista');
 // Fallo controlado: aviso explícito, inicio desbloqueado y reserva funcional.
 await page.route('**/david.png*',route=>route.abort());await page.reload();await page.evaluate(()=>enemyArtReady);
 assert((await page.locator('#assetStatus').innerText()).includes('personajes/david'));assert(await page.locator('#start').isEnabled());
 await page.evaluate(()=>{hero=0;party=[1,6];startBattle();battleDraw()});assert.deepEqual(errors,[]);
 console.log('PASS fallo de PNG: aviso y reserva, juego disponible');
 await context.close();
 }
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
