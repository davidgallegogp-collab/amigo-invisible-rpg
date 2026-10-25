"use strict";
// Datos originales: 15 personajes, clases y posiciones de la taberna.
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
  David: [232, 285], Noelia: [340, 285], Jordux: [448, 285],
  Pablo: [556, 285], Villa: [664, 285],
  Jesús: [232, 390], Carlos: [340, 390], Lucía: [448, 390],
  Manu: [556, 390], María: [664, 390],
  Óscar: [232, 495], Lobato: [340, 495], Guarriadna: [448, 495],
  Ari: [556, 495], Alba: [664, 495],
};
const positions = data.map(([name]) => characterPositions[name]);
