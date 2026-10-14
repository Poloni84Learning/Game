// RNG seeded (mulberry32) — toàn bộ tính ngẫu nhiên đi qua đây để replay được.
import type { GameState } from './types.ts';

// Mulberry32: 32-bit, nhanh, chu kỳ đủ dài cho game board.
export function nextRandom(state: number): { state: number; value: number } {
  state = (state + 0x6d2b79f5) | 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { state, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

// Tung 1 xúc xắc 6 mặt, cập nhật rngState trong GameState.
export function rollD6(g: GameState): number {
  const r = nextRandom(g.rngState);
  g.rngState = r.state;
  return 1 + Math.floor(r.value * 6);
}
