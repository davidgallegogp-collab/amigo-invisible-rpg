"use strict";
// Solo estado visual por instancia; utiliza el reloj y el bucle de combate existentes.
const HeroAnimations = (() => {
  const durations = { attack: 230, skill: 300, hurt: 200, defeat: 460, heal: 300, guard: 220 };
  const priorities = { defeat: 4, hurt: 3, attack: 2, skill: 2, heal: 1, guard: 1 };
  let states = new WeakMap(), nextPhase = 0;
  const tints = new WeakMap();
  function state(hero) {
    if (!states.has(hero)) states.set(hero, { phase: nextPhase++, event: null, pending: null });
    return states.get(hero);
  }
  function advance(s, now) {
    if (s.event && now >= s.event.end && s.event.type !== "defeat") {
      s.event = s.pending;
      s.pending = null;
      if (s.event && now >= s.event.end) s.event = null;
    }
  }
  function play(hero, type, now = performance.now()) {
    if (!durations[type] || (hero.hp <= 0 && type !== "defeat")) return;
    const s = state(hero);
    advance(s, now);
    if (s.event?.type === "defeat") return;
    const event = { type, start: now, end: now + durations[type] };
    if (type === "defeat") {
      s.event = event; s.pending = null;
      return;
    }
    if (s.event && priorities[type] < priorities[s.event.type]) {
      // Cola acotada a una reacción/acción: nunca retrasa PV, PM ni turnos.
      if (!s.pending || priorities[type] >= priorities[s.pending.type])
        s.pending = { type, start: s.event.end, end: s.event.end + durations[type] };
      return;
    }
    if (type === "hurt") {
      // Golpes consecutivos reinician el impacto. Recuperar una acción interrumpida
      // permite ver también el ataque del último héroe del turno instantáneo.
      const pending = s.event && ["attack", "skill"].includes(s.event.type) ? s.event : s.pending;
      s.pending = pending ? { type: pending.type, start: event.end, end: event.end + durations[pending.type] } : null;
    } else s.pending = null;
    s.event = event;
  }
  function sample(hero, now = performance.now()) {
    const s = state(hero);
    advance(s, now);
    const result = { x: 0, y: 0, alpha: 1, flash: 0, color: "white", type: "idle" };
    const event = s.event;
    if (!event) {
      if (hero.hp <= 0) return { ...result, alpha: 0.45, type: "defeat" };
      result.y = Math.sin(now * 0.0039 + s.phase) * 2;
      return result;
    }
    result.type = event.type;
    const elapsed = Math.max(0, now - event.start);
    const t = Math.min(1, elapsed / durations[event.type]);
    const pulse = Math.sin(Math.PI * t);
    if (event.type === "attack") result.x = -8 * pulse;
    else if (event.type === "skill") {
      result.y = -3 * pulse; result.flash = 0.65 * pulse; result.color = "#a9ddff";
    } else if (event.type === "hurt") {
      result.x = Math.sin(t * Math.PI * 6) * 3 * (1 - t);
      result.flash = Math.max(0, 1 - elapsed / 140);
    } else if (event.type === "defeat") {
      result.flash = Math.max(0, 1 - elapsed / 100);
      result.alpha = elapsed < 140 ? (Math.floor(elapsed / 35) % 2 ? 0.35 : 1)
        : 1 - 0.55 * Math.min(1, (elapsed - 140) / 320);
    } else if (event.type === "heal") {
      result.flash = 0.6 * pulse; result.color = "#a4ffad";
    } else if (event.type === "guard") {
      result.x = 2 * pulse; result.flash = 0.6 * pulse; result.color = "#a9ddff";
    }
    return result;
  }
  function flashImage(img, color) {
    // Misma resolución fuente: la máscara y el PNG coinciden píxel a píxel
    // al escalar o invertir. Reutilizamos la máscara blanca existente sin modificarla.
    const white = EnemyAnimations.flashImage(img, img.naturalWidth, img.naturalHeight);
    if (color === "white") return white;
    let cache = tints.get(img);
    if (!cache) { cache = new Map(); tints.set(img, cache); }
    if (!cache.has(color)) {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(white, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height);
      cache.set(color, canvas);
    }
    return cache.get(color);
  }
  return { play, sample, flashImage, reset() { states = new WeakMap(); nextPhase = 0; } };
})();
