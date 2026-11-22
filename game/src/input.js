// Velvet Vault — keyboard and mouse input.
// Keys: WASD / arrows to move, Shift to sneak, P or Esc to pause, M to mute,
// R to restart the level, Enter / Space to confirm on menus.
// Mouse: click a floor spot to walk there; click menu buttons to use them.
// The canvas is scaled to fit the window, so mouse positions are mapped back
// into the game's 1280x800 coordinate space.
import { VIEW_W, VIEW_H } from './config.js';

export function createInput(canvas, hooks) {
  const keys = new Set();
  const state = {
    keys,
    moveTarget: null, // {x, y} in game coordinates, or null
    click: null, // last click {x, y} in game coordinates, consumed by the game
  };

  function toGame(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) return;
    keys.add(k);
    if (k === 'p' || k === 'escape') hooks.onPause();
    if (k === 'm') hooks.onMute();
    if (k === 'r') hooks.onRestart();
    if (k === 'enter' || k === ' ') hooks.onConfirm();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const p = toGame(e);
    state.click = p;
    // A floor click is a walk order unless the game is on a menu screen.
    if (hooks.onFloorClick(p)) state.moveTarget = p;
  });

  return state;
}

// Resolve the current movement direction from keys (1) or a click target (2).
// Returns {dx, dy, sneak} with dx/dy normalized, or null when idle.
export function moveVector(input, tx, ty) {
  const k = input.keys;
  let dx = 0;
  let dy = 0;
  if (k.has('a') || k.has('arrowleft')) dx -= 1;
  if (k.has('d') || k.has('arrowright')) dx += 1;
  if (k.has('w') || k.has('arrowup')) dy -= 1;
  if (k.has('s') || k.has('arrowdown')) dy += 1;
  if (dx || dy) {
    input.moveTarget = null;
    const len = Math.hypot(dx, dy);
    return { dx: dx / len, dy: dy / len, sneak: k.has('shift') };
  }
  const t = input.moveTarget;
  if (t) {
    const ddx = t.x - tx;
    const ddy = t.y - ty;
    const len = Math.hypot(ddx, ddy);
    if (len < 6) {
      input.moveTarget = null;
      return null;
    }
    return { dx: ddx / len, dy: ddy / len, sneak: k.has('shift') };
  }
  return null;
}
