// Servicio exclusivamente simulado. No contiene invitaciones ni asignaciones reales.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{randomBytes}=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(u==='/')u='/index.html';const f=path.join(root,u);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('https://draw.test/'))failed.push(r.url())});
 const token=randomBytes(32).toString('base64url'),url='http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/';
 let mode='ok',calls=0;const bodies=[];
 await page.route('**/js/sorteo-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'const SorteoConfig=Object.freeze({endpoint:"https://draw.test/reveal",drawId:"simulacion"});'}));
 await page.route('https://draw.test/reveal',async r=>{
  calls++;const req=r.request();assert.equal(req.method(),'POST');assert.equal(req.headers()['referer'],undefined);assert(!req.url().includes(token));
  const body=req.postDataJSON();bodies.push(body);assert.deepEqual(Object.keys(body).sort(),['drawId','token']);assert.equal(body.token,token);
  const headers={'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'};
  if(mode==='down')return r.fulfill({status:503,headers,json:{error:'unavailable'}});
  if(mode==='invalid')return r.fulfill({status:404,headers,json:{error:'invalid_invitation'}});
  return r.fulfill({headers,json:{recipient:{name:'PRUEBA · Destinatario simulado',spriteKey:mode==='no-sprite'?'inexistente':'alba'}}});
 });
 const press=async l=>mobile?l.tap():l.click();
 await page.goto(url+'#invitacion='+token);await page.evaluate(()=>enemyArtReady);assert.equal(calls,0);
 await press(page.locator('#start'));await page.evaluate(()=>{party=[6,2];startBattle();stage=2;startEncounter();enemies.forEach(e=>damageEnemy(e,10000));finishBattle(true)});
 assert((await page.locator('#battleLog').innerText()).includes('MISIÓN COMPLETADA'));
 await press(page.locator('#battleActions').getByRole('button',{name:/^🎁/}));
 assert(await page.locator('#destinyDialog').isVisible());assert.equal(calls,0);
 const shot=async name=>{if(process.env.SNAPSHOT_DIR){await page.waitForTimeout(400);fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'movil':'escritorio')+'-'+name+'.png')})}};
 await shot('cofre');await press(page.locator('#destinyOpen'));await page.locator('#destinyName').waitFor({state:'visible'});
 assert.equal(await page.locator('#destinyName').innerText(),'PRUEBA · Destinatario simulado');assert.equal(calls,1);assert(await page.locator('#destinyPortrait').isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#destinyDialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
 await shot('revelacion-simulada');
 await press(page.locator('#destinyOpen'));await press(page.locator('#destinySkip'));await page.locator('#destinyName').waitFor({state:'visible'});assert.equal(calls,2);
 mode='down';await press(page.locator('#destinyOpen'));await page.locator('#destinyStatus').filter({hasText:'temporalmente'}).waitFor();assert(await page.locator('#destinyResult').isHidden());
 mode='invalid';await press(page.locator('#destinyOpen'));await page.locator('#destinyStatus').filter({hasText:'no es válida'}).waitFor();
 mode='no-sprite';await page.emulateMedia({reducedMotion:'reduce'});await press(page.locator('#destinyOpen'));await page.locator('#destinyNoPortrait').waitFor({state:'visible'});assert(await page.locator('#destinyPortrait').isHidden());assert(await page.locator('#destinySkip').isHidden());
 await press(page.locator('#destinyBack'));assert.equal(await page.evaluate(()=>battleActive),false);
 mode='ok';await page.reload();await page.evaluate(()=>enemyArtReady);await press(page.locator('#consultInvitation'));await press(page.locator('#destinyOpen'));await page.locator('#destinyName').waitFor({state:'visible'});
 assert.equal(await page.locator('#destinyName').innerText(),'PRUEBA · Destinatario simulado');
 // Otro dispositivo/contexto, sin almacenamiento previo, mismo enlace y resultado.
 const otherContext=await browser.newContext();const second=await otherContext.newPage();await second.route('**/js/sorteo-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'const SorteoConfig={endpoint:"https://draw.test/reveal",drawId:"simulacion"};'}));
 await second.route('https://draw.test/reveal',r=>{assert.equal(r.request().postDataJSON().token,token);return r.fulfill({headers:{'Access-Control-Allow-Origin':'*'},json:{recipient:{name:'PRUEBA · Destinatario simulado',spriteKey:'alba'}}})});
 await second.goto(url+'#invitacion='+token);await second.evaluate(()=>enemyArtReady);await second.locator('#consultInvitation').click();await second.locator('#destinyOpen').click();await second.locator('#destinyName').waitFor({state:'visible'});await otherContext.close();
 await page.goto(url);await page.evaluate(()=>enemyArtReady);await page.evaluate(()=>FinalScene.show());await press(page.locator('#destinyOpen'));await page.locator('#destinyStatus').filter({hasText:'enlace personal'}).waitFor();
 await page.unroute('**/js/sorteo-config.js*');await page.reload();await page.evaluate(()=>FinalScene.show());await press(page.locator('#destinyOpen'));await page.locator('#destinyStatus').filter({hasText:'pendiente de configuración'}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS',mobile?'móvil táctil':'escritorio','cofre, animación/omisión/reduced-motion, resultado simulado, reconsulta/recarga, sin sprite, sin invitación/configuración, 404/503, cero errores JS');await context.close();
}
}finally{if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
