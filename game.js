'use strict';

/* =========================================================================
   ZOMBIE EXTINCTION — motor 2D en Canvas puro (sin librerías externas)
   Estructura pensada para poder ampliar personajes, armas, mapas,
   enemigos, vehículos y misiones sin tocar el resto del motor.
   ========================================================================= */

/* ---------------------------- UTILIDADES -------------------------------- */
const rand   = (a, b) => a + Math.random() * (b - a);
const randi  = (a, b) => Math.floor(rand(a, b + 1));
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const dist   = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const lerp   = (a, b, t) => a + (b - a) * t;
const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
const choice = arr => arr[randi(0, arr.length - 1)];

/* ------------------------------- DATOS ----------------------------------- */

const CHARACTERS = [
  { id: 'male',   name: 'RECLUTA MASCULINO', color: '#7d8c72', accent: '#c9d6bd', desc: 'Equilibrado. Puntería estable.' },
  { id: 'female', name: 'RECLUTA FEMENINA',  color: '#c07a2e', accent: '#f0c98a', desc: 'Ágil. Recarga más rápida.' },
];

const WEAPONS = [
  { id: 'm1903',   name: 'M1903',         dmg: 46, fireRate: 620, spread: 0.02, speed: 900,  color: '#e9e6d6', maxAmmo: 5,  regenMs: 260, pellets: 1 },
  { id: 'ak47',    name: 'AK-47',         dmg: 15, fireRate: 110, spread: 0.09, speed: 950,  color: '#c07a2e', maxAmmo: 30, regenMs: 55,  pellets: 1 },
  { id: 'flamer',  name: 'LANZALLAMAS',   dmg: 6,  fireRate: 45,  spread: 0.28, speed: 480,  color: '#d1272d', maxAmmo: 80, regenMs: 22,  pellets: 1, short: true },
  { id: 'rifle',   name: 'RIFLE',         dmg: 26, fireRate: 260, spread: 0.02, speed: 1050, color: '#9dfb4c', maxAmmo: 12, regenMs: 140, pellets: 1 },
  { id: 'beretta', name: 'BERETTA NANO',  dmg: 13, fireRate: 150, spread: 0.06, speed: 880,  color: '#9aa694', maxAmmo: 15, regenMs: 90,  pellets: 1 },
  { id: 'shotgun', name: 'ESCOPETA',      dmg: 11, fireRate: 520, spread: 0.24, speed: 780,  color: '#b5651d', maxAmmo: 6,  regenMs: 420, pellets: 5 },
];

const VEHICLE_SETS = {
  dino: [
    { id: 'raptor',   name: 'VELOCIRRAPTOR', hp: 130, speed: 235, desc: 'Rápido pero frágil.', kind: 'dino', pal: ['#3f7a34', '#274d20'] },
    { id: 'trex',     name: 'T-REX',         hp: 200, speed: 175, desc: 'Equilibrio entre fuerza y velocidad.', kind: 'dino', pal: ['#6a5a2b', '#3f341a'] },
    { id: 'tricera',  name: 'TRICERATOPS',   hp: 270, speed: 140, desc: 'Lento pero muy resistente.', kind: 'dino', pal: ['#4a6b6b', '#2c4141'] },
  ],
  tank: [
    { id: 'beute', name: 'BEUTEPANZER', hp: 260, speed: 118, desc: 'Blindaje capturado, versátil.', kind: 'tank', pal: ['#4a4f3f', '#2c2f26'] },
    { id: 'tiger', name: 'TIGER I',     hp: 340, speed: 95,  desc: 'Blindaje pesado, muy lento.', kind: 'tank', pal: ['#514a3a', '#332e24'] },
    { id: 'kv1',   name: 'KV-1',        hp: 300, speed: 105, desc: 'Sólido todoterreno soviético.', kind: 'tank', pal: ['#41493f', '#262c24'] },
  ],
  absurd: [
    { id: 'shoe', name: 'ZAPATILLA GIGANTE', hp: 190, speed: 195, desc: 'Camina sobre patas improvisadas.', kind: 'shoe', pal: ['#c0472e', '#7a2a1a'] },
    { id: 'ball', name: 'AUTO-PELOTA',       hp: 150, speed: 245, desc: 'Rueda con gracia balonesca.', kind: 'ball', pal: ['#e9e6d6', '#20281c'] },
    { id: 'case', name: 'ESTUCHE CAMINANTE', hp: 210, speed: 165, desc: 'Avanza sobre lápices-pata.', kind: 'case', pal: ['#3a6ea8', '#1e3a5c'] },
  ],
  animal: [
    { id: 'horse',  name: 'CABALLO',                 hp: 140, speed: 255, desc: 'No puede repararse. Sin miedo.', kind: 'horse', pal: ['#6b4a2c', '#3a2818'] },
    { id: 'donkey', name: 'BURRO',                   hp: 175, speed: 195, desc: 'No puede repararse. Terco y firme.', kind: 'horse', pal: ['#7d7a72', '#48453f'] },
    { id: 'cat2',   name: 'GATO GIGANTE DE DOS CABEZAS', hp: 165, speed: 225, desc: 'No puede repararse. Doble mordida.', kind: 'cat2', pal: ['#d99b3e', '#7a5620'] },
  ],
};

const COMPANIONS = [
  { id: 'tralalero', name: 'TRALALERO TRALALA', desc: 'Ataque giratorio de área cada pocos segundos.', color: '#3a6ea8', ability: 'spin' },
  { id: 'triplet',    name: 'TRIPLE T',          desc: 'Dispara tres proyectiles a distancia.', color: '#c07a2e', ability: 'triple' },
  { id: 'bobrito',    name: 'BOBRITO BANDITO',   desc: 'Aura curativa periódica para el jugador.', color: '#9dfb4c', ability: 'heal' },
];

/* Configuración de las 5 etapas */
const STAGES = [
  {
    id: 1, key: 'dino', name: 'DINOSAURIO',
    vehicleSet: 'dino', vehicleLabel: 'MONTURA', requireWeapons: true,
    resource: { name: 'MEDICINA', icon: '✚', color: '#d1272d' },
    canRepair: true,
    objectiveType: 'rescue', rescueTarget: 5,
    zombieTypes: ['walker'],
    palette: { ground: '#1c2417', accent: '#243020' },
    objectiveText: 'Rescata a los 5 supervivientes (presiona E) y luego dirígete a la zona segura.',
  },
  {
    id: 2, key: 'tank', name: 'TANQUES',
    vehicleSet: 'tank', vehicleLabel: 'TANQUE', requireWeapons: false,
    resource: { name: 'CASCO', icon: '⛨', color: '#c07a2e' },
    canRepair: true,
    objectiveType: 'findNPC', npcName: 'CIENTÍFICO',
    zombieTypes: ['walker', 'gunner'],
    palette: { ground: '#20211c', accent: '#2a2a22' },
    objectiveText: 'Encuentra al científico perdido y escóltalo a la zona segura.',
  },
  {
    id: 3, key: 'absurd', name: 'VEHÍCULOS ABSURDOS',
    vehicleSet: 'absurd', vehicleLabel: 'VEHÍCULO', requireWeapons: false,
    resource: { name: 'MONEDA', icon: '●', color: '#e0b13f' },
    canRepair: true,
    objectiveType: 'airBoss',
    zombieTypes: ['walker', 'heli'],
    palette: { ground: '#1a2130', accent: '#232c40' },
    objectiveText: 'Sobrevive a los helicópteros y derrota al helicóptero principal.',
  },
  {
    id: 4, key: 'animal', name: 'ANIMALES',
    vehicleSet: 'animal', vehicleLabel: 'CRIATURA', requireWeapons: false,
    resource: null, canRepair: false,
    objectiveType: 'survive', surviveKillTarget: 25,
    zombieTypes: ['rider'],
    palette: { ground: '#241c14', accent: '#302418' },
    objectiveText: 'Elimina 25 zombies para llenar la barra al 100% y luego dirígete a la zona segura. La criatura no puede repararse.',
  },
  {
    id: 5, key: 'final', name: 'BATALLA FINAL',
    vehicleSet: null, requireWeapons: false, onFoot: true, companionSelect: true,
    resource: null, canRepair: false,
    objectiveType: 'boss',
    zombieTypes: ['walker', 'gunner'],
    palette: { ground: '#15120f', accent: '#221c17' },
    objectiveText: 'Avanza junto a tu ayudante y derrota al jefe final.',
  },
];

