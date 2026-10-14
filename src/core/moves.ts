// Nước đi hợp lệ (GDD §2.2, §2.3): ra chuồng, đi vòng, đường về, đích đúng số, Xạ Kích.
import type { GameState, Piece, PiecePos } from './types.ts';
import { RING, TRACK_END, GOAL_P, ringIndexOf, isStar, regionOfP } from '../data/board.ts';

// Ô vòng r mà quân đang đứng (chỉ quân trên vòng mới chặn/bắt được).
export function ringCellOf(pc: Piece): number | null {
  return pc.pos.zone === 'track' && pc.pos.p <= TRACK_END
    ? ringIndexOf(pc.player, pc.pos.p)
    : null;
}

// Mọi quân đang đứng trên ô vòng r (có thể chồng nhiều quân / nhiều phe).
export function piecesAtRing(g: GameState, r: number): Piece[] {
  const out: Piece[] = [];
  for (const pl of g.players) {
    for (const pc of pl.pieces) {
      if (ringCellOf(pc) === r) out.push(pc);
    }
  }
  return out;
}

// Về đích: cần đúng số bước 57 − p. Thừa → quân đó không có nước này.
export function exactGoalSteps(pc: Piece): number | null {
  return pc.pos.zone === 'track' ? GOAL_P - pc.pos.p : null;
}

// Ra chuồng: ngưỡng tung (Long cộng hưởng 2 quân trên sân → ≥5, mặc định 6).
export function canDeployThreshold(g: GameState, player: number): number {
  const pl = g.players[player];
  const dragons = pl.pieces.filter((pc) => pc.tribe === 'dragon');
  const dragonOnBoard = dragons.filter((pc) => pc.pos.zone !== 'pen').length;
  if (dragons.length === pl.pieces.length && dragonOnBoard >= 2) return 5;
  return 6;
}

export function canDeploy(g: GameState, player: number, die: number): boolean {
  return die >= canDeployThreshold(g, player);
}

// Liệt kê quân có nước hợp lệ với die hiện tại (skip/frozen/goal bị loại).
export function movablePieces(g: GameState, player: number, die: number): Piece[] {
  const out: Piece[] = [];
  for (const pc of g.players[player].pieces) {
    if (pc.skipTurns > 0 || pc.frozenTurns > 0) continue;
    if (pc.pos.zone === 'pen') {
      if (canDeploy(g, player, die)) out.push(pc);
      continue;
    }
    if (pc.pos.zone === 'goal') continue;
    // Exact-goal: quân cần đúng 57−p; die thừa → quân đó không có nước.
    const need = exactGoalSteps(pc);
    if (need !== null && die > need) continue;
    out.push(pc);
  }
  return out;
}

// Đích đến p mới của quân khi đi `steps` (chỉ track; clamp tại GOAL_P).
export function destination(pc: Piece, steps: number): PiecePos {
  if (pc.pos.zone !== 'track') return pc.pos;
  return { zone: 'track', p: Math.min(GOAL_P, pc.pos.p + steps) };
}

// Xạ Kích: mục tiêu địch cách 3–5 ô theo ĐƯỜNG VÒNG tính tiến từ cung thủ.
// Ô sao miễn XK; quân mục tiêu đứng trong rừng → chặn.
export function xkTargets(g: GameState, archer: Piece): Piece[] {
  if (archer.cls !== 'archer' || archer.pos.zone !== 'track') return [];
  if (archer.pos.p > TRACK_END) return []; // không bắn từ đường về
  const from = ringIndexOf(archer.player, archer.pos.p);
  const out: Piece[] = [];
  for (let d = 3; d <= 5; d++) {
    const r = (from + d) % RING;
    if (isStar(r)) continue;
    for (const tgt of piecesAtRing(g, r)) {
      if (tgt.player === archer.player) continue;
      if (tgt.pos.zone === 'track' && tgt.pos.p <= TRACK_END
        && regionOfP(tgt.player, tgt.pos.p) === 'forest') continue;
      out.push(tgt);
    }
  }
  return out;
}

// Chiếm ô: địch trên ô đích → giao tranh (D2: attacker chọn 1 nếu chồng nhiều địch).
export function enemiesAtDest(g: GameState, player: number, destP: number): Piece[] {
  if (destP > TRACK_END) return []; // đường về/đích không gặp địch
  return piecesAtRing(g, ringIndexOf(player, destP)).filter((pc) => pc.player !== player);
}

// Đồng minh trên ô đích (GDD cho phép quân mình chồng; dùng cho UI + Vua Cô Độc khoảng cách).
export function alliesAtDest(g: GameState, player: number, destP: number): Piece[] {
  if (destP > TRACK_END) return [];
  return piecesAtRing(g, ringIndexOf(player, destP)).filter((pc) => pc.player === player);
}

// Kiểm tra nước đi: trả về lỗi nếu không hợp lệ.
export function validateMove(
  g: GameState, player: number, pieceId: number, die: number,
): { ok: true; piece: Piece; dest: number } | { ok: false; error: string } {
  const pc = g.players[player].pieces.find((x) => x.id === pieceId);
  if (!pc) return { ok: false, error: 'Quân không tồn tại' };
  if (pc.skipTurns > 0) return { ok: false, error: 'Quân bị bẫy/Bắn Chân: mất lượt di' };
  if (pc.frozenTurns > 0) return { ok: false, error: 'Quân bị Trói Trận' };
  if (pc.pos.zone === 'goal') return { ok: false, error: 'Quân đã về đích' };
  if (pc.pos.zone === 'pen') {
    if (!canDeploy(g, player, die)) {
      return { ok: false, error: `Cần tung ${canDeployThreshold(g, player)} để ra chuồng` };
    }
    return { ok: true, piece: pc, dest: 0 };
  }
  const need = exactGoalSteps(pc);
  if (need !== null && die > need) {
    return { ok: false, error: `Về đích cần đúng ${need} (tung ${die} thừa)` };
  }
  const dest = Math.min(GOAL_P, pc.pos.p + die);
  return { ok: true, piece: pc, dest };
}
