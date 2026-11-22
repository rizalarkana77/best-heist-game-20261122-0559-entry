// Velvet Vault — game loop and rules.
// A thief crosses a guarded gallery: guards patrol with vision cones and
// cameras sweep theirs; standing in a cone raises the alarm, hiding cools
// it. Grab the Star Sapphire to open the exit, then reach the door.
// Caught at alarm 100 costs a nerve; three nerves, three rooms, one heist.
import { VIEW_W, VIEW_H, THIEF_R, THIEF_SPEED, SNEAK_SPEED, GUARD_R, GUARD_SPEED, ALERT_SPEED, GUARD_RANGE, GUARD_HALF_ANGLE, CAM_RANGE, CAM_HALF_ANGLE, ALARM_GUARD_RATE, ALARM_CAM_RATE, ALARM_DECAY, ALARM_ALERT_AT, NERVES, ROOM } from './config.js';
import { LEVELS, buildLevel, moveCircle, lineBlocked } from './world.js';
import { render, buttonsFor } from './render.js';
import { createInput, moveVector } from './input.js';
import { mulberry32, clamp, angleDiff, dist } from './random.js';
import { applyShot } from './shots.js';
import {
  ensureAudio, toggleMute, isMuted, sfxClick, sfxPickup, sfxSapphire,
  sfxSpotted, sfxCaught, sfxWin, sfxExitOpen, startSiren, stopSiren,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);
const rng = mulberry32(seed);

const game = {
  mode: 'title',
  level: buildLevel(0),
  score: 0,
  nerves: NERVES,
  totalElapsed: 0,
  banner: null,
  sneak: false,
  moveTarget: null,
  hoverButton: null,
  best: Number(localStorage.getItem('velvet-vault-best') || 0),
  levelClearText: '',
  rank: '',
  introUntil: 0,
};

function setBanner(text, color, ms, blink = false, now = performance.now()) {
  game.banner = { text, color, until: now + ms, blink };
}

function startLevel(index, keepScore) {
  game.level = buildLevel(index);
  if (!keepScore) game.score = 0;
  game.nerves = NERVES;
  game.mode = 'playing';
  game.banner = null;
  game.moveTarget = null;
  setBanner(game.level.def.intro, '#e8dcc3', 2600);
  game.introUntil = performance.now() + 2600;
}

function nextLevel() {
  if (game.level.index + 1 >= LEVELS.length) {
    winGame();
    return;
  }
  game.level = buildLevel(game.level.index + 1);
  game.mode = 'playing';
  game.banner = null;
  game.moveTarget = null;
  setBanner(game.level.def.intro, '#e8dcc3', 2600);
}

function winGame() {
  game.mode = 'win';
  stopSiren();
  sfxWin();
  const t = game.totalElapsed;
  game.rank = t < 300 ? 'GHOST — unseen, unhurried, unstoppable'
    : t < 480 ? 'MASTERMIND — clean, quick, professional'
    : 'LUCKY AMATEUR — the sapphire is yours, barely';
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem('velvet-vault-best', String(game.best));
  }
}

function levelClear() {
  const level = game.level;
  const timeBonus = Math.max(200, 1000 - Math.round(8 * level.elapsed));
  const stealthBonus = Math.round((100 - level.alarm) * 2);
  game.score += timeBonus + stealthBonus;
  game.mode = 'levelclear';
  stopSiren();
  sfxWin();
  game.levelClearText = `Time bonus +${timeBonus}  •  stealth bonus +${stealthBonus}`;
}

function caught() {
  game.nerves -= 1;
  stopSiren();
  sfxCaught();
  if (game.nerves <= 0) {
    game.mode = 'gameover';
    if (game.score > game.best) {
      game.best = game.score;
      localStorage.setItem('velvet-vault-best', String(game.best));
    }
    return;
  }
  game.mode = 'caught';
}

function retryRoom() {
  const index = game.level.index;
  game.level = buildLevel(index);
  game.mode = 'playing';
  game.banner = null;
  game.moveTarget = null;
  setBanner('Back to the shadows. The guards reset.', '#e8dcc3', 2200);
}

// --- Vision: is the thief inside a watcher's cone with a clear sight line?
function watcherSees(level, wx, wy, facing, halfAngle, range) {
  const t = level.thief;
  const d = dist(wx, wy, t.x, t.y);
  if (d > range) return false;
  if (Math.abs(angleDiff(Math.atan2(t.y - wy, t.x - wx), facing)) > halfAngle) return false;
  return !lineBlocked(level, wx, wy, t.x, t.y);
}

