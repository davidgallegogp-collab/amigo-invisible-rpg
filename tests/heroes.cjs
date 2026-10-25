// node tests/heroes.cjs (lógica); BROWSER_PATH=/ruta/chromium node tests/heroes.cjs --browser
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {harness}=require('./animations.cjs');
const root=path.resolve(__dirname,'..'),base='da7b5fc28a98888ba49737fdee5344b6cfb30b08';
for(const file of ['js/animaciones.js','js/enemigos.js','js/recursos.js','js/estado.js',...['enemigos','personajes'].flatMap(dir=>fs.readdirSync(path.join(root,'assets',dir)).map(n=>'assets/'+dir+'/'+n))]){
 assert(fs.readFileSync(path.join(root,file)).equals(execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:10e6})),file);
}
assert(!/setTimeout|setInterval|requestAnimationFrame/.test(fs.readFileSync(path.join(root,'js/animaciones-heroes.js'),'utf8')));
const h=harness(),sample=()=>h.run('HeroAnimations.sample(p)');
for(let i=0;i<16;i++){
 h.run(`var p={name:data[${i}][0],hp:50};HeroAnimations.reset()`);
 for(const type of ['attack','skill','hurt','heal','guard']){
  h.run('HeroAnimations.reset()');h.time(1000);h.run(`HeroAnimations.play(p,'${type}')`);
  h.time(1050);const a=sample();assert.equal(a.type,type);assert(Math.abs(a.x)<=8&&Math.abs(a.y)<=3);
  if(type==='attack')assert(a.x<0);else assert(a.flash>0);
  if(type==='hurt'){assert.equal(a.color,'white');assert.notEqual(a.x,0)}
  h.time(1500);assert.equal(sample().type,'idle');assert.equal(sample().x,0);assert.equal(sample().flash,0);assert(Math.abs(sample().y)<=2);
 }
 h.time(2000);h.run('p.hp=0;HeroAnimations.play(p,"defeat")');h.time(2080);assert(sample().flash>0);assert(sample().alpha>0);
 h.time(2500);assert.equal(sample().type,'defeat');assert(Math.abs(sample().alpha-.45)<1e-9);assert.equal(sample().y,0);assert.equal(sample().x,0);
 h.run('HeroAnimations.play(p,"attack");HeroAnimations.play(p,"skill")');assert.equal(sample().type,'defeat');
 h.run('p.hp=50;HeroAnimations.reset()');assert.equal(sample().type,'idle');assert.equal(sample().alpha,1);
}
h.time(3000);h.run('HeroAnimations.reset();var p={hp:50},q={hp:50};HeroAnimations.play(p,"hurt")');assert.equal(h.run('HeroAnimations.sample(q).type'),'idle');
h.run('HeroAnimations.play(p,"attack")');h.time(3050);h.run('HeroAnimations.play(p,"hurt")');h.time(3270);assert.equal(sample().type,'attack');h.time(4000);assert.equal(sample().type,'idle');
h.time(5000);h.run('HeroAnimations.play(p,"skill");HeroAnimations.play(p,"hurt");p.hp=0;HeroAnimations.play(p,"defeat")');h.time(6000);assert.equal(sample().type,'defeat');
console.log('PASS 16 héroes × estados, izquierda, prioridades, golpes consecutivos, instancias y fin de animaciones');
h.time(10000);h.run('hero=0;party=[6,2];startBattle();stage=1;startEncounter();var p=combatants[0]');
h.click('battleActions','⚔');assert.equal(sample().type,'idle');h.click('battleActions','↩');assert.equal(sample().type,'idle');
h.click('battleActions','⚔');h.click('battleActions','🎯');assert.equal(sample().type,'attack');
h.run('HeroAnimations.reset();activeTurn=0;combatants[0].mp=0;showTurn(true)');h.click('battleActions','✨');assert.equal(sample().type,'idle');assert.equal(h.run('combatants[0].mp'),0);
h.run('combatants[0].mp=32;showTurn(true)');h.click('battleActions','✨');assert.equal(sample().type,'idle');h.click('battleActions','↩');assert.equal(sample().type,'idle');h.click('battleActions','✨');h.click('battleActions','🎯');assert.equal(sample().type,'skill');
h.run('HeroAnimations.reset();var p=combatants[0];hitHero(p,0)');assert.equal(sample().type,'idle');h.run('hitHero(p,1)');assert.equal(sample().type,'hurt');
h.run('hitHero(p,10000)');assert.equal(sample().type,'defeat');
h.run('stage=0;combatants.forEach(p=>p.hp=p.maxhp);startEncounter()');assert.equal(sample().type,'idle');
h.run('activeTurn=1;combatants[0].hp-=10;combatants[1].hp-=10;showTurn(true)');h.click('battleActions','✨');assert.equal(sample().type,'heal');assert.equal(h.run('HeroAnimations.sample(combatants[1]).type'),'skill');assert.equal(h.run('HeroAnimations.sample(combatants[2]).type'),'idle');
h.time(10350);assert.equal(h.run('HeroAnimations.sample(combatants[1]).type'),'heal');
h.run('startEncounter();combatants[0].hp=0;activeTurn=1;showTurn(true)');h.click('battleActions','✨');assert.equal(h.run('combatants[0].hp'),0);assert.equal(sample().type,'defeat');
h.run('combatants.forEach(p=>p.hp=p.maxhp);startEncounter();activeTurn=0;showTurn(true)');h.click('battleActions','🛡');assert.equal(sample().type,'guard');h.run('hitHero(p,5)');assert.equal(sample().type,'hurt');
h.run('leaveDungeon()');assert.equal(sample().type,'idle');
h.run('battleActive=false;startBattle();combatants.forEach(p=>hitHero(p,10000));finishBattle(false)');h.click('battleActions','🔁');assert(h.run('combatants.every(p=>HeroAnimations.sample(p).type==="idle"&&p.hp===p.maxhp)'));
console.log('PASS activación: confirmación/cancelación, maná, daño real, curación efectiva, defensa, muerte y reinicios');
// Misma lógica y semilla que main v0.9: no se filtra ningún dato de combate.
const old=harness(),fresh=harness();old.run(execFileSync('git',['show',base+':js/combate.js'],{cwd:root,encoding:'utf8'}));
const snapshot='JSON.stringify({combatants,enemies,stage,round,phase2,enemyBoost,activeTurn,usedPotion,combatFinished,log:$("battleLog").textContent})';
const equal=()=>assert.equal(fresh.run(snapshot),old.run(snapshot));
const both=code=>{old.run(code);fresh.run(code);equal()};
const click=label=>{old.click('battleActions',label);fresh.click('battleActions',label);equal()};
for(let i=0;i<16;i++){
 both(`battleActive=false;hero=${i};party=[(${i}+1)%16,(${i}+2)%16];startBattle();combatants.forEach(p=>p.hp-=25)`);click('✨');
 both('stage=1;startEncounter();combatants.forEach(p=>p.hp=p.maxhp=10000)');click('⚔');click('🎯');click('🛡');click('🧪');
 both('hitHero(combatants[0],11);hitHero(combatants[0],13);hitHero(combatants[1],0)');
}
for(const victim of [0,1]){both('stage=1;startEncounter()');both(`damageEnemy(enemies[${victim}],10000);enemyTurn()`)}
both('stage=2;startEncounter();combatants.forEach(p=>p.hp=10000)');for(let i=0;i<3;i++)both('enemyTurn()');
console.log('PASS comparación exacta con v0.9: PV/PM, 16 habilidades, ataques, defensa, poción, turnos, ambas fases II y danzas');

