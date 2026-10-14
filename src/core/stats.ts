// Pipeline tính chỉ số 10 tầng (GDD §5.4) — đầu vào quân + state, đầu ra StatBlock + ModLine[].
import type { GameState, ModLine, Piece, StatBlock } from './types.ts';
import type { CoreId } from './types.ts';
import { CLASSES, levelGains } from '../data/classes.ts';
import { TRIBES } from '../data/tribes.ts';
import { regionOfP } from '../data/board.ts';
import type { RegionId } from './types.ts';

export interface PieceStats {
  stats: StatBlock;      // hp đã kèm maxHp (hp field = max hiệu chỉnh)
  atk: number;
  def: number;
  mods: ModLine[];       // breakdown từng tầng cho tooltip
  maxHp: number;
  region: RegionId;
}

// Tầng 5: cộng hưởng tộc theo SỐ QUÂN TRÊN SÂN (vòng + đường về + đích; không chuồng).
export function onBoardCount(g: GameState, player: number): number {
  return g.players[player].pieces.filter(
    (pc) => pc.pos.zone === 'track' || pc.pos.zone === 'goal',
  ).length;
}

// Tầng 6: Tàn Đoàn = số quân CÒN CHẠY (vòng + đường về; không đích, không chuồng).
export function marchingCount(g: GameState, player: number): number {
  return g.players[player].pieces.filter((pc) => pc.pos.zone === 'track').length;
}

export function hasCore(piece: Piece, g: GameState, core: CoreId): boolean {
  return g.players[piece.player].cores.includes(core);
}

// Quân "Vua Cô Độc": cách mọi đồng minh trên sân ≥ 4 ô (đo theo p cùng phe; đồng minh chuồng/đích bỏ qua).
export function isLoneKing(piece: Piece, g: GameState): boolean {
  if (piece.pos.zone !== 'track') return false;
  const allies = g.players[piece.player].pieces.filter(
    (o) => o.id !== piece.id && o.pos.zone === 'track',
  );
  return allies.every((o) => {
    const a = piece.pos.zone === 'track' ? piece.pos.p : -1;
    const b = o.pos.zone === 'track' ? o.pos.p : -1;
    return Math.abs(a - b) >= 4;
  });
}

