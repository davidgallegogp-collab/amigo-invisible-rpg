"use strict";
// Estado exclusivamente visual, por instancia. Sin timers ni bucles adicionales.
const EnemyAnimations = (() => {
  const defaults = { bob: 1, sway: 0, period: 2500, attack: 240, reach: 7 };
  const profiles = {
    Mirucha: { bob: 2, period: 3200, attack: 300, reach: 6 },
    Nacho: { attack: 180, reach: 6 },
    Arturo: { bob: 1, period: 3100, attack: 380, reach: 8 },
    Quico: { bob: 1.5, sway: 1.5, period: 2200, attack: 280 },
    Avionatin: { period: 2000, attack: 190, reach: 7 },
    Abel: { period: 2300, attack: 210, reach: 6 },
  };
  let states = new WeakMap();
  const masks = new WeakMap();
  function state(e, now) {
    if (!states.has(e)) states.set(e, { born: now, event: null, pending: null });
    return states.get(e);
  }
  function profile(e) { return { ...defaults, ...profiles[e.name] }; }
  function play(e, type, now = performance.now()) {
    const s = state(e, now);
    if (s.event?.type === "death" || (e.hp <= 0 && type !== "death")) return;
    const duration = type === "death" ? 560 : type === "hurt" ? 180 : profile(e).attack;
    // El último héroe y el turno enemigo pueden resolverse en la misma llamada.
    // Terminar su reacción antes del ataque, sin retrasar daño, turnos ni controles.
    if (type === "attack" && s.event?.type === "hurt" && now < s.event.end) {
      s.pending = { type, start: s.event.end, end: s.event.end + duration };
      return;
    }
    s.event = { type, start: now, end: now + duration };
    s.pending = null;
  }
  function sample(e, now = performance.now()) {
    const s = state(e, now), p = profile(e);
    if (s.event && now >= s.event.end && s.event.type !== "death") {
      s.event = s.pending;
      s.pending = null;
      if (s.event && now >= s.event.end) s.event = null;
    }
    const result = { x: 0, y: 0, alpha: 1, flash: 0, visible: true };
    const event = s.event;
    if (!event) {
      if (e.hp <= 0) return { ...result, alpha: 0, visible: false };
      const phase = (now - s.born) * Math.PI * 2 / p.period;
      result.x = Math.sin(phase) * p.sway;
      result.y = Math.sin(phase) * p.bob;
    } else {
      const elapsed = now - event.start;
      const t = Math.min(1, Math.max(0, elapsed / (event.end - event.start)));
      if (event.type === "attack") {
        // Avance hacia los héroes (derecha), golpe corto y retorno suave.
        result.x = p.reach * Math.sin(Math.PI * t);
      } else if (event.type === "hurt") {
        result.x = Math.sin(t * Math.PI * 6) * 3 * (1 - t);
        result.flash = Math.max(0, 1 - elapsed / 120);
      } else {
        result.flash = Math.max(0, 1 - elapsed / 100);
        result.alpha = elapsed < 160 ? (Math.floor(elapsed / 40) % 2 ? 0.3 : 1)
          : Math.max(0, 1 - (elapsed - 160) / 400);
        result.visible = t < 1;
      }
    }
    return result;
  }
  // Máscara blanca del propio PNG, a tamaño de dibujo: conserva su alfa y no
  // depende de Canvas.filter (compatibilidad móvil). Nunca modifica la imagen.
  function flashImage(img, w, h) {
    let mask = masks.get(img);
    if (!mask || mask.width !== w || mask.height !== h) {
      mask = document.createElement("canvas");
      mask.width = w; mask.height = h;
      const ctx = mask.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      masks.set(img, mask);
    }
    return mask;
  }
  return { play, sample, flashImage, reset() { states = new WeakMap(); } };
})();
