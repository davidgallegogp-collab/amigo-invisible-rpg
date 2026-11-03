// v1.2.1: enlace externo, sin consultas ni invitaciones.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(u==='/')u='/index.html';const f=path.join(root,u);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
const form='https://docs.google.com/forms/d/e/1FAIpQLSfb3NrSLeJ76OhQAHorPJQi0pUwkEg8DkeXdNSZNyceNW59qg/viewform?usp=sharing&ouid=104747675665075751133';
const base='6ebc825022e0881c989bf2f9b55a1845a0c80360',{execFileSync}=require('node:child_process');
for(const file of ['js/combate.js','js/personajes.js','js/estado.js','js/recursos.js','js/taberna.js','js/animaciones.js','js/animaciones-heroes.js','js/enemigos.js','js/main.js','js/interfaz.js'])assert(fs.readFileSync(path.join(root,file)).equals(execFileSync('git',['show',base+':'+file],{cwd:root})),file);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 // Interceptar solo el destino externo para verificar navegación sin enviar datos.
 await context.route('https://docs.google.com/forms/**',r=>r.fulfill({contentType:'text/html',body:'<title>Destino externo de prueba</title><p>Formulario: navegación verificada, sin envío.</p>'}));
 const press=async l=>mobile?l.tap():l.click();
 await page.goto('http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/#invitacion=valor-antiguo-ignorado');await page.evaluate(()=>enemyArtReady);
 assert.equal(await page.title(),'La Taberna del Amigo Invisible v1.2.1');assert.equal(await page.locator('#consultInvitation').count(),0);
 assert.equal(await page.locator('.character-card').count(),15);assert(await page.evaluate(()=>data.some(p=>p[0]==='Jordux')));
 await press(page.locator('#start'));await page.evaluate(()=>{party=[6,2];startBattle();Math.random=()=>0});
 // Tres combates con acciones reales y PV/PM originales, sin matar enemigos por código.
 let count=0;while(count++<200){
  const state=await page.evaluate(()=>({finished:combatFinished,stage,won:!livingEnemies().length,p:combatants[activeTurn],needsHeal:combatants.some(a=>a.hp>0&&a.maxhp-a.hp>=20),usedPotion}));
  if(state.finished){assert(state.won);if(state.stage===2)break;assert.equal(await page.locator('#destinyDialog').count(),0);await press(page.getByRole('button',{name:/^🚪/}));continue}
  const p=state.p,action=p.cls==='Clérigo'&&p.mp>=8&&state.needsHeal?'✨':p.hp<p.maxhp/2&&!state.usedPotion?'🧪':p.cls!=='Clérigo'&&p.mp>=8?'✨':'⚔';
  await press(page.locator('#battleActions').getByRole('button',{name:new RegExp('^'+action)}));const targets=page.getByRole('button',{name:/^🎯/});if(await targets.count())await press(targets.last());
 }assert(count<200);
 assert((await page.locator('#battleLog').innerText()).includes('MISIÓN COMPLETADA'));
 await press(page.locator('#battleActions').getByRole('button',{name:/^🎁/}));await press(page.locator('#destinyOpen'));
 assert(await page.locator('#destinyChest').evaluate(el=>el.classList.contains('opening')));
 await page.locator('#destinyResult').waitFor({state:'visible'});
 assert.equal(await page.locator('#destinyTitle').innerText(),'¡HAS ENCONTRADO EL REGISTRO SECRETO DE PERE!');
 assert.deepEqual(await page.locator('#destinyResult p').allTextContents(),[
 '¡Enhorabuena, aventurero! Has sobrevivido a Mirucha, a los guardianes y hasta a Quico.',
 'Ahora solo queda una última misión: dejar tu nombre y correo electrónico para participar en el amigo invisible.',
 'Pere se encargará de que el destino haga el resto.']);
 const link=page.locator('#destinyForm');assert.equal(await link.getAttribute('href'),form);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#destinyDialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
 if(process.env.SNAPSHOT_DIR){fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.waitForTimeout(400);await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'movil':'escritorio')+'-registro-pere.png')})}
 const popupPromise=context.waitForEvent('page');await press(link);const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),form);assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
 await page.keyboard.press('Escape');await press(page.locator('#battleActions').getByRole('button',{name:/^🎁/}));await press(page.locator('#destinyOpen'));await press(page.locator('#destinySkip'));assert(await link.isVisible());
 await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});await press(page.locator('#battleActions').getByRole('button',{name:/^🎁/}));await press(page.locator('#destinyOpen'));assert(await link.isVisible());assert(await page.locator('#destinySkip').isHidden());
 await press(page.locator('#destinyBack'));assert.equal(await page.evaluate(()=>battleActive),false);
 assert(!requests.some(url=>/supabase|sorteo(?:-config)?\.js/.test(url)));assert(requests.every(url=>new URL(url).hostname==='127.0.0.1'));
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'móvil táctil':'escritorio','tres combates, victoria, animación, omisión, reduced-motion, texto exacto, enlace/pestaña/noopener, retorno, sin llamadas externas ni errores JS');await context.close();
}
}finally{if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
