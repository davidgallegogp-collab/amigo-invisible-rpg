"use strict";
// Encuentros y dibujo original de enemigos. Se ejecuta al dibujar el combate.
const encounters = [
  {
    title: "I · Mirucha, la Bruja de Madriz",
    place: "LA PLAZA DE MADRIZ",
    foes: [{ name: "Mirucha", kind: "witch", hp: 88, maxhp: 88, atk: 9 }],
    intro:
      "«¿Os he dicho que soy de Madrid? ¡El agua de Madriz está buenísima!»",
  },
  {
    title: "II · Los Guardianes del Cumpleaños",
    place: "LA CATEDRAL DEL MERKAFONT",
    foes: [
      { name: "Nacho", kind: "spear", hp: 92, maxhp: 92, atk: 12 },
      { name: "Arturo", kind: "hammer", hp: 116, maxhp: 116, atk: 14 },
    ],
    intro: "Nacho y Arturo cruzan sus armas. «¡FELIZ CUMPLEAÑOS! ¡MERKAFONT!»",
  },
  {
    title: "III · Quico, el Gran Orco Danzarín",
    place: "EL SALÓN DEL BAILE",
    foes: [
      { name: "Quico", kind: "boss", hp: 165, maxhp: 165, atk: 10 },
      { name: "Avionatin", kind: "orc", hp: 66, maxhp: 66, atk: 11 },
      { name: "Abel", kind: "orc", hp: 66, maxhp: 66, atk: 11 },
    ],
    intro: "Quico entra bailando. Avionatin y Abel aplauden con sus hachas.",
  },
];