/* ------------------------------ ESTADO GLOBAL ---------------------------- */

const GAME = {
  screen: 'menu',
  settings: { sfx: 70, music: 50, shake: true, touch: false },
  selection: { character: null, vehicle: null, weapons: [], companion: null },
  stageIndex: 0,
  run: { rescued: 0, kills: 0, totalKills: 0 },
  level: null,     // objeto de nivel activo
  input: { keys: {}, mouse: { x: 0, y: 0, down: false }, touch: { move: { x: 0, y: 0 }, fire: false, aiming: false, aimAngle: 0 } },
  paused: false,
  rafId: null,
};

/* ------------------------------ NAVEGACIÓN UI ----------------------------- */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  GAME.screen = id;
}

function bindMenuActions() {
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    handleAction(action);
  });
}

function handleAction(action) {
  switch (action) {
    case 'goto-character': buildCharacterGrid(); showScreen('screen-character'); break;
    case 'goto-settings': showScreen('screen-settings'); break;
    case 'goto-controls': showScreen('screen-controls'); break;
    case 'back-menu': showScreen('screen-menu'); break;
    case 'goto-vehicle': GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 }; openVehicleSelectForCurrentStage(); break;
    case 'vehicle-next': afterVehicleSelected(); break;
    case 'start-stage': beginStageIntro(); break;
    case 'stage-intro-continue': startStageGameplay(); break;
    case 'resume-game': togglePause(false); break;
    case 'restart-stage': togglePause(false); startStageGameplay(); break;
    case 'quit-menu': fullReset(); showScreen('screen-menu'); break;
    case 'retry-run': fullReset(); showScreen('screen-menu'); break;
    case 'controller-reveal-continue': showScreen('screen-potion'); break;
    case 'potion-yes': resolveEnding(true); break;
    case 'potion-no': resolveEnding(false); break;
  }
}

function fullReset() {
  cancelAnimationFrame(GAME.rafId);
  GAME.selection = { character: null, vehicle: null, weapons: [], companion: null };
  GAME.stageIndex = 0;
  GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
  GAME.level = null;
  GAME.paused = false;
}

/* ---------------------------- SELECCIÓN: PERSONAJE ------------------------ */

