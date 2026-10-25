"use strict";
// Taberna estática: dibujo a demanda e interacción directa por personaje.
function block(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function text(s, x, y, color = "#fff0d2", size = 12) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(s, x, y);
}

function furniture() {
  const bg = tavernArt.tavern_bg;
  if (bg && bg.complete && bg.naturalWidth) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    return;
  }
  // Escenario anterior como reserva si falla la imagen nueva.
  block(0, 0, 896, 608, "#51372d");
  for (let y = 12; y < 608; y += 24) {
    block(0, y, 896, 2, "#654735");
    for (let x = (y % 48) * 3; x < 896; x += 115)
      block(x, y + 4, 2, 18, "#463127");
  }
  block(0, 0, 896, 110, "#282630");
  block(15, 17, 505, 73, "#765034");
  block(20, 22, 495, 56, "#b3834d");
  for (let x = 35; x < 510; x += 60) block(x, 65, 45, 6, "#6d452d");
  text("LA BARRA DE PERE", 255, 51, "#3b2723", 19);
  block(718, 10, 156, 86, "#40343a");
  block(729, 22, 135, 62, "#8a5140");
  block(758, 35, 78, 44, "#ef993b");
  block(773, 48, 48, 31, "#ffd273");
  text("CHIMENEA", 796, 104, "#e7bd82");
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 3; col++) {
      let x = 154 + col * 266,
        y = 253 + row * 165;
      block(x - 54, y - 29, 108, 58, "#382a2d");
      block(x - 49, y - 24, 98, 48, "#95623e");
      block(x - 44, y - 19, 88, 38, "#b7834b");
      block(x - 36, y - 31, 26, 8, "#61504a");
      block(x + 14, y + 23, 26, 8, "#61504a");
      block(x - 7, y - 7, 14, 14, "#dbbd77");
    }
  block(770, 515, 110, 74, "#42352d");
  block(782, 523, 87, 54, "#6e5842");
  text("⚔", 825, 549, "#f5cf77", 20);
  text("MAZMORRA", 825, 568, "#f6ddaa", 11);
  block(418, 593, 65, 15, "#2c2627");
  text("ENTRADA", 449, 590, "#fff1bc", 11);
}

function sprite(x, y, cls, name, main = false) {
  const c = colors[cls] || "#ab7854";
  block(x - 10, y - 23, 20, 17, "#e7b892");
  block(x - 11, y - 27, 22, 7, main ? "#f4d26a" : "#453038");
  block(x - 12, y - 6, 24, 22, c);
  block(x - 9, y + 15, 8, 9, "#292432");
  block(x + 2, y + 15, 8, 9, "#292432");
  block(x - 6, y - 16, 3, 3, "#292432");
  block(x + 4, y - 16, 3, 3, "#292432");
  text(name, x, y - 33, main ? "#ffe070" : "#f8edcf", 11);
}

