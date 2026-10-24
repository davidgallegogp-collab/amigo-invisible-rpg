"use strict";
// Dibujo, turnos y reglas originales del combate; no inicia bucles ni registra eventos.
function battleButton(label, callback) {
  const el = document.createElement("button");
  el.textContent = label;
  el.onclick = callback;
  $("battleActions").appendChild(el);
}
function battleLog(line) {
  $("battleLog").textContent = line;
  visualPulse = 12;
}
function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

function pixel(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}
function battleBackdrop(g) {
  const t = visualFrame,
    st = stage;
  const sky = st === 0 ? "#202342" : st === 1 ? "#171e34" : "#26172b";
  pixel(g, 0, 0, 768, 355, sky);
  if (st === 0) {
    // Plaza madrileña: edificios, ventanas y farolas
    pixel(g, 0, 94, 768, 165, "#403752");
    for (let i = 0; i < 9; i++) {
      let x = i * 92 - 12,
        h = 76 + ((i * 37) % 57);
      pixel(g, x, 150 - h, 84, h + 107, i % 2 ? "#66566d" : "#554b66");
      pixel(g, x + 6, 150 - h, 72, 8, "#a08384");
      for (let yy = 164 - h; yy < 224; yy += 28)
        for (let xx = x + 13; xx < x + 76; xx += 24)
          pixel(g, xx, yy, 12, 16, (i + yy) % 3 ? "#a78a7b" : "#e8c685");
    }
    pixel(g, 0, 257, 768, 98, "#6a5765");
    for (let x = 0; x < 768; x += 57) pixel(g, x, 279, 46, 3, "#8a7480");
    for (let x = 35; x < 768; x += 180) {
      pixel(g, x, 115, 5, 140, "#222639");
      pixel(g, x - 8, 109, 21, 9, "#e5c57e");
      pixel(g, x - 12, 102, 29, 5, "#f6db99");
    }
    g.fillStyle = "#e9d9a3";
    g.font = "bold 11px monospace";
    g.textAlign = "center";
    g.fillText("AGUA DE MADRIZ", 380, 122);
  } else if (st === 1) {
    // Catedral gótica: arcos y vidrieras
    pixel(g, 0, 61, 768, 196, "#30344b");
    for (let i = 0; i < 7; i++) {
      let x = i * 122 - 10;
      pixel(g, x, 50, 17, 208, "#515169");
      pixel(g, x + 93, 50, 17, 208, "#515169");
      pixel(g, x + 18, 77, 74, 134, "#232b48");
      pixel(g, x + 29, 87, 52, 105, i % 2 ? "#4a6681" : "#77577b");
      pixel(g, x + 51, 90, 8, 99, "#e0ac6d");
      pixel(g, x + 27, 138, 58, 8, "#e0ac6d");
      pixel(g, x + 18, 66, 74, 11, "#777088");
    }
    pixel(g, 0, 257, 768, 98, "#555465");
    for (let x = 0; x < 768; x += 70) pixel(g, x, 283, 63, 4, "#757285");
    pixel(g, 345, 33, 78, 24, "#3c3147");
    g.fillStyle = "#d8bd7f";
    g.font = "bold 13px monospace";
    g.fillText("MERKAFONT", 384, 50);
  } else {
    // Sala del baile orco, antorchas y tapices
    pixel(g, 0, 65, 768, 194, "#4a303c");
    for (let x = 0; x < 768; x += 110) {
      pixel(g, x, 63, 18, 192, "#68414a");
      pixel(g, x + 20, 82, 73, 122, "#442b3a");
      pixel(g, x + 29, 93, 55, 82, "#713b48");
      pixel(g, x + 46, 102, 21, 56, "#bb8c56");
    }
    for (let x of [56, 704]) {
      pixel(g, x, 153, 9, 95, "#292331");
      pixel(g, x - 10, 143, 29, 17, "#a76c3c");
      let sway = Math.sin(t * 0.1 + x) * 3;
      pixel(g, x - 6 + sway, 123, 22, 24, "#e48b39");
      pixel(g, x + sway, 115, 10, 13, "#ffd26c");
    }
    pixel(g, 0, 257, 768, 98, "#634447");
    for (let x = 0; x < 768; x += 58) pixel(g, x, 277, 49, 3, "#80555a");
    pixel(g, 358, 38, 52, 26, "#b88d46");
    pixel(g, 370, 23, 28, 19, "#e0ba67");
  }
  // Delimitación de arena y partículas flotantes
  pixel(g, 0, 254, 768, 4, "#a18b79");
  for (let i = 0; i < 13; i++) {
    const x = (i * 137 + t * ((i % 3) + 1) * 0.35) % 768,
      y = 90 + ((i * 43) % 145) + Math.sin(t * 0.035 + i) * 9;
    pixel(
      g,
      x,
      y,
      3,
      3,
      st === 1 ? "#a6c3dc" : st === 0 ? "#d9bfaa" : "#f0a960",
    );
  }
}
function battleHero(g, p, i) {
  const x = 489 + i * 96,
    y = 205 + (i % 2) * 19,
    bob = p.hp > 0 ? Math.round(Math.sin(visualFrame * 0.065 + i) * 2) : 0;
  g.save();
  g.translate(x, y + bob);
  if (p.hp <= 0) g.globalAlpha = 0.45;
  pixel(g, -16, 16, 12, 21, "#2a2839");
  pixel(g, 4, 16, 12, 21, "#2a2839");
  pixel(g, -23, -16, 46, 39, p.hp > 0 ? colors[p.cls] : "#58515e");
  pixel(g, -26, -14, 8, 27, "#d0a17e");
  pixel(g, 18, -14, 8, 27, "#d0a17e");
  pixel(g, -16, -47, 32, 31, "#e3ad88");
  pixel(g, -19, -53, 38, 10, p.cls === "Clérigo" ? "#f0e3c7" : "#3a293a");
  pixel(g, -10, -35, 4, 4, "#282533");
  pixel(g, 7, -35, 4, 4, "#282533");
  if (p.cls === "Mago") {
    pixel(g, 22, -25, 4, 65, "#b49d71");
    pixel(g, 19, -36, 10, 13, "#b99bea");
  }
  if (p.cls === "Arquero") {
    pixel(g, 20, -14, 5, 40, "#ac7b48");
    pixel(g, 25, -21, 3, 53, "#dfc4a0");
  }
  if (p.cls === "Guerrero" || p.cls === "Bárbaro") {
    pixel(g, 20, -18, 7, 44, "#a8b3c0");
    pixel(g, 16, -20, 16, 7, "#d3dbe1");
  }
  if (p.cls === "Clérigo") {
    pixel(g, 20, -20, 5, 46, "#d9b97e");
    pixel(g, 17, -29, 12, 12, "#f1e6a9");
  }
  g.restore();
  g.textAlign = "center";
  g.font = "bold 12px monospace";
  g.fillStyle = "#fff1cf";
  g.fillText(p.name, x, y - 62);
  if (i === activeTurn && !combatFinished) {
    g.fillStyle = "#ffe17e";
    g.fillText("▼", x, y - 79);
  }
}
function battleDraw(now = performance.now()) {
  if (!battleActive) return;
  const g = bctx;
  visualFrame++;
  battleBackdrop(g);
  const slots = enemies,
    pos =
      slots.length === 1
        ? [180]
        : slots.length === 2
          ? [114, 269]
          : [85, 230, 355];
  slots.forEach((e, i) => {
    const animation = EnemyAnimations.sample(e, now);
    if (!animation.visible) return;
    const x = pos[i],
      y = e.kind === "boss" ? 247 : 244;
    g.save();
    g.translate(animation.x, animation.y);
    g.globalAlpha = animation.alpha;
    enemySprite(g, e, x, y, animation.flash);
    g.restore();
    if (e.hp <= 0) return;
    g.font = "bold 12px monospace";
    g.textAlign = "center";
    g.fillStyle = "#fff0d0";
    g.fillText(e.name, x, 49);
    pixel(g, x - 48, 56, 96, 12, "#211c2d");
    pixel(
      g,
      x - 46,
      58,
      (92 * e.hp) / e.maxhp,
      8,
      e.enraged ? "#ffc06a" : "#e77d8e",
    );
    if (e.enraged) {
      g.fillStyle = "#ffda6c";
      g.fillText("★ FASE II", x, 83);
    }
  });
  combatants.forEach((p, i) => battleHero(g, p, i));
  if (visualPulse > 0) {
    g.fillStyle = `rgba(255,220,147,${visualPulse / 42})`;
    g.fillRect(0, 0, 768, 355);
    visualPulse = Math.max(0, visualPulse - 1.3);
  }
}
function visualLoop(now) {
  if (battleActive) battleDraw(now);
  requestAnimationFrame(visualLoop);
}