function enemySprite(g, e, x, y, flash = 0) {
  const spriteImg = enemyArt[e.name.toLowerCase()] || enemyArt[e.kind];
  if (spriteImg && spriteImg.complete && spriteImg.naturalWidth) {
    // Ilustraciones dedicadas, escaladas con su proporción original.
    const h =
      e.kind === "boss"
        ? 195
        : e.kind === "orc"
          ? 150
          : e.kind === "hammer"
            ? 188
            : e.kind === "spear"
              ? 180
              : 178;
    const w = (h * spriteImg.naturalWidth) / spriteImg.naturalHeight;
    // Sombra suave de contacto para que el sprite no parezca flotante.
    g.save();
    g.fillStyle = "rgba(15,12,24,.46)";
    g.beginPath();
    g.ellipse(x, y + 20, w * 0.35, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // Un toque de energía según el tipo de jefe; el arte PNG conserva la transparencia.
    g.save();
    if (e.kind === "witch") {
      g.shadowColor = "#ba6bff";
      g.shadowBlur = 12;
    }
    if (e.kind === "spear") {
      g.shadowColor = "#ffdc75";
      g.shadowBlur = 8;
    }
    if (e.kind === "hammer") {
      g.shadowColor = "#d7bd92";
      g.shadowBlur = 5;
    }
    g.drawImage(
      spriteImg,
      Math.round(x - w / 2),
      Math.round(y - h + 23),
      Math.round(w),
      Math.round(h),
    );
    g.restore();
    if (flash > 0) {
      g.save();
      g.globalAlpha *= flash;
      g.drawImage(
        EnemyAnimations.flashImage(spriteImg, Math.round(w), Math.round(h)),
        Math.round(x - w / 2), Math.round(y - h + 23),
      );
      g.restore();
    }
    return;
  }

  const k = e.kind;
  g.save();
  g.translate(x, y);
  if (k === "witch") {
    rect(g, -28, -63, 56, 68, "#643c8c");
    rect(g, -34, -20, 68, 35, "#422a64");
    rect(g, -20, -87, 40, 34, "#d7aa87");
    rect(g, -44, -92, 88, 10, "#372248");
    g.fillStyle = "#503064";
    g.beginPath();
    g.moveTo(-28, -92);
    g.lineTo(0, -143);
    g.lineTo(29, -92);
    g.fill();
    rect(g, 24, -75, 7, 89, "#c4a06d");
    rect(g, 22, -88, 11, 15, "#a9d4ff");
    rect(g, -11, -76, 5, 5, "#181220");
    rect(g, 7, -76, 5, 5, "#181220");
    rect(g, -16, -54, 32, 5, "#ba8ac8");
    rect(g, -7, -64, 14, 4, "#813a63");
    rect(g, 25, -92, 9, 8, "#e2e5f5");
  } else if (k === "spear") {
    rect(g, -24, -100, 48, 108, "#a97d31");
    rect(g, -17, -128, 34, 31, "#f4d27a");
    rect(g, -29, -101, 58, 16, "#d4b35b");
    rect(g, -15, -40, 12, 50, "#92702f");
    rect(g, 4, -40, 12, 50, "#92702f");
    rect(g, 30, -144, 7, 159, "#f6df9e");
    g.fillStyle = "#e2faff";
    g.beginPath();
    g.moveTo(33, -168);
    g.lineTo(23, -140);
    g.lineTo(43, -140);
    g.fill();
    rect(g, -19, -68, 38, 14, "#efe0b7");
    rect(g, -28, -96, 7, 38, "#edc971");
    rect(g, 22, -96, 7, 38, "#edc971");
    rect(g, -7, -121, 14, 7, "#f7e7a0");
    g.fillStyle = "#4c3324";
    g.font = "bold 7px monospace";
    g.textAlign = "center";
    g.fillText("FELIZ", 0, -62);
    g.fillText("CUMPLEAÑOS", 0, -56);
  } else if (k === "hammer") {
    rect(g, -40, -100, 80, 110, "#89909d");
    rect(g, -32, -133, 64, 41, "#a4aab5");
    rect(g, -48, -96, 96, 22, "#727d8e");
    rect(g, -29, -38, 24, 49, "#626b79");
    rect(g, 6, -38, 24, 49, "#626b79");
    rect(g, 49, -148, 11, 155, "#9a7952");
    rect(g, 29, -153, 56, 35, "#b0b6c0");
    rect(g, -34, -72, 68, 20, "#d2d4db");
    rect(g, -45, -95, 9, 48, "#bbc1c8");
    rect(g, 36, -95, 9, 48, "#bbc1c8");
    rect(g, -25, -120, 50, 7, "#6b7381");
    g.fillStyle = "#352b32";
    g.font = "bold 12px monospace";
    g.textAlign = "center";
    g.fillText("MERKAFONT", 0, -58);
  } else {
    const boss = k === "boss",
      scale = boss ? 1.38 : 0.83;
    g.scale(scale, scale);
    rect(g, -37, -100, 74, 98, boss ? "#51843e" : "#538f4c");
    rect(g, -29, -134, 58, 42, "#77ae59");
    rect(g, -46, -116, 18, 22, "#9c6a49");
    rect(g, 28, -116, 18, 22, "#9c6a49");
    rect(g, -30, -5, 24, 33, "#5a4c43");
    rect(g, 7, -5, 24, 33, "#5a4c43");
    rect(g, -15, -119, 7, 7, "#30232c");
    rect(g, 12, -119, 7, 7, "#30232c");
    rect(g, -22, -101, 44, 8, "#e5c68b");
    rect(g, -37, -62, 74, 24, boss ? "#ad5472" : "#7a5440");
    rect(g, -17, -107, 9, 5, "#fff4ce");
    rect(g, 9, -107, 9, 5, "#fff4ce");
    rect(g, -6, -85, 12, 5, "#33432d");
    if (boss) {
      rect(g, -39, -142, 78, 9, "#b99545");
      rect(g, -26, -156, 12, 16, "#d5b554");
      rect(g, 13, -156, 12, 16, "#d5b554");
    } else {
      rect(g, 43, -94, 8, 104, "#876947");
      rect(g, 34, -112, 27, 23, "#8f9aa2");
    }
  }
  g.restore();
}
