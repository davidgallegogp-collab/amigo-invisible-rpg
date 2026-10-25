// BROWSER_PATH opcional; SNAPSHOT_DIR opcional. npm install --no-save playwright
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base='2d37492f1c6d42086278386cefe809409884ac52';
for(const file of ['js/animaciones.js','js/animaciones-heroes.js','js/enemigos.js','js/estado.js',...['personajes','enemigos'].flatMap(d=>fs.readdirSync(path.join(root,'assets',d)).map(n=>'assets/'+d+'/'+n))])assert(fs.readFileSync(path.join(root,file)).equals(execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:10e6})),file+' modificado');
const c=vm.createContext({});vm.runInContext(execFileSync('git',['show',base+':js/personajes.js'],{cwd:root,encoding:'utf8'}),c);const expected=JSON.parse(vm.runInContext('JSON.stringify(data.filter(p=>p[0]!=="Martín"))',c));
expected.find(p=>p[0]==='Óscar')[3]='Te llevo al Clot y te enseño los pajaros';
const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname.replace(/^\/amigo-invisible-rpg/,'');if(p==='/')p='/index.html';const f=path.join(root,p);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.css':'text/css'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:850},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
   const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
   const url='http://127.0.0.1:'+server.address().port+'/amigo-invisible-rpg/';
   const press=async locator=>mobile?locator.tap():locator.click();
   const clickNpc=async(i,edge=false)=>{
    await page.locator('#game').scrollIntoViewIfNeeded();
    const point=await page.evaluate(({i,edge})=>{const r=canvas.getBoundingClientRect(),b=npcBounds(i);return {x:r.left+canvas.clientLeft+(b.x+(edge?2:b.w/2))*(r.width-2*canvas.clientLeft)/canvas.width,y:r.top+canvas.clientTop+(b.y+b.h/2)*(r.height-2*canvas.clientTop)/canvas.height}},{i,edge});
    if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   };
   for(let protagonist=0;protagonist<15;protagonist++){
    await page.goto(url);await page.evaluate(()=>enemyArtReady);await page.selectOption('#pick',String(protagonist));await press(page.locator('#start'));
    assert.equal(await page.evaluate(()=>hero),protagonist);assert(await page.locator('#dungeon').isDisabled());
    assert.deepEqual(await page.evaluate(()=>data),expected);
    assert(await page.evaluate(()=>Object.values(tavernArt).every(img=>img.complete&&img.naturalWidth>0)));
    assert.equal(await page.evaluate(()=>Object.keys(heroSpriteCatalog).length),15);
    assert(!await page.evaluate(()=>data.some(p=>p[0]==='Martín')||'Martín' in heroSpriteCatalog));
    if(protagonist===0){
     assert.equal(await page.locator('[data-dir],#pad,#talk').count(),0);
     const geometry=await page.evaluate(()=>{
      const assert=(v,m)=>{if(!v)throw Error(m)};const boxes=[-1,...data.map((_,i)=>i)].map(i=>({i,...npcBounds(i)}));
      for(const a of boxes){assert(npcAt(a.x+a.w/2,a.y+a.h/2)===a.i,'centro incorrecto');assert(a.x>=0&&a.y>=0&&a.x+a.w<=canvas.width&&a.y+a.h<=canvas.height,'fuera');for(const b of boxes)if(a.i!==b.i)assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'solapamiento')}
      const r=canvas.getBoundingClientRect();return {touchWidth:boxes[0].w*(r.width-2*canvas.clientLeft)/canvas.width};
     });assert(geometry.touchWidth>=44);
     for(let i=-1;i<15;i++){
      await clickNpc(i,i%2===0);
      assert.equal(await page.locator('#npcTitle').innerText(),i===-1?'🍺 Pere · Tabernero':expected[i][0]+' · '+expected[i][1]);
      const portrait=await page.evaluate(()=>({label:$('npcPortrait').getAttribute('aria-label'),pixels:[...$('npcPortrait').getContext('2d').getImageData(0,0,240,300).data].some(v=>v>0),scroll:$('dialogbox').scrollWidth,width:$('dialogbox').clientWidth}));
      assert.equal(portrait.label,'Retrato de '+(i===-1?'Pere':expected[i][0]));assert(portrait.pixels);assert(portrait.scroll<=portrait.width);
      assert(await page.evaluate(i=>{const img=i===-1?tavernArt.pere:heroArt[heroSpriteCatalog[data[i][0]].key];const c=document.createElement('canvas');c.width=240;c.height=300;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const scale=Math.min(240/img.naturalWidth,300/img.naturalHeight),w=scale*img.naturalWidth,h=scale*img.naturalHeight;g.drawImage(img,(240-w)/2,(300-h)/2,w,h);return c.toDataURL()===$('npcPortrait').toDataURL()},i));
      if(process.env.SNAPSHOT_DIR&&(i===-1||i===2)){fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'mobile':'desktop')+'-dialog-'+i+'.png'),fullPage:true})}
      if(i>=0){assert.equal(await page.locator('#npcLine').innerText(),'«'+expected[i][2]+'»');assert((await page.locator('#npcDetail').innerText()).includes(expected[i][3]))}
      if(i<=0)assert.equal(await page.getByRole('button',{name:'➕ Reclutar',exact:true}).count(),0);
      await press(page.getByRole('button',{name:'Cerrar',exact:true}));
     }
     const fixed=await page.evaluate(()=>({positions:JSON.stringify(positions),player:JSON.stringify(player),last:JSON.stringify(last)}));
     for(const key of ['w','a','s','d','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','e'])await page.keyboard.press(key);
     assert.deepEqual(await page.evaluate(()=>({positions:JSON.stringify(positions),player:JSON.stringify(player),last:JSON.stringify(last)})),fixed);assert.equal(await page.evaluate(()=>modal),false);
     // El dibujo se repite solo al cambiar UI, no por un bucle de exploración.
     assert(await page.evaluate(()=>{const before=canvas.toDataURL();render();return before===canvas.toDataURL()}));
    }
    const first=(protagonist+1)%15,second=(protagonist+2)%15,third=(protagonist+3)%15;
    await clickNpc(first);await page.evaluate(()=>window.oldRecruit=[...$('actions').children].find(b=>b.textContent.startsWith('➕')).onclick);await press(page.getByRole('button',{name:'➕ Reclutar',exact:true}));
    await page.evaluate(()=>window.oldRecruit());assert.equal(await page.evaluate(()=>party.length),1);assert(await page.locator('#dungeon').isDisabled());
    await clickNpc(first);assert.equal(await page.getByRole('button',{name:'➕ Reclutar',exact:true}).count(),0);await press(page.getByRole('button',{name:'Cerrar',exact:true}));
    await clickNpc(second);await press(page.getByRole('button',{name:'➕ Reclutar',exact:true}));assert(await page.locator('#dungeon').isEnabled());assert.deepEqual(await page.evaluate(()=>party),[first,second]);
    await clickNpc(third);assert.equal(await page.getByRole('button',{name:'➕ Reclutar',exact:true}).count(),0);await press(page.getByRole('button',{name:'Cerrar',exact:true}));
    await page.evaluate(()=>window.oldRecruit());assert.equal(await page.evaluate(()=>party.length),2);
    const marks=await page.evaluate(()=>{const labels=[];const draw=ctx.fillText.bind(ctx);ctx.fillText=(s,...args)=>{labels.push(s);draw(s,...args)};render();ctx.fillText=draw;return labels.filter(s=>s==='★ TÚ'||s==='✓ EQUIPO')});assert.equal(marks.filter(s=>s==='★ TÚ').length,1);assert.equal(marks.filter(s=>s==='✓ EQUIPO').length,2);
    if(protagonist===0&&process.env.SNAPSHOT_DIR){fs.mkdirSync(process.env.SNAPSHOT_DIR,{recursive:true});await page.mouse.move(0,0);await page.screenshot({path:path.join(process.env.SNAPSHOT_DIR,(mobile?'mobile':'desktop')+'.png'),fullPage:true})}
    await press(page.locator('#dungeon'));assert(await page.evaluate(()=>battleActive&&stage===0&&combatants.length===3));assert.deepEqual(await page.evaluate(()=>combatants.map(p=>p.name)),[protagonist,first,second].map(i=>expected[i][0]));
    await page.evaluate(()=>leaveDungeon());assert.equal(await page.evaluate(()=>battleActive),false);assert(await page.locator('#dungeon').isEnabled());await clickNpc(-1);assert((await page.locator('#npcDetail').innerText()).includes('Pulsa'));await press(page.getByRole('button',{name:'Cerrar',exact:true}));
   }
   assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PASS',mobile?'toque móvil DPR2':'ratón escritorio','15 protagonistas, 16 zonas, frases, bordes, equipos, duplicados, límite, distintivos, botón, retorno y cero errores');
   // Recursos nuevos fallidos: aviso, retrato vacío explícito y reserva funcional.
   await page.route('**/assets/taberna/*.png*',route=>route.abort());
   await page.reload();await page.evaluate(()=>enemyArtReady);await press(page.locator('#start'));await clickNpc(-1);
   assert((await page.locator('#assetStatus').textContent()).includes('taberna/pere'));
   assert(await page.evaluate(()=>failedSprites.includes('taberna/tavern_bg')));
   assert.equal(await page.getByRole('button',{name:'➕ Reclutar',exact:true}).count(),0);
   assert.deepEqual(errors,[]);
   console.log('PASS reserva de fondo y Pere, diálogo disponible sin errores');
   await context.close();
  }
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
