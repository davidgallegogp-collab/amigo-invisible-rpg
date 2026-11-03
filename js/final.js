"use strict";
// Configuración pública: cambiar solo esta URL para sustituir el formulario.
const REGISTRO_PERE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfb3NrSLeJ76OhQAHorPJQi0pUwkEg8DkeXdNSZNyceNW59qg/viewform?usp=sharing&ouid=104747675665075751133";
const FinalScene = (() => {
  let dialog, opening = false;
  const q = id => dialog.querySelector('#' + id);
  function reveal() {
    if (!opening || !dialog.open) return;
    opening = false;
    q('destinyChest').className = 'destiny-chest opened';
    q('destinyChest').hidden = true;
    q('destinySkip').hidden = true;
    q('destinyOpen').hidden = true;
    q('destinyStatus').hidden = true;
    q('destinyTitle').textContent = '¡HAS ENCONTRADO EL REGISTRO SECRETO DE PERE!';
    q('destinyResult').hidden = false;
    q('destinyForm').hidden = false;
    q('destinyTitle').focus();
  }
  function open() {
    if (opening) return;
    opening = true;
    q('destinyOpen').disabled = true;
    q('destinyStatus').textContent = 'El cofre del destino se abre…';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    q('destinySkip').hidden = reduced;
    q('destinyChest').className = reduced ? 'destiny-chest opened' : 'destiny-chest opening';
    if (reduced) reveal();
  }
  function show(victory = false) {
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'destinyDialog';
      dialog.setAttribute('aria-labelledby', 'destinyTitle');
      dialog.innerHTML = `<div class="destiny-window">
        <p id="destinyEyebrow" class="eyebrow">EPÍLOGO / LA RECOMPENSA</p>
        <h2 id="destinyTitle" tabindex="-1">EL COFRE DEL DESTINO</h2>
        <div id="destinyChest" class="destiny-chest" aria-hidden="true"><div class="chest-rays"></div><div class="chest-lid"></div><div class="chest-body"></div><div class="chest-lock"></div><span class="chest-spark">✦</span></div>
        <div id="destinyResult" hidden>
          <p>¡Enhorabuena, aventurero! Has sobrevivido a Mirucha, a los guardianes y hasta a Quico.</p>
          <p>Ahora solo queda una última misión: dejar tu nombre y correo electrónico para participar en el amigo invisible.</p>
          <p>Pere se encargará de que el destino haga el resto.</p>
        </div>
        <p id="destinyStatus" role="status"></p>
        <div class="destiny-actions"><button id="destinyOpen">🎁 Abrir cofre</button><button id="destinySkip" hidden>Omitir animación</button><a id="destinyForm" target="_blank" rel="noopener noreferrer" hidden>✉ DEJAR MI CORREO</a><button id="destinyBack">🍺 Volver a la taberna</button></div>
      </div>`;
      document.body.appendChild(dialog);
      q('destinyForm').href = REGISTRO_PERE_URL;
      q('destinyOpen').addEventListener('click', open);
      q('destinySkip').addEventListener('click', reveal);
      q('destinyChest').addEventListener('animationend', e => { if (e.animationName === 'destiny-lid') reveal(); });
      q('destinyBack').addEventListener('click', () => { dialog.close(); leaveDungeon(); });
      dialog.addEventListener('close', () => { opening = false; q('destinyChest').className = 'destiny-chest'; });
      // Escape conserva el cierre nativo del diálogo y el acceso al cofre del combate.
    }
    if (dialog.open) return;
    opening = false;
    q('destinyTitle').textContent = 'EL COFRE DEL DESTINO';
    q('destinyChest').hidden = false; q('destinyChest').className = 'destiny-chest';
    q('destinyResult').hidden = true; q('destinyForm').hidden = true; q('destinySkip').hidden = true;
    q('destinyOpen').hidden = false; q('destinyOpen').disabled = false;
    q('destinyStatus').hidden = false;
    q('destinyStatus').textContent = victory
      ? 'Contra todo pronóstico, habéis derrotado a Quico y sus secuaces. Entre los restos del combate aparece un misterioso cofre…'
      : 'Pere ha guardado una última misión en este cofre.';
    q('destinyEyebrow').textContent = victory ? '¡MISIÓN COMPLETADA!' : 'EPÍLOGO / LA RECOMPENSA';
    dialog.showModal(); q('destinyOpen').focus();
  }
  return Object.freeze({ show });
})();
