// Giao tranh (GDD §2.4 + quyết định D4/D5/D6/D9).
// attackerScore = d6 + ATK + mod [+crit ×2 d6]; defenderScore = d6 + DEF + 1 + mod. Hòa nghiêng thủ.
import type { BattleResult, BattleSide, GameState, ModLine, Piece, RegionId } from './types.ts';
import { nextRandom, rollD6 } from './rng.ts';
import { computeStats, hasCore } from './stats.ts';
import { regionOfP, ringIndexOf, isTemple } from '../data/board.ts';

export interface BattleContext {
  attacker: Piece;
  defender: Piece;
  isXk: boolean;          // Xạ Kích: khởi phát từ bắn, không crit
  forceNoCrit?: boolean;  // Tam Tiễn: mỗi phát không crit
  fixedAttackerD6?: number; // Prophet Eye: ép kết quả roll
  fixedDefenderD6?: number;
}

// Điểm roll thêm/trừ (không phải ATK/DEF): ice áp cho attacker khi mục tiêu đứng trong vực,
// Nợ Máu áp mọi roll của phe giữ lõi, Yêu res4 +2 khi tấn công.
function rollDelta(
  g: GameState, pc: Piece, isAttacker: boolean, targetRegion: RegionId | null,
): { delta: number; mods: ModLine[] } {
  let delta = 0;
  const mods: ModLine[] = [];

  // Vực băng: kẻ TẤN CÔNG quân đứng trong vực −1 (Long miễn 2 chiều).
  if (isAttacker && targetRegion === 'ice' && pc.tribe !== 'dragon') {
    delta -= 1;
    mods.push({ source: 'region', label: 'Vực băng −1 roll', amount: -1 });
  }

  // Yêu res4: +2 điểm roll khi TẤN CÔNG.
  const onBoard = g.players[pc.player].pieces.filter((p) => p.pos.zone !== 'pen').length;
  if (isAttacker && pc.tribe === 'demon' && onBoard >= 4) {
    delta += 2;
    mods.push({ source: 'resonance', label: 'Yêu res4 +2 roll', amount: 2 });
  }

  // Nợ Máu: mọi roll của phe giữ lõi −1.
  if (hasCore(pc, g, 'bloodDebt')) {
    delta -= 1;
    mods.push({ source: 'core', label: 'Nợ Máu −1 roll', amount: -1 });
  }

  return { delta, mods };
}

function side(
  g: GameState, pc: Piece, d6: number, isAttacker: boolean,
  targetRegion: RegionId | null,
): BattleSide {
  const st = computeStats(g, pc);
  const mods: ModLine[] = [...st.mods];
  let atk = st.atk;
  let def = st.def;

  // Đền: quân đứng đúng ô đền → +1 ATK cả 2 chiều (đền là ô vòng r ≡ 6 mod 13).
  if (pc.pos.zone === 'track' && isTemple(ringIndexOf(pc.player, pc.pos.p))) {
    atk += 1;
    mods.push({ source: 'temple', label: 'Đền +1 ATK', amount: 1 });
  }

  // A different build rule, rather than a permanent stat bonus.
  if (isAttacker && hasCore(pc, g, 'punishingLight')) {
    mods.push({ source: 'core', label: 'Phán Quyết Bình Minh: DEF thay ATK', amount: def - atk });
    atk = def;
  }

  // Đuốc Bóng Đêm: +1 ATK thêm khi phe này là bên TẤN CÔNG.
  if (isAttacker && hasCore(pc, g, 'nightTorch')) {
    atk += 1;
    mods.push({ source: 'core', label: 'Đuốc tấn công +1 ATK', amount: 1 });
  }

  const { delta, mods: rollMods } = rollDelta(g, pc, isAttacker, targetRegion);
  mods.push(...rollMods);

  const total = d6 + (isAttacker ? atk : def + 1) + delta;
  return { pieceId: `P${pc.player}:${pc.id}`, d6, base: d6, mods, total };
}

// Chạy một giao tranh đầy đủ. Mutates g.rngState qua rollD6 (trừ khi fixed).
export function resolveBattle(g: GameState, ctx: BattleContext): BattleResult {
  const { attacker, defender } = ctx;

  const atkD6 = ctx.fixedAttackerD6 ?? rollD6(g);
  const defD6 = ctx.fixedDefenderD6 ?? rollD6(g);

  // Chí mạng Sát thủ: 25% ×2 điểm d6 (D4). Rừng chặn crit; XK/Tam Tiễn không crit.
  const defRegion = defender.pos.zone === 'track' ? regionOfP(defender.player, defender.pos.p) : null;
  let crit = false;
  let atkBase = atkD6;
  if (!ctx.isXk && !ctx.forceNoCrit && attacker.cls === 'assassin' && defRegion !== 'forest') {
    const r = nextRandom(g.rngState);
    g.rngState = r.state;
    crit = r.value < 0.25;
    if (crit) atkBase = atkD6 * 2; // ×2 điểm d6
  }

  const a = side(g, attacker, atkBase, true, defRegion);
  if (crit) {
    a.mods.push({ source: 'crit', label: 'Chí mạng ×2 d6', amount: atkD6 }); // d6 được nhân đôi
    a.d6 = atkBase;
  }
  const d = side(g, defender, defD6, false, null);

  // Hòa nghiêng thủ (D5): a.total >= d.total → attacker thắng.
  const outcome: 'attacker' | 'defender' = a.total >= d.total ? 'attacker' : 'defender';
  const attackerWon = outcome === 'attacker';

  // D5: thua thật → sát thương = chênh lệch (min 1); hòa → 0.
  const damage = attackerWon ? 0 : Math.max(1, d.total - a.total);

  // EXP (GDD §3.6): thắng 50 / thua 10; headHunter mất an ủi khi thua, +100 khi thắng địch cấp ≥ mình.
  let atkExp = attackerWon ? 50 : hasCore(attacker, g, 'headHunter') ? 0 : 10;
  let defExp = attackerWon ? (hasCore(defender, g, 'headHunter') ? 0 : 10) : 50;

  if (attackerWon && hasCore(attacker, g, 'headHunter') && defender.level >= attacker.level) atkExp += 100;
  if (!attackerWon && hasCore(defender, g, 'headHunter') && attacker.level >= defender.level) defExp += 100;

  return {
    attacker: a,
    defender: d,
    attackerIsArcherXk: ctx.isXk,
    crit,
    outcome,
    damage,
    expGained: { attacker: atkExp, defender: defExp },
  };
}