function buildCharacterGrid() {
  const grid = document.getElementById('character-grid');
  grid.innerHTML = '';
  CHARACTERS.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${ch.name}</div>
      <div class="pick-card-desc">${ch.desc}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawHuman(c, 90, 60, 0, ch.color, ch.accent, 1.6));
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.character = ch;
      document.getElementById('btn-char-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

/* ---------------------------- SELECCIÓN: VEHÍCULO -------------------------- */

function openVehicleSelectForCurrentStage() {
  const stage = STAGES[GAME.stageIndex];
  if (stage.onFoot) {
    if (stage.companionSelect) { buildCompanionGrid(); showScreen('screen-vehicle'); return; }
    afterVehicleSelected();
    return;
  }
  buildVehicleGrid(stage);
  showScreen('screen-vehicle');
}

function buildVehicleGrid(stage) {
  document.getElementById('vehicle-title').textContent = `ELIGE TU ${stage.vehicleLabel}`;
  document.getElementById('vehicle-sub').textContent = `Etapa ${stage.id} — ${stage.name}`;
  const grid = document.getElementById('vehicle-grid');
  grid.innerHTML = '';
  document.getElementById('btn-vehicle-next').disabled = true;
  VEHICLE_SETS[stage.vehicleSet].forEach(v => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${v.name}</div>
      <div class="pick-card-desc">${v.desc}<br>Vida ${v.hp} · Vel ${v.speed}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawVehicle(c, 90, 55, 0, v, 1.15));
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.vehicle = v;
      document.getElementById('btn-vehicle-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

function buildCompanionGrid() {
  document.getElementById('vehicle-title').textContent = 'ELIGE TU AYUDANTE';
  document.getElementById('vehicle-sub').textContent = 'Etapa 5 — Batalla final';
  const grid = document.getElementById('vehicle-grid');
  grid.innerHTML = '';
  document.getElementById('btn-vehicle-next').disabled = true;
  COMPANIONS.forEach(c0 => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${c0.name}</div>
      <div class="pick-card-desc">${c0.desc}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawCompanion(c, 90, 60, c0, 1.7));
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.companion = c0;
      document.getElementById('btn-vehicle-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

function afterVehicleSelected() {
  buildWeaponGrid();
  showScreen('screen-weapons');
}

/* ---------------------------- SELECCIÓN: ARMAS ----------------------------- */

function buildWeaponGrid() {
  const previous = GAME.selection.weapons || [];
  GAME.selection.weapons = [];
  document.getElementById('weapon-count').textContent = String(previous.length);
  const grid = document.getElementById('weapon-grid');
  grid.innerHTML = '';
  document.getElementById('btn-weapons-next').disabled = previous.length !== 3;
  WEAPONS.forEach(w => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    const wasSelected = previous.some(x => x.id === w.id);
    if (wasSelected) { card.classList.add('selected'); GAME.selection.weapons.push(w); }
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${w.name}</div>
      <div class="pick-card-desc">Daño ${w.dmg} · Cadencia ${Math.round(1000/w.fireRate*10)/10}/s</div>
      <div class="pick-check">✔ SELECCIONADA</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawWeaponIcon(c, 90, 55, w));
    card.addEventListener('click', () => {
      const idx = GAME.selection.weapons.findIndex(x => x.id === w.id);
      if (idx >= 0) {
        GAME.selection.weapons.splice(idx, 1);
        card.classList.remove('selected');
      } else {
        if (GAME.selection.weapons.length >= 3) return;
        GAME.selection.weapons.push(w);
        card.classList.add('selected');
      }
      document.getElementById('weapon-count').textContent = GAME.selection.weapons.length;
      document.getElementById('btn-weapons-next').disabled = GAME.selection.weapons.length !== 3;
    });
    grid.appendChild(card);
  });
}

/* ---------------------------- INTRO DE ETAPA -------------------------------- */

function beginStageIntro() {
  const stage = STAGES[GAME.stageIndex];
  document.getElementById('stage-intro-num').textContent = `ETAPA ${stage.id}`;
  document.getElementById('stage-intro-title').textContent = stage.name;
  document.getElementById('stage-intro-obj').textContent = stage.objectiveText;
  showScreen('screen-stage-intro');
}

/* =========================================================================
   RENDERIZADO DE SPRITES (procedural, sin imágenes)
   ========================================================================= */

function drawPreview(canvas, fn) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createRadialGradient(90, 55, 4, 90, 55, 90);
  g.addColorStop(0, 'rgba(157,251,76,0.10)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  fn(ctx);
}

function drawHuman(ctx, x, y, angle, bodyColor, accent, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  // piernas
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-5, 14); ctx.moveTo(3, 4); ctx.lineTo(5, 14); ctx.stroke();
  // cuerpo
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  // cabeza
  ctx.fillStyle = '#e9c9a0';
  ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.fill();
  // arma (línea en dirección angle)
  ctx.rotate(angle);
  ctx.strokeStyle = '#20241c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.restore();
}

function drawZombie(ctx, x, y, angle, type, hitFlash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 13, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  const base = hitFlash > 0 ? '#e9e6d6' : (type === 'gunner' ? '#4a6b3a' : type === 'rider' ? '#5c6b3a' : '#527a3a');
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hitFlash > 0 ? '#fff' : '#3d5c2a';
  ctx.beginPath(); ctx.arc(0, -13, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d1272d';
  ctx.beginPath(); ctx.arc(-2, -14, 1.4, 0, Math.PI * 2); ctx.arc(2, -14, 1.4, 0, Math.PI * 2); ctx.fill();
  // brazos extendidos
  ctx.strokeStyle = base; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const flail = Math.sin(Date.now() / 120 + x) * 4;
  ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(-14, 4 + flail); ctx.moveTo(7, -2); ctx.lineTo(14, 4 - flail); ctx.stroke();
  if (type === 'gunner') { ctx.strokeStyle = '#20241c'; ctx.lineWidth = 2; ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(15, 0); ctx.stroke(); }
  ctx.restore();
}

function drawRiderZombie(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 12, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5c4630';
  ctx.beginPath(); ctx.ellipse(0, 4, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15, 0, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawZombie(ctx, x, y - 8, angle, 'rider', 0);
}

function drawVehicle(ctx, x, y, angle, v, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 16, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  const [c1, c2] = v.pal;
  switch (v.kind) {
    case 'dino':
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(-30, 6); ctx.quadraticCurveTo(-10, -16, 20, -6); ctx.quadraticCurveTo(30, -2, 26, 8);
      ctx.quadraticCurveTo(0, 14, -30, 6); ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.ellipse(24, -8, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d1272d';
      ctx.beginPath(); ctx.arc(28, -10, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c1; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-24, 16); ctx.moveTo(-8, 6); ctx.lineTo(-8, 18); ctx.stroke();
      break;
    case 'tank':
      ctx.fillStyle = c2; ctx.fillRect(-26, -14, 52, 28);
      ctx.fillStyle = c1; ctx.fillRect(-22, -10, 44, 20);
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20241c'; ctx.fillRect(0, -3, 26, 6);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      for (let i = -20; i <= 20; i += 8) { ctx.beginPath(); ctx.arc(i, -16, 4, 0, Math.PI * 2); ctx.arc(i, 16, 4, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'shoe':
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(-28, 10); ctx.quadraticCurveTo(-28, -14, 0, -14); ctx.quadraticCurveTo(30, -14, 28, 4);
      ctx.quadraticCurveTo(20, 12, -28, 10); ctx.fill();
      ctx.fillStyle = c2; ctx.fillRect(-24, 6, 48, 6);
      ctx.strokeStyle = c2; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = -18; i <= 14; i += 12) { ctx.beginPath(); ctx.moveTo(i, 10); ctx.lineTo(i - 3, 20); ctx.stroke(); }
      break;
    case 'ball':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 2;
      for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'case':
      ctx.fillStyle = c1; ctx.fillRect(-26, -12, 52, 24);
      ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.strokeRect(-26, -12, 52, 24);
      ctx.fillStyle = c2; ctx.fillRect(-4, -12, 8, 24);
      ctx.strokeStyle = '#e0b13f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = -20; i <= 20; i += 10) { ctx.beginPath(); ctx.moveTo(i, 12); ctx.lineTo(i, 22); ctx.stroke(); }
      break;
    case 'horse':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22, -6, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-14, 20); ctx.moveTo(10, 8); ctx.lineTo(10, 20); ctx.stroke();
      break;
    case 'cat2':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 2, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(16, -8, 8, 0, Math.PI * 2); ctx.arc(-2, -12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(16, -22); ctx.lineTo(20, -14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(-2, -26); ctx.lineTo(2, -18); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawCompanion(ctx, x, y, comp, scale) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 11, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = comp.color; ctx.shadowBlur = 10;
  ctx.fillStyle = comp.color;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0f0a';
  ctx.beginPath(); ctx.arc(-2.5, -1, 1.3, 0, Math.PI * 2); ctx.arc(2.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWeaponIcon(ctx, x, y, w) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = w.color; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.shadowColor = w.color; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-30, 6); ctx.lineTo(30, -6); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-10, 16); ctx.stroke();
  ctx.restore();
}

function drawHeli(ctx, x, y, t, hit) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 60, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hit > 0 ? '#fff' : '#3a4038';
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-2, -2, 22, 4);
  ctx.strokeStyle = '#20241c'; ctx.lineWidth = 2;
  ctx.save(); ctx.rotate(t * 18);
  ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.moveTo(0, -24); ctx.lineTo(0, 24); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#d1272d'; ctx.beginPath(); ctx.arc(14, 0, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBoss(ctx, x, y, hpPct, hit) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 46, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
  const c = hit > 0 ? '#fff' : '#4a4f46';
  ctx.fillStyle = c; ctx.fillRect(-34, -34, 68, 68);
  ctx.fillStyle = '#2c2f28'; ctx.fillRect(-34, -34, 68, 14);
  ctx.fillStyle = hpPct > 0.5 ? '#9dfb4c' : hpPct > 0.2 ? '#e0b13f' : '#d1272d';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(-14, -10, 6, 0, Math.PI * 2); ctx.arc(14, -10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(-34, -34, 68, 68);
  ctx.fillStyle = '#20241c';
  for (let i = -24; i <= 24; i += 16) ctx.fillRect(i - 3, 20, 6, 20);
  ctx.restore();
}

function drawPickup(ctx, x, y, kind, color) {
  ctx.save(); ctx.translate(x, y);
  const bob = Math.sin(Date.now() / 260 + x) * 3;
  ctx.translate(0, bob);
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  if (kind === 'coin') { ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === 'potion') {
    ctx.beginPath(); ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-2, -10, 4, 6);
  } else {
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#0a0f0a'; ctx.fillRect(-1.5, -5, 3, 10); ctx.fillRect(-5, -1.5, 10, 3);
  }
  ctx.restore();
}

function drawSurvivor(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 12, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9d6bd';
  ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e9c9a0'; ctx.beginPath(); ctx.arc(0, -12, 5.5, 0, Math.PI * 2); ctx.fill();
  const wave = Math.sin(Date.now() / 200) * 8;
  ctx.strokeStyle = '#c9d6bd'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(12, -14 + wave); ctx.stroke();
  ctx.restore();
}

function drawScientist(ctx, x, y) {
  drawSurvivor(ctx, x, y);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#d1272d'; ctx.fillRect(-2, -4, 4, 4);
  ctx.restore();
}

/* =========================================================================
   NIVEL / GAMEPLAY
   ========================================================================= */

const WORLD = { w: 2600, h: 1900 };

function makeWeaponState(w) { return { def: w, ammo: w.maxAmmo, cd: 0, regenAcc: 0 }; }

function startStageGameplay() {
  const stage = STAGES[GAME.stageIndex];
  const canvas = document.getElementById('game-canvas');

  const player = {
    x: WORLD.w / 2, y: WORLD.h / 2, angle: 0, hp: 100, maxHp: 100,
    speed: 190, r: 12, invuln: 0,
  };

  const vehicle = stage.onFoot ? null : {
    def: GAME.selection.vehicle, hp: GAME.selection.vehicle.hp, maxHp: GAME.selection.vehicle.hp,
    x: player.x, y: player.y, angle: 0, r: 30,
  };

  const weaponStates = GAME.selection.weapons.length
    ? GAME.selection.weapons.map(makeWeaponState)
    : [makeWeaponState(WEAPONS[1])];

  const safeZone = { x: WORLD.w - 160, y: WORLD.h - 160, r: 110 };

  const level = {
    stage,
    player, vehicle,
    weaponStates, activeWeapon: 0,
    bullets: [], enemyBullets: [], zombies: [], survivors: [], pickups: [], particles: [],
    npc: null, companion: null,
    safeZone,
    decor: generateDecor(stage),
    camera: { x: player.x, y: player.y },
    rescuedThisStage: 0,
    killsThisStage: 0,
    distanceTravelled: 0,
    boss: null,
    bossDefeated: false,
    subPhase: 'play', // play | bossIntro | bossDefeatedCutscene | complete
    time: 0,
    shakeT: 0,
    interactTarget: null,
  };

  if (stage.onFoot) {
    level.companion = {
      def: GAME.selection.companion, x: player.x - 40, y: player.y, hp: 140, maxHp: 140,
      cd: 0, angle: 0,
    };
  }

  seedLevelEntities(level);
  GAME.level = level;
  GAME.paused = false;
  showScreen('screen-game');
  resizeCanvas(canvas);
  document.getElementById('touch-controls').classList.toggle('show', GAME.settings.touch);
  document.getElementById('hud-vehicle-block').style.display = stage.onFoot ? 'none' : 'block';
  document.getElementById('hud-boss').classList.remove('show');
  updateWeaponSlotsUI();
  updateObjectiveUI();

  let last = performance.now();
  cancelAnimationFrame(GAME.rafId);
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!GAME.paused) { update(dt); render(); }
    GAME.rafId = requestAnimationFrame(loop);
  }
  GAME.rafId = requestAnimationFrame(loop);
}

function generateDecor(stage) {
  const decor = [];
  const kinds = stage.key === 'dino' ? ['house', 'tree', 'road']
    : stage.key === 'tank' ? ['rubble', 'house', 'road']
    : stage.key === 'absurd' ? ['cloud', 'road']
    : stage.key === 'animal' ? ['tree', 'rock']
    : ['ruin', 'rubble'];
  for (let i = 0; i < 46; i++) {
    decor.push({
      kind: choice(kinds),
      x: rand(80, WORLD.w - 80), y: rand(80, WORLD.h - 80),
      s: rand(0.7, 1.6), rot: rand(0, Math.PI * 2),
    });
  }
  return decor;
}

function seedLevelEntities(level) {
  const { stage } = level;
  const zombieCount = { dino: 18, tank: 22, absurd: 16, animal: 24, final: 26 }[stage.key];
  for (let i = 0; i < zombieCount; i++) spawnZombie(level);

  if (stage.objectiveType === 'rescue') {
    for (let i = 0; i < stage.rescueTarget; i++) {
      level.survivors.push({ x: rand(150, WORLD.w - 150), y: rand(150, WORLD.h - 150), rescued: false, following: false });
    }
  }
  if (stage.objectiveType === 'findNPC') {
    level.npc = { x: rand(200, WORLD.w - 200), y: rand(200, WORLD.h - 200), found: false, following: false, kind: 'scientist' };
  }
  if (stage.objectiveType === 'airBoss') {
    level.heliTimer = 3;
    level.helisSpawned = 0;
  }
  if (stage.objectiveType === 'boss') {
    // el jefe aparece al final del mapa; se activa cuando el jugador se acerca
    level.boss = {
      x: WORLD.w / 2, y: 220, hp: 900, maxHp: 900, phase: 1, active: false,
      angle: 0, cd: 0, moveT: 0, defeated: false, coreDefeated: false,
    };
  }
  if (stage.resource) {
    for (let i = 0; i < 9; i++) {
      level.pickups.push({ x: rand(100, WORLD.w - 100), y: rand(100, WORLD.h - 100), kind: 'resource', taken: false });
    }
  }
}

function spawnZombie(level) {
  const type = choice(level.stage.zombieTypes);
  const edge = randi(0, 3);
  let x, y;
  if (edge === 0) { x = rand(0, WORLD.w); y = 0; }
  else if (edge === 1) { x = rand(0, WORLD.w); y = WORLD.h; }
  else if (edge === 2) { x = 0; y = rand(0, WORLD.h); }
  else { x = WORLD.w; y = rand(0, WORLD.h); }
  level.zombies.push({
    x, y, type, hp: type === 'rider' ? 60 : 42, maxHp: type === 'rider' ? 60 : 42,
    speed: type === 'rider' ? rand(110, 150) : rand(48, 82),
    angle: 0, cd: rand(0, 1), hit: 0, alive: true,
  });
}

/* ------------------------------- INPUT ------------------------------------ */

function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && GAME.screen === 'screen-game') e.preventDefault();
    GAME.input.keys[e.code] = true;
    if (e.code === 'Escape' && GAME.screen === 'screen-game') togglePause(!GAME.paused);
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code) && GAME.level) {
      const idx = Number(e.code.slice(-1)) - 1;
      if (idx < GAME.level.weaponStates.length) { GAME.level.activeWeapon = idx; updateWeaponSlotsUI(); }
    }
    if (e.code === 'KeyE' && GAME.level) tryInteract();
  });
  window.addEventListener('keyup', e => { GAME.input.keys[e.code] = false; });

  const canvas = document.getElementById('game-canvas');
  canvas.style.touchAction = 'none';

  function updateMousePos(e) {
    const r = canvas.getBoundingClientRect();
    GAME.input.mouse.x = e.clientX - r.left; GAME.input.mouse.y = e.clientY - r.top;
  }

  // Pointer Events (en vez de mousedown/mousemove/mouseup) + captura de puntero:
  // así el disparo nunca se "pierde" aunque el mouse se mueva rápido o salga
  // del canvas mientras se mantiene el click apretado (algo que sí puede pasar
  // con mousedown/mouseup normales, sobre todo mientras te mueves con WASD).
  canvas.addEventListener('pointermove', updateMousePos);
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; // solo click izquierdo dispara
    e.preventDefault();
    updateMousePos(e);
    canvas.setPointerCapture(e.pointerId);
    GAME.input.mouse.down = true;
  });
  const releaseFire = e => {
    if (e.button !== undefined && e.button !== 0) return;
    GAME.input.mouse.down = false;
  };
  canvas.addEventListener('pointerup', releaseFire);
  canvas.addEventListener('pointercancel', releaseFire);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Si la ventana pierde el foco (alt-tab, click fuera, etc.) soltamos todo
  // para que ninguna tecla o el click queden "pegados" como presionados.
  window.addEventListener('blur', () => {
    GAME.input.keys = {};
    GAME.input.mouse.down = false;
  });

  window.addEventListener('resize', () => { if (GAME.screen === 'screen-game') resizeCanvas(canvas); });

  // touch stick
  const stick = document.getElementById('touch-stick');
  const nub = document.getElementById('touch-stick-nub');
  let stickActive = false, stickId = null, center = { x: 0, y: 0 };
  stick.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0]; stickId = t.identifier; stickActive = true;
    const r = stick.getBoundingClientRect(); center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  window.addEventListener('touchmove', e => {
    if (!stickActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      let dx = t.clientX - center.x, dy = t.clientY - center.y;
      const m = Math.hypot(dx, dy), max = 40;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      nub.style.left = 32 + dx + 'px'; nub.style.top = 32 + dy + 'px';
      GAME.input.touch.move.x = dx / max; GAME.input.touch.move.y = dy / max;
    }
  }, { passive: false });
  window.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickActive = false; nub.style.left = '32px'; nub.style.top = '32px'; GAME.input.touch.move = { x: 0, y: 0 }; }
    }
  });

  // joystick de apuntar/disparar: aparece donde toques dentro de la zona
  // derecha de la pantalla; arrastrar define el ángulo de disparo y
  // mantener presionado dispara sin soltar.
  const aimZone = document.getElementById('touch-aim-zone');
  const aimStick = document.getElementById('touch-aim-stick');
  const aimNub = document.getElementById('touch-aim-nub');
  let aimId = null, aimCenter = { x: 0, y: 0 };
  aimZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    aimId = t.identifier;
    aimCenter = { x: t.clientX, y: t.clientY };
    aimStick.style.left = (aimCenter.x - 55) + 'px';
    aimStick.style.top = (aimCenter.y - 55) + 'px';
    aimStick.classList.add('show');
    aimNub.style.left = '32px'; aimNub.style.top = '32px';
    GAME.input.touch.fire = true;
  }, { passive: false });
  window.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== aimId) continue;
      let dx = t.clientX - aimCenter.x, dy = t.clientY - aimCenter.y;
      const m = Math.hypot(dx, dy), max = 45;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      aimNub.style.left = (32 + dx) + 'px'; aimNub.style.top = (32 + dy) + 'px';
      if (m > 6) { GAME.input.touch.aimAngle = Math.atan2(dy, dx); GAME.input.touch.aiming = true; }
    }
  }, { passive: false });
  window.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === aimId) {
        aimId = null; aimStick.classList.remove('show');
        GAME.input.touch.fire = false; GAME.input.touch.aiming = false;
      }
    }
  });

  document.getElementById('touch-interact').addEventListener('touchstart', e => { e.preventDefault(); tryInteract(); });
  document.getElementById('touch-pause').addEventListener('touchstart', e => {
    e.preventDefault();
    if (GAME.screen === 'screen-game') togglePause(!GAME.paused);
  });
  document.getElementById('touch-weapon').addEventListener('touchstart', e => {
    e.preventDefault();
    if (!GAME.level) return;
    GAME.level.activeWeapon = (GAME.level.activeWeapon + 1) % GAME.level.weaponStates.length;
    updateWeaponSlotsUI();
  });

  document.getElementById('opt-touch').addEventListener('change', e => { GAME.settings.touch = e.target.checked; });
  document.getElementById('opt-shake').addEventListener('change', e => { GAME.settings.shake = e.target.checked; });

  // Detecta automáticamente si es un dispositivo táctil (celular/tablet)
  // y activa los controles táctiles por defecto, sin que el jugador tenga
  // que ir a buscar la opción en Configuración.
  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    GAME.settings.touch = true;
    document.getElementById('opt-touch').checked = true;
  }
}

