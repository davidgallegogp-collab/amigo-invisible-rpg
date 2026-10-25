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
// Asociación estable por nombre visible; claves y PNG del manifiesto aprobado.
const heroSpriteCatalog = {
  "David": { key: "david", version: "54ab7ae153a5", flip: false },
  "Noelia": { key: "noelia", version: "d40abe3bfc7a", flip: false },
  "Jordux": { key: "jordux", version: "da54970d19fa", flip: false },
  "Pablo": { key: "pablo", version: "0d9170289ce7", flip: false },
  "Villa": { key: "villa", version: "df13cfd723e2", flip: false },
  "Jesús": { key: "jesus", version: "32ce25a77b36", flip: false },
  "Carlos": { key: "carlos", version: "c66ef518065e", flip: false },
  "Lucía": { key: "lucia", version: "9317bb42f93a", flip: false },
  "Manu": { key: "manu", version: "0acf95534b4b", flip: false },
  "María": { key: "maria", version: "6cc24781804e", flip: false },
  "Óscar": { key: "oscar", version: "39dd8a19f79a", flip: false },
  "Lobato": { key: "lobato", version: "1b1f100a21c4", flip: false },
  "Guarriadna": { key: "guarriadna", version: "1666a47f1778", flip: false },
  "Ari": { key: "ari", version: "b29c5971eb8e", flip: false },
  "Alba": { key: "alba", version: "b24d63323d6a", flip: false },
};
// Orden de los encuentros existentes: Mirucha; Nacho/Arturo; Quico y aliados.
const battleBackgroundCatalog = [
  { key: "combate_1_mirucha", version: "cc1ce641e192" },
  { key: "combate_2_nacho_arturo", version: "cdff485e5715" },
  { key: "combate_3_jefe_final", version: "aaccd2238585" },
];
const battleBackgroundArt = {};
const tavernArt = {};
const tavernCatalog = {"pere": "74c0d782e5ec", "tavern_bg": "b5ce20d590f9"};
const heroArt = {};
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
    [
      ...battleBackgroundCatalog.map(({ key, version }) =>
        ({ key, file: key, version, folder: "combates", cache: battleBackgroundArt })),
      ...Object.entries(tavernCatalog).map(([key, version]) =>
        ({ key, file: key, version, folder: "taberna", cache: tavernArt })),
      ...Object.entries(spriteCatalog).map(([key, { file, version }]) =>
        ({ key, file, version, folder: "enemigos", cache: enemyArt })),
      ...Object.values(heroSpriteCatalog).map(({ key, version }) =>
        ({ key, file: key, version, folder: "personajes", cache: heroArt })),
    ].map(
      ({ key, file, version, folder, cache }) =>
        new Promise((resolve) => {
          const img = new Image();
          cache[key] = img;
          img.onload = () => resolve();
          img.onerror = () => {
            failedSprites.push(folder + "/" + file);
            console.error("No se pudo cargar el sprite:", img.src);
            resolve();
          };
          // Relativa al documento: válida tanto en la raíz como bajo /amigo-invisible-rpg/.
          // Al cambiar un PNG, actualizar version con los primeros 12 caracteres de su SHA-256.
          img.src = "assets/" + folder + "/" + file + ".png?v=" + version;
        }),
    ),
  ).then(() => {
    $("start").disabled = false;
    assetStatus.textContent = failedSprites.length
      ? "No se pudieron cargar: " +
        failedSprites.join(", ") +
        ". Comprueba las carpetas assets/enemigos, assets/personajes, assets/taberna y assets/combates. Se usarán dibujos de reserva."
      : "Ilustraciones listas · 6 enemigos y 15 aventureros · Taberna, Pere y 3 fondos de combate";
    if (failedSprites.length) {
      const warning = assetStatus.cloneNode(true);
      warning.id = "battleAssetStatus";
      $("battleCard").prepend(warning);
    }
  });
}
