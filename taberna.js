"use strict";
// Exploración, dibujo, colisiones y diálogos de la taberna.
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

function collides(x, y) {
  if (x < 22 || x > 874 || y < 121 || y > 575) return true;
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 3; col++) {
      let a = 154 + col * 266,
        b = 253 + row * 165;
      if (Math.abs(x - a) < 69 && Math.abs(y - b) < 47) return true;
    }
  if (x > 760 && y > 504) return true;
  return false;
}

function render() {
  furniture();
  data.forEach((p, i) => {
    if (i === hero || party.includes(i)) return;
    let [x, y] = positions[i];
    sprite(x, y, p[1], p[0]);
  });
  sprite(562, 105, "Guerrero", "Pere 🍺");
  party.forEach((idx, i) => {
    const target =
      last[Math.min(last.length - 1, Math.round((i + 1) * 13))] || player;
    sprite(target.x, target.y, data[idx][1], data[idx][0]);
  });
  sprite(player.x, player.y, data[hero][1], data[hero][0] + " (TÚ)", true);
  if (started && !modal && !battleActive) {
    let speed = 2.6,
      dx = 0,
      dy = 0;
    if (pressed.has("left")) dx--;
    if (pressed.has("right")) dx++;
    if (pressed.has("up")) dy--;
    if (pressed.has("down")) dy++;
    if (dx || dy) {
      let len = Math.hypot(dx, dy);
      dx = (dx / len) * speed;
      dy = (dy / len) * speed;
      let nx = player.x + dx,
        ny = player.y + dy;
      if (!collides(nx, player.y)) player.x = nx;
      if (!collides(player.x, ny)) player.y = ny;
      last.unshift({ ...player });
      if (last.length > 50) last.pop();
      if (player.x > 706 && player.y > 470 && party.length === 2) startBattle();
    }
  }
  requestAnimationFrame(render);
}

function nearest() {
  let list = data
    .map((p, i) => ({ i, x: positions[i][0], y: positions[i][1], name: p[0] }))
    .filter((n) => n.i !== hero && !party.includes(n.i));
  list.push({ i: -1, x: 562, y: 130, name: "Pere" });
  return list
    .map((n) => ({ ...n, d: Math.hypot(n.x - player.x, n.y - player.y) }))
    .sort((a, b) => a.d - b.d)[0];
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
}

function update() {
  $("team").textContent =
    "⚔ Equipo: " +
    data[hero][0] +
    " · " +
    party.map((i) => data[i][0]).join(" · ") +
    (party.length === 2
      ? " · ¡Listo!"
      : " · " + (2 - party.length) + " huecos libres");
}

function talk() {
  if (!started || modal) return;
  const n = nearest();
  if (!n || n.d > 76) {
    $("message").textContent =
      "Acércate a alguien para hablar (distancia corta).";
    return;
  }
  modal = true;
  $("modal").style.display = "flex";
  $("actions").replaceChildren();
  if (n.i === -1) {
    $("npcTitle").textContent = "🍺 Pere · Tabernero";
    $("npcLine").textContent =
      "«Bienvenidos a mi taberna, panchitos. ¡Hoy es mi día libre!»";
    $("npcDetail").textContent =
      party.length === 2
        ? "Ya tienes un equipo completo. Acércate a la salida de la esquina inferior derecha para combatir."
        : "Busca dos compañeros antes de partir a la mazmorra.";
    action("Cerrar", close);
    return;
  }
  const p = data[n.i];
  $("npcTitle").textContent = p[0] + " · " + p[1];
  $("npcLine").textContent = "«" + p[2] + "»";
  $("npcDetail").textContent = "Habilidad especial: " + p[3];
  if (party.length < 2)
    action("➕ Reclutar", () => {
      party.push(n.i);
      update();
      $("message").textContent = p[0] + " se une a tu equipo.";
      close();
    });
  else $("npcDetail").textContent += " · Tu equipo ya está completo.";
  action("Cerrar", close);
}