function resizeCanvas(canvas) {
  canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
}

function togglePause(p) {
  GAME.paused = p;
  document.getElementById('screen-pause').classList.toggle('active', p);
}

/* ------------------------------ INTERACCIÓN -------------------------------- */

function tryInteract() {
  const level = GAME.level; if (!level) return;
  const p = level.player;
  const stage = level.stage;

  if (stage.objectiveType === 'rescue') {
    level.survivors.forEach(s => {
      if (!s.rescued && !s.following && dist(p.x, p.y, s.x, s.y) < 46) {
        s.following = true;
        s.rescued = true;
        level.rescuedThisStage++;
        GAME.run.rescued++;
      }
    });
  }
  if (stage.objectiveType === 'findNPC' && level.npc && !level.npc.found) {
    if (dist(p.x, p.y, level.npc.x, level.npc.y) < 46) { level.npc.found = true; level.npc.following = true; }
  }
}

/* --------------------------------- UPDATE ---------------------------------- */

function update(dt) {
  const level = GAME.level; const stage = level.stage;
  level.time += dt;
  level.shakeT = Math.max(0, level.shakeT - dt);
  if (level.vehicle) level.player.speed = level.vehicle.def.speed;

  updatePlayerMovement(level, dt);
  updateVehicle(level, dt);
  updateWeapons(level, dt);
  updateBullets(level, dt);
  updateZombies(level, dt);
  updateFollowers(level, dt);
  updatePickups(level);
  if (stage.objectiveType === 'airBoss') updateHelis(level, dt);
  if (stage.objectiveType === 'boss') updateBoss(level, dt);
  if (level.companion) updateCompanion(level, dt);

  level.camera.x = lerp(level.camera.x, level.player.x, 0.12);
  level.camera.y = lerp(level.camera.y, level.player.y, 0.12);

  checkStageCompletion(level);
  updateHUD(level);
}

