// Velvet Vault — deterministic staged frames for the screenshots.
// ?shot=cover|spotted|loot|exit&seed=1 freezes a fixed gameplay moment from
// the same render code live play uses, so every screenshot is a real render
// of the game's own code: room, guards with vision cones, cameras, loot,
// sapphire and the alarm meter, all in one frame.
import { buildLevel } from './world.js';

function guardAt(level, i, x, y, facing, seesThief) {
  const g = level.guards[i];
  g.x = x;
  g.y = y;
  g.facing = facing;
  g.seesThief = seesThief;
}

function camAt(level, i, angle, seesThief) {
  const c = level.cameras[i];
  c.angle = angle;
  c.seesThief = seesThief;
}

export function applyShot(game, name) {
  // Always stage on room 1: it has every element the brief asks for.
  const level = buildLevel(0);
  game.level = level;
  game.mode = 'shot';
  game.score = 1250;
  game.nerves = 3;
  game.totalElapsed = 96;
  game.banner = null;
  game.sneak = false;
  game.moveTarget = null;

  if (name === 'cover') {
    // Mid-heist: thief sneaking up the carpet, one case already taken,
    // a guard cone sweeping close by, camera sweeping, sapphire glowing.
    // The thief stands clear of every cone — the HUD reads "unseen".
    level.thief.x = 350;
    level.thief.y = 640;
    level.thief.facing = -Math.PI / 2;
    guardAt(level, 0, 450, 380, Math.PI / 2, false);
    guardAt(level, 1, 900, 300, Math.PI, false);
    camAt(level, 0, Math.PI / 2 - 0.5, false);
    level.loot[0].taken = true;
    level.alarm = 14;
    level.seen = false;
    game.score = 350;
    game.totalElapsed = 48;
    game.sneak = true;
  } else if (name === 'spotted') {
    // Caught in a cone: alarm climbing fast, guard facing the thief.
    level.thief.x = 470;
    level.thief.y = 430;
    level.thief.facing = Math.PI;
    guardAt(level, 0, 450, 330, Math.PI / 2, true);
    guardAt(level, 1, 850, 300, Math.PI, false);
    camAt(level, 0, Math.PI / 2 + 0.6, false);
    level.alarm = 68;
    level.seen = true;
    game.banner = { text: 'SPOTTED!', color: '#ff4040', until: 100000, blink: true };
    game.score = 250;
    game.totalElapsed = 73;
  } else if (name === 'loot') {
    // The sapphire is taken: exit open, loot nearly complete.
    level.thief.x = 1020;
    level.thief.y = 230;
    level.thief.facing = -Math.PI / 4;
    guardAt(level, 0, 450, 560, -Math.PI / 2, false);
    guardAt(level, 1, 850, 300, Math.PI, false);
    camAt(level, 0, Math.PI / 2 + 0.4, false);
    level.loot.forEach((l) => { l.taken = true; });
    level.sapphire.taken = true;
    level.exitOpen = true;
    level.alarm = 25;
    level.seen = false;
    game.banner = { text: 'EXIT OPEN — RUN!', color: '#39d98a', until: 100000, blink: false };
    game.score = 1150;
    game.totalElapsed = 121;
  } else if (name === 'exit') {
    // At the door with everything stolen: the getaway.
    level.thief.x = 1150;
    level.thief.y = 130;
    level.thief.facing = -Math.PI / 2;
    guardAt(level, 0, 450, 200, Math.PI, false);
    guardAt(level, 1, 1000, 300, Math.PI / 2, false);
    camAt(level, 0, Math.PI / 2 - 0.8, false);
    level.loot.forEach((l) => { l.taken = true; });
    level.sapphire.taken = true;
    level.exitOpen = true;
    level.alarm = 40;
    level.seen = false;
    game.banner = { text: 'CLEAN GETAWAY!', color: '#39d98a', until: 100000, blink: false };
    game.score = 1850;
    game.totalElapsed = 148;
  } else {
    // Unknown shot name: fall back to the cover frame.
    return applyShot(game, 'cover');
  }
  return level;
}
