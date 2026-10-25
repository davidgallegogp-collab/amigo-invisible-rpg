// node tests/animations.cjs — sin dependencias; DOM/Canvas simulados, no prueba visual.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const base = 'f602fc48d723d57c15e1ea4cf2a565f5b27eb537';
function harness(baseline = false) {
  const elements = new Map(), draws = [], listeners = {};
  let now = 1000;
  const context = () => {
    const stack = [];
    const g = {globalAlpha:1, tx:0, ty:0,
      save(){stack.push({globalAlpha:this.globalAlpha,tx:this.tx,ty:this.ty})},
      restore(){Object.assign(this,stack.pop())},
      translate(x,y){this.tx+=x;this.ty+=y},
      drawImage(img,...args){draws.push({src:img.src,args,alpha:this.globalAlpha,x:this.tx,y:this.ty})},
    };
    for(const key of ['clearRect','fillRect','strokeRect','beginPath','ellipse','fill','fillText','moveTo','lineTo','scale'])g[key]=()=>{};
    return g;
  };
  function element(){return {children:[],style:{},dataset:{},events:{},value:'0',textContent:'',
    appendChild(c){this.children.push(c)},prepend(c){this.children.unshift(c)},
    replaceChildren(){this.children=[]},setAttribute(){},cloneNode(){return element()},
    querySelector(){return this.heading ||= element()},getContext(){return this.g ||= context()},
    addEventListener(k,fn){this.events[k]=fn},setPointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,width:896,height:608}},
  }};
  const pads=['left','right','up','down'].map(dir=>Object.assign(element(),{dataset:{dir}}));
  class Image {
    set src(src){this._src=src;const png=fs.readFileSync(path.join(root,src.split('?')[0]));
      this.naturalWidth=png.readUInt32BE(16);this.naturalHeight=png.readUInt32BE(20);this.complete=true;this.onload();}
    get src(){return this._src}
  }
  const sandbox = vm.createContext({console,performance:{now:()=>now},Image,
    requestAnimationFrame(){},window:{addEventListener(){}},
    document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},
      createElement:element,querySelectorAll:()=>pads,body:{classList:{add(){}}},
      addEventListener(k,fn){listeners[k]=fn}},
  });
  const run = code => vm.runInContext(code,sandbox);
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const [,file] of html.matchAll(/src="(js\/[^?]+)\?/g)) {
    const source=baseline&&!['js/animaciones.js','js/animaciones-heroes.js'].includes(file)
      ?execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8'})
      :fs.readFileSync(path.join(root,file),'utf8');
    vm.runInContext(source,sandbox,{filename:file});
  }
  if (baseline) run('data.splice(12,1);data.splice(11,1);data.find(p=>p[0]==="Alba")[2]="¿Sale piti?";data.splice(data.findIndex(p=>p[0]==="Martín"),1);data.find(p=>p[0]==="Óscar")[3]="Te llevo al Clot y te enseño los pajaros"');
  run('Math.random=()=>0');
  return {run,draws,elements,pads,listeners,time(t){now=t},click(id,prefix){
    const b=elements.get(id).children.find(b=>b.textContent.startsWith(prefix));
    assert(b,'Botón '+prefix);b.onclick();
  }};
}
module.exports = { harness };
if (require.main === module) {
for(const name of ['mirucha','nacho','arturo','quico','avionatin','abel']) {
 const file='assets/enemigos/'+name+'.png';
 assert(fs.readFileSync(path.join(root,file)).equals(execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:10e6})));
}
console.log('PASS seis PNG idénticos byte a byte a v0.8');
const h=harness();
h.run('hero=0;party=[1,6];startBattle()');
// Los seis perfiles: reposo acotado, daño real, avance, retorno, desaparición.
for(let st=0;st<3;st++) {
 h.run(`stage=${st};startEncounter()`);
 const count=h.run('enemies.length');
 for(let i=0;i<count;i++){
  h.run(`var e=enemies[${i}];EnemyAnimations.reset()`);
  h.time(1000);h.run('EnemyAnimations.sample(e)');
  for(let t=1000;t<=5000;t+=17){h.time(t);const a=h.run('EnemyAnimations.sample(e)');assert(Math.abs(a.y)<=2&&Math.abs(a.x)<=1.5);assert.equal(a.alpha,1)}
  h.time(6000);h.run('damageEnemy(e,0)');assert.equal(h.run('EnemyAnimations.sample(e).flash'),0);
  h.run('damageEnemy(e,1)');assert.equal(h.run('EnemyAnimations.sample(e).flash'),1);
  h.time(6040);assert.notEqual(h.run('EnemyAnimations.sample(e).x'),0);
  h.time(6200);assert.equal(h.run('EnemyAnimations.sample(e).flash'),0);
  h.run('EnemyAnimations.play(e,"attack")');h.time(6250);assert(h.run('EnemyAnimations.sample(e).x')>0);
  h.time(6800);assert(Math.abs(h.run('EnemyAnimations.sample(e).x'))<=1.5);
  h.run('damageEnemy(e,10000)');assert(h.run('EnemyAnimations.sample(e).visible'));
  h.time(6840);assert.equal(h.run('EnemyAnimations.sample(e).alpha'),0.3);
  h.time(7160);assert(h.run('EnemyAnimations.sample(e).alpha')>0&&h.run('EnemyAnimations.sample(e).alpha')<1);
  h.time(7400);assert.equal(h.run('EnemyAnimations.sample(e).visible'),false);
  h.run('EnemyAnimations.play(e,"attack")');assert.equal(h.run('EnemyAnimations.sample(e).visible'),false);
 }
}
console.log('PASS reposo, daño, ataque y muerte en los seis perfiles');
h.time(10000);h.run('stage=1;startEncounter();damageEnemy(enemies[0],1);enemyTurn()');
assert.equal(h.run('EnemyAnimations.sample(enemies[0]).flash'),1);
h.time(10220);assert(h.run('EnemyAnimations.sample(enemies[0]).x')>0);
h.time(11000);assert.equal(h.run('EnemyAnimations.sample(enemies[0]).flash'),0);
h.time(12000);h.run('damageEnemy(enemies[0],1);enemyTurn();damageEnemy(enemies[0],10000)');
h.time(13000);assert.equal(h.run('EnemyAnimations.sample(enemies[0]).visible'),false);
h.run('startEncounter()');assert(h.run('enemies.every(e=>EnemyAnimations.sample(e).visible)'));
// Seleccionar objetivo no genera destello; atacar sí. No se anima cobertura sola.
h.time(14000);h.run('pickEnemy(()=>{})');assert.equal(h.run('EnemyAnimations.sample(enemies[0]).flash'),0);
h.run('Math.random=()=>0.9;enemyTurn()');h.time(14050);assert.equal(h.run('EnemyAnimations.sample(enemies[0]).x'),0);
h.run('Math.random=()=>0');
console.log('PASS selección, cobertura, reacción/ataque secuenciales, muerte prioritaria y reinicio');
// Renderer: tamaños originales, posiciones fijas, transparencia aislada, fin de muerte.
h.time(15000);h.run('stage=1;startEncounter();visualPulse=0');h.draws.length=0;h.run('battleDraw()');
const before=h.draws.filter(d=>d.src?.includes('/enemigos/'));
h.run('damageEnemy(enemies[0],10000)');h.time(15350);h.draws.length=0;h.run('battleDraw()');
const during=h.draws.filter(d=>d.src?.includes('/enemigos/'));
assert.equal(during.length,2);assert(during[0].alpha>0&&during[0].alpha<1);
assert.equal(during[1].alpha,1);assert.deepEqual(during[1].args,before[1].args);
h.time(15600);h.draws.length=0;h.run('battleDraw()');assert.equal(h.draws.filter(d=>d.src?.includes('/enemigos/')).length,1);
assert.equal(h.run('bctx.globalAlpha'),1);
console.log('PASS dibujo conserva dimensiones y anclajes; muerte desaparece sin contaminar Canvas');
// Comparación diferencial: mismas decisiones y semilla contra v0.8.
const old=harness(true), fresh=harness();
const snapshot=`JSON.stringify({enemies,combatants,stage,round,phase2,enemyBoost,activeTurn,combatFinished,usedPotion,log:$("battleLog").textContent},(key,value)=>key==="spriteKey"?undefined:value)`;
const both=code=>{old.run(code);fresh.run(code);assert.equal(fresh.run(snapshot),old.run(snapshot))};
for(let hero=0;hero<15;hero++){
 both(`battleActive=false;hero=${hero};party=[(${hero}+1)%15,(${hero}+2)%15];startBattle();combatants.forEach(p=>p.hp-=25)`);
 old.click('battleActions','✨');fresh.click('battleActions','✨');assert.equal(fresh.run(snapshot),old.run(snapshot));
}
both('stage=0;startEncounter();combatants.forEach(p=>{p.hp=p.maxhp=10000});combatants[0].hp=9900');
for(const label of ['🛡','🧪','🧪']) {
 old.click('battleActions',label);fresh.click('battleActions',label);
 assert.equal(fresh.run(snapshot),old.run(snapshot));
}
both('activeTurn=0;combatants[0].mp=0;showTurn(true)');
old.click('battleActions','✨');fresh.click('battleActions','✨');assert.equal(fresh.run(snapshot),old.run(snapshot));
both('combatants[0].guard=true;hitHero(combatants[0],11)');
for(const victim of [0,1]){
 both('stage=1;startEncounter();combatants.forEach(p=>p.hp=10000);enemyTurn()');
 both(`damageEnemy(enemies[${victim}],10000);checkPhase();enemyTurn()`);
 assert(fresh.run('phase2&&livingEnemies()[0].enraged'));
}
both('stage=2;startEncounter();combatants.forEach(p=>p.hp=10000)');
for(let i=0;i<3;i++)both('enemyTurn()');
both('combatants.forEach(p=>p.hp=1);round=2;enemyTurn()');
old.click('battleActions','🔁');fresh.click('battleActions','🔁');assert.equal(fresh.run(snapshot),old.run(snapshot));
both('stage=0;startEncounter();combatants.forEach(p=>p.hp=p.maxhp=10000)');
for(let st=0;st<3;st++){
 for(let n=0;n<100&&!fresh.run('combatFinished');n++){
  old.click('battleActions','⚔');fresh.click('battleActions','⚔');
  if(fresh.elements.get('battleActions').children.some(b=>b.textContent.startsWith('🎯'))){old.click('battleActions','🎯');fresh.click('battleActions','🎯')}
  assert.equal(fresh.run(snapshot),old.run(snapshot));
 }
 assert(fresh.run('combatFinished&&livingEnemies().length===0'));
 if(st<2){old.click('battleActions','🚪');fresh.click('battleActions','🚪')}
}
old.click('battleActions','🎁');fresh.click('battleActions','🎁');assert.equal(fresh.run(snapshot),old.run(snapshot));
assert(fresh.elements.get('battleLog').textContent.includes('Has completado'));
fresh.click('battleActions','🍺');assert.equal(fresh.run('battleActive'),false);
console.log('PASS reglas idénticas: 15 habilidades, combo, ambas fases II, tres danzas, derrota/reintento, tres encuentros y cofre (PV ampliados en simulación)');
// Interacción estática: diálogos y reclutamiento, sin movimiento.
const ui=harness();ui.elements.get('start').onclick();
assert.equal(ui.elements.get('dungeon').disabled,true);
for(const i of [1,6]){ui.run(`talk(${i})`);ui.click('actions','➕')}
assert.equal(ui.run('party.length'),2);assert.equal(ui.elements.get('dungeon').disabled,false);
ui.run('talk(1)');assert(!ui.elements.get('actions').children.some(b=>b.textContent.startsWith('➕')));ui.click('actions','Cerrar');
ui.elements.get('dungeon').onclick();assert.equal(ui.run('battleActive'),true);
console.log('PASS diálogos por selección, sin duplicados, reclutamiento y botón de mazmorra');
console.log('AVISO: esta suite no sustituye una revisión visual ni un navegador/dispositivo real.');

}