function moveVector() {
  const k = GAME.input.keys;
  let dx = 0, dy = 0;
  if (k['KeyW'] || k['ArrowUp']) dy -= 1;
  if (k['KeyS'] || k['ArrowDown']) dy += 1;
  if (k['KeyA'] || k['ArrowLeft']) dx -= 1;
  if (k['KeyD'] || k['ArrowRight']) dx += 1;
  const t = GAME.input.touch.move;
  if (Math.abs(t.x) > 0.15 || Math.abs(t.y) > 0.15) { dx = t.x; dy = t.y; }
  const m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  return { dx, dy, moving: m > 0.05 };
}

function updatePlayerMovement(level, dt) {
  const p = level.player;
  const { dx, dy, moving } = moveVector();
  const speedMult = GAME.selection.character && GAME.selection.character.id === 'female' ? 1.05 : 1.0;
  p.x = clamp(p.x + dx * p.speed * speedMult * dt, 20, WORLD.w - 20);
  p.y = clamp(p.y + dy * p.speed * speedMult * dt, 20, WORLD.h - 20);
  if (p.invuln > 0) p.invuln -= dt;

  // dirección del vehículo/personaje: la controlan WASD / flechas
  if (moving) p.moveAngle = Math.atan2(dy, dx);
  if (p.moveAngle === undefined) p.moveAngle = 0;

  // dirección de apuntado/disparo: la controla el mouse (o el joystick táctil
  // derecho en celulares), independiente del movimiento
  if (GAME.input.touch.aiming) {
    p.angle = GAME.input.touch.aimAngle;
  } else {
    const canvas = document.getElementById('game-canvas');
    const screenCX = canvas.width / 2, screenCY = canvas.height / 2;
    const worldMouseX = level.camera.x + (GAME.input.mouse.x - screenCX);
    const worldMouseY = level.camera.y + (GAME.input.mouse.y - screenCY);
    p.angle = angleTo(p.x, p.y, worldMouseX, worldMouseY);
  }

  level.distanceTravelled += Math.hypot(dx, dy) * p.speed * dt;

  // interacción cercana (para mostrar prompt)
  level.interactTarget = null;
  if (level.stage.objectiveType === 'rescue') {
    const s = level.survivors.find(s => !s.rescued && !s.following && dist(p.x, p.y, s.x, s.y) < 46);
    if (s) level.interactTarget = s;
  }
  if (level.stage.objectiveType === 'findNPC' && level.npc && !level.npc.found) {
    if (dist(p.x, p.y, level.npc.x, level.npc.y) < 46) level.interactTarget = level.npc;
  }
}

function updateVehicle(level, dt) {
  const v = level.vehicle; if (!v) return;
  const p = level.player;
  v.x = p.x; v.y = p.y;
  const face = p.moveAngle || 0;
  // solo se suaviza la rotación visual; la posición sigue al jugador sin retraso
  v.angle = lerpAngle(v.angle, face, clamp(dt * 12, 0, 1));
  p.speed = v.def.speed;
  if (v.hp <= 0) onVehicleDestroyed(level);
}

function updateWeapons(level, dt) {
  const ws = level.weaponStates[level.activeWeapon];
  if (!ws) return;
  ws.cd -= dt * 1000;
  if (ws.ammo < ws.def.maxAmmo) { ws.regenAcc += dt * 1000; if (ws.regenAcc >= ws.def.regenMs) { ws.regenAcc = 0; ws.ammo++; } }
  const wantFire = GAME.input.mouse.down || GAME.input.touch.fire || GAME.input.keys['Space'];
  if (wantFire && ws.cd <= 0 && ws.ammo > 0) {
    ws.cd = ws.def.fireRate; ws.ammo--;
    fireWeapon(level, ws.def);
  }
}

function fireWeapon(level, w) {
  const p = level.player;
  const muzzleX = p.x + Math.cos(p.angle) * 20, muzzleY = p.y + Math.sin(p.angle) * 20;
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spread = (Math.random() - 0.5) * w.spread * 2;
    const a = p.angle + spread;
    level.bullets.push({
      x: muzzleX, y: muzzleY, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed,
      dmg: w.dmg, color: w.color, life: w.short ? 0.25 : 1.0, r: w.short ? 5 : 3,
    });
  }
  level.shakeT = Math.min(level.shakeT + 0.03, 0.12);
}

function updateBullets(level, dt) {
  level.bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
  level.bullets = level.bullets.filter(b => b.life > 0 && b.x > -50 && b.x < WORLD.w + 50 && b.y > -50 && b.y < WORLD.h + 50);

  level.enemyBullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
  level.enemyBullets = level.enemyBullets.filter(b => b.life > 0);

  // colisión balas jugador -> zombies
  level.bullets.forEach(b => {
    level.zombies.forEach(z => {
      if (!z.alive) return;
      if (dist(b.x, b.y, z.x, z.y) < 15) { z.hp -= b.dmg; z.hit = 0.12; b.life = 0; }
    });
    if (level.boss && level.boss.active && !level.boss.defeated) {
      if (dist(b.x, b.y, level.boss.x, level.boss.y) < 40) { level.boss.hp -= b.dmg; level.boss.hit = 0.12; b.life = 0; }
    }
    if (level.heli && level.heli.active) {
      if (dist(b.x, b.y, level.heli.x, level.heli.y) < 24) { level.heli.hp -= b.dmg; level.heli.hit = 0.12; b.life = 0; }
    }
  });
  level.bullets = level.bullets.filter(b => b.life > 0);

  // colisión balas enemigas -> jugador/vehículo
  level.enemyBullets.forEach(b => {
    const target = level.vehicle || level.player;
    if (dist(b.x, b.y, target.x, target.y) < (level.vehicle ? level.vehicle.r : 16)) {
      damagePlayerOrVehicle(level, b.dmg);
      b.life = 0;
    }
  });
  level.enemyBullets = level.enemyBullets.filter(b => b.life > 0);

  // zombies muertos
  level.zombies.forEach(z => {
    if (z.alive && z.hp <= 0) {
      z.alive = false; level.killsThisStage++; GAME.run.kills++; GAME.run.totalKills++;
      spawnDeathParticles(level, z.x, z.y);
      setTimeout(() => { if (level === GAME.level && level.subPhase === 'play') spawnZombie(level); }, 2600);
    }
  });
  level.zombies = level.zombies.filter(z => z.alive);
}

