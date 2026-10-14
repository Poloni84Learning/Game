// State machine lượt chơi (GDD §6): roll→move→resolve→battle→corePick→endTurn.
// Mọi mutation state đi qua đây; battle/moves chỉ tính toán thuần.
import type {
  ActionResult, BattleView, ClassId, CoreId, GameState, ItemId, LogEntry, Piece, Player, SkillId, TribeId,
} from './types.ts';
import { nextRandom, rollD6 } from './rng.ts';
import { computeStats, marchingCount, onBoardCount } from './stats.ts';
import { resolveBattle } from './battle.ts';
import {
  canDeployThreshold, enemiesAtDest, exactGoalSteps, movablePieces, validateMove, xkTargets,
} from './moves.ts';
import {
  ARC_LEN, GOAL_P, RING, TRACK_END, isStar, isTemple, regionOfRing, ringIndexOf, specialAt,
} from '../data/board.ts';
import { CLASSES, LEVEL_THRESHOLDS, MAX_LEVEL } from '../data/classes.ts';
import { TRIBES } from '../data/tribes.ts';
import { SKILLS } from '../data/skills.ts';
import { CORES } from '../data/cores.ts';
import { ITEMS } from '../data/items.ts';

// ===== Khởi tạo =====

export interface GameSetup {
  seed: number;
  players: { tribe: TribeId; classes: ClassId[] }[]; // 2..4 phe, 4 class không trùng
}

export function newGame(setup: GameSetup): GameState {
  const players = setup.players.map((pl, i) => ({
    id: i,
    tribe: pl.tribe,
    classes: pl.classes,
    pieces: pl.classes.map((cls, idx) => makePiece(i, idx, cls, pl.tribe)),
    cores: [],
    corePickPending: null,
    coreOffers: [],
    coreRerollUsed: {},
    coreFlags: {},
    sixStreak: 0,
    rollCount: 0,
    luckyRerollStock: 0,
    extraMoves: 0,
  }));
  const g: GameState = {
    seed: setup.seed,
    turn: 0,
    playerCount: players.length,
    players,
    phase: 'roll',
    current: 0,
    die: null,
    dieRolled: false,
    winner: null,
    openedChests: new Set(),
    battle: null,
    log: [],
    rngState: setup.seed | 0,
  };
  logSys(g, `Trận đấu bắt đầu — ${players.length} phe, seed ${setup.seed}`);
  return g;
}

function makePiece(player: number, id: number, cls: ClassId, tribe: TribeId): Piece {
  return {
    id, player, cls, tribe,
    level: 1, exp: 0, hp: CLASSES[cls].base.hp + (TRIBES[tribe].personal.hp ?? 0),
    items: [],
    pos: { zone: 'pen' },
    skillsLearned: [],
    skillCd: {},
    skipTurns: 0, frozenTurns: 0,
    shieldTurn: false, darkVeilTurn: false,
    legShotArmed: false, robArmed: false, chargeArmed: false, mirrorUsed: false,
  };
}

// ===== Log =====

function logEntry(g: GameState, kind: LogEntry['kind'], text: string, detail?: Record<string, unknown>): LogEntry {
  return { turn: g.turn, player: g.current, kind, text, detail };
}

function pushLog(g: GameState, e: LogEntry): void {
  g.log.push(e);
}

function logSys(g: GameState, text: string): void {
  g.log.push({ turn: g.turn, player: g.current, kind: 'system', text });
}

// ===== Phase: ROLL =====

// Tung xúc xắc cho phe hiện tại. Trả về die + các quân có nước.
export function doRoll(g: GameState): ActionResult {
  if (g.phase !== 'roll' || g.winner !== null) return err('Không phải phase roll');
  const pl = g.players[g.current];
  pl.rollCount += 1;
  const die = rollD6(g);
  g.die = die;
  g.dieRolled = true;

  pushLog(g, logEntry(g, 'roll', `Phe ${g.current + 1} (${TRIBES[pl.tribe].name}) tung được ${die}`));

  // Chuỗi 6: 6 liên tiếp thứ 3 → mất lượt + reset chuỗi (D1: đi thêm không tăng chuỗi).
  if (die === 6) {
    pl.sixStreak += 1;
    if (pl.sixStreak >= 3) {
      pushLog(g, logEntry(g, 'system', '3 lần 6 liên tiếp — mất lượt, chuỗi reset'));
      pl.sixStreak = 0;
      return endTurn(g);
    }
  } else {
    pl.sixStreak = 0;
  }

  // Ngọc May Mắn: nếu không có nước nào với die này và phe còn stock → tự reroll 1 lần.
  const movable = movablePieces(g, g.current, die);
  if (movable.length === 0 && pl.luckyRerollStock > 0) {
    pl.luckyRerollStock -= 1;
    const archers0 = pl.pieces.filter(
      (pc) => pc.cls === 'archer' && pc.skipTurns === 0 && pc.frozenTurns === 0,
    );
    if (!archers0.some((a) => xkTargets(g, a).length > 0)) {
      pushLog(g, logEntry(g, 'item', 'Ngọc May Mắn tự kích hoạt — tung lại'));
      return doRoll(g);
    }
  }

  // Hết nước hợp lệ toàn bộ → tung lại cùng lượt, không tăng chuỗi 6 (GDD §2.5).
  if (movable.length === 0) {
    const archers = pl.pieces.filter(
      (pc) => pc.cls === 'archer' && pc.skipTurns === 0 && pc.frozenTurns === 0,
    );
    if (!archers.some((a) => xkTargets(g, a).length > 0)) {
      pushLog(g, logEntry(g, 'system', 'Không có nước hợp lệ — tung lại'));
      return doRoll(g); // đệ quy tung lại (không tăng chuỗi)
    }
  }

  g.phase = 'move';
  return { ok: true };
}

