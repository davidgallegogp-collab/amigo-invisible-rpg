"use strict";
// Catálogo y carga centralizada. Añadir sprites aquí; conservar claves y rutas relativas.
const spriteCatalog = {
  witch: { file: "mirucha", version: "3b68124444b5" },
  spear: { file: "nacho", version: "f5653039db52" },
  hammer: { file: "arturo", version: "31a96c18c1c5" },
  quico: { file: "quico", version: "07449926afe0" },
  avionatin: { file: "avionatin", version: "34d1ab8f3d79" },
  abel: { file: "abel", version: "f4dd69bf62b5" },
};
const enemyArt = {};
const failedSprites = [];
function cargarRecursos() {
  const assetStatus = document.createElement("p");
  assetStatus.id = "assetStatus";
  assetStatus.setAttribute("role", "status");
  assetStatus.textContent = "Cargando ilustraciones…";
  $("panel").appendChild(assetStatus);
  $("start").disabled = true;
  return Promise.all(
    Object.entries(spriteCatalog).map(
      ([key, { file, version }]) =>
        new Promise((resolve) => {
          const img = new Image();
          enemyArt[key] = img;
          img.onload = () => resolve();
          img.onerror = () => {
            failedSprites.push(file);
            console.error("No se pudo cargar el sprite:", img.src);
            resolve();
          };
          // Relativa al documento: válida tanto en la raíz como bajo /amigo-invisible-rpg/.
          // Al cambiar un PNG, actualizar version con los primeros 12 caracteres de su SHA-256.
          img.src = "assets/enemigos/" + file + ".png?v=" + version;
        }),
    ),
  ).then(() => {
    $("start").disabled = false;
    assetStatus.textContent = failedSprites.length
      ? "No se pudieron cargar: " +
        failedSprites.join(", ") +
        ". Comprueba la carpeta assets/enemigos. Se usarán dibujos de reserva."
      : "Ilustraciones listas · Los seis enemigos";
    if (failedSprites.length) {
      const warning = assetStatus.cloneNode(true);
      warning.id = "battleAssetStatus";
      $("battleCard").prepend(warning);
    }
  });
}
