// Velvet Vault — every pixel is drawn in code on one canvas: parquet floor,
// velvet carpet, display cases, pillars, guards with vision cones, sweeping
// cameras, loot, the sapphire, the thief, the HUD and all menus.
// Cone angles here are the same numbers the game logic uses, so what you
// see is exactly what can spot you.
import {
  VIEW_W, VIEW_H, HUD_H, FOOT_H, ROOM, COLORS,
  GUARD_RANGE, GUARD_HALF_ANGLE, CAM_RANGE, CAM_HALF_ANGLE,
} from './config.js';
import { LEVELS } from './world.js';

// Menu buttons, in game coordinates. main.js hit-tests these same rects.
export function buttonsFor(mode) {
  const cx = VIEW_W / 2;
  if (mode === 'title') {
    return [
      { id: 'start', x: cx - 130, y: 560, w: 260, h: 56, label: 'BEGIN THE HEIST' },
      { id: 'how', x: cx - 130, y: 628, w: 260, h: 40, label: 'HOW TO PLAY' },
    ];
  }
  if (mode === 'how') {
    return [{ id: 'back', x: cx - 130, y: 640, w: 260, h: 48, label: 'BACK' }];
  }
  if (mode === 'paused') {
    return [
      { id: 'resume', x: cx - 130, y: 420, w: 260, h: 52, label: 'RESUME' },
      { id: 'restart', x: cx - 130, y: 486, w: 260, h: 52, label: 'RESTART ROOM' },
    ];
  }
  if (mode === 'caught') {
    return [{ id: 'retry', x: cx - 130, y: 470, w: 260, h: 52, label: 'TRY AGAIN' }];
  }
  if (mode === 'gameover') {
    return [{ id: 'retry', x: cx - 130, y: 500, w: 260, h: 52, label: 'START OVER' }];
  }
  if (mode === 'levelclear') {
    return [{ id: 'next', x: cx - 130, y: 480, w: 260, h: 52, label: 'NEXT ROOM' }];
  }
  if (mode === 'win') {
    return [{ id: 'again', x: cx - 130, y: 520, w: 260, h: 52, label: 'STEAL IT AGAIN' }];
  }
  return [];
}

function conePath(ctx, x, y, facing, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, edge) {
  conePath(ctx, x, y, facing, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Parquet planks.
  ctx.fillStyle = COLORS.floorB;
  for (let y = ROOM.y + 28; y < ROOM.y + ROOM.h; y += 56) {
    ctx.fillRect(ROOM.x, y, ROOM.w, 3);
  }
  for (let x = ROOM.x + 44; x < ROOM.x + ROOM.w; x += 88) {
    ctx.fillRect(x, ROOM.y, 3, ROOM.h);
  }
  // Velvet carpet down the middle of the gallery.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(ROOM.x + 420, ROOM.y, 392, ROOM.h);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(ROOM.x + 420, ROOM.y, 392, ROOM.h);
  ctx.strokeStyle = 'rgba(201,162,39,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ROOM.x + 432, ROOM.y + 10, 368, ROOM.h - 20);
}

function drawWalls(ctx, level) {
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 5;
  ctx.strokeRect(ROOM.x - 3, ROOM.y - 3, ROOM.w + 6, ROOM.h + 6);
  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = 14;
  ctx.strokeRect(ROOM.x - 10, ROOM.y - 10, ROOM.w + 20, ROOM.h + 20);
  // Exit door on the top wall.
  const e = level.def.exit;
  ctx.fillStyle = level.exitOpen ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(e.x - 38, ROOM.y - 12, 76, 18);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 38, ROOM.y - 12, 76, 18);
  ctx.fillStyle = level.exitOpen ? '#062b18' : '#e8dcc3';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(level.exitOpen ? 'EXIT' : 'LOCKED', e.x, ROOM.y - 2);
}