// ===== Phase: MOVE =====

// Di chuyển quân pieceId theo g.die. Giao tranh tự chạy khi đáp ô có địch (D2: chọn defenderId nếu chồng).
export function doMove(g: GameState, pieceId: number, defenderId?: number): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  if (g.die === null) return err('Chưa tung xúc xắc');
  const player = g.current;
  const v = validateMove(g, player, pieceId, g.die);
  if (!v.ok) return err(v.error);
  const pc = v.piece;

  const out = moveOnePiece(g, pc, v.dest, defenderId);

  if (!out.ok) return out;
  const fin = maybeFinishOrExtra(g, dieIs6(g), out.extra);
  return { ...fin, battle: fin.battle ?? out.battle };
}

// Thân di chuyển 1 quân (không kết lượt): trả về extra ActionResult cho caller ghép.
function moveOnePiece(g: GameState, pc: Piece, dest: number, defenderId?: number): ActionResult & { extra?: ActionResult | null } {
  const player = g.current;
  const startP = pc.pos.zone === 'track' ? pc.pos.p : -1;

  // Ra chuồng
  if (pc.pos.zone === 'pen') {
    pc.pos = { zone: 'track', p: 0 };
    pushLog(g, logEntry(g, 'move', `${pieceName(g, pc)} ra chuồng`));
  } else {
    pc.pos = { zone: 'track', p: dest };
    pushLog(g, logEntry(g, 'move', `${pieceName(g, pc)} đi tới p${dest}`));
  }

  // Vòng lần đầu: p vượt 51 lần đầu → +20 EXP.
  if (startP >= 0 && startP <= TRACK_END && dest > TRACK_END) {
    gainExp(g, pc, 20, 'vòng lần đầu');
  }

  // Về đích
  if (dest === GOAL_P) {
    onGoal(g, pc);
    return { ok: true };
  }

  // Đáp ô vòng: giao tranh / ô đặc biệt / vùng.
  const r = ringIndexOf(player, dest);
  const enemies = enemiesAtDest(g, player, dest);
  if (enemies.length > 0 && !isStar(r)) {
    const defender = defenderId !== undefined
      ? enemies.find((e) => e.id === defenderId)!
      : enemies[0];
    const out = landOnEnemy(g, pc, defender);
    return { ...out, extra: out };
  }

  const res = resolveCell(g, pc, r);
  // Trận Địa Xung Phong đã arming: sau khi di xong → đi tiếp 3 ô bắt buộc (exact-goal vẫn ràng buộc).
  if (pc.chargeArmed && pc.pos.zone === 'track') {
    pc.chargeArmed = false;
    const need = exactGoalSteps(pc);
    if (need !== null && need >= 3) {
      const destP = pc.pos.p + 3;
      pc.pos = { zone: 'track', p: destP };
      pushLog(g, logEntry(g, 'skill', `Trận Địa Xung Phong — đi tiếp 3 ô → p${destP}`));
      const r2 = ringIndexOf(player, destP);
      const enemies2 = enemiesAtDest(g, player, destP);
      if (enemies2.length > 0 && !isStar(r2)) {
        const out2 = landOnEnemy(g, pc, enemies2[0]);
        return { ...out2, extra: out2 };
      }
      resolveCell(g, pc, r2);
    } else {
      pc.chargeArmed = true; // không đủ đường → giữ arming cho lần di tới
      pushLog(g, logEntry(g, 'skill', 'Trận Địa Xung Phong: không đủ đường đi 3 ô — giữ'));
    }
  }
  return { ok: true, extra: res };
}

// Đáp ô có địch (không phải sao): chạy giao tranh. Attacker giữ ô nếu thắng; thua về ô xuất phát bước đi.
function landOnEnemy(g: GameState, attacker: Piece, defender: Piece): ActionResult {
  if (defender.shieldTurn) {
    pushLog(g, logEntry(g, 'battle', `${pieceName(g, defender)} có Khiên Thành Chủ — chặn bắt`));
    // Attacker vẫn vào ô? GDD: chặn bắt = attacker không bắt được, đứng ô đó cùng defender? Không —
    // Khiên chặn nỗ lực bắt: attacker không thực hiện bắt → coi như ô bị chặn, attacker về ô cũ.
    return retreatAttacker(g, attacker);
  }
  if (defender.darkVeilTurn) {
    pushLog(g, logEntry(g, 'battle', `${pieceName(g, defender)} trong Bóng Đêm — không thể bị bắt`));
    return retreatAttacker(g, attacker);
  }

  const br = resolveBattle(g, { attacker, defender, isXk: false });
  const view: BattleView = { ...br, reason: 'landOn' };
  g.battle = view;
  pushLog(g, logEntry(g, 'battle',
    `${pieceName(g, attacker)} (${br.attacker.total}) ${br.outcome === 'attacker' ? 'thắng' : 'thua'} ${pieceName(g, defender)} (${br.defender.total})${br.crit ? ' — CHÍ MẠNG!' : ''}`,
    { attacker: br.attacker, defender: br.defender },
  ));

  // Cướp Đoạt (Sát thủ): thắng giao tranh → cướp 1 item của nạn nhân.
  if (br.outcome === 'attacker' && attacker.robArmed) {
    attacker.robArmed = false;
    if (defender.items.length > 0 && attacker.items.length < 2) {
      const stolen = defender.items.pop()!;
      attacker.items.push(stolen);
      pushLog(g, logEntry(g, 'item', `${pieceName(g, attacker)} cướp ${ITEMS[stolen].name} của ${pieceName(g, defender)}`));
    }
  }

  applyBattleOutcome(g, attacker, defender, br, 'landOn');
  const die6 = dieIs6(g);
  g.battle = null;

  // Thắng giao tranh → attacker ở lại ô + phe được đi thêm. Thua/hòa → hết lượt sau xử outcome.
  if (br.outcome === 'attacker') {
    const pl = g.players[attacker.player];
    // Yêu res2: thắng giao tranh hồi 2 HP.
    if (attacker.tribe === 'demon' && onBoardCount(g, attacker.player) >= 2) {
      attacker.hp = Math.min(computeStats(g, attacker).maxHp, attacker.hp + 2);
    }
    pl.extraMoves += 1;
    pushLog(g, logEntry(g, 'system', 'Thắng giao tranh — được đi thêm'));
  }
  // The move caller owns phase/extra-turn resolution. Finishing here would
  // hand the turn over twice, or consume the same rolled six twice.
  return { ok: true, battle: view };
}

