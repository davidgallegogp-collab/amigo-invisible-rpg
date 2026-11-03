"use strict";
const Sorteo = (() => {
  function invitation() {
    const token = new URLSearchParams(location.hash.slice(1)).get("invitacion");
    return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }
  async function consult(signal) {
    if (!SorteoConfig.endpoint || !SorteoConfig.drawId)
      throw Error("La revelación real está pendiente de configuración. Tu aventura está completada.");
    const token = invitation();
    if (!token) throw Error("Abre tu enlace personal de invitación para consultar el cofre. No hay una invitación válida en esta dirección.");
    const endpoint = new URL(SorteoConfig.endpoint);
    if (endpoint.protocol !== "https:" || endpoint.search || endpoint.hash)
      throw Error("La configuración del servicio debe revisarse.");
    let response;
    try {
      response = await fetch(endpoint.href, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({drawId: SorteoConfig.drawId, token}),
        credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
        signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
      });
    } catch { throw Error("No se pudo conectar con el cofre. Puedes reintentar sin cambiar tu destinatario."); }
    if (response.status === 404) throw Error("Esta invitación no es válida o ha sido sustituida. Solicita tu enlace actual al organizador.");
    if (!response.ok) throw Error("El cofre no está disponible temporalmente. Vuelve a intentarlo.");
    let result; try { result = (await response.json()).recipient; } catch {}
    if (!result || typeof result.name !== "string" || !result.name.trim() || result.name.length > 100)
      throw Error("No se pudo leer el resultado. Vuelve a intentarlo.");
    return { name: result.name, spriteKey: result.spriteKey };
  }
  return Object.freeze({ consult });
})();