// Đầy đủ 10 tầng: gốc hệ → tộc cá nhân → cấp → item → cộng hưởng tộc → (hệ: draft chuẩn bỏ)
// → Tàn Đoàn → lõi → vùng+đền → hiệu chỉnh tạm (shieldWall không đổi chỉ số; battlefield buffs khác xử lý ở battle).
export function computeStats(g: GameState, piece: Piece): PieceStats {
  const mods: ModLine[] = [];
  const base = CLASSES[piece.cls].base;
  let hp = base.hp, atk = base.atk, def = base.def;
  mods.push({ source: 'class', label: CLASSES[piece.cls].name, amount: 0 });

  // Tộc cá nhân
  const tribe = TRIBES[piece.tribe];
  if (tribe.personal.hp) { hp += tribe.personal.hp; mods.push({ source: 'tribe', label: `${tribe.name} +HP`, amount: tribe.personal.hp }); }
  if (tribe.personal.atk) { atk += tribe.personal.atk; mods.push({ source: 'tribe', label: `${tribe.name} +ATK`, amount: tribe.personal.atk }); }
  if (tribe.personal.def) { def += tribe.personal.def; mods.push({ source: 'tribe', label: `${tribe.name} +DEF`, amount: tribe.personal.def }); }

  // Cấp
  const lv = levelGains(piece.level);
  hp += lv.hp; atk += lv.atk;
  mods.push({ source: 'level', label: `Cấp ${piece.level}`, amount: lv.hp + lv.atk });

  // Item (max 2)
  for (const it of piece.items) {
    if (it === 'sword') { atk += 2; mods.push({ source: 'item', label: 'Kiếm', amount: 2 }); }
    if (it === 'shield') { def += 2; mods.push({ source: 'item', label: 'Khiên', amount: 2 }); }
  }

  // Cộng hưởng tộc (2/4 quân trên sân)
  const onBoard = onBoardCount(g, piece.player);
  if (piece.tribe === 'human') {
    if (onBoard >= 2) { def += 1; mods.push({ source: 'resonance', label: 'Người res2 +DEF', amount: 1 }); }
    // res4 hồi HP xử lý đầu lượt ở turn.ts, không phải stat.
  }
  if (piece.tribe === 'elf' && onBoard >= 2) {
    mods.push({ source: 'resonance', label: 'Tiên Linh res2 CD−1', amount: 0 }); // hiệu chỉnh CD ở turn.ts
  }
  if (piece.tribe === 'demon' && onBoard >= 2) {
    mods.push({ source: 'resonance', label: 'Yêu res2 thắng hồi 2', amount: 0 }); // hiệu ứng giao tranh ở battle.ts
  }
  if (piece.tribe === 'dragon' && onBoard >= 2) {
    mods.push({ source: 'resonance', label: 'Long res2 ra chuồng ≥5', amount: 0 }); // turn.ts
  }
  if (onBoard >= 4) {
    if (piece.tribe === 'demon') mods.push({ source: 'resonance', label: 'Yêu res4 +2 roll tấn công', amount: 0 }); // battle.ts
    if (piece.tribe === 'human') mods.push({ source: 'resonance', label: 'Người res4 hồi 1 đầu lượt', amount: 0 });
    if (piece.tribe === 'elf') mods.push({ source: 'resonance', label: 'Tiên Linh res4 hoán đổi', amount: 0 });
    if (piece.tribe === 'dragon') mods.push({ source: 'resonance', label: 'Long res4 tung 6 thêm 3 ô', amount: 0 });
  }

  // Tầng 7: Tàn Đoàn (đếm theo quân CÒN CHẠY; buff chỉ áp cho quân đang chạy)
  const marching = marchingCount(g, piece.player);
  if (piece.pos.zone === 'track') {
    if (marching === 1) {
      atk += 2; def += 2;
      mods.push({ source: 'march', label: 'Tàn Đoàn +2/+2', amount: 2 });
    } else if (marching >= 2) {
      atk += marching; // +1 ATK mỗi quân
      mods.push({ source: 'march', label: `Tàn Đoàn +${marching} ATK`, amount: marching });
    }
  }

  // Tầng 8: lõi
  if (hasCore(piece, g, 'bloodPact')) {
    atk += 3; hp -= 2;
    mods.push({ source: 'core', label: 'Khế Máu +3 ATK / −2 maxHP', amount: 3 });
  }
  if (hasCore(piece, g, 'nightTorch')) {
    atk += 1;
    mods.push({ source: 'core', label: 'Đuốc Bóng Đêm +1 ATK', amount: 1 });
  }
  if (hasCore(piece, g, 'loneKing') && isLoneKing(piece, g)) {
    atk += 2; def += 2;
    mods.push({ source: 'core', label: 'Vua Cô Độc +2/+2', amount: 2 });
  }

  // Tầng 9: vùng + đền (đền +1 ATK cả 2 chiều xử lý ở battle; vùng theo ô quân)
  const region = piece.pos.zone === 'track' ? regionOfP(piece.player, piece.pos.p) : null;
  if (region === 'forest' && piece.tribe === 'elf') {
    def += 1;
    mods.push({ source: 'region', label: 'Tiên Linh trong rừng +1 DEF', amount: 1 });
  }
  if (region === 'desert' && piece.tribe === 'demon') {
    atk += 1;
    mods.push({ source: 'region', label: 'Yêu trong sa mạc +1 ATK', amount: 1 });
  }
  if (region === 'ice' && piece.tribe === 'dragon') {
    def += 1;
    mods.push({ source: 'region', label: 'Long trong vực +1 DEF', amount: 1 });
  }

  // Tầng 10: hiệu chỉnh tạm (skipNextMove không đổi chỉ số; frozenTurns tương tự).

  return { stats: { hp, atk, def }, atk, def, mods, maxHp: hp, region: region ?? 'forest' };
}