// Áp kết quả giao tranh vào state (đền +1 ATK là mod trong battle; đây chỉ vị trí + HP + EXP + skill).
function applyBattleOutcome(
  g: GameState, attacker: Piece, defender: Piece, br: Awaited<ReturnType<typeof resolveBattle>>, reason: 'landOn' | 'shoot',
): void {
  const attackerWon = br.outcome === 'attacker';

  if (attackerWon) {
    // Địch về chuồng: hồi đầy HP, giữ cấp/item/lõi.
    sendToPen(g, defender);
    gainExp(g, attacker, br.expGained.attacker, 'thắng giao tranh');
    gainExp(g, defender, br.expGained.defender, 'thua giao tranh');
    // Sát thủ Cướp Đoạt: cướp 1 item.
    if (reason === 'landOn' && attacker.cls === 'assassin'
      && g.players[attacker.player].cores.includes('rob' as CoreId)) {
      // rob là skill — xử lý ở castSkill; landOn cướp chỉ khi skill rob active effect.
    }
  } else {
    // D5: attacker thua → về ô xuất phát bước đi + trừ HP = chênh lệch min 1; hòa (damage 0) → về ô cũ.
    const stFrom = attacker.pos.zone === 'track' ? attacker.pos.p : 0;
    const backTo = Math.max(0, stFrom - (g.die ?? 0));
    attacker.pos = { zone: 'track', p: backTo };
    if (br.damage > 0) {
      attacker.hp -= br.damage;
      pushLog(g, logEntry(g, 'battle', `${pieceName(g, attacker)} trừ ${br.damage} HP`));
      if (attacker.hp <= 0) sendToPen(g, attacker);
    }
    // Gương Bóng Tử Địa: thua giao tranh nhưng quân thắng cũng về chuồng (1 lần/quân/trận).
    if (reason === 'landOn' && !defender.mirrorUsed
      && g.players[attacker.player].cores.includes('deadMirror')) {
      if (!defender.shieldTurn) {
        defender.mirrorUsed = true;
        sendToPen(g, defender);
        pushLog(g, logEntry(g, 'battle', `Gương Bóng Tử Địa — ${pieceName(g, defender)} cũng về chuồng`));
      }
    }
    gainExp(g, attacker, br.expGained.attacker, 'thua giao tranh');
    gainExp(g, defender, br.expGained.defender, 'thắng giao tranh');
  }
}

// D10: khi bị chặn (shield/darkVeil), attacker quay về ô cũ (ô xuất phát bước đi).
function retreatAttacker(g: GameState, attacker: Piece): ActionResult {
  const stFrom = attacker.pos.zone === 'track' ? attacker.pos.p : 0;
  attacker.pos = { zone: 'track', p: Math.max(0, stFrom - (g.die ?? 0)) };
  const res = resolveCell(g, attacker, ringIndexOf(attacker.player, attacker.pos.p));
  return maybeFinishOrExtra(g, false, res);
}

// Gửi quân về chuồng: hồi đầy HP (theo stats hiện tại), giữ cấp/exp/item.
function sendToPen(g: GameState, pc: Piece): void {
  const st = computeStats(g, pc);
  pc.pos = { zone: 'pen' };
  pc.hp = st.maxHp;
  pc.skipTurns = 0;       // bẫy không theo quân về chuồng (dẫm lại nhốt lại)
  pc.frozenTurns = 0;
  pc.legShotArmed = false;
  pc.robArmed = false;
  pc.chargeArmed = false;
  pc.shieldTurn = false;
  pc.darkVeilTurn = false;
  pushLog(g, logEntry(g, 'pen', `${pieceName(g, pc)} về chuồng`));
}

// ===== Xạ Kích =====