function spawnDeathParticles(level, x, y) {
  for (let i = 0; i < 8; i++) {
    level.particles.push({ x, y, vx: rand(-80, 80), vy: rand(-80, 80), life: 0.4, color: '#4a6b2a' });
  }
}

function damagePlayerOrVehicle(level, dmg) {
  if (level.vehicle) { level.vehicle.hp = Math.max(0, level.vehicle.hp - dmg); }
  else if (level.player.invuln <= 0) { level.player.hp = Math.max(0, level.player.hp - dmg); level.player.invuln = 0.5; if (level.player.hp <= 0) onPlayerDown(level); }
  level.shakeT = Math.min(level.shakeT + 0.15, 0.25);
}

function onVehicleDestroyed(level) {
  if (GAME.paused || level.subPhase === 'complete') return;
  level.subPhase = 'complete';
  document.getElementById('stage-fail-title').textContent = 'VEHÍCULO DESTRUIDO';
  document.getElementById('stage-fail-sub').textContent = 'Tu montura ha caído. La etapa se reinicia.';
  cancelAnimationFrame(GAME.rafId);
  showScreen('screen-stage-fail');
}

function onPlayerDown(level) {
  if (level.subPhase === 'complete') return;
  level.subPhase = 'complete';
  document.getElementById('stage-fail-title').textContent = 'HAS CAÍDO';
  document.getElementById('stage-fail-sub').textContent = 'Fuiste derribado por los zombies.';
  cancelAnimationFrame(GAME.rafId);
  showScreen('screen-stage-fail');
}

function updateZombies(level, dt) {
  const target = level.vehicle || level.player;
  level.zombies.forEach(z => {
    z.hit = Math.max(0, z.hit - dt);
    z.cd -= dt;
    const d = dist(z.x, z.y, target.x, target.y);
    z.angle = angleTo(z.x, z.y, target.x, target.y);
    if (z.type === 'gunner' && d < 340 && d > 90) {
      if (z.cd <= 0) { z.cd = 1.6; level.enemyBullets.push({ x: z.x, y: z.y, vx: Math.cos(z.angle) * 260, vy: Math.sin(z.angle) * 260, dmg: 8, life: 2 }); }
    } else if (d > 26) {
      z.x += Math.cos(z.angle) * z.speed * dt; z.y += Math.sin(z.angle) * z.speed * dt;
    } else if (z.cd <= 0) {
      z.cd = 0.9; damagePlayerOrVehicle(level, z.type === 'rider' ? 14 : 9);
    }
  });

  level.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  level.particles = level.particles.filter(p => p.life > 0);
}

function updateFollowers(level, dt) {
  const p = level.player;
  // Los supervivientes de la etapa de rescate ya se cuentan al interactuar (ver tryInteract);
  // esto solo evita procesar cada frame algo que ya no es visible.
  if (level.npc && level.npc.following && !level.npc.delivered) {
    level.npc.x = lerp(level.npc.x, p.x - 30, 0.06); level.npc.y = lerp(level.npc.y, p.y + 20, 0.06);
    if (dist(level.npc.x, level.npc.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r) level.npc.delivered = true;
  }
}

function updatePickups(level) {
  const target = level.vehicle || level.player;
  level.pickups.forEach(pk => {
    if (pk.taken) return;
    if (dist(pk.x, pk.y, target.x, target.y) < 34) {
      pk.taken = true;
      if (pk.kind === 'resource' && level.stage.canRepair && level.vehicle) {
        level.vehicle.hp = Math.min(level.vehicle.maxHp, level.vehicle.hp + level.vehicle.maxHp * 0.22);
      }
      if (pk.kind === 'potion') { level.hasPotion = true; }
    }
  });
}

/* --------- Helicópteros (etapa 3) --------- */
function updateHelis(level, dt) {
  level.heliTimer -= dt;
  if (!level.heli && level.helisSpawned < 5 && level.heliTimer <= 0) {
    level.heliTimer = rand(3, 5); level.helisSpawned++;
    level.heli = {
      x: rand(200, WORLD.w - 200), y: rand(200, WORLD.h - 200), hp: level.helisSpawned >= 5 ? 220 : 60, maxHp: level.helisSpawned >= 5 ? 220 : 60,
      isBoss: level.helisSpawned >= 5, active: true, cd: 1, hit: 0, vx: rand(-40, 40), vy: rand(-40, 40),
    };
    if (level.heli.isBoss) { level.bossHeliActive = true; }
  }
  if (level.heli) {
    const h = level.heli; h.hit = Math.max(0, h.hit - dt);
    h.x = clamp(h.x + h.vx * dt, 100, WORLD.w - 100); h.y = clamp(h.y + h.vy * dt, 100, WORLD.h - 100);
    if (Math.random() < 0.01) { h.vx = rand(-50, 50); h.vy = rand(-50, 50); }
    h.cd -= dt;
    const target = level.vehicle || level.player;
    if (dist(h.x, h.y, target.x, target.y) < 420 && h.cd <= 0) {
      h.cd = 1.1;
      const a = angleTo(h.x, h.y, target.x, target.y);
      level.enemyBullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: 10, life: 2.4 });
    }
    if (h.hp <= 0) {
      if (h.isBoss) { level.pickups.push({ x: h.x, y: h.y, kind: 'potion', taken: false, r: 20 }); level.airBossDone = true; }
      level.heli = null;
    }
  }
  if (document.getElementById('hud-boss')) {
    document.getElementById('hud-boss').classList.toggle('show', !!(level.heli && level.heli.isBoss));
    if (level.heli && level.heli.isBoss) {
      document.getElementById('hud-boss-label').textContent = 'HELICÓPTERO PRINCIPAL';
      document.getElementById('hud-boss-hp').style.width = clamp(level.heli.hp / level.heli.maxHp * 100, 0, 100) + '%';
    }
  }
}

/* --------- Jefe final (etapa 5) --------- */
function updateBoss(level, dt) {
  const b = level.boss; if (!b || b.defeated) return;
  const p = level.player;
  if (!b.active && dist(p.x, p.y, b.x, b.y) < 480) { b.active = true; }
  document.getElementById('hud-boss').classList.toggle('show', b.active);
  if (!b.active) return;
  b.hit = Math.max(0, (b.hit || 0) - dt);
  document.getElementById('hud-boss-label').textContent = 'JEFE: ZOMBIE ROBÓTICO';
  document.getElementById('hud-boss-hp').style.width = clamp(b.hp / b.maxHp * 100, 0, 100) + '%';

  b.moveT += dt;
  b.x += Math.sin(b.moveT * 0.6) * 30 * dt;
  b.y = clamp(b.y + 20 * dt * (dist(p.x, p.y, b.x, b.y) > 260 ? 1 : -1), 150, WORLD.h - 150);
  b.angle = angleTo(b.x, b.y, p.x, p.y);
  b.cd -= dt;
  b.phase = b.hp > b.maxHp * 0.6 ? 1 : b.hp > b.maxHp * 0.25 ? 2 : 3;
  const fireRate = b.phase === 1 ? 1.3 : b.phase === 2 ? 0.85 : 0.5;
  const spread = b.phase === 3 ? 3 : b.phase === 2 ? 2 : 1;
  if (b.cd <= 0) {
    b.cd = fireRate;
    for (let i = -Math.floor(spread / 2); i <= Math.floor(spread / 2); i++) {
      const a = b.angle + i * 0.18;
      level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, dmg: 9, life: 2.6 });
    }
  }
  if (b.hp <= 0 && !b.defeated) {
    b.defeated = true;
    level.subPhase = 'bossDefeatedCutscene';
    level.cutsceneT = 0;
  }
}

