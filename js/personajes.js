"use strict";
// Datos originales: 16 personajes, clases y posiciones de la taberna.
const data = [
  [
    "David",
    "Mago",
    "Me han vuelto a banear el chat del LoL por decir barbaridades",
    "El que se mueva es gay",
  ],
  [
    "Noelia",
    "Pícaro",
    "Amor, pásame mi mechero. ¿Me pones una pinta de lager?",
    "Kaladin y Shallan",
  ],
  ["Jordux", "Bárbaro", "Otra pausa dramática...", "FF al 15"],
  ["Pablo", "Arquero", "Me voy al estudio", "Hay que jugar en Faceit"],
  ["Villa", "Guerrero", "¿Sale CS?", "Gomu Gomu Gatling"],
  [
    "Jesús",
    "Pícaro",
    "Echo de menos trabajar",
    "El café de mi casa es el mejor",
  ],
  ["Carlos", "Clérigo", "Putos cines ABC", "Bisexualidad legendaria"],
  ["Lucía", "Arquero", "¿Me pones un zumo de piña?", "The Fate of Ophelia"],
  [
    "Manu",
    "Bárbaro",
    "Ñas, ¿sale lolsito chavales? Qué hambre tengo.",
    "Golpetazo con tubería de PVC",
  ],
  ["María", "Clérigo", "Tú, chavales, ¿jugamos al Gang Beasts?", "¡MANUEL!"],
  ["Martín", "Guerrero", "¿Dos doses o dos doses?", "FP de jardinería"],
  [
    "Óscar",
    "Mago",
    "Yo juego eminencias, pero que no están chetas",
    "Yo juego eminencias",
  ],
  [
    "Lobato",
    "Guerrero",
    "Star Wars, la puta mejor saga del mundo",
    "Prevención de riesgos laborales",
  ],
  [
    "Guarriadna",
    "Pícaro",
    "Buah, yo he sido una maleanta de cuidado",
    "Contabilidad fatal",
  ],
  [
    "Ari",
    "Arquero",
    "En Venezuela sí ponen Los Simpsons, y tenemos televisores",
    "Panchitada histórica",
  ],
  ["Alba", "Clérigo", "¿Sale piti?", "Besito en la frente"],
];
const colors = {
  Mago: "#9a7be2",
  Pícaro: "#c7a85a",
  Bárbaro: "#d07160",
  Arquero: "#67ae86",
  Guerrero: "#6793c8",
  Clérigo: "#dfc5a1",
};
// Posiciones asociadas al nombre: eliminar/reordenar data no desplaza a otro NPC.
const characterPositions = {
  David: [94, 178], Noelia: [210, 178], Jordux: [335, 178],
  Pablo: [455, 178], Villa: [575, 178], Jesús: [695, 178],
  Carlos: [95, 333], Lucía: [245, 333], Manu: [395, 333],
  María: [545, 333], Martín: [695, 333],
  Óscar: [96, 480], Lobato: [246, 480], Guarriadna: [396, 480],
  Ari: [546, 480], Alba: [696, 480],
};
const positions = data.map(([name]) => characterPositions[name]);