async function browserChecks(){
 const http=require('node:http'),{chromium}=require('playwright');
 const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(p==='/')p='/index.html';const f=path.join(root,p);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.css':'text/css'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:850},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/');await page.evaluate(()=>enemyArtReady);await page.locator("#start").click();
   const result=await page.evaluate(()=>{
    const assert=(x,m)=>{if(!x)throw Error(m)};let variants=0;
    // Alfa exacto del PNG y máscara, incluso al escalar e invertir los 16 diseños.
    for(const img of Object.values(heroArt))for(const color of ['white','#a9ddff','#a4ffad']){
     const mask=HeroAnimations.flashImage(img,color);assert(mask===HeroAnimations.flashImage(img,color),'máscara recalculada');
     for(const flip of [false,true]){
      const draw=source=>{const c=document.createElement('canvas');c.width=100;c.height=120;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(50,0);if(flip)g.scale(-1,1);g.drawImage(source,-44,0,88,88*450/384);return g.getImageData(0,0,100,120).data};
      const a=draw(img),b=draw(mask);for(let i=3;i<a.length;i+=4)assert(a[i]===b[i],'alfa/silueta incorrecta');variants++;
     }
    }
    hero=0;party=[6,2];startBattle();visualPulse=0;
    // Efectos sin recortes para cada slot; transformaciones de base y máscara coinciden.
    const draw=bctx.drawImage.bind(bctx),calls=[];bctx.drawImage=(img,...args)=>{calls.push({args,matrix:[...Object.values(bctx.getTransform().toJSON())],alpha:bctx.globalAlpha});draw(img,...args)};
    let renders=0;
    for(let a=0;a<16;a++)for(let slot=0;slot<3;slot++)for(const type of ['attack','skill','hurt','heal','guard','defeat']){
     const p={name:data[a][0],spriteKey:heroSpriteCatalog[data[a][0]].key,cls:data[a][1],hp:type==='defeat'?0:50};HeroAnimations.reset();HeroAnimations.play(p,type,1000);
     calls.length=0;battleHero(bctx,p,slot,1060);const sample=HeroAnimations.sample(p,1060),left=489+96*slot-44+sample.x;
     assert(left>=0&&left+88<=768,'fuera del Canvas');assert(calls.length===(type==='attack'?1:2),'capa ausente');
     if(calls.length===2){assert(JSON.stringify(calls[0].args)===JSON.stringify(calls[1].args),'anclaje máscara');assert(JSON.stringify(calls[0].matrix)===JSON.stringify(calls[1].matrix),'orientación máscara')}
     assert(bctx.globalAlpha===1,'alfa contaminada');renders++;
    }
    bctx.drawImage=draw;HeroAnimations.reset();startEncounter();
    // Mismo tiempo = misma muestra independientemente del número de frames.
    const p=combatants[0];HeroAnimations.play(p,'hurt',1000);const once=JSON.stringify(HeroAnimations.sample(p,1080));for(let i=0;i<144;i++)HeroAnimations.sample(p,1080);assert(once===JSON.stringify(HeroAnimations.sample(p,1080)),'dependencia de FPS');
    return {variants,renders};
   });
   assert.equal(result.variants,96);assert.equal(result.renders,288);assert.deepEqual(errors,[]);
   const frameTiming=await page.evaluate(async()=>{
    HeroAnimations.reset();combatants.forEach(p=>HeroAnimations.play(p,'skill'));
    const times=[];await new Promise(resolve=>{const frame=t=>{times.push(t);if(times.length===61)resolve();else requestAnimationFrame(frame)};requestAnimationFrame(frame)});
    const intervals=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);
    return {medianMs:intervals[30],p95Ms:intervals[57]};
   });
   console.log('FRAME TIMING',mobile?'móvil emulado':'escritorio',frameTiming);
   if(process.env.SNAPSHOT_DIR){
    fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});
    // Congelar solo el dibujo de prueba para capturar puntos concretos del efecto.
    await page.evaluate(()=>{window.drawAt=battleDraw;battleDraw=()=>{};});
    for(const [type,offset] of [['attack',115],['skill',150],['hurt',45],['heal',150],['guard',110],['defeat',80],['defeat',460]]){
     await page.evaluate(({type,offset})=>{hero=0;party=[6,2];battleActive=false;startBattle();visualPulse=0;HeroAnimations.reset();const p=combatants[0];if(type==='defeat')p.hp=0;HeroAnimations.play(p,type,1000);window.drawAt(1000+offset)},{type,offset});
     await page.locator('#battleCanvas').screenshot({path:path.join(process.env.SNAPSHOT_DIR,`${mobile?'mobile':'desktop'}-${type}-${offset}.png`)});
    }
   }
   console.log('PASS navegador',mobile?'móvil DPR2':'escritorio',result,'máscaras cacheadas, alfa exacto, inversión, anclajes y cero excepciones');
   await context.close();
  }
 }finally{if(browser)await browser.close();server.close()}
}
if(process.argv.includes('--browser'))browserChecks().catch(e=>{console.error(e);process.exitCode=1});