function updateCompanion(level, dt) {
  const c = level.companion; const p = level.player;
  const targetX = p.x - Math.cos(p.angle) * 46 - 20, targetY = p.y - Math.sin(p.angle) * 46;
  c.x = lerp(c.x, targetX, 0.08); c.y = lerp(c.y, targetY, 0.08);
  c.cd -= dt;
  const nearest = level.zombies.reduce((best, z) => {
    const d = dist(c.x, c.y, z.x, z.y);
    return d < best.d ? { z, d } : best;
  }, { z: null, d: 999999 });
  if (nearest.z) c.angle = angleTo(c.x, c.y, nearest.z.x, nearest.z.y);

  if (c.def.ability === 'spin' && c.cd <= 0) {
    c.cd = 2.2;
    level.zombies.forEach(z => { if (dist(c.x, c.y, z.x, z.y) < 90) { z.hp -= 30; z.hit = 0.12; } });
    level.particles.push({ x: c.x, y: c.y, vx: 0, vy: 0, life: 0.25, color: c.def.color, ring: true });
  }
  if (c.def.ability === 'triple' && c.cd <= 0 && nearest.z) {
    c.cd = 1.1;
    for (let i = -1; i <= 1; i++) {
      const a = c.angle + i * 0.15;
      level.bullets.push({ x: c.x, y: c.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, dmg: 14, color: c.def.color, life: 1, r: 3 });
    }
  }
  if (c.def.ability === 'heal' && c.cd <= 0) {
    c.cd = 4.5;
    if (level.vehicle) level.vehicle.hp = Math.min(level.vehicle.maxHp, level.vehicle.hp + 15);
    level.player.hp = Math.min(level.player.maxHp, level.player.hp + 15);
  }
}

/* --------------------------- FIN DE ETAPA / OBJETIVOS ------------------------- */

function checkStageCompletion(level) {
  if (level.subPhase === 'bossDefeatedCutscene') { runBossCutscene(level); return; }
  if (level.subPhase !== 'play') return;
  const stage = level.stage;
  let done = false;
  if (stage.objectiveType === 'rescue') {
    const allRescued = level.rescuedThisStage >= stage.rescueTarget;
    const inSafeZone = allRescued && dist(level.player.x, level.player.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r;
    done = allRescued && inSafeZone;
  }
  if (stage.objectiveType === 'findNPC') done = !!(level.npc && level.npc.delivered);
  if (stage.objectiveType === 'airBoss') done = !!level.airBossDone && !!level.hasPotion;
  if (stage.objectiveType === 'survive') {
    const killTargetReached = level.killsThisStage >= stage.surviveKillTarget;
    const inSafeZone = killTargetReached && dist(level.player.x, level.player.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r;
    done = killTargetReached && inSafeZone;
  }
  if (stage.objectiveType === 'boss') done = level.boss && level.boss.coreDefeated;

  if (done) { level.subPhase = 'complete'; advanceStage(); }
}

function runBossCutscene(level) {
  level.cutsceneT += 1 / 60;
  if (level.cutsceneT > 1.6 && !level.boss.coreDefeated) {
    level.boss.coreDefeated = true;
  }
  if (level.cutsceneT > 2.4) {
    level.subPhase = 'complete';
    cancelAnimationFrame(GAME.rafId);
    buildControllerScene();
    showScreen('screen-controller-reveal');
  }
}

function advanceStage() {
  cancelAnimationFrame(GAME.rafId);
  const isLast = GAME.stageIndex >= STAGES.length - 1;
  if (isLast) { return; } // el final se gestiona vía la poción
  GAME.stageIndex++;
  openVehicleSelectForCurrentStage();
}

function resolveEnding(yes) {
  cancelAnimationFrame(GAME.rafId);
  if (yes) {
    buildGoodEndScene();
    showScreen('screen-good-end');
  } else {
    buildBadEndScene();
    showScreen('screen-bad-end');
  }
}

function buildGoodEndScene() {
  const el = document.getElementById('good-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#0e1a10'); g.addColorStop(1, '#1c2f18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  for (let i = 0; i < 6; i++) drawSurvivor(ctx, 40 + i * 48, 130);
  drawScientist(ctx, 170, 90);
  ctx.fillStyle = 'rgba(157,251,76,0.5)';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(0, 180), rand(0.5, 1.8), 0, Math.PI * 2); ctx.fill(); }
}

function buildBadEndScene() {
  const el = document.getElementById('bad-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#2a0808'); g.addColorStop(1, '#050202');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  // resplandor de la explosión que arrasa el mundo
  const rg = ctx.createRadialGradient(170, 90, 8, 170, 90, 170);
  rg.addColorStop(0, 'rgba(255,150,60,0.55)');
  rg.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 340, 180);
  ctx.strokeStyle = 'rgba(209,39,45,0.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), len = rand(30, 85);
    ctx.beginPath(); ctx.moveTo(170, 90); ctx.lineTo(170 + Math.cos(a) * len, 90 + Math.sin(a) * len); ctx.stroke();
  }
  // el jugador ya convertido en zombie
  drawZombie(ctx, 170, 120, 0, 'walker', 0);
  ctx.fillStyle = 'rgba(209,39,45,0.3)';
  for (let i = 0; i < 5; i++) ctx.fillRect(rand(0, 320), rand(0, 160), rand(10, 60), rand(2, 6));
}

