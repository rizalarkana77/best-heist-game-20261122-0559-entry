// Velvet Vault — all sound is synthesized with WebAudio: no audio files,
// no network. A tiny helper builds short tones; the game calls the named
// effects (pickup, spotted, siren, win, caught, click).
let ctx = null;
let muted = false;
let sirenNodes = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSiren();
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxClick() {
  tone(620, 0.06, 'triangle', 0.08);
}

export function sfxPickup() {
  tone(880, 0.09, 'sine', 0.12);
  tone(1318, 0.14, 'sine', 0.1, 0.07);
}

export function sfxSapphire() {
  tone(660, 0.1, 'sine', 0.12);
  tone(990, 0.1, 'sine', 0.12, 0.08);
  tone(1320, 0.22, 'sine', 0.12, 0.16);
}

export function sfxSpotted() {
  tone(220, 0.16, 'square', 0.09, 0, 440);
}

export function sfxCaught() {
  tone(330, 0.5, 'sawtooth', 0.1, 0, 110);
}

export function sfxWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.11, i * 0.09));
}

export function sfxExitOpen() {
  tone(392, 0.12, 'triangle', 0.1);
  tone(587, 0.2, 'triangle', 0.1, 0.1);
}

// A soft two-tone siren that runs while the alarm is high; start/stop only.
export function startSiren() {
  if (muted || sirenNodes) return;
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 620;
  lfo.type = 'sine';
  lfo.frequency.value = 1.6;
  lfoGain.gain.value = 180;
  g.gain.value = 0.035;
  lfo.connect(lfoGain).connect(osc.frequency);
  osc.connect(g).connect(ac.destination);
  osc.start();
  lfo.start();
  sirenNodes = { osc, lfo, g };
}

export function stopSiren() {
  if (!sirenNodes) return;
  try {
    sirenNodes.g.gain.setValueAtTime(0.0001, ctx.currentTime);
    sirenNodes.osc.stop(ctx.currentTime + 0.1);
    sirenNodes.lfo.stop(ctx.currentTime + 0.1);
  } catch {
    // already stopped
  }
  sirenNodes = null;
}
