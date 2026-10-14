// Audio: Web Audio tổng hợp — beep/swoosh/impact (0 asset, GDD §5.2).
let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, when = 0): void {
  const a = ac();
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  roll(): void { tone(300, 0.08, 'square'); tone(420, 0.08, 'square', 0.06, 0.08); },
  move(): void { tone(520, 0.06, 'triangle', 0.06); },
  hit(): void { tone(160, 0.15, 'sawtooth', 0.1); tone(90, 0.2, 'square', 0.08, 0.05); },
  crit(): void { tone(880, 0.1, 'sawtooth', 0.12); tone(1320, 0.15, 'square', 0.1, 0.08); },
  goal(): void { tone(523, 0.1, 'triangle', 0.09); tone(659, 0.1, 'triangle', 0.09, 0.1); tone(784, 0.18, 'triangle', 0.1, 0.2); },
  win(): void { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, i * 0.14)); },
  error(): void { tone(140, 0.12, 'square', 0.07); },
};
