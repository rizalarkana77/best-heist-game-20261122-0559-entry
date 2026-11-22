// Velvet Vault — shared constants for the heist.
// One canvas, one room per level, everything drawn in code: no images,
// no fonts, no network. The room fills the canvas under a HUD bar.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 76;
export const FOOT_H = 30;
export const ROOM = { x: 24, y: HUD_H + 12, w: 1232, h: 676 };

export const THIEF_R = 14;
export const THIEF_SPEED = 175;
export const SNEAK_SPEED = 92;
export const GUARD_R = 15;
export const GUARD_SPEED = 72;
export const ALERT_SPEED = 112;
export const GUARD_RANGE = 235;
export const GUARD_HALF_ANGLE = 0.62;
export const CAM_RANGE = 275;
export const CAM_HALF_ANGLE = 0.5;
export const ALARM_GUARD_RATE = 26;
export const ALARM_CAM_RATE = 20;
export const ALARM_DECAY = 9;
export const ALARM_ALERT_AT = 55;
export const NERVES = 3;

export const COLORS = {
  floorA: '#2b2118',
  floorB: '#332819',
  carpet: '#5e1220',
  carpetEdge: '#8a1f2d',
  wall: '#171310',
  wallTrim: '#c9a227',
  caseGlass: '#3d6f8e',
  caseFrame: '#c9a227',
  pillar: '#4a3b2c',
  pillarTop: '#5d4a37',
  guard: '#232c3f',
  guardCap: '#1a2233',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneSeen: 'rgba(255, 64, 64, 0.30)',
  camCone: 'rgba(120, 220, 255, 0.16)',
  camConeSeen: 'rgba(255, 64, 64, 0.28)',
  thief: '#1c1c22',
  mask: '#a4123f',
  loot: '#ffd34d',
  sapphire: '#4de3ff',
  exit: '#39d98a',
  exitLocked: '#6b7a72',
  hud: '#100d0b',
  hudText: '#e8dcc3',
  gold: '#c9a227',
};
