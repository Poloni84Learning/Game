// Data: bố cục bàn cờ — 52 ô vòng, ô đặc biệt, ánh xạ p↔r (GDD §2.1, §4.1).
// Core chỉ cam kết ánh xạ p↔r + ô đặc biệt; tọa độ pixel vẽ thuộc phần render.
import type { RegionId, SpecialCell } from '../core/types.ts';

export const RING = 52;        // số ô đường vòng
export const TRACK_END = 51;   // p = 0..51 là ô vòng
export const HOME_LEN = 5;     // p = 52..56: 5 ô đường về
export const GOAL_P = 57;      // p = 57: ô đích
export const ARCS = 4;         // 4 cung × 13 ô
export const ARC_LEN = 13;

// Cung k (Bắc=0 Rừng, Đông=1 Sa Mạc, Nam=2 Thung Lũng, Tây=3 Vực Băng).
export function arcOfRing(r: number): number {
  return Math.floor(r / ARC_LEN); // công thức cung, dùng lại ở moves (khoảng cách Xạ Kích)
}

export function regionOfRing(r: number): RegionId {
  return REGIONS_BY_ARC[arcOfRing(r)];
}

// p (góc nhìn phe i, 0..51) -> r ô vòng: r = (13i + p) mod 52.
export function ringIndexOf(player: number, p: number): number {
  return (ARC_LEN * player + p) % RING;
}

// r -> p của phe i: p = (r − 13i) mod 52.
export function progressOfRing(player: number, r: number): number {
  return ((r - ARC_LEN * player) % RING + RING) % RING;
}

// Vùng của quân phe i theo p. Đường về mang màu cung xuất phát của phe.
export function regionOfP(player: number, p: number): RegionId {
  return p > TRACK_END
    ? REGIONS_BY_ARC[player]
    : regionOfRing(ringIndexOf(player, p));
}

const REGIONS_BY_ARC: readonly RegionId[] = ['forest', 'desert', 'valley', 'ice'] as const;

// ===== 24 ô đặc biệt theo offset trong cung (GDD §4.1) =====
// offset 0: sao (4) | 3: rương (4) | 5: bẫy (4) | 6: đền (4)
// 8: sao giữa cung (4) | 10: Bắc&Nam hồi đầy (2), Đông&Tây bẫy (2)
function buildSpecials(): Map<number, SpecialCell> {
  const m = new Map<number, SpecialCell>(); // number-keyed, dựng động → Map hợp lệ
  for (let k = 0; k < ARCS; k++) {
    const base = k * ARC_LEN;
    m.set(base + 0, 'star');
    m.set(base + 3, 'chest');
    m.set(base + 5, 'trap');
    m.set(base + 6, 'temple');
    m.set(base + 8, 'star');
    m.set(base + 10, k === 0 || k === 2 ? 'heal' : 'trap');
  }
  return m;
}

export const SPECIALS: ReadonlyMap<number, SpecialCell> = buildSpecials();

// Domain API dùng chung moves/turn/battle (ô an toàn, hiệu ứng đáp ô).
export function specialAt(r: number): SpecialCell | null {
  return SPECIALS.get(r) ?? null;
}
export function isStar(r: number): boolean {
  return SPECIALS.get(r) === 'star';
}
export function isTemple(r: number): boolean {
  return SPECIALS.get(r) === 'temple';
}

// 8 ô sao cố định: r ≡ 0 hoặc 8 (mod 13).
export const STARS: readonly number[] = Array.from(SPECIALS.entries())
  .filter(([, t]) => t === 'star')
  .map(([r]) => r)
  .sort((a, b) => a - b);
