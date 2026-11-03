"use strict";
const FinalScene = (() => {
  let dialog, controller, generation = 0, animationDone = false, outcome;
  const q = id => dialog.querySelector('#' + id);
  function showResult() {
    if (!animationDone || !outcome) return;
    q('destinySkip').hidden = true;
    q('destinyChest').hidden = true;
    q('destinyOpen').disabled = false;
    q('destinyOpen').textContent = 'Consultar de nuevo';
    if (outcome.error) {
      q('destinyStatus').textContent = outcome.error;
      q('destinyOpen').textContent = 'Reintentar consulta';
      return;
    }
    q('destinyTitle').textContent = 'TU AMIGO INVISIBLE ES…';
    q('destinyName').textContent = outcome.name;
    q('destinyResult').hidden = false;
    q('destinyStatus').textContent = 'Los dioses del RNG han hablado. No se admiten devoluciones, lloros ni reclamaciones al tabernero.';
    const entry = Object.values(heroSpriteCatalog).find(e => e.key === outcome.spriteKey);
    const img = entry && heroArt[entry.key], canvas = q('destinyPortrait');
    canvas.hidden = !(img && img.complete && img.naturalWidth);
    q('destinyNoPortrait').hidden = !canvas.hidden;
    if (!canvas.hidden) {
      const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height);
      g.imageSmoothingEnabled = false;
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      g.drawImage(img, Math.round((canvas.width-w)/2), Math.round((canvas.height-h)/2), Math.round(w), Math.round(h));
      canvas.setAttribute('aria-label', 'Retrato de ' + outcome.name);
    }
    q('destinyName').focus();
  }
  function skip() {
    animationDone = true;
    q('destinyChest').classList.remove('opening');
    q('destinyChest').classList.add('opened');
    q('destinySkip').hidden = true;
    showResult();
  }
  async function open() {
    controller?.abort(); controller = new AbortController();
    const attempt = ++generation;
    outcome = null; animationDone = matchMedia('(prefers-reduced-motion: reduce)').matches;
    q('destinyTitle').textContent = 'EL COFRE DEL DESTINO';
    q('destinyName').textContent = ''; q('destinyResult').hidden = true;
    q('destinyPortrait').getContext('2d').clearRect(0,0,240,280);
    q('destinyStatus').textContent = 'Consultando tu invitación…';
    q('destinyOpen').disabled = true; q('destinySkip').hidden = animationDone;
    q('destinyChest').hidden = false;
    q('destinyChest').className = animationDone ? 'destiny-chest opened' : 'destiny-chest opening';
    try { const result = await Sorteo.consult(controller.signal); if (attempt === generation) outcome = result; }
    catch (error) { if (attempt === generation) outcome = {error:error.message}; }
    if (attempt === generation && dialog.open) showResult();
  }
  function cleanup() {
    generation++; controller?.abort(); outcome = null;
    q('destinyName').textContent = '';
    q('destinyPortrait').getContext('2d').clearRect(0,0,240,280);
  }
  function show(victory = false) {
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'destinyDialog';
      dialog.setAttribute('aria-labelledby', 'destinyTitle');
      dialog.innerHTML = `<div class="destiny-window">
        <p id="destinyEyebrow" class="eyebrow">EPÍLOGO / LA RECOMPENSA</p>
        <h2 id="destinyTitle">EL COFRE DEL DESTINO</h2>
        <div id="destinyChest" class="destiny-chest" aria-hidden="true"><div class="chest-rays"></div><div class="chest-lid"></div><div class="chest-body"></div><div class="chest-lock"></div><span class="chest-spark">✦</span></div>
        <div id="destinyResult" hidden><h3 id="destinyName" tabindex="-1"></h3><canvas id="destinyPortrait" width="240" height="280" role="img"></canvas><p id="destinyNoPortrait" hidden>✦ Un destino único, sin retrato asignado ✦</p></div>
        <p id="destinyStatus" role="status">Tu enlace personal guarda el destino, elijas al héroe que elijas.</p>
        <div class="destiny-actions"><button id="destinyOpen">🎁 Abrir cofre</button><button id="destinySkip" hidden>Omitir animación</button><button id="destinyBack">🍺 Volver a la taberna</button></div>
      </div>`;
      document.body.appendChild(dialog);
      q('destinyOpen').addEventListener('click', open);
      q('destinySkip').addEventListener('click', skip);
      q('destinyChest').addEventListener('animationend', e => { if(e.animationName === 'destiny-lid') skip(); });
      q('destinyBack').addEventListener('click', () => { dialog.close(); leaveDungeon(); });
      dialog.addEventListener('close', cleanup);
      // Escape cierra la escena y deja accesible el botón del cofre en el combate.
    }
    if (dialog.open) return;
    q('destinyTitle').textContent = 'EL COFRE DEL DESTINO';
    q('destinyChest').hidden = false; q('destinyChest').className = 'destiny-chest';
    q('destinyResult').hidden = true; q('destinySkip').hidden = true;
    q('destinyOpen').disabled = false; q('destinyOpen').textContent = '🎁 Abrir cofre';
    q('destinyStatus').textContent = 'Tu enlace personal guarda el destino, elijas al héroe que elijas.';
    q('destinyEyebrow').textContent = victory ? '¡MISIÓN COMPLETADA!' : 'EPÍLOGO / LA RECOMPENSA';
    if (victory) q('destinyStatus').textContent = 'Contra todo pronóstico, habéis derrotado a Quico y sus secuaces. Entre los restos del combate aparece un misterioso cofre…';
    dialog.showModal(); q('destinyOpen').focus();
  }
  return Object.freeze({ show });
})();

window.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("consultInvitation");
  if (new URLSearchParams(location.hash.slice(1)).has("invitacion")) button.hidden = false;
  button.addEventListener("click", () => FinalScene.show());
});
