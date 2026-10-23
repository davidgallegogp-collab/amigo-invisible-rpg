"use strict";
// Punto único de arranque: opciones, eventos y los dos bucles originales.
data.forEach((p, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = p[0] + " — " + p[1];
  $("pick").appendChild(o);
});
$("talk").onclick = talk;
$("start").onclick = () => {
  hero = Number($("pick").value);
  party = [];
  player = { x: 449, y: 552 };
  last = [{ ...player }];
  started = true;
  document.body.classList.add("started");
  $("overlay").style.display = "none";
  update();
  $("message").textContent =
    "¡Bienvenido, " + data[hero][0] + "! Habla con tus amigos y recluta a dos.";
};
document.addEventListener("keydown", (e) => {
  const m = {
    w: "up",
    ArrowUp: "up",
    s: "down",
    ArrowDown: "down",
    a: "left",
    ArrowLeft: "left",
    d: "right",
    ArrowRight: "right",
  };
  if (m[e.key]) {
    e.preventDefault();
    pressed.add(m[e.key]);
  }
  if (e.key.toLowerCase() === "e" && !e.repeat) talk();
  if (e.key === "Escape" && !battleActive) close();
});
document.addEventListener("keyup", (e) => {
  const m = {
    w: "up",
    ArrowUp: "up",
    s: "down",
    ArrowDown: "down",
    a: "left",
    ArrowLeft: "left",
    d: "right",
    ArrowRight: "right",
  };
  if (m[e.key]) pressed.delete(m[e.key]);
});
document.querySelectorAll("[data-dir]").forEach((b) => {
  const dir = b.dataset.dir;
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    pressed.add(dir);
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(ev, () => pressed.delete(dir));
});
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) * 896) / r.width,
    y = ((e.clientY - r.top) * 608) / r.height;
  const dx = x - player.x,
    dy = y - player.y;
  if (Math.hypot(dx, dy) < 95) talk();
});
window.addEventListener("blur", () => pressed.clear());
const enemyArtReady = cargarRecursos();
render();
requestAnimationFrame(visualLoop);
