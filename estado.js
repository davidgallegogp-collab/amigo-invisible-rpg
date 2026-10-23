"use strict";
// Estado compartido y referencias DOM. Cargar después de personajes.js.
let hero = 0,
  party = [],
  player = { x: 450, y: 552 },
  last = [{ x: 450, y: 552 }],
  modal = false,
  started = false,
  pressed = new Set(),
  tick = 0;
const canvas = document.getElementById("game"),
  ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const $ = (id) => document.getElementById(id);
let battleActive = false,
  combatants = [],
  enemies = [],
  activeTurn = 0,
  round = 1,
  combatFinished = false,
  stage = 0,
  usedPotion = false,
  phase2 = false,
  enemyBoost = 0;
const bc = $("battleCanvas"),
  bctx = bc.getContext("2d");
bctx.imageSmoothingEnabled = false;

let visualFrame = 0,
  visualPulse = 0;
