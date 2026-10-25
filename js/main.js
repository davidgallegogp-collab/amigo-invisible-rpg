"use strict";
// Arranque e interacción de taberna. El combate conserva su bucle original.
data.forEach((p, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = p[0] + " — " + p[1];
  $("pick").appendChild(o);
});
initInterface();
$("start").onclick = () => {
  hero = Number($("pick").value);
  party = [];
  started = true;
  document.body.classList.add("started");
  $("overlay").style.display = "none";
  update();
  $("message").textContent =
    "¡Bienvenido, " + data[hero][0] + "! Pulsa sobre dos aventureros para reclutarlos.";
};
$("dungeon").onclick = () => {
  if (!started || modal || battleActive || party.length !== 2) return;
  hoveredNpc = null;
  render();
  startBattle();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !battleActive) close();
});
canvas.addEventListener("click", (e) => {
  if (!started || modal || battleActive) return;
  const { x, y } = canvasPoint(e), i = npcAt(x, y);
  if (i !== null) talk(i);
});
canvas.addEventListener("pointermove", (e) => {
  if (!started || modal || battleActive || e.pointerType === "touch") return;
  const { x, y } = canvasPoint(e), i = npcAt(x, y);
  canvas.style.cursor = i === null ? "default" : "pointer";
  if (i !== hoveredNpc) { hoveredNpc = i; render(); }
});
canvas.addEventListener("pointerleave", () => {
  canvas.style.cursor = "default";
  if (!modal && hoveredNpc !== null) { hoveredNpc = null; render(); }
});
const enemyArtReady = cargarRecursos();
enemyArtReady.then(() => { render(); refreshSelectionArt(); });
render();
requestAnimationFrame(visualLoop);