function battleStatus() {
  $("battleStatus").textContent =
    combatants
      .map(
        (p, i) =>
          (i === activeTurn && !combatFinished ? "▶ " : "  ") +
          p.name +
          ": " +
          Math.max(0, p.hp) +
          "/" +
          p.maxhp +
          " PV · " +
          p.mp +
          "/" +
          p.maxmp +
          " PM" +
          (p.hp <= 0 ? " ☠" : ""),
      )
      .join("\n") +
    "\n" +
    enemies
      .map((e) => e.name + ": " + Math.max(0, e.hp) + "/" + e.maxhp + " PV")
      .join(" · ") +
    " · Ronda " +
    round;
  battleDraw();
}
function nextLiving(start) {
  for (let k = 0; k < combatants.length; k++) {
    const n = (start + k) % combatants.length;
    if (combatants[n].hp > 0) return n;
  }
  return -1;
}
function startBattle() {
  if (battleActive || party.length !== 2) return;
  pressed.clear();
  battleActive = true;
  stage = 0;
  combatants = [hero, ...party].map((i) => {
    const cls = data[i][1],
      maxhp =
        cls === "Bárbaro"
          ? 78
          : cls === "Guerrero"
            ? 72
            : cls === "Clérigo"
              ? 62
              : 66;
    return {
      name: data[i][0],
      cls,
      special: data[i][3],
      hp: maxhp,
      maxhp,
      mp: 32,
      maxmp: 32,
      guard: false,
    };
  });
  usedPotion = false;
  startEncounter();
}
function startEncounter() {
  EnemyAnimations.reset();
  combatFinished = false;
  round = 1;
  activeTurn = 0;
  phase2 = false;
  enemyBoost = 0;
  enemies = encounters[stage].foes.map((e) => ({ ...e }));
  $("battle").style.display = "block";
  $("battleCard").querySelector("h2").textContent =
    "⚔ " + encounters[stage].title;
  battleLog(encounters[stage].intro);
  showTurn(true);
}
function finishBattle(won) {
  combatFinished = true;
  $("battleActions").replaceChildren();
  battleStatus();
  if (!won) {
    battleLog("💀 El grupo ha caído ante " + encounters[stage].title + ".");
    battleButton("🔁 Reintentar encuentro", () => {
      combatants.forEach((p) => {
        p.hp = p.maxhp;
        p.mp = p.maxmp;
        p.guard = false;
      });
      usedPotion = false;
      startEncounter();
    });
    battleButton("🍺 Volver a la taberna", leaveDungeon);
    return;
  }
  if (stage < 2) {
    battleLog(
      "🎉 ¡Victoria! " +
        (stage === 0
          ? "Mirucha se marcha murmurando: «En Madrid esto no pasa»."
          : "Los Guardianes del Cumpleaños han caído.") +
        " El grupo recupera fuerzas.",
    );
    battleButton("🚪 Siguiente encuentro", () => {
      stage++;
      combatants.forEach((p) => {
        p.hp = Math.min(p.maxhp, p.hp + 32);
        p.mp = Math.min(p.maxmp, p.mp + 14);
        p.guard = false;
      });
      usedPotion = false;
      startEncounter();
    });
  } else {
    battleLog(
      "🏆 ¡Quico, Avionatin y Abel han sido derrotados! Un cofre mágico aparece...",
    );
    battleButton("🎁 Abrir cofre", () => {
      battleLog(
        "✨ ¡Has completado la aventura! El amigo invisible se revelará aquí cuando conectemos el sorteo privado.",
      );
      $("battleActions").replaceChildren();
      battleButton("🍺 Volver a la taberna", leaveDungeon);
    });
  }
}
function leaveDungeon() {
  EnemyAnimations.reset();
  battleActive = false;
  $("battle").style.display = "none";
  player = { x: 680, y: 545 };
  last = [{ ...player }];
  $("message").textContent =
    "¡Gran aventura! Puedes volver a entrar en la mazmorra.";
}
function livingEnemies() {
  return enemies.filter((e) => e.hp > 0);
}
function pickEnemy(cb) {
  const a = livingEnemies();
  if (a.length === 1) {
    cb(a[0]);
    return;
  }
  $("battleActions").replaceChildren();
  battleLog("Selecciona el objetivo:");
  a.forEach((e) =>
    battleButton("🎯 " + e.name + " (" + e.hp + " PV)", () => cb(e)),
  );
  battleButton("↩ Atrás", () => showTurn(true));
}
function checkPhase() {
  if (stage !== 1 || phase2 || livingEnemies().length !== 1) return "";
  phase2 = true;
  const e = livingEnemies()[0];
  e.enraged = true;
  e.atk += 7;
  e.maxhp += 35;
  e.hp += 35;
  return e.name === "Nacho"
    ? " ¡Nacho absorbe la fuerza de Arturo! ¡Lanza eléctrica desatada!"
    : " ¡Arturo absorbe la velocidad de Nacho! ¡Martillo frenético!";
}
function damageEnemy(e, d) {
  const previousHp = e.hp;
  e.hp = Math.max(0, e.hp - d);
  if (e.hp < previousHp) EnemyAnimations.play(e, e.hp === 0 ? "death" : "hurt");
  return checkPhase();
}
function actionDone(message) {
  battleLog(message);
  battleStatus();
  if (!livingEnemies().length) {
    finishBattle(true);
    return;
  }
  const next = nextLiving(activeTurn + 1);
  if (next <= activeTurn) {
    enemyTurn();
    return;
  }
  activeTurn = next;
  showTurn(true);
}
function hitHero(target, dmg) {
  const real = target.guard ? Math.ceil(dmg / 2) : dmg;
  target.hp = Math.max(0, target.hp - real);
  return real;
}
function enemyTurn() {
  const lines = [];
  const living = () => combatants.filter((p) => p.hp > 0);
  const pick = () => {
    const a = living();
    return a[Math.floor(Math.random() * a.length)];
  };
  for (const e of livingEnemies()) {
    if (!living().length) break;
    if (stage === 0) {
      EnemyAnimations.play(e, "attack");
      const phrases = [
        "«¡El agua de Madriz está buenísima!»",
        "«¡Esto en Madrid no pasa!»",
        "«¡En Madrid tenemos de todo!»",
        "«¿Os he dicho que soy de Madrid?»",
      ];
      const victim = pick(),
        d = hitHero(victim, e.atk + Math.floor(Math.random() * 6));
      lines.push(
        "Mirucha: " +
          phrases[Math.floor(Math.random() * phrases.length)] +
          " " +
          victim.name +
          " recibe " +
          d +
          " de daño mágico.",
      );
    } else if (stage === 1) {
      const duo = livingEnemies().length === 2;
      if (duo && e.name === "Arturo" && Math.random() < 0.6) {
        EnemyAnimations.play(e, "attack");
        EnemyAnimations.play(enemies.find((ally) => ally.name === "Nacho"), "attack");
        const victim = pick(),
          d = hitHero(victim, 22 + Math.floor(Math.random() * 6));
        lines.push(
          "¡COMBO: Felicidades de Merkafont! Nacho inmoviliza y Arturo golpea a " +
            victim.name +
            " (" +
            d +
            " daño).",
        );
      } else if (e.name === "Nacho" && duo) {
        lines.push("Nacho cubre a Arturo con su lanza.");
      } else {
        EnemyAnimations.play(e, "attack");
        const victim = pick(),
          d = hitHero(victim, e.atk + Math.floor(Math.random() * 5));
        lines.push(
          e.name +
            (e.enraged ? " [FASE II]" : "") +
            " golpea a " +
            victim.name +
            " (" +
            d +
            ").",
        );
      }
    } else if (e.name === "Quico") {
      EnemyAnimations.play(e, "attack");
      const move = round % 3;
      if (move === 1) {
        enemyBoost = 2;
        lines.push(
          "💃 ¡DANZA DE GUERRA! Quico aumenta el ataque de Avionatin y Abel.",
        );
      } else if (move === 2) {
        living().forEach((p) => hitHero(p, 7 + Math.floor(Math.random() * 4)));
        lines.push(
          "🕺 ¡DANZA DEL TERREMOTO! Todos los héroes reciben daño mágico.",
        );
      } else {
        const victim = pick(),
          d = hitHero(victim, 12);
        lines.push(
          "Quico hace un PASO PROHIBIDO sobre " + victim.name + " (" + d + ").",
        );
      }
    } else {
      EnemyAnimations.play(e, "attack");
      const victim = pick(),
        d = hitHero(
          victim,
          e.atk + (enemyBoost > 0 ? 6 : 0) + Math.floor(Math.random() * 4),
        );
      lines.push(e.name + " ataca a " + victim.name + " (" + d + ").");
    }
  }
  if (enemyBoost > 0) enemyBoost--;
  combatants.forEach((p) => (p.guard = false));
  round++;
  if (!living().length) {
    battleLog(lines.join(" "));
    finishBattle(false);
    return;
  }
  activeTurn = nextLiving(0);
  showTurn(true);
  battleLog(lines.join(" "));
}
function showTurn(keepLog = false) {
  if (combatFinished) return;
  activeTurn = nextLiving(activeTurn);
  if (activeTurn < 0) {
    finishBattle(false);
    return;
  }
  battleStatus();
  $("battleActions").replaceChildren();
  const p = combatants[activeTurn];
  if (!keepLog) battleLog("Turno de " + p.name + ".");
  battleButton("⚔ Atacar", () =>
    pickEnemy((e) => {
      const dmg =
        11 + Math.floor(Math.random() * 9) + (p.cls === "Bárbaro" ? 5 : 0);
      const extra = damageEnemy(e, dmg);
      actionDone(
        p.name + " ataca a " + e.name + " (" + dmg + " daño)." + extra,
      );
    }),
  );
  battleButton("✨ " + p.special + " (8 PM)", () => {
    if (p.mp < 8) {
      battleLog("No tienes suficiente maná.");
      return;
    }
    if (p.cls === "Clérigo") {
      p.mp -= 8;
      combatants.forEach((a) => {
        if (a.hp > 0) a.hp = Math.min(a.maxhp, a.hp + 24);
      });
      actionDone(p.name + " usa «" + p.special + "» y cura 24 PV al grupo.");
    } else
      pickEnemy((e) => {
        p.mp -= 8;
        const dmg =
          (p.cls === "Mago" ? 30 : 26) + Math.floor(Math.random() * 9);
        const extra = damageEnemy(e, dmg);
        actionDone(
          p.name +
            " usa «" +
            p.special +
            "» sobre " +
            e.name +
            " (" +
            dmg +
            " daño)." +
            extra,
        );
      });
  });
  battleButton("🛡 Defender", () => {
    p.guard = true;
    actionDone(p.name + " se protege.");
  });
  battleButton("🧪 Poción (1)", () => {
    if (usedPotion) {
      battleLog("La poción de este encuentro ya se ha usado.");
      return;
    }
    usedPotion = true;
    p.hp = Math.min(p.maxhp, p.hp + 32);
    actionDone(p.name + " recupera hasta 32 PV.");
  });
}