function drawObstacles(ctx, level) {
  for (const o of level.def.obstacles) {
    if (o.kind === 'case') {
      ctx.fillStyle = COLORS.caseFrame;
      ctx.fillRect(o.x - 3, o.y - 3, o.w + 6, o.h + 6);
      ctx.fillStyle = COLORS.caseGlass;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(o.x + 6, o.y + 4, o.w - 12, 8);
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.pillar;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COLORS.pillarTop;
      ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    }
  }
}

function drawLoot(ctx, level, now) {
  for (const l of level.loot) {
    if (l.taken) continue;
    const pulse = 0.75 + 0.25 * Math.sin(now / 300 + l.x);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 14);
    ctx.lineTo(l.x + 11, l.y);
    ctx.lineTo(l.x, l.y + 14);
    ctx.lineTo(l.x - 11, l.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const s = level.sapphire;
  if (!s.taken) {
    const tw = 0.6 + 0.4 * Math.sin(now / 240);
    ctx.save();
    ctx.shadowColor = COLORS.sapphire;
    ctx.shadowBlur = 26 * tw + 8;
    ctx.fillStyle = COLORS.sapphire;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 22);
    ctx.lineTo(s.x + 17, s.y);
    ctx.lineTo(s.x, s.y + 22);
    ctx.lineTo(s.x - 17, s.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 22);
    ctx.lineTo(s.x + 17, s.y);
    ctx.lineTo(s.x, s.y);
    ctx.closePath();
    ctx.fill();
    // Pedestal ring.
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuards(ctx, level) {
  for (const g of level.guards) {
    drawCone(
      ctx, g.x, g.y, g.facing, GUARD_HALF_ANGLE, GUARD_RANGE,
      g.seesThief ? COLORS.coneSeen : COLORS.cone,
      g.seesThief ? 'rgba(255,80,80,0.7)' : 'rgba(255,214,90,0.45)',
    );
  }
  for (const g of level.guards) {
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim points where the guard looks.
    ctx.fillStyle = COLORS.guardCap;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 6, g.y + Math.sin(g.facing) * 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing - 0.4) * 6, g.y + Math.sin(g.facing - 0.4) * 6, 2, 0, Math.PI * 2);
    ctx.arc(g.x + Math.cos(g.facing + 0.4) * 6, g.y + Math.sin(g.facing + 0.4) * 6, 2, 0, Math.PI * 2);
    ctx.fill();
    if (g.seesThief) {
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 24);
    }
  }
}

function drawCameras(ctx, level, now) {
  for (const c of level.cameras) {
    drawCone(
      ctx, c.x, c.y, c.angle, CAM_HALF_ANGLE, CAM_RANGE,
      c.seesThief ? COLORS.camConeSeen : COLORS.camCone,
      c.seesThief ? 'rgba(255,80,80,0.6)' : 'rgba(120,220,255,0.4)',
    );
  }
  for (const c of level.cameras) {
    ctx.fillStyle = '#20262e';
    ctx.fillRect(c.x - 11, c.y - 8, 22, 16);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x - 11, c.y - 8, 22, 16);
    ctx.fillStyle = c.seesThief ? '#ff4040' : '#ff5a5a';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
    if (c.seesThief) {
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', c.x, c.y - 20);
    }
  }
}