function update(dt, now) {
  const level = game.level;
  if (game.mode !== 'playing') return;
  level.elapsed += dt;
  game.totalElapsed += dt;

  // --- Move the thief.
  const mv = moveVector(input, level.thief.x, level.thief.y);
  game.sneak = !!(mv && mv.sneak);
  if (mv) {
    const speed = mv.sneak ? SNEAK_SPEED : THIEF_SPEED;
    moveCircle(level, level.thief, mv.dx * speed * dt, mv.dy * speed * dt, THIEF_R);
    level.thief.facing = Math.atan2(mv.dy, mv.dx);
  }
  game.moveTarget = input.moveTarget;

  // --- Patrol the guards (faster once the alarm is high).
  const alerted = level.alarm >= ALARM_ALERT_AT;
  const gSpeed = (alerted ? ALERT_SPEED : level.def.guardSpeed);
  for (const g of level.guards) {
    const target = g.waypoints[g.wp];
    const d = dist(g.x, g.y, target.x, target.y);
    if (d < 4) {
      g.wp = (g.wp + 1) % g.waypoints.length;
      continue;
    }
    const nx = (target.x - g.x) / d;
    const ny = (target.y - g.y) / d;
    g.x += nx * gSpeed * dt;
    g.y += ny * gSpeed * dt;
    g.facing = Math.atan2(ny, nx);
  }

  // --- Sweep the cameras.
  for (const c of level.cameras) {
    c.phase += dt * level.def.camSweep;
    c.angle = c.base + Math.sin(c.phase) * c.sweep;
  }

  // --- Who sees the thief?
  let seen = false;
  let rate = 0;
  for (const g of level.guards) {
    g.seesThief = watcherSees(level, g.x, g.y, g.facing, GUARD_HALF_ANGLE, GUARD_RANGE);
    if (g.seesThief) {
      seen = true;
      rate += ALARM_GUARD_RATE;
    }
  }
  for (const c of level.cameras) {
    c.seesThief = watcherSees(level, c.x, c.y, c.angle, CAM_HALF_ANGLE, CAM_RANGE);
    if (c.seesThief) {
      seen = true;
      rate += ALARM_CAM_RATE;
    }
  }
  const wasSeen = level.seen;
  level.seen = seen;
  if (seen) {
    if (!wasSeen) {
      sfxSpotted();
      setBanner('SPOTTED!', '#ff4040', 1200, true, now);
    }
    level.alarm = clamp(level.alarm + rate * (game.sneak ? 0.5 : 1) * dt, 0, 100);
  } else {
    level.alarm = clamp(level.alarm - ALARM_DECAY * dt, 0, 100);
  }
  if (level.alarm >= 70) startSiren();
  else stopSiren();
  if (level.alarm >= 100) {
    caught();
    return;
  }

  // --- Loot pickups.
  for (const l of level.loot) {
    if (!l.taken && dist(level.thief.x, level.thief.y, l.x, l.y) < THIEF_R + 16) {
      l.taken = true;
      game.score += 100;
      sfxPickup();
    }
  }
  const s = level.sapphire;
  if (!s.taken && dist(level.thief.x, level.thief.y, s.x, s.y) < THIEF_R + 22) {
    s.taken = true;
    level.exitOpen = true;
    game.score += 500;
    sfxSapphire();
    sfxExitOpen();
    setBanner('SAPPHIRE TAKEN — EXIT OPEN!', '#39d98a', 2600, false, now);
  }

  // --- Exit: reach the door once it is open.
  if (level.exitOpen) {
    const e = level.def.exit;
    if (dist(level.thief.x, level.thief.y, e.x, e.y) < 46) {
      levelClear();
    }
  }
}

// --- Input hooks.
const input = createInput(canvas, {
  onPause() {
    if (game.mode === 'playing') {
      game.mode = 'paused';
      stopSiren();
    } else if (game.mode === 'paused') {
      game.mode = 'playing';
    }
  },
  onMute() {
    toggleMute();
  },
  onRestart() {
    if (['playing', 'paused', 'caught'].includes(game.mode)) retryRoom();
  },
  onConfirm() {
    ensureAudio();
    if (game.mode === 'title') startLevel(0, false);
    else if (game.mode === 'how') game.mode = 'title';
    else if (game.mode === 'paused') game.mode = 'playing';
    else if (game.mode === 'caught') retryRoom();
    else if (game.mode === 'gameover') startLevel(0, false);
    else if (game.mode === 'levelclear') nextLevel();
    else if (game.mode === 'win') startLevel(0, false);
  },
  onFloorClick(p) {
    ensureAudio();
    // Menu buttons first.
    for (const b of buttonsFor(game.mode)) {
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        sfxClick();
        if (b.id === 'start' || b.id === 'again') startLevel(0, false);
        else if (b.id === 'how') game.mode = 'how';
        else if (b.id === 'back') game.mode = 'title';
        else if (b.id === 'resume') game.mode = 'playing';
        else if (b.id === 'restart') retryRoom();
        else if (b.id === 'retry') {
          if (game.mode === 'gameover') startLevel(0, false);
          else retryRoom();
        } else if (b.id === 'next') nextLevel();
        return false;
      }
    }
    // Only a live game takes walk orders, and only inside the room.
    if (game.mode !== 'playing') return false;
    if (p.x < ROOM.x || p.x > ROOM.x + ROOM.w || p.y < ROOM.y || p.y > ROOM.y + ROOM.h) return false;
    return true;
  },
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
  const hit = buttonsFor(game.mode).find(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
  game.hoverButton = hit ? hit.id : null;
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

// --- Main loop.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt, now);
  render(ctx, game, now);
  if (game.mode !== 'shot') requestAnimationFrame(frame);
}

// --- Boot: a ?shot= URL stages one frozen frame for screenshots.
if (shotName) {
  applyShot(game, shotName);
  render(ctx, game, 1000);
  document.title = `Velvet Vault — shot ${shotName}`;
} else {
  document.title = 'Velvet Vault — A Midnight Heist';
  requestAnimationFrame(frame);
}