// Cung thủ bắn mục tiêu (thay nước di). attacker giữ ô, không đáp xuống.
export function doShoot(g: GameState, archerId: number, targetId: number, targetPlayer: number): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  const pl = g.players[g.current];
  const archer = pl.pieces.find((p) => p.id === archerId);
  if (!archer || archer.cls !== 'archer') return err('Không phải cung thủ');
  if (archer.pos.zone !== 'track' || archer.pos.p > TRACK_END) return err('Không bắn được từ vị trí này');
  const targets = xkTargets(g, archer);
  const target = targets.find((t) => t.id === targetId && t.player === targetPlayer);
  if (!target) return err('Mục tiêu ngoài tầm / bị chặn (sao, rừng)');

  const br = resolveBattle(g, { attacker: archer, defender: target, isXk: true });
  const view: BattleView = { ...br, reason: 'shoot' };
  g.battle = view;
  pushLog(g, logEntry(g, 'battle',
    `Xạ Kích! ${pieceName(g, archer)} (${br.attacker.total}) bắn ${pieceName(g, target)} (${br.defender.total}) — ${br.outcome === 'attacker' ? 'trúng' : 'hụt'}`,
    { attacker: br.attacker, defender: br.defender },
  ));

  const attackerWon = br.outcome === 'attacker';
  if (attackerWon) {
    // XK trúng = giao tranh đầy đủ: địch thua về chuồng.
    sendToPen(g, target);
    // Bắn Chân đã arming: XK trúng → địch mất lượt di kế tiếp.
    if (archer.legShotArmed) {
      archer.legShotArmed = false;
      target.skipTurns = 2;
      pushLog(g, logEntry(g, 'skill', `Bắn Chân — ${pieceName(g, target)} mất lượt di kế tiếp`));
    }
    if (archer.tribe === 'demon' && onBoardCount(g, archer.player) >= 2) {
      archer.hp = Math.min(computeStats(g, archer).maxHp, archer.hp + 2);
    }
    gainExp(g, archer, br.expGained.attacker, 'Xạ Kích thắng');
    gainExp(g, target, br.expGained.defender, 'Xạ Kích thua');
  } else {
    gainExp(g, archer, br.expGained.attacker, 'Xạ Kích hụt');
    gainExp(g, target, br.expGained.defender, 'Xạ Kích trúng defense');
  }
  g.battle = null;
  return maybeFinishOrExtra(g, dieIs6(g));
}

// ===== Resolve ô đến =====

// Xử lý ô vòng vừa đáp (không có địch hoặc địch đã xử): bẫy/rương/đền/heal/sao.
function resolveCell(g: GameState, pc: Piece, r: number): ActionResult | null {
  const special = specialAt(r);
  const region = regionOfRing(r);
  const pl = g.players[pc.player];
  const nightTorch = pl.cores.includes('nightTorch');

  // Bẫy: dừng đúng ô → mất lượt di kế tiếp. Knight + elf miễn; valley vô hiệu; reverseFlow → đền.
  if (special === 'trap') {
    if (region === 'valley') {
      pushLog(g, logEntry(g, 'trap', 'Bẫy bị Thung Lũng vô hiệu hóa'));
    } else if (pc.cls === 'knight' || pc.tribe === 'elf') {
      pushLog(g, logEntry(g, 'trap', `${pieceName(g, pc)} miễn bẫy`));
    } else if (pl.cores.includes('reverseFlow')) {
      // Đảo Ngược Dòng Chảy: bẫy → đền gần nhất, đền cho +1 ATK (mod đền áp khi đứng trên).
      const templeR = nearestTemple(r);
      const tp = ((templeR - ARC_LEN * pc.player) % RING + RING) % RING;
      pc.pos = { zone: 'track', p: tp };
      pushLog(g, logEntry(g, 'trap', `Đảo Dòng Chảy — ${pieceName(g, pc)} teleport đến đền gần nhất`));
    } else {
      pc.skipTurns = 2;   // bẫm ở lượt N: chặn lượt di kế N+1 (tick đầu lượt N+1 → còn 1 → chặn; tick N+2 → 0)
      pushLog(g, logEntry(g, 'trap', `${pieceName(g, pc)} dẫm bẫy — mất lượt di kế tiếp`));
    }
  }

  // Rương: dừng đúng mới mở; 1 lần/trận; random sword/shield/potion/lucky/+30EXP.
  if (special === 'chest' && !g.openedChests.has(r)) {
    g.openedChests.add(r);
    openChest(g, pc, null);
  }

  // Ô hồi: hồi đầy (dừng đúng ô). Đuốc Bóng Đêm chặn hồi từ ô (không chặn lõi/cộng hưởng).
  if (special === 'heal' && !nightTorch) {
    const st = computeStats(g, pc);
    if (pc.hp < st.maxHp) {
      pc.hp = st.maxHp;
      pushLog(g, logEntry(g, 'heal', `${pieceName(g, pc)} hồi đầy HP (${st.maxHp})`));
    }
  }

  return null; // các hiệu ứng ô không tạo ActionResult riêng
}

// Rương mở: random item (max 2/quân) hoặc +30 EXP nếu trùng.
function openChest(g: GameState, pc: Piece, pick: ItemId | null): void {
  const pl = g.players[pc.player];
  const hasMap = pl.cores.includes('treasureMap');
  if (pick !== null && hasMap) {
    // Bản Đồ Kho Báu: chọn 1/3.
    pc.items.push(pick);
    pushLog(g, logEntry(g, 'chest', `Bản Đồ Kho Báu — ${pieceName(g, pc)} nhận ${ITEMS[pick].name}`));
    return;
  }
  if (pick !== null && !hasMap) {
    // Gọi với pick khi không có map: vẫn random thường (API an toàn).
  }
  const opts: (ItemId | 'exp')[] = ['sword', 'shield', 'potion', 'lucky', 'exp'];
  const roll = rollD6(g);
  const choice = opts[roll % opts.length];
  if (choice === 'exp') {
    gainExp(g, pc, 30, 'rương quy đổi');
    pushLog(g, logEntry(g, 'chest', 'Rương: +30 EXP'));
    return;
  }
  const itemChoice: ItemId = choice; // từ đây choice loại 'exp'
  if (pc.items.length >= 2) {
    gainExp(g, pc, 30, 'rương trùng (đầy túi)');
    pushLog(g, logEntry(g, 'chest', 'Túi đã đầy — rương quy đổi +30 EXP'));
    return;
  }
  if (itemChoice === 'potion') {
    // Bình Máu: hồi 4 ngay.
    const st = computeStats(g, pc);
    pc.hp = Math.min(st.maxHp, pc.hp + 4);
    pushLog(g, logEntry(g, 'item', `${pieceName(g, pc)} dùng Bình Máu (+4 HP)`));
  } else if (itemChoice === 'lucky') {
    pl.luckyRerollStock += 1;
    pushLog(g, logEntry(g, 'item', `Ngọc May Mắn cho phe ${g.current + 1}`));
  } else {
    pc.items.push(itemChoice);
  }
  pushLog(g, logEntry(g, 'chest', `Rương mở: ${ITEMS[itemChoice].name}`));
}