let hoveredNpc = null;
const pereSpot = { x: 448, y: 150 };
function npcBounds(i) {
  const [x, y] = i === -1 ? [pereSpot.x, pereSpot.y] : positions[i];
  return { x: x - 54, y: y - 80, w: 108, h: 104 };
}
function npcAt(x, y) {
  for (const i of [-1, ...data.map((_, i) => i)]) {
    const b = npcBounds(i);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return i;
  }
  return null;
}
function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  // El borde CSS no pertenece a los píxeles del Canvas.
  return {
    x: (event.clientX - r.left - canvas.clientLeft) * canvas.width / (r.width - 2 * canvas.clientLeft),
    y: (event.clientY - r.top - canvas.clientTop) * canvas.height / (r.height - 2 * canvas.clientTop),
  };
}
function render() {
  furniture();
  data.forEach((p, i) => {
    const [x, y] = positions[i], b = npcBounds(i);
    const member = i === hero || party.includes(i);
    if (hoveredNpc === i || member) {
      ctx.strokeStyle = i === hero ? "#ffe070" : member ? "#95dfa1" : "#f4d9ac";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    }
    const img = heroArt[heroSpriteCatalog[p[0]]?.key];
    if (img && img.complete && img.naturalWidth) {
      const w = 64, h = w * img.naturalHeight / img.naturalWidth;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x - w / 2, y - h, w, h);
    } else sprite(x, y - 24, p[1], ""); // Reserva ya existente, solo ante un fallo.
    text(p[0], x, y + 13, "#fff1d7", 14);
    if (member) text(i === hero ? "★ TÚ" : "✓ EQUIPO", x, y + 27, i === hero ? "#ffe070" : "#95dfa1", 11);
  });
  if (hoveredNpc === -1) {
    const b = npcBounds(-1);
    ctx.strokeStyle = "#f4d9ac"; ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
  }
  const pere = tavernArt.pere;
  if (pere && pere.complete && pere.naturalWidth) {
    const h = 100, w = h * pere.naturalWidth / pere.naturalHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pere, pereSpot.x - w / 2, pereSpot.y - h, w, h);
    text("Pere 🍺", pereSpot.x, pereSpot.y + 13, "#fff1d7", 14);
  } else sprite(pereSpot.x, pereSpot.y - 24, "Guerrero", "Pere 🍺");
}

function action(label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = fn;
  $("actions").appendChild(b);
}

function close() {
  modal = false;
  $("modal").style.display = "none";
  hoveredNpc = null;
  render();
}

function update() {
  renderTeamPanel();
  $("dungeon").disabled = !started || party.length !== 2;
  render();
}

function showPortrait(i) {
  const portrait = $("npcPortrait"), g = portrait.getContext("2d");
  const name = i === -1 ? "Pere" : data[i][0];
  const img = i === -1 ? tavernArt.pere : heroArt[heroSpriteCatalog[name]?.key];
  portrait.setAttribute("aria-label", "Retrato de " + name);
  g.clearRect(0, 0, portrait.width, portrait.height);
  g.imageSmoothingEnabled = false;
  if (img && img.complete && img.naturalWidth) {
    const scale = Math.min(portrait.width / img.naturalWidth, portrait.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    g.drawImage(img, (portrait.width - w) / 2, (portrait.height - h) / 2, w, h);
  } else {
    g.fillStyle = "#f6e4bd"; g.font = "14px monospace"; g.textAlign = "center";
    g.fillText("Imagen no disponible", portrait.width / 2, portrait.height / 2);
  }
}

function talk(i) {
  if (!started || modal || battleActive || !Number.isInteger(i) || i < -1 || i >= data.length) return;
  hoveredNpc = i;
  render();
  modal = true;
  $("modal").style.display = "flex";
  $("actions").replaceChildren();
  showPortrait(i);
  if (i === -1) {
    $("npcTitle").textContent = "🍺 Pere · Tabernero";
    $("npcLine").textContent =
      "«Bienvenidos a mi taberna, panchitos. ¡Hoy es mi día libre!»";
    $("npcDetail").textContent =
      party.length === 2
        ? "Ya tienes un equipo completo. Pulsa «⚔ Entrar en la mazmorra» para combatir."
        : "Pulsa sobre dos aventureros para reclutarlos antes de partir a la mazmorra.";
    action("Cerrar", close);
    return;
  }
  const p = data[i];
  $("npcTitle").textContent = p[0] + " · " + p[1];
  $("npcLine").textContent = "«" + p[2] + "»";
  $("npcDetail").textContent = "Habilidad especial: " + p[3];
  if (i !== hero && !party.includes(i) && party.length < 2)
    action("➕ Reclutar", () => {
      if (!started || battleActive || i === hero || party.includes(i) || party.length >= 2) return;
      party.push(i);
      update();
      $("message").textContent = p[0] + " se une a tu equipo.";
      close();
    });
  else $("npcDetail").textContent += i === hero ? " · Este es tu protagonista."
    : party.includes(i) ? " · Ya forma parte del equipo." : " · Tu equipo ya está completo.";
  action("Cerrar", close);
}