function drawThief(ctx, level, now, sneak) {
  const t = level.thief;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
  ctx.stroke();
  // Velvet mask across the eyes, facing the move direction.
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.facing);
  ctx.fillStyle = COLORS.mask;
  ctx.fillRect(2, -8, 12, 16);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(7, -4, 2, 0, Math.PI * 2);
  ctx.arc(7, 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (sneak) {
    ctx.strokeStyle = 'rgba(232,220,195,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawHud(ctx, view) {
  const { level, score, nerves, totalElapsed } = view;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('VELVET VAULT', 24, 24);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#b8a97f';
  ctx.fillText(level.def.name, 24, 52);

  // Loot pips: cases + sapphire.
  const lootTotal = level.loot.length + 1;
  const lootGot = level.loot.filter((l) => l.taken).length + (level.sapphire.taken ? 1 : 0);
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText('LOOT', 430, 24);
  for (let i = 0; i < lootTotal; i++) {
    const x = 490 + i * 26;
    const got = i < lootGot;
    ctx.fillStyle = got ? COLORS.loot : '#3a332a';
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + 8, 24);
    ctx.lineTo(x, 34);
    ctx.lineTo(x - 8, 24);
    ctx.closePath();
    ctx.fill();
    if (got) {
      ctx.strokeStyle = COLORS.gold;
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#b8a97f';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`${lootGot}/${lootTotal}`, 490 + lootTotal * 26 + 6, 24);

  // Alarm meter.
  const ax = 700;
  const ay = 16;
  const aw = 250;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 24);
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(ax + 70, ay, aw, 18);
  const frac = Math.max(0, Math.min(1, level.alarm / 100));
  const alarmColor = frac < 0.4 ? '#39d98a' : frac < 0.7 ? '#ffb020' : '#ff4040';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax + 70, ay, aw * frac, 18);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax + 70, ay, aw, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(level.alarm)}%`, ax + 70 + aw / 2, ay + 9);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#b8a97f';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(level.seen ? 'SPOTTED — HIDE!' : 'unseen', ax + 70, 52);

  // Score, timer, nerves.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`SCORE ${score}`, VIEW_W - 24, 24);
  const mins = Math.floor(totalElapsed / 60);
  const secs = Math.floor(totalElapsed % 60);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`TIME ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W - 24, 52);
  ctx.fillStyle = '#ff6b81';
  ctx.font = '18px system-ui, sans-serif';
  let hearts = '';
  for (let i = 0; i < nerves; i++) hearts += '♥ ';
  ctx.fillText(hearts.trim(), VIEW_W - 190, 24);
}

function drawFooter(ctx) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, VIEW_H - FOOT_H, VIEW_W, FOOT_H);
  ctx.fillStyle = '#b8a97f';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'WASD / arrows or click to move  •  Shift to sneak  •  P pause  •  M mute  •  R restart room',
    VIEW_W / 2, VIEW_H - FOOT_H / 2,
  );
}

function drawBanner(ctx, view, now) {
  const b = view.banner;
  if (!b || now > b.until) return;
  const blink = b.blink ? (Math.floor(now / 180) % 2 === 0 ? 1 : 0.25) : 1;
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 18;
  ctx.fillText(b.text, VIEW_W / 2, 150);
  ctx.restore();
}

function drawButton(ctx, b, hover) {
  ctx.fillStyle = hover ? '#c9a227' : '#2a2118';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = hover ? '#171310' : COLORS.hudText;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 6, 5, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
}

