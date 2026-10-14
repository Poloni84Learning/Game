// Layout hình học bàn cờ: ánh xạ r (ô vòng) / p (đường về) / chuồng → tọa độ tile.
// Canvas 19×19 tiles: bàn 15×15 ở giữa (offset 2), chuồng 2×2 ở 4 góc ngoài.
// TILE 48 = asset V4 48 native pixels × SPR 1. Geometry and input coordinates unchanged.
import { ARC_LEN, RING } from '../data/board.ts';

export const TILE = 48;
export const GRID = 19;          // 19×19 tiles
export const OFFSET = 2;         // bàn 15×15 đặt tại (2,2)
export const BOARD = 15;         // lưới bàn

export interface Tile { col: number; row: number; }

// 52 ô vòng quanh mép bàn: cạnh trên (đi phải) → phải (xuống) → dưới (trái) → trái (lên).
// Mỗi cạnh 13 ô: cols/rows 1..13 của cạnh (góc 15×15 trống cho chuồng gần).
function buildRing(): Tile[] {
  const t: Tile[] = [];
  for (let c = 1; c <= 13; c++) t.push({ col: c, row: 0 });            // r0..r12 Bắc
  for (let r = 1; r <= 13; r++) t.push({ col: 14, row: r });           // r13..r25 Đông
  for (let c = 13; c >= 1; c--) t.push({ col: c, row: 14 });           // r26..r38 Nam
  for (let r = 13; r >= 1; r--) t.push({ col: 0, row: r });            // r39..r51 Tây
  return t;
}
export const RING_TILES: readonly Tile[] = buildRing();

// Chuồng 4 phe: khối 2×2 tại 4 góc canvas NGOÀI lưới bàn — toạ độ BOARD (âm/≥BOARD)
// để khớp trực tiếp clickTarget sau khi trừ OFFSET. Phe 0 Bắc-TL, 1 Đông-TR, 2 Nam-BR, 3 Tây-BL
// (thứ tự Bắc→Đông→Nam→Tây theo GDD §2.1).
export const PEN_TILES: readonly Tile[] = [
  { col: -2, row: -2 }, { col: 15, row: -2 }, { col: 15, row: 15 }, { col: -2, row: 15 },
];

function buildHome(player: number): Tile[] {
  const c = 7; // cột giữa
  const rot = (col: number, row: number, k: number): Tile => {
    for (let i = 0; i < k; i++) { const t = col; col = BOARD - 1 - row; row = t; }
    return { col, row };
  };
  const tiles: Tile[] = [];
  for (let i = 1; i <= 5; i++) tiles.push(rot(c, i, player)); // (7,1)..(7,5) xoay theo phe
  return tiles;
}
export const HOME_TILES: readonly Tile[][] = [0, 1, 2, 3].map(buildHome);
export const GOAL_TILE: Tile = { col: 7, row: 7 };

// Tile của quân: zone pen → ô chuồng theo slot quân; track → ring; home → đường về; goal → tâm.
export function tileOf(player: number, zone: string, p: number, pieceId: number): Tile {
  if (zone === 'pen') {
    const base = PEN_TILES[player];
    // 4 slot trong chuồng 2×2: quân 0..3 → TL,TR,BL,BR
    return { col: base.col + (pieceId % 2), row: base.row + Math.floor(pieceId / 2) };
  }
  if (zone === 'track') return RING_TILES[p] ?? RING_TILES[0];
  if (zone === 'home') return HOME_TILES[player][Math.min(4, p - 52)] ?? GOAL_TILE;
  return GOAL_TILE;
}

// Vùng nền tile theo r: cung k = r/13 (Bắc rừng B01, Đông sa mạc B02, Nam thung lũng B03, Tây băng B04).
export function regionTileOf(r: number): number {
  return Math.floor(r / ARC_LEN) + 1; // B01..B04
}

export function px(col: number, row: number): { x: number; y: number } {
  return { x: (col + OFFSET) * TILE, y: (row + OFFSET) * TILE };
}

export const CANVAS_W = GRID * TILE;
export const CANVAS_H = GRID * TILE;

// Mã màu phe (khớp PALETTE contract r/f/l/u → player 0..3).
export const PLAYER_HEX: readonly string[] = ['#e77b68', '#e2b563', '#7bb58b', '#89bad1'];

export const RING_COUNT = RING;