// Đền gần nhất theo vòng (tiến hoặc lùi ngắn nhất).
function nearestTemple(r: number): number {
  const temples = [6, 19, 32, 45];
  let best = temples[0], bestDist = RING;
  for (const t of temples) {
    const d = Math.min((t - r + RING) % RING, (r - t + RING) % RING);
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

// ===== Skill =====

// Dùng skill (thay nước di, ≤1/lượt, CD theo lượt phe).
export function castSkill(g: GameState, pieceId: number, skillId: SkillId): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  const pl = g.players[g.current];
  const pc = pl.pieces.find((p) => p.id === pieceId);
  if (!pc) return err('Quân không tồn tại');
  const def = SKILLS[skillId];
  if (!def) return err('Skill không tồn tại');
  const expected = CLASSES[pc.cls].skillIds;
  if (!expected.includes(skillId)) return err('Skill không thuộc hệ này');
  if (pc.level < def.unlockLevel) return err(`Cần cấp ${def.unlockLevel}`);
  if ((pc.skillCd[skillId] ?? 0) > 0) return err(`Skill hồi (${pc.skillCd[skillId]} lượt)`);
  if (pc.pos.zone !== 'track' || pc.skipTurns > 0 || pc.frozenTurns > 0) return err('Quân không thể dùng skill tại trạng thái này');

  pc.skillCd[skillId] = def.cd;
  // Tiên Linh res2: CD −1.
  if (pc.tribe === 'elf' && onBoardCount(g, pc.player) >= 2) {
    pc.skillCd[skillId] -= 1;
  }
  pushLog(g, logEntry(g, 'skill', `${pieceName(g, pc)} dùng ${def.name}`));

  switch (skillId) {
    case 'shieldWall':
      pc.shieldTurn = true;
      break;
    case 'darkVeil':
      pc.darkVeilTurn = true;
      break;
    case 'bind': {
      // Trói Trận: 1 địch không được di lượt kế — chọn địch gần nhất trong 6 ô.
      const target = nearestEnemy(g, pc, 6);
      if (target) {
        target.frozenTurns = 1;
        pushLog(g, logEntry(g, 'skill', `Trói ${pieceName(g, target)}`));
      } else {
        pc.skillCd[skillId] = 0; // hoàn CD nếu không trúng ai
      }
      break;
    }
    case 'enlighten': {
      // Khai Sáng: toàn đội hồi 3 HP (lõi vẫn hoạt động — không bị Đuốc chặn vì là skill).
      for (const p of pl.pieces) {
        const maxHp = computeStats(g, p).maxHp;
        p.hp = Math.min(maxHp, p.hp + 3);
      }
      // −1 CD MỘT skill của MỘT đồng minh (skill đang hồi đầu tiên tìm thấy).
      outer: for (const p of pl.pieces) {
        if (p.id === pc.id) continue;
        for (const sid of Object.keys(p.skillCd)) {
          if (p.skillCd[sid] > 0) {
            p.skillCd[sid] -= 1;
            pushLog(g, logEntry(g, 'skill', `−1 CD ${SKILLS[sid as SkillId].name} của ${pieceName(g, p)}`));
            break outer;
          }
        }
      }
      pushLog(g, logEntry(g, 'skill', 'Khai Sáng: toàn đội hồi 3 HP'));
      break;
    }
    case 'legShot':
      // Bắn Chân: arming — XK trúng kế tiếp của cung thủ này → địch mất lượt di kế.
      pc.legShotArmed = true;
      break;
    case 'tripleShot': {
      tripleShotTargets(g, pc);
      break;
    }
    case 'chargeFormation':
      // Trận Địa Xung Phong: arming — sau khi di xong (doMove kế) đi tiếp 3 ô bắt buộc.
      pc.chargeArmed = true;
      break;
    case 'rob':
      // Cướp Đoạt: arming — thắng giao tranh kế của sát thủ này → cướp 1 item.
      pc.robArmed = true;
      break;
  }

  if (pl.cores.includes('rustLightning')) {
    for (const ally of pl.pieces) {
      if (ally.id === pc.id) continue;
      for (const sid of Object.keys(ally.skillCd)) {
        if (ally.skillCd[sid] > 0) ally.skillCd[sid] -= 1;
      }
    }
    pushLog(g, logEntry(g, 'core', 'Chuông Sét Gỉ — giảm 1 CD cho skill của đồng minh'));
  }
  return maybeFinishOrExtra(g, false);
}

// ---- Skill helpers ----

// Tam Tiễn: bắn 3 mục tiêu gần nhất trong tầm, mỗi phát giao tranh đầy đủ không crit.
function tripleShotTargets(g: GameState, pc: Piece): void {
  const targets = xkTargets(g, pc).slice(0, 3);
  for (const tgt of targets) {
    const br = resolveBattle(g, { attacker: pc, defender: tgt, isXk: true, forceNoCrit: true });
    pushLog(g, logEntry(g, 'battle', `Tam Tiễn bắn ${pieceName(g, tgt)} — ${br.outcome === 'attacker' ? 'trúng' : 'hụt'}`));
    if (br.outcome === 'attacker') {
      sendToPen(g, tgt);
      gainExp(g, pc, br.expGained.attacker, 'Tam Tiễn');
      gainExp(g, tgt, br.expGained.defender, 'Tam Tiễn thua');
    }
  }
  if (targets.length === 0) {
    pushLog(g, logEntry(g, 'skill', 'Tam Tiễn: không có mục tiêu trong tầm'));
  }
}

// Địch gần nhất trong `within` ô vòng (không sao — bắn được cả sao cho bind? bind không phải bắn).
function nearestEnemy(g: GameState, pc: Piece, within: number): Piece | null {
  if (pc.pos.zone !== 'track' || pc.pos.p > TRACK_END) return null;
  const from = ringIndexOf(pc.player, pc.pos.p);
  let best: Piece | null = null, bestD = within + 1;
  for (const pl2 of g.players) {
    if (pl2.id === pc.player) continue;
    for (const e of pl2.pieces) {
      if (e.pos.zone !== 'track' || e.pos.p > TRACK_END) continue;
      const er = ringIndexOf(e.player, e.pos.p);
      const d = Math.min((er - from + RING) % RING, (from - er + RING) % RING);
      if (d <= within && d < bestD) { best = e; bestD = d; }
    }
  }
  return best;
}

// ===== EXP / level / lõi =====

export function gainExp(g: GameState, pc: Piece, amount: number, why: string): void {
  if (pc.pos.zone === 'goal') return; // quân đã đích không tích EXP
  pc.exp += amount;
  pushLog(g, logEntry(g, 'system', `${pieceName(g, pc)} +${amount} EXP (${why})`));
  checkLevelUp(g, pc);
}

function checkLevelUp(g: GameState, pc: Piece): void {
  while (pc.level < MAX_LEVEL && pc.exp >= LEVEL_THRESHOLDS[pc.level + 1]) {
    pc.level += 1;
    const st = computeStats(g, pc);
    pc.hp = Math.min(pc.hp + 1, st.maxHp); // +1 HP khi lên cấp
    pushLog(g, logEntry(g, 'levelup', `${pieceName(g, pc)} lên cấp ${pc.level}`));
    // Học skill mốc 3/5.
    for (const sid of CLASSES[pc.cls].skillIds) {
      const def = SKILLS[sid as SkillId];
      if (def.unlockLevel === pc.level && !pc.skillsLearned.includes(pc.level)) {
        pc.skillsLearned.push(pc.level);
      }
    }
    // Mốc lõi 3/6/9 → chèn CORE_PICK.
    if (pc.level === 3 || pc.level === 6 || pc.level === 9) {
      const pl = g.players[pc.player];
      if (pl.cores.length < 3 && !pl.coreRerollUsed[pc.level]) {
        pl.corePickPending = pc.level;
        if (g.phase === 'move') g.phase = 'corePick';
        pushLog(g, logEntry(g, 'core', `Mốc cấp ${pc.level} — chọn lõi K`));
      }
    }
  }
}

// Chọn lõi khi corePickPending (1 reroll mỗi mốc). Sau chọn, flow lượt tiếp tục bình thường.
export function coreOffers(g: GameState): CoreId[] {
  const pl = g.players[g.current];
  if (pl.corePickPending === null) return [];
  if (pl.coreOffers.length === 0) {
    const pool = (Object.keys(CORES) as CoreId[]).filter(c => !pl.cores.includes(c));
    for (let i = pool.length - 1; i > 0; i--) {
      const r = nextRandom(g.rngState); g.rngState = r.state;
      const j = Math.floor(r.value * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pl.coreOffers = pool.slice(0, 3);
  }
  return [...pl.coreOffers];
}

export function pickCore(g: GameState, coreId: CoreId, reroll = false): ActionResult {
  const pl = g.players[g.current];
  if (pl.corePickPending === null) return err('Không có mốc lõi đang chờ');
  if (g.phase !== 'corePick' && g.phase !== 'move') return err('Sai phase');

  if (reroll) {
    const milestone = pl.corePickPending;
    if (pl.coreRerollUsed[milestone]) return err('Đã dùng reroll mốc này');
    pl.coreRerollUsed[milestone] = true;
    pl.coreOffers = [];
    coreOffers(g);
    pushLog(g, logEntry(g, 'core', `Reroll lựa chọn lõi mốc ${milestone}`));
    return { ok: true };
  }

  if (!CORES[coreId]) return err('Lõi không tồn tại');
  if (pl.cores.length >= 3) return err('Đã đủ 3 lõi');
  if (pl.cores.includes(coreId)) return err('Lõi đã có');
  if (!coreOffers(g).includes(coreId)) return err('Lõi không nằm trong ba lựa chọn hiện tại');

  pl.cores.push(coreId);
  pl.corePickPending = null;
  pl.coreOffers = [];
  pushLog(g, logEntry(g, 'core', `Chọn lõi: ${CORES[coreId].name}`));
  return maybeFinishOrExtra(g, false);
}

// ===== Đích / thắng / đi thêm =====

function onGoal(g: GameState, pc: Piece): void {
  pc.pos = { zone: 'goal' };
  gainExp(g, pc, 0, 'về đích'); // goal +100 xử ở gainExp bên dưới
  pc.exp += 100; // goal EXP trực tiếp (gainExp chặn goal)
  pushLog(g, logEntry(g, 'goal', `${pieceName(g, pc)} VỀ ĐÍCH! +100 EXP`));
  checkLevelUp(g, pc);
  // 1 quân về đích → phe được đi thêm.
  g.players[pc.player].extraMoves += 1;
}

function dieIs6(g: GameState): boolean {
  return g.die === 6;
}

// Sau move/battle: nếu phe thắng đã đủ 4 quân đích → game over; else nếu có extraMoves → tiếp roll.
function maybeFinishOrExtra(g: GameState, fromSix: boolean, res?: ActionResult | null): ActionResult {
  // Kiểm thắng.
  for (const pl of g.players) {
    if (pl.pieces.every((p) => p.pos.zone === 'goal')) {
      g.winner = pl.id;
      g.phase = 'gameOver';
      pushLog(g, logEntry(g, 'system', `Phe ${pl.id + 1} chiến thắng!`));
      return { ok: true, finishedGame: true };
    }
  }

  // Còn lõi chờ chọn → phase corePick.
  const pl = g.players[g.current];
  if (pl.corePickPending !== null) {
    g.phase = 'corePick';
    return res ?? { ok: true };
  }

  // Đi thêm: 6 → +1; thắng giao tranh / về đích đã cộng extraMoves.
  if (fromSix) pl.extraMoves += 1;
  if (pl.extraMoves > 0) {
    pl.extraMoves -= 1;
    g.die = null;
    g.dieRolled = false;
    g.phase = 'roll';
    return res ?? { ok: true };
  }

  return endTurn(g, res ?? null);
}

// ===== endTurn =====

// Kết thúc lượt: tick hiệu ứng đầu lượt KẾ TIẾP, chuyển sang phe kế.
export function endTurn(g: GameState, res?: ActionResult | null): ActionResult {
  const pl = g.players[g.current];

  // (shieldTurn/darkVeilTurn KHÔNG clear ở đây — chúng bảo vệ cho tới lượt kế của phe giữ,
  // địch bắt trong lượt của nó; clear ở startOfTurn khi phe giữ chơi lại.)

  g.turn += 1;
  g.current = (g.current + 1) % g.playerCount;
  const next = g.players[g.current];

  // Tick CD skill phe vừa chơi (CD theo lượt phe).
  for (const p of pl.pieces) {
    for (const sid of Object.keys(p.skillCd)) {
      if (p.skillCd[sid] > 0) p.skillCd[sid] -= 1;
    }
  }

  startOfTurn(g, next);

  g.phase = 'roll';
  g.die = null;
  g.dieRolled = false;
  return { ok: true, ...(res ?? {}) };
}

// Hiệu ứng đầu lượt phe `next`: tick skip/frozen, sa mạc cháy, hồi (valley/res4/rustLightning).
function startOfTurn(g: GameState, next: Player): void {
  for (const pc of next.pieces) {
    // Bẫy/Bắn Chân: dẫm lượt N → skipTurns=2; tick đầu lượt N+1 → 1 (bị chặn lượt này), N+2 → 0.
    if (pc.skipTurns > 0) pc.skipTurns -= 1;
    if (pc.frozenTurns > 0) pc.frozenTurns -= 1;
    // Khiên/Bóng Đêm hết hiệu lực khi phe giữ chơi lại (đã bảo vệ trọn 1 vòng quanh bàn).
    pc.shieldTurn = false;
    pc.darkVeilTurn = false;


    const st = computeStats(g, pc);
    const region = pc.pos.zone === 'track' && pc.pos.p <= TRACK_END
      ? regionOfRing(ringIndexOf(pc.player, pc.pos.p)) : null;
    const pl = g.players[pc.player];

    // Sa mạc: −1 HP đầu lượt mỗi quân đứng (min 1); Yêu miễn.
    if (region === 'desert' && pc.tribe !== 'demon' && pc.hp > 1) {
      pc.hp -= 1;
      pushLog(g, logEntry(g, 'system', `${pieceName(g, pc)} cháy sa mạc −1 HP`));
    }

    // Valley: +1 HP đầu lượt (mọi phe); Người affinity hồi 2. Đuốc Bóng Đêm chặn hồi từ ô & vùng.
    if (region === 'valley' && !pl.cores.includes('nightTorch')) {
      pc.hp = Math.min(st.maxHp, pc.hp + (pc.tribe === 'human' ? 2 : 1));
    }
    // Người res4: toàn đội hồi 1 đầu lượt.
    if (pc.tribe === 'human' && onBoardCount(g, pc.player) >= 4) {
      pc.hp = Math.min(st.maxHp, pc.hp + 1);
    }
  }
}

// ===== Utils =====

function pieceName(g: GameState, pc: Piece): string {
  const cls = CLASSES[pc.cls].name;
  const tribe = TRIBES[pc.tribe].name;
  return `${tribe} ${cls}#${pc.id + 1}(P${pc.player + 1})`;
}

function err(error: string): ActionResult {
  return { ok: false, error };
}

// ===== API lõi đặc biệt =====

// Chìa Vũ Trụ: 1 lần/trận thay nước di — hoán đổi vị trí 2 quân bất kỳ (không chuồng/đích).
export function useUniverseKey(g: GameState, pieceIdA: number, pieceIdB: number): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  const pl = g.players[g.current];
  if (!pl.cores.includes('universeKey')) return err('Phe không giữ Chìa Vũ Trụ');
  if (pl.coreFlags.universeKeyUsed) return err('Đã dùng Chìa Vũ Trụ trận này');
  const pa = pl.pieces.find((p) => p.id === pieceIdA);
  const pb = pl.pieces.find((p) => p.id === pieceIdB);
  if (!pa || !pb || pa === pb) return err('Cần 2 quân khác nhau');
  if (pa.pos.zone !== 'track' || pb.pos.zone !== 'track' || pa.pos.p > TRACK_END || pb.pos.p > TRACK_END) {
    return err('Chỉ hoán đổi quân đang đứng trên vòng');
  }
  const tmp = pa.pos;
  pa.pos = pb.pos;
  pb.pos = tmp;
  pl.coreFlags.universeKeyUsed = true;
  pushLog(g, logEntry(g, 'core', `Chìa Vũ Trụ — hoán đổi ${pieceName(g, pa)} ↔ ${pieceName(g, pb)}`));
  return maybeFinishOrExtra(g, false);
}

// Mắt Tiên Tri: xem trước roll kế của phe bất kỳ (không tiêu thụ RNG).
export function prophetEyePeek(g: GameState): number {
  const r = nextRandom(g.rngState);
  return 1 + Math.floor(r.value * 6);
}

// Mắt Tiên Tri: 1 lần/trận đổi kết quả roll sắp tới của phe ĐỊCH (áp trước khi địch roll).
// Triển khai đơn giản theo GDD intent: ép giá trị roll kế của phe current.
export function prophetEyeForce(g: GameState, value: number): ActionResult {
  const pl = g.players[g.current];
  if (!pl.cores.includes('prophetEye')) return err('Phe không giữ Mắt Tiên Tri');
  if (pl.coreFlags.prophetSwapUsed) return err('Đã dùng lần đổi kết quả trận này');
  if (value < 1 || value > 6) return err('Giá trị phải 1–6');
  pl.coreFlags.prophetSwapUsed = true;
  g.die = value;
  pushLog(g, logEntry(g, 'core', `Mắt Tiên Tri — ép roll kế thành ${value}`));
  return { ok: true };
}

// Nợ Máu: chia số roll D cho 2 quân (a + b = D, mỗi quân ≥ 0) — thay nước di.
export function doMoveSplit(g: GameState, pieceIdA: number, pieceIdB: number, stepsA: number): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  const pl = g.players[g.current];
  if (!pl.cores.includes('bloodDebt')) return err('Phe không giữ Nợ Máu');
  if (g.die === null) return err('Chưa tung xúc xắc');
  const D = g.die;
  const stepsB = D - stepsA;
  if (stepsA < 0 || stepsB < 0) return err('Mỗi quân phải nhận ≥ 0 bước');

  const va = validateMove(g, g.current, pieceIdA, stepsA);
  if (!va.ok) return err(`Quân A: ${va.error}`);
  const vb = validateMove(g, g.current, pieceIdB, stepsB);
  if (!vb.ok) return err(`Quân B: ${vb.error}`);
  const pcA = va.piece;
  const pcB = vb.piece;
  const destA = pcA.pos.zone === 'track' ? Math.min(57, pcA.pos.p + stepsA) : 0;
  const outA = moveOnePiece(g, pcA, destA);
  if (!outA.ok) { return outA; }
  // B vẫn di được sau khi A đi (phase move giữ nguyên — moveOnePiece không kết lượt).
  const destB = pcB.pos.zone === 'track' ? Math.min(57, pcB.pos.p + stepsB) : 0;
  const outB = moveOnePiece(g, pcB, destB);
  if (!outB.ok) { return outB; }
  return maybeFinishOrExtra(g, false, outB.extra ?? outA.extra);
}

// Bản Đồ Kho Báu: mở rương được chọn 1/3 item (thay nước di, dùng khi đáp rương hoặc trực tiếp).
export function openChestWithMap(g: GameState, pieceId: number, pick: ItemId): ActionResult {
  if (g.phase !== 'move' || g.winner !== null) return err('Không phải phase move');
  const pl = g.players[g.current];
  if (!pl.cores.includes('treasureMap')) return err('Phe không giữ Bản Đồ Kho Báu');
  const pc = pl.pieces.find((p) => p.id === pieceId);
  if (!pc || pc.pos.zone !== 'track') return err('Quân không trên bàn');
  const r = ringIndexOf(pc.player, pc.pos.p);
  if (specialAt(r) !== 'chest') return err('Quân không đứng trên rương');
  if (g.openedChests.has(r)) {
    // Rương trùng: +30 EXP quy đổi.
    gainExp(g, pc, 30, 'rương trùng (Bản Đồ)');
    pushLog(g, logEntry(g, 'chest', 'Rương đã mở — Bản Đồ quy đổi +30 EXP'));
    return maybeFinishOrExtra(g, false);
  }
  g.openedChests.add(r);
  if (pc.items.length >= 2) {
    gainExp(g, pc, 30, 'rương (túi đầy)');
    pushLog(g, logEntry(g, 'chest', 'Túi đã đầy — quy đổi +30 EXP'));
    return maybeFinishOrExtra(g, false);
  }
  pc.items.push(pick);
  pushLog(g, logEntry(g, 'chest', `Bản Đồ Kho Báu — chọn ${ITEMS[pick].name}`));
  return maybeFinishOrExtra(g, false);
}

export function autoPlayOneTurn(g: GameState): ActionResult {
  const r = doRoll(g);
  if (!r.ok || g.phase !== 'move') return r; // doRoll có thể tự endTurn (3×6, hết nước)

  const pl = g.players[g.current];
  const mv = movablePieces(g, g.current, g.die ?? 0);
  let out: ActionResult = r;
  if (mv.length > 0) {
    out = doMove(g, mv[0].id);
  } else {
    const archers = pl.pieces.filter((p) => p.cls === 'archer' && p.pos.zone === 'track');
    const shot = archers.find((a) => xkTargets(g, a).length > 0);
    if (shot) {
      const t = xkTargets(g, shot)[0];
      out = doShoot(g, shot.id, t.id, t.player);
    } else {
      out = endTurn(g);
    }
  }

  // Chọn lõi tự động (mốc 3/6/9): lõi đầu tiên chưa có.
  let guard = 0;
  while ((g.phase as string) === 'corePick' && g.players[g.current].corePickPending !== null && guard++ < 10) {
    const remaining = coreOffers(g);
    const pick = pickCore(g, remaining[0]);
    if (!pick.ok) {
      g.players[g.current].corePickPending = null; // thoát kẹt (đủ 3 lõi)
      break;
    }
  }
  return out;
}
