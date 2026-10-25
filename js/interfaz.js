"use strict";
// Presentación derivada del estado del juego. No mantiene PV, PM ni turnos propios.
function uiNode(tag, cls, value) {
  const node = document.createElement(tag);
  node.className = cls;
  if (value !== undefined) node.textContent = value;
  return node;
}
function uiPortrait(canvas, name) {
  const art = heroArt[heroSpriteCatalog[name]?.key], g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.imageSmoothingEnabled = false;
  if (art?.complete && art.naturalWidth) {
    const scale = Math.min(canvas.width / art.naturalWidth, canvas.height / art.naturalHeight);
    const w = art.naturalWidth * scale, h = art.naturalHeight * scale;
    g.drawImage(art, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
}
function selectCharacter(index, focus = false) {
  $("pick").value = String(index);
  [...$("characterGallery").children].forEach((card, i) => {
    card.setAttribute("aria-pressed", String(i === index));
    card.tabIndex = i === index ? 0 : -1;
    if (i === index && focus) card.focus();
  });
  const p = data[index];
  $("selectionName").textContent = p[0];
  $("selectionClass").textContent = p[1];
  $("selectionSkill").textContent = p[3];
  uiPortrait($("selectionPortrait"), p[0]);
}
function initInterface() {
  data.forEach((p, i) => {
    const card = uiNode("button", "character-card");
    card.type = "button";
    card.setAttribute("aria-label", p[0] + ", " + p[1]);
    const portrait = uiNode("canvas", "card-portrait");
    portrait.width = 88; portrait.height = 104;
    portrait.setAttribute("aria-hidden", "true");
    card.appendChild(portrait);
    card.appendChild(uiNode("strong", "", p[0]));
    card.appendChild(uiNode("span", "character-class", p[1]));
    card.onclick = () => selectCharacter(i);
    card.addEventListener("keydown", e => {
      let next = i;
      if (["ArrowRight", "ArrowDown"].includes(e.key)) next = (i + 1) % data.length;
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) next = (i + data.length - 1) % data.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = data.length - 1;
      else return;
      e.preventDefault(); selectCharacter(next, true);
    });
    $("characterGallery").appendChild(card);
  });
  $("pick").addEventListener("change", () => selectCharacter(Number($("pick").value)));
  selectCharacter(Number($("pick").value));
}
function refreshSelectionArt() {
  [...$("characterGallery").children].forEach((card, i) => uiPortrait(card.children[0], data[i][0]));
  selectCharacter(Number($("pick").value));
}
function renderTeamPanel() {
  $("team").replaceChildren();
  [hero, ...party, ...Array(2 - party.length).fill(null)].forEach((id, slot) => {
    const card = uiNode("div", "team-slot" + (id === null ? " vacant" : ""));
    card.appendChild(uiNode("span", "eyebrow", slot === 0 ? "Protagonista" : "Compañero " + slot));
    card.appendChild(uiNode("strong", "", id === null ? "Espacio libre" : data[id][0]));
    card.appendChild(uiNode("small", "", id === null ? "Pulsa un aventurero" : data[id][1]));
    $("team").appendChild(card);
  });
  $("teamState").textContent = party.length === 2 ? "Equipo completo · Listo para partir" : (2 - party.length) + " compañeros por reclutar";
}
function uiMeter(label, value, max, cls) {
  const group = uiNode("div", "stat-line");
  group.appendChild(uiNode("span", "stat-value", label + " " + Math.max(0, value) + " / " + max));
  const track = uiNode("div", "meter " + cls);
  track.setAttribute("role", "meter"); track.setAttribute("aria-label", label);
  track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", String(max));
  track.setAttribute("aria-valuenow", String(Math.max(0, value)));
  const fill = uiNode("span", "meter-fill");
  fill.style.width = (max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0) + "%";
  track.appendChild(fill); group.appendChild(track); return group;
}
function renderBattleStatus() {
  $("battleStatus").replaceChildren();
  combatants.forEach((p, i) => {
    const active = i === activeTurn && !combatFinished && p.hp > 0;
    const card = uiNode("article", "hero-status" + (active ? " active" : "") + (p.hp <= 0 ? " defeated" : ""));
    card.setAttribute("aria-label", p.name);
    card.appendChild(uiNode("span", "status-turn", p.hp <= 0 ? "DERROTADO" : active ? "▶ TURNO ACTUAL" : p.guard ? "EN DEFENSA" : "EN EQUIPO"));
    card.appendChild(uiNode("strong", "hero-name", p.name));
    card.appendChild(uiNode("small", "hero-class", p.cls));
    card.appendChild(uiMeter("PV", p.hp, p.maxhp, "hp"));
    card.appendChild(uiMeter("PM", p.mp, p.maxmp, "mp"));
    $("battleStatus").appendChild(card);
  });
  $("battleRound").textContent = "Encuentro " + (stage + 1) + " / 3 · Ronda " + round + (phase2 ? " · FASE II" : "");
  $("enemySummary").textContent = enemies.map(e => e.name + ": " + Math.max(0, e.hp) + "/" + e.maxhp + " PV" + (e.hp <= 0 ? " · Derrotado" : e.enraged ? " · FASE II" : "")).join(" · ");
  $("actionHint").textContent = combatFinished ? "Resultado del encuentro" : "Acciones de " + combatants[activeTurn].name;
}
function drawEnemyStatus(g, e, x) {
  const hp = Math.max(0, e.hp), w = 104;
  pixel(g, x - w / 2, 29, w, 54, "#111c35");
  g.strokeStyle = e.enraged ? "#f4d58b" : "#b99755"; g.lineWidth = 1;
  g.strokeRect(x - w / 2 + .5, 29.5, w - 1, 53);
  g.textAlign = "center"; g.font = "bold 12px monospace";
  g.fillStyle = "#f5e8c9"; g.fillText(e.name, x, 44);
  pixel(g, x - 46, 49, 92, 8, "#080e1d");
  pixel(g, x - 45, 50, Math.round(90 * Math.min(1, hp / e.maxhp)), 6, "#d75e65");
  g.font = "10px monospace"; g.fillStyle = "#f5e8c9";
  g.fillText(hp + " / " + e.maxhp + " PV", x, 69);
  if (e.enraged || hp === 0) {
    pixel(g, x - 52, 83, 104, 16, "#111c35");
    g.fillStyle = "#f4d58b"; g.fillText(hp === 0 ? "DERROTADO" : "★ FASE II", x, 94);
  }
}