export function render(ctx, view, now) {
  const { mode, level } = view;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0b0908';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const inGame = ['playing', 'paused', 'caught', 'gameover', 'levelclear', 'win', 'shot'].includes(mode);
  if (inGame && level) {
    drawFloor(ctx);
    drawObstacles(ctx, level);
    drawLoot(ctx, level, now);
    drawCameras(ctx, level, now);
    drawGuards(ctx, level);
    drawThief(ctx, level, now, view.sneak);
    if (view.moveTarget) {
      const pulse = 5 + 2 * Math.sin(now / 150);
      ctx.strokeStyle = 'rgba(232,220,195,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(view.moveTarget.x, view.moveTarget.y, pulse + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawWalls(ctx, level);
    drawHud(ctx, view);
    drawFooter(ctx);
    drawBanner(ctx, view, now);
  }

  if (mode === 'title' || mode === 'how') {
    overlay(ctx, 0.82);
    centerText(ctx, 'VELVET VAULT', 150, 'bold 72px Georgia, serif', COLORS.gold);
    centerText(ctx, '— A MIDNIGHT HEIST —', 210, 'bold 22px system-ui, sans-serif', '#e8dcc3');
    if (mode === 'title') {
      centerText(ctx, 'The Marroway Gallery sleeps. Its sapphire does not.', 270, '18px system-ui, sans-serif', '#b8a97f');
      centerText(ctx, 'Sneak past the guards, dodge the cameras, take the Star Sapphire,', 300, '18px system-ui, sans-serif', '#b8a97f');
      centerText(ctx, 'and slip out before the alarm hits 100.', 328, '18px system-ui, sans-serif', '#b8a97f');
      if (view.best > 0) {
        centerText(ctx, `BEST HEIST: ${view.best} PTS`, 380, 'bold 18px system-ui, sans-serif', COLORS.loot);
      }
      centerText(ctx, 'Three rooms. Three nerves. One sapphire each.', 430, '16px system-ui, sans-serif', '#8a7d63');
    } else {
      const lines = [
        'MOVE — WASD / arrow keys, or click the floor to walk there',
        'SNEAK — hold Shift: slower, but the alarm rises half as fast',
        'VISION — guards and cameras see inside their cones; walls and cases block sight',
        'ALARM — rises while you are seen, cools while you hide; at 100 you are caught',
        'LOOT — cases are +100; the Star Sapphire is +500 and opens the exit',
        'WIN — grab the sapphire, reach the glowing EXIT, clear all three rooms',
        'PAUSE — P or Esc   •   MUTE — M   •   RESTART ROOM — R',
      ];
      lines.forEach((l, i) => centerText(ctx, l, 290 + i * 38, '17px system-ui, sans-serif', '#e8dcc3'));
    }
  }

  if (mode === 'paused') {
    overlay(ctx, 0.6);
    centerText(ctx, 'PAUSED', 300, 'bold 54px Georgia, serif', COLORS.gold);
    centerText(ctx, 'The guards wait. So does the sapphire.', 360, '18px system-ui, sans-serif', '#e8dcc3');
  }

  if (mode === 'caught') {
    overlay(ctx, 0.55);
    centerText(ctx, 'CAUGHT!', 300, 'bold 54px Georgia, serif', '#ff4040');
    centerText(ctx, 'The alarm hit 100. The guards found Wren in the gallery.', 360, '18px system-ui, sans-serif', '#e8dcc3');
    centerText(ctx, `Nerves left: ${view.nerves}`, 400, 'bold 20px system-ui, sans-serif', '#ff6b81');
  }

  if (mode === 'gameover') {
    overlay(ctx, 0.75);
    centerText(ctx, 'THE HEIST FAILS', 300, 'bold 54px Georgia, serif', '#ff4040');
    centerText(ctx, 'No nerves left. The Marroway Gallery keeps its sapphire — this time.', 360, '18px system-ui, sans-serif', '#e8dcc3');
    centerText(ctx, `Final score: ${view.score} pts`, 410, 'bold 22px system-ui, sans-serif', COLORS.loot);
  }

  if (mode === 'levelclear') {
    overlay(ctx, 0.45);
    centerText(ctx, 'ROOM CLEARED', 300, 'bold 54px Georgia, serif', COLORS.exit);
    centerText(ctx, view.levelClearText || '', 360, '18px system-ui, sans-serif', '#e8dcc3');
    centerText(ctx, `Score: ${view.score} pts`, 400, 'bold 22px system-ui, sans-serif', COLORS.loot);
  }

  if (mode === 'win') {
    overlay(ctx, 0.7);
    centerText(ctx, 'THE PERFECT HEIST', 260, 'bold 58px Georgia, serif', COLORS.gold);
    centerText(ctx, 'Three rooms. Three sapphires. Not a single guard the wiser.', 330, '18px system-ui, sans-serif', '#e8dcc3');
    centerText(ctx, `Final score: ${view.score} pts`, 390, 'bold 26px system-ui, sans-serif', COLORS.loot);
    const mins = Math.floor(view.totalElapsed / 60);
    const secs = Math.floor(view.totalElapsed % 60);
    centerText(ctx, `Total time ${mins}:${String(secs).padStart(2, '0')}  •  ${view.rank}`, 430, '18px system-ui, sans-serif', '#e8dcc3');
    if (view.best > 0) centerText(ctx, `Best heist: ${view.best} pts`, 465, '16px system-ui, sans-serif', '#b8a97f');
  }

  for (const b of buttonsFor(mode)) drawButton(ctx, b, view.hoverButton === b.id);
}