function buildControllerScene() {
  const el = document.getElementById('controller-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#1a1508'); g.addColorStop(1, '#050402');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  // chispas del robot destruido de fondo
  ctx.fillStyle = 'rgba(224,177,63,0.35)';
  for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(60, 170), rand(0.5, 2), 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(224,177,63,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(60, 10); ctx.moveTo(300, 30); ctx.lineTo(280, 0); ctx.stroke();
  // el zombie con lentes, en primer plano
  ctx.save();
  ctx.translate(170, 128);
  ctx.scale(2.3, 2.3);
  drawZombie(ctx, 0, 0, 0, 'walker', 0);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.rect(-6.2, -16.5, 4.6, 4.6);
  ctx.rect(1.6, -16.5, 4.6, 4.6);
  ctx.moveTo(-1.6, -14.2); ctx.lineTo(1.6, -14.2);
  ctx.stroke();
  ctx.restore();
  // el papel doblado que sostiene
  ctx.fillStyle = '#e9e6d6';
  ctx.save(); ctx.translate(198, 148); ctx.rotate(-0.15);
  ctx.fillRect(-9, -6, 18, 13);
  ctx.strokeStyle = '#9aa694'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(9, -1); ctx.stroke();
  ctx.restore();
}

/* --------------------------------- RENDER ----------------------------------- */

function render() {
  const level = GAME.level;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  ctx.save();
  let shakeX = 0, shakeY = 0;
  if (GAME.settings.shake && level.shakeT > 0) { shakeX = rand(-1, 1) * level.shakeT * 20; shakeY = rand(-1, 1) * level.shakeT * 20; }

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, level.stage.palette.ground); g.addColorStop(1, level.stage.palette.accent);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const camX = level.camera.x - w / 2 + shakeX, camY = level.camera.y - h / 2 + shakeY;
  ctx.translate(-camX, -camY);

  drawGroundGrid(ctx, camX, camY, w, h);
  drawDecor(ctx, level);
  drawSafeZone(ctx, level);

  if (level.stage.resource) level.pickups.forEach(pk => { if (!pk.taken && pk.kind === 'resource') drawPickup(ctx, pk.x, pk.y, 'resource', level.stage.resource.color); });
  level.pickups.forEach(pk => { if (!pk.taken && pk.kind === 'potion') drawPickup(ctx, pk.x, pk.y, 'potion', '#9dfb4c'); });

  if (level.stage.objectiveType === 'rescue') level.survivors.forEach(s => { if (!s.rescued) drawSurvivor(ctx, s.x, s.y); });
  if (level.npc && !level.npc.delivered) drawScientist(ctx, level.npc.x, level.npc.y);

  level.zombies.forEach(z => { if (z.type === 'rider') drawRiderZombie(ctx, z.x, z.y, z.angle); else drawZombie(ctx, z.x, z.y, z.angle, z.type, z.hit); });

  if (level.heli && level.heli.active) drawHeli(ctx, level.heli.x, level.heli.y, level.time, level.heli.hit);
  if (level.boss && level.boss.active && !level.boss.defeated) drawBoss(ctx, level.boss.x, level.boss.y, level.boss.hp / level.boss.maxHp, level.boss.hit || 0);

  level.bullets.forEach(b => { ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; });
  level.enemyBullets.forEach(b => { ctx.fillStyle = '#d1272d'; ctx.shadowColor = '#d1272d'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; });
  level.particles.forEach(p => {
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    if (p.ring) { ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 90 * (1 - p.life / 0.25), 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
  });

  if (level.vehicle) drawVehicle(ctx, level.vehicle.x, level.vehicle.y, level.vehicle.angle, level.vehicle.def, 1);
  else drawHuman(ctx, level.player.x, level.player.y, level.player.angle, GAME.selection.character.color, GAME.selection.character.accent, 1);

  if (level.companion) drawCompanion(ctx, level.companion.x, level.companion.y, level.companion.def, 1.4);

  ctx.restore();

  drawMinimap(level);
  document.getElementById('hud-interact').classList.toggle('show', !!level.interactTarget);
}

function drawGroundGrid(ctx, camX, camY, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
  const size = 64;
  const startX = Math.floor(camX / size) * size, startY = Math.floor(camY / size) * size;
  for (let x = startX; x < camX + w + size; x += size) { ctx.beginPath(); ctx.moveTo(x, camY - size); ctx.lineTo(x, camY + h + size); ctx.stroke(); }
  for (let y = startY; y < camY + h + size; y += size) { ctx.beginPath(); ctx.moveTo(camX - size, y); ctx.lineTo(camX + w + size, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(209,39,45,0.5)'; ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
}

function drawDecor(ctx, level) {
  level.decor.forEach(d => {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.scale(d.s, d.s);
    switch (d.kind) {
      case 'tree':
        ctx.fillStyle = '#2c1c10'; ctx.fillRect(-3, 0, 6, 14);
        ctx.fillStyle = '#274d20'; ctx.beginPath(); ctx.arc(0, -8, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e3a18'; ctx.beginPath(); ctx.arc(-6, -4, 10, 0, Math.PI * 2); ctx.fill();
        break;
      case 'house':
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-22, -14, 44, 30);
        ctx.fillStyle = '#7a1418'; ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(0, -34); ctx.lineTo(26, -14); ctx.fill();
        ctx.fillStyle = '#20241c'; ctx.fillRect(-6, 2, 12, 14);
        break;
      case 'road':
        ctx.fillStyle = 'rgba(90,90,90,0.25)'; ctx.fillRect(-60, -8, 120, 16);
        ctx.strokeStyle = 'rgba(220,220,180,0.3)'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.stroke(); ctx.setLineDash([]);
        break;
      case 'rubble':
      case 'ruin':
        ctx.fillStyle = '#3a3a34'; ctx.fillRect(-14, -10, 28, 20); ctx.fillStyle = '#26261f'; ctx.fillRect(-8, -18, 12, 12);
        break;
      case 'rock':
        ctx.fillStyle = '#4a453c'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'cloud':
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.arc(-14, 0, 14, 0, Math.PI * 2); ctx.arc(6, -6, 18, 0, Math.PI * 2); ctx.arc(22, 0, 13, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  });
}

function drawSafeZone(ctx, level) {
  const s = level.safeZone;
  const pulse = 1 + Math.sin(level.time * 3) * 0.06;
  ctx.strokeStyle = 'rgba(157,251,76,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(157,251,76,0.08)'; ctx.fill();
  ctx.fillStyle = '#9dfb4c'; ctx.font = '12px "Chakra Petch"'; ctx.textAlign = 'center';
  ctx.fillText('ZONA SEGURA', s.x, s.y - s.r - 10);
}

function drawMinimap(level) {
  const cv = document.getElementById('minimap-canvas'); const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 140, 140);
  ctx.fillStyle = 'rgba(20,26,18,0.7)'; ctx.fillRect(0, 0, 140, 140);
  const sx = 140 / WORLD.w, sy = 140 / WORLD.h;
  ctx.fillStyle = '#9dfb4c';
  ctx.beginPath(); ctx.arc(level.safeZone.x * sx, level.safeZone.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d1272d';
  level.zombies.forEach(z => { ctx.fillRect(z.x * sx - 1, z.y * sy - 1, 2, 2); });
  if (level.stage.objectiveType === 'rescue') { ctx.fillStyle = '#e9e6d6'; level.survivors.forEach(s => { if (!s.rescued) ctx.fillRect(s.x * sx - 1.5, s.y * sy - 1.5, 3, 3); }); }
  if (level.npc && !level.npc.delivered) { ctx.fillStyle = '#e9e6d6'; ctx.fillRect(level.npc.x * sx - 2, level.npc.y * sy - 2, 4, 4); }
  if (level.boss) { ctx.fillStyle = '#ff5050'; ctx.fillRect(level.boss.x * sx - 3, level.boss.y * sy - 3, 6, 6); }
  ctx.fillStyle = '#fff';
  const p = level.player; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(157,251,76,0.4)'; ctx.strokeRect(0, 0, 140, 140);
}

/* ---------------------------------- HUD ------------------------------------- */

function updateWeaponSlotsUI() {
  const level = GAME.level; if (!level) return;
  const box = document.getElementById('weapon-slots'); box.innerHTML = '';
  level.weaponStates.forEach((ws, i) => {
    const el = document.createElement('div');
    el.className = 'weapon-slot' + (i === level.activeWeapon ? ' active' : '');
    el.innerHTML = `<span class="slot-num">${i + 1}</span>${ws.def.name}`;
    box.appendChild(el);
  });
}

function updateObjectiveUI() {
  const level = GAME.level; if (!level) return;
  document.getElementById('hud-objective').textContent = 'Objetivo: ' + level.stage.objectiveText;
}

function updateHUD(level) {
  document.getElementById('hud-player-hp').style.width = clamp(level.player.hp / level.player.maxHp * 100, 0, 100) + '%';
  const vBlock = document.getElementById('hud-vehicle-block');
  if (level.vehicle) {
    document.getElementById('hud-vehicle-label').textContent = level.vehicle.def.name;
    document.getElementById('hud-vehicle-hp').style.width = clamp(level.vehicle.hp / level.vehicle.maxHp * 100, 0, 100) + '%';
  }
  document.getElementById('hud-rescued').textContent = GAME.run.rescued;
  document.getElementById('hud-kills').textContent = GAME.run.totalKills;

  const ws = level.weaponStates[level.activeWeapon];
  if (ws) document.getElementById('hud-ammo').textContent = `MUN: ${ws.ammo}/${ws.def.maxAmmo}`;
  updateWeaponSlotsUI();

  const inv = document.getElementById('inv-items'); inv.innerHTML = '';
  if (level.stage.objectiveType === 'rescue') { const el = document.createElement('div'); el.className = 'inv-item'; el.textContent = level.rescuedThisStage; inv.appendChild(el); }
  if (level.hasPotion) { const el = document.createElement('div'); el.className = 'inv-item'; el.textContent = '🧪'; inv.appendChild(el); }

  if (level.stage.objectiveType === 'survive') {
    const pct = Math.min(100, Math.round(level.killsThisStage / level.stage.surviveKillTarget * 100));
    document.getElementById('hud-objective').textContent = level.killsThisStage >= level.stage.surviveKillTarget
      ? '¡Objetivo cumplido! Ve a la zona segura'
      : `ZOMBIES ELIMINADOS: ${level.killsThisStage}/${level.stage.surviveKillTarget}  ·  ${pct}%`;
  } else if (level.stage.objectiveType === 'rescue') {
    document.getElementById('hud-objective').textContent = level.rescuedThisStage >= level.stage.rescueTarget
      ? 'Todos rescatados. ¡Ve a la zona segura!'
      : `Rescatados: ${level.rescuedThisStage}/${level.stage.rescueTarget}`;
  } else if (level.stage.objectiveType === 'findNPC') {
    document.getElementById('hud-objective').textContent = level.npc.delivered ? 'Científico a salvo' : level.npc.following ? 'Escolta al científico a la zona segura' : 'Encuentra al científico';
  } else if (level.stage.objectiveType === 'airBoss') {
    document.getElementById('hud-objective').textContent = level.hasPotion ? 'Recoge la poción y continúa' : 'Sobrevive y derrota al helicóptero principal';
  } else if (level.stage.objectiveType === 'boss') {
    document.getElementById('hud-objective').textContent = level.boss.active ? 'Derrota al jefe final' : 'Avanza hacia el norte del mapa';
  }
}

/* ------------------------------------ INIT ----------------------------------- */

function setRealViewportHeight() {
  // En móviles, la barra de direcciones aparece/desaparece y 100vh no
  // refleja el alto real visible. window.innerHeight sí, así que lo usamos
  // para fijar --app-height y que el juego ocupe toda la pantalla real.
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}

document.addEventListener('DOMContentLoaded', () => {
  setRealViewportHeight();
  window.addEventListener('resize', setRealViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(setRealViewportHeight, 100));
  bindMenuActions();
  setupInput();
  showScreen('screen-menu');
});
