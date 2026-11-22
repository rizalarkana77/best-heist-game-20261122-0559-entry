// Velvet Vault — the three rooms of the Marroway Gallery.
// Each level: a room with display cases and pillars (cover), patrolling
// guards with vision cones, sweeping wall cameras, loot cases, one Star
// Sapphire, and an exit door that only opens once the sapphire is taken.
// All coordinates are in the game's 1280x800 space; the room is
// x 24..1256, y 88..764.
import { ROOM } from './config.js';

export const LEVELS = [
  {
    name: 'Room 1 — The Gilded Gallery',
    intro: 'Slip past the guards. Take the Star Sapphire, then the exit.',
    guardSpeed: 72,
    camSweep: 0.55,
    start: { x: 90, y: 700 },
    exit: { x: 1180, y: 100, side: 'top' },
    sapphire: { x: 1050, y: 200 },
    loot: [
      { x: 350, y: 180 },
      { x: 640, y: 430 },
      { x: 950, y: 620 },
    ],
    obstacles: [
      { x: 300, y: 300, w: 180, h: 60, kind: 'case' },
      { x: 700, y: 150, w: 60, h: 140, kind: 'pillar' },
      { x: 500, y: 560, w: 200, h: 60, kind: 'case' },
      { x: 950, y: 350, w: 60, h: 160, kind: 'pillar' },
      { x: 150, y: 430, w: 120, h: 50, kind: 'case' },
    ],
    guards: [
      { waypoints: [{ x: 450, y: 180 }, { x: 450, y: 650 }] },
      { waypoints: [{ x: 850, y: 300 }, { x: 1150, y: 300 }] },
    ],
    cameras: [{ x: 640, y: 90, base: Math.PI / 2, sweep: 0.9 }],
  },
  {
    name: 'Room 2 — The Vault Hall',
    intro: 'Three guards, two cameras, and the sapphire is far from the door.',
    guardSpeed: 86,
    camSweep: 0.7,
    start: { x: 90, y: 700 },
    exit: { x: 90, y: 100, side: 'top' },
    sapphire: { x: 1120, y: 680 },
    loot: [
      { x: 300, y: 200 },
      { x: 620, y: 300 },
      { x: 900, y: 180 },
      { x: 420, y: 620 },
    ],
    obstacles: [
      { x: 250, y: 350, w: 60, h: 160, kind: 'pillar' },
      { x: 550, y: 150, w: 200, h: 60, kind: 'case' },
      { x: 850, y: 420, w: 200, h: 60, kind: 'case' },
      { x: 450, y: 480, w: 60, h: 140, kind: 'pillar' },
      { x: 1000, y: 180, w: 60, h: 120, kind: 'pillar' },
    ],
    guards: [
      { waypoints: [{ x: 350, y: 150 }, { x: 350, y: 600 }] },
      { waypoints: [{ x: 700, y: 550 }, { x: 1150, y: 550 }] },
      { waypoints: [{ x: 950, y: 180 }, { x: 950, y: 420 }] },
    ],
    cameras: [
      { x: 300, y: 90, base: Math.PI / 2, sweep: 0.8 },
      { x: 1254, y: 400, base: Math.PI, sweep: 0.8 },
    ],
  },
  {
    name: 'Room 3 — The Crown Room',
    intro: 'The Crown Room: four guards, three cameras, one very watched sapphire.',
    guardSpeed: 98,
    camSweep: 0.85,
    start: { x: 640, y: 700 },
    exit: { x: 640, y: 100, side: 'top' },
    sapphire: { x: 640, y: 270 },
    loot: [
      { x: 200, y: 200 },
      { x: 1080, y: 200 },
      { x: 200, y: 620 },
      { x: 1080, y: 620 },
      { x: 640, y: 500 },
    ],
    obstacles: [
      { x: 480, y: 170, w: 60, h: 120, kind: 'pillar' },
      { x: 740, y: 170, w: 60, h: 120, kind: 'pillar' },
      { x: 480, y: 480, w: 60, h: 120, kind: 'pillar' },
      { x: 740, y: 480, w: 60, h: 120, kind: 'pillar' },
      { x: 300, y: 360, w: 140, h: 50, kind: 'case' },
      { x: 840, y: 360, w: 140, h: 50, kind: 'case' },
    ],
    guards: [
      { waypoints: [{ x: 350, y: 150 }, { x: 350, y: 650 }] },
      { waypoints: [{ x: 930, y: 150 }, { x: 930, y: 650 }] },
      { waypoints: [{ x: 200, y: 380 }, { x: 1080, y: 380 }] },
      { waypoints: [{ x: 640, y: 420 }, { x: 640, y: 680 }] },
    ],
    cameras: [
      { x: 320, y: 90, base: Math.PI / 2, sweep: 0.8 },
      { x: 960, y: 90, base: Math.PI / 2, sweep: 0.8 },
      { x: 1254, y: 620, base: Math.PI, sweep: 0.8 },
    ],
  },
];

// Build a fresh, mutable play state for a level index.
export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    def,
    index,
    thief: { x: def.start.x, y: def.start.y, facing: -Math.PI / 2 },
    guards: def.guards.map((g) => ({
      waypoints: g.waypoints,
      wp: 1,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      facing: Math.atan2(
        g.waypoints[1].y - g.waypoints[0].y,
        g.waypoints[1].x - g.waypoints[0].x,
      ),
      seesThief: false,
    })),
    cameras: def.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      base: c.base,
      sweep: c.sweep,
      phase: 0,
      angle: c.base,
      seesThief: false,
    })),
    loot: def.loot.map((l) => ({ x: l.x, y: l.y, taken: false })),
    sapphire: { x: def.sapphire.x, y: def.sapphire.y, taken: false },
    alarm: 0,
    seen: false,
    exitOpen: false,
    elapsed: 0,
  };
}

// Keep a circle inside the room and out of the obstacle rects, sliding
// along edges: move x, resolve, then move y, resolve.
export function moveCircle(level, obj, dx, dy, r) {
  const room = ROOM;
  obj.x += dx;
  obj.x = Math.max(room.x + r, Math.min(room.x + room.w - r, obj.x));
  for (const o of level.def.obstacles) {
    if (circleHitsRect(obj.x, obj.y, r, o)) {
      obj.x = dx > 0 ? o.x - r : o.x + o.w + r;
      obj.x = Math.max(room.x + r, Math.min(room.x + room.w - r, obj.x));
    }
  }
  obj.y += dy;
  obj.y = Math.max(room.y + r, Math.min(room.y + room.h - r, obj.y));
  for (const o of level.def.obstacles) {
    if (circleHitsRect(obj.x, obj.y, r, o)) {
      obj.y = dy > 0 ? o.y - r : o.y + o.h + r;
      obj.y = Math.max(room.y + r, Math.min(room.y + room.h - r, obj.y));
    }
  }
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const ddx = cx - nx;
  const ddy = cy - ny;
  return ddx * ddx + ddy * ddy < r * r;
}

// True when the segment from (x1,y1) to (x2,y2) is blocked by any obstacle.
export function lineBlocked(level, x1, y1, x2, y2) {
  for (const o of level.def.obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment enter the rectangle's x/y slabs together?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}
