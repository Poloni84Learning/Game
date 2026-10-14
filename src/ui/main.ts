// Bootstrap + vòng đời game: draft → vòng lượt → victory. Wire canvas ↔ core ↔ HUD.
import type { ActionResult, CoreId, GameState, ItemId, Piece, SkillId, TribeId } from '../core/types.ts';
import {
  newGame, doRoll, doMove, doShoot, castSkill, endTurn,
  useUniverseKey, prophetEyePeek, prophetEyeForce, doMoveSplit, openChestWithMap,
} from '../core/turn.ts';
import { movablePieces, validateMove, xkTargets, enemiesAtDest } from '../core/moves.ts';
import { GOAL_P, specialAt } from '../data/board.ts';
import { CLASSES } from '../data/classes.ts';
import { TRIBES } from '../data/tribes.ts';
import { Renderer, destRing, type Highlight } from '../gfx/render.ts';
import { GOAL_TILE, HOME_TILES, PEN_TILES, RING_TILES, TILE, px } from '../gfx/layout.ts';
import { setHeroStyle } from '../gfx/sprites.ts';
import { renderHud, setDevBarVisible, type HudActions } from './hud.ts';
import {
  askPlayerCount, showBattle, showCorePick, showDraft, showSplitPick,
  showTreasurePick, showVictory, hideOverlay,
} from './screens.ts';
import { sfx } from './audio.ts';

const canvas = document.getElementById('board') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

let g: GameState | null = null;
let selectedPieceId: number | null = null;
let highlights: Highlight[] = [];
let peekValue: number | null = null;
let interactLocked = false;      // battle popup đang mở
let universeKeyMode = false;     // đang chọn 2 quân để hoán đổi
let universeKeyFirst: Piece | null = null;
let pendingSplit: number | null = null; // die của bloodDebt


// ===== Bootstrap =====
askPlayerCount((n) => {
  showDraft(n, ({ tribes, heroStyle }) => {
    setHeroStyle(heroStyle);
    g = newGame({
      seed: (Math.random() * 2 ** 31) | 0,
      players: tribes.map((t) => ({ tribe: t, classes: ['knight', 'mage', 'archer', 'assassin'] })),
    });
    hideOverlay();
    fit();
    setDevBarVisible(false);
    refresh();
  });
});

// ===== Canvas input: click tile → chọn quân/di/bắn =====
canvas.addEventListener('click', (ev) => {
  if (!g || interactLocked || g.winner !== null) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const x = (ev.clientX - rect.left) * sx;
  const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
  const col = Math.floor(x / TILE) - 2;
  const row = Math.floor(y / TILE) - 2;
  const tile = clickTarget(col, row);
  // data-trace: kênh đọc cho kiểm thử tự động (bot) — tile nhấn, nước bị chặn, lỗi runtime.
  if (!tile) { document.body.dataset.trace = 'tile null'; return; }
  try { handleTileClick(tile); } catch (e) { document.body.dataset.trace = `ERR ${String(e)}`; }
});

type ClickTarget =
  | { kind: 'ring'; r: number }
  | { kind: 'pen'; player: number; slot: number }
  | { kind: 'home'; player: number; idx: number }
  | { kind: 'goal' };


function clickTarget(col: number, row: number): ClickTarget | null {
  // Chuồng
  for (let p = 0; p < 4; p++) {
    const b = PEN_TILES[p];
    if (col >= b.col && col < b.col + 2 && row >= b.row && row < b.row + 2) {
      return { kind: 'pen', player: p, slot: (col - b.col) + (row - b.row) * 2 };
    }
  }
  // Đường về (5 ô mỗi phe) + đích tâm.
  for (let p = 0; p < 4; p++) {
    const idx = HOME_TILES[p].findIndex((t) => t.col === col && t.row === row);
    if (idx >= 0) return { kind: 'home', player: p, idx };
  }
  if (col === GOAL_TILE.col && row === GOAL_TILE.row) return { kind: 'goal' };
  const ri = RING_TILES.findIndex((t) => t.col === col && t.row === row);
  if (ri >= 0) return { kind: 'ring', r: ri };
  return null;
}

function handleTileClick(target: NonNullable<ClickTarget>): void {
  if (!g) return;
  const me = g.current;
  document.body.dataset.trace = `tile ${JSON.stringify(target)} sel=${selectedPieceId} die=${g.die}`;

  // 1) Chọn quân của mình (ring hoặc chuồng).
  // Quân của mình theo r trên vòng.
  const myPieceAtRing = (player: number, r: number): Piece | undefined =>
    g!.players[player].pieces.find((pc) =>
      pc.pos.zone === 'track' && pc.pos.p <= 51 && ((13 * player + pc.pos.p) % 52) === r);

  if (target.kind === 'pen' && target.player === me) {
    // Chọn quân trong chuồng theo slot đã click.
    const slot = target.slot;
    const candidates = movablePieces(g, me, g.die ?? 0).filter((pc) => pc.pos.zone === 'pen');
    const pick = candidates.find((pc) => pc.id === slot) ?? candidates[0];
    if (pick) { selectPiece(pick); return; }
    selectedPieceId = null;
    highlights = [];
    refresh();
    return;
  }

  // 2) Mode Chìa Vũ Trụ: chọn 2 quân bất kỳ trên vòng (của mình) để hoán đổi.
  if (universeKeyMode && target.kind === 'ring') {
    const occupant = g.players[me].pieces.find(
      (pc) => pc.pos.zone === 'track' && pc.pos.p <= 51 && (13 * me + pc.pos.p) % 52 === target.r,
    );
    if (!occupant) return;
    if (!universeKeyFirst) {
      universeKeyFirst = occupant;
      refresh();
      return;
    }
    if (universeKeyFirst === occupant) return;
    const r = useUniverseKey(g, universeKeyFirst.id, occupant.id);
    universeKeyMode = false;
    universeKeyFirst = null;
    flashResult(r);
    refresh();
    return;
  }

  // 3) Đã chọn quân + die → click ô đích để đi (vòng hoặc đường về/đích).
  if (selectedPieceId !== null && g.die !== null) {
    const sel = g.players[me].pieces.find((pc) => pc.id === selectedPieceId);
    const v = sel ? validateMove(g, me, sel.id, g.die) : { ok: false as const, error: 'Không tìm thấy quân' };
    document.body.dataset.trace += ` v=${JSON.stringify(v)}`;
    if (sel && v.ok) {
      // Đích vòng: quân từ pen/ring vào ring.
      if ((sel.pos.zone === 'pen' || (sel.pos.zone === 'track' && sel.pos.p <= 51)) && target.kind === 'ring') {
        const destR = ((13 * me + v.dest) % 52 + 52) % 52;
        if (target.r === destR) {
          const enemies = enemiesAtDest(g, me, v.dest);
          const r = enemies.length > 1
            ? doMove(g, sel.id, enemies[0].id) // D2: chọn defender — đơn giản: địch đầu.
            : doMove(g, sel.id);
          flashResult(r);
          selectedPieceId = null;
          highlights = [];
          afterAction();
          return;
        }
      }
      // Đích đường về / đích tâm: quân đang trên đường về (track p 52..56).
      if (sel.pos.zone === 'track' && sel.pos.p > 51 && (target.kind === 'home' || target.kind === 'goal')) {
        if (target.kind === 'home') {
          if (target.player !== me || target.idx !== v.dest - 52) return;
        } else if (v.dest < GOAL_P) return;
        const r = doMove(g, sel.id);
        flashResult(r);
        selectedPieceId = null;
        highlights = [];
        afterAction();
        return;
      }
    }
  }

  // 4) Click địch khi có cung thủ được chọn → Xạ Kích.
  if (selectedPieceId !== null && target.kind === 'ring') {
    const archer = g.players[me].pieces.find((pc) => pc.id === selectedPieceId);
    if (archer?.cls === 'archer') {
      const tgt = xkTargets(g, archer).find((t) =>
        t.pos.zone === 'track' && t.pos.p <= 51 && (13 * t.player + t.pos.p) % 52 === target.r);
      if (tgt) {
        const r = doShoot(g, archer.id, tgt.id, tgt.player);
        flashResult(r);
        selectedPieceId = null;
        highlights = [];
        afterAction();
        return;
      }
    }
  }

  // 5) Click quân mình bất kỳ → chọn + highlight nước (vòng hoặc đường về).
  if (target.kind === 'ring') {
    const found = myPieceAtRing(me, target.r);
    if (found) { selectPiece(found); return; }
  }
  if (target.kind === 'home' && target.player === me) {
    const found = g.players[me].pieces.find(
      (pc) => pc.pos.zone === 'track' && pc.pos.p > 51 && pc.pos.p - 52 === target.idx,
    );
    if (found) { selectPiece(found); return; }
  }
}

function selectPiece(pc: Piece): void {
  if (!g) return;
  selectedPieceId = pc.id;
  highlights = computeHighlights(pc);
  refresh();
}

function computeHighlights(pc: Piece): Highlight[] {
  if (!g) return [];
  const out: Highlight[] = [];
  if (g.die !== null) {
    const v = validateMove(g, g.current, pc.id, g.die);
    if (v.ok) {
      const r = destRing(g.current, v.dest);
      if (r !== null) out.push({ r, kind: 'move' });
    }
  }
  if (pc.cls === 'archer') {
    for (const t of xkTargets(g, pc)) {
      if (!isOnRing(t)) continue;
      const r = ringOf(t);
      out.push({ r, kind: 'target' });
    }
  }
  return out;
}

// ===== HUD actions =====
const actions: HudActions = {
  onRoll(): void {
    if (!g || g.phase !== 'roll') return;
    sfx.roll();
    const r = doRoll(g);
    flashResult(r);
    highlights = [];
    afterAction();
  },

  onDevDie(n: number): void {
    // DevMode: ép xúc xắc (chỉ khi phase roll; mô phỏng tung và tìm nước).
    if (!g || g.phase !== 'roll') return;
    const me = g.current;
    // Đặt rngState để doRoll ra đúng n: mulberry32 — đơn giản hơn: ghi đè g.die qua prophetEyeForce? Không — làm thẳng:
    // Đã tung rồi? Nếu phase roll: set die trực tiếp + phase move (không qua log roll cho gọn DevMode).
    g.die = n;
    g.dieRolled = true;
    g.phase = 'move';
    void me;
    refresh();
  },

  onPieceClick(pc: Piece): void {
    selectPiece(pc);
  },

  onSkillClick(pc: Piece, sid: SkillId): void {
    if (!g || g.phase !== 'move' || g.winner !== null) return;
    const def = CLASSES[pc.cls].skillIds as SkillId[];
    if (!def.includes(sid)) return;
    // bind: chọn địch gần nhất trong 6 ô (engine đã tự chọn); các skill khác bấm là cast.
    const r = castSkill(g, pc.id, sid);
    flashResult(r);
    if (r.ok) {
      selectedPieceId = null;
      highlights = [];
    }
    afterAction();
  },

  onCoreAction(act: string): void {
    if (!g) return;
    switch (act) {
      case 'universeKey':
        universeKeyMode = true;
        universeKeyFirst = null;
        refresh();
        break;
      case 'bloodDebt':
        if (g.die !== null) {
          pendingSplit = g.die;
          // Quân A = quân được chọn (nếu có & hợp lệ) — mở bảng chia.
          showSplitPick(g.die, (stepsA) => {
            if (!g || g.phase !== 'move') return;
            const pa = selectedPieceId;
            if (pa === null) { flashResult({ ok: false, error: 'Chọn quân A trước' }); return; }
            // Quân B = quân khác đầu tiên có nước.
            const others = g.players[g.current].pieces.filter((x) => x.id !== pa && x.pos.zone !== 'goal');
            if (others.length === 0) return;
            const r = doMoveSplit(g, pa, others[0].id, stepsA);
            flashResult(r);
            selectedPieceId = null;
            highlights = [];
            afterAction();
          });
        }
        break;
      case 'treasureMap': {
        if (selectedPieceId === null) { flashResult({ ok: false, error: 'Chọn quân đứng trên rương trước' }); return; }
        showTreasurePick((item: ItemId) => {
          if (!g) return;
          const r = openChestWithMap(g, selectedPieceId!, item);
          flashResult(r);
          selectedPieceId = null;
          afterAction();
        });
        break;
      }
      case 'prophetPeek':
        peekValue = prophetEyePeek(g);
        refresh();
        break;
      case 'prophetForce': {
        if (peekValue === null) peekValue = prophetEyePeek(g);
        const v = Number(prompt(`Ép roll kế của phe hiện tại thành (1–6)? [peek: ${peekValue}]`, `${peekValue}`));
        if (v >= 1 && v <= 6) {
          const r = prophetEyeForce(g, v);
          flashResult(r);
          if (r.ok) { g.die = v; g.dieRolled = true; if (g.phase === 'roll') g.phase = 'move'; }
        }
        refresh();
        break;
      }
    }
  },
};

// Đăng ký HUD handlers một lần.
document.getElementById('btnRoll')!.addEventListener('click', () => actions.onRoll());
document.getElementById('btnDev')!.addEventListener('click', () => {
  const bar = document.getElementById('devBar')!;
  bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
});

// ===== Vòng render =====
function refresh(): void {
  if (!g) return;
  // Highlight giữ nước di của quân đang chọn.
  if (selectedPieceId !== null) {
    const pc = g.players[g.current].pieces.find((x) => x.id === selectedPieceId);
    if (pc) highlights = computeHighlights(pc);
    if (universeKeyMode) {
      const onRing = g.players[g.current].pieces.filter(isOnRing);
      highlights = onRing.map((x) => ({ r: ringOf(x), kind: 'move' as const }));
    }
  }
  renderer.draw(g, highlights, selectedPieceId, performance.now());
  renderHud(g, selectedPieceId, peekValue, actions);
  document.getElementById('turnBadge')!.textContent = universeKeyMode
    ? '🔑 Chọn 2 quân trên vòng để hoán đổi'
    : document.getElementById('turnBadge')!.textContent;
  // Dev probe: snapshot state qua data-attribute (kênh đọc cho kiểm thử tự động).
  document.body.dataset.dbg = JSON.stringify({
    phase: g.phase, die: g.die, cur: g.current, sel: selectedPieceId,
    win: g.winner, lock: interactLocked,
    pcs: g.players[g.current].pieces.map((p) => ({ id: p.id, z: p.pos.zone, p: p.pos.zone === 'track' ? p.pos.p : null })),
  });
  maybePopups();
}

function maybePopups(): void {
  if (!g || interactLocked) return;
  // CORE_PICK modal.
  if (g.phase === 'corePick' && g.players[g.current].corePickPending !== null) {
    const milestone = g.players[g.current].corePickPending!;
    interactLocked = true;
    let rerolled = false;
    showCorePick(g, milestone, (coreId: CoreId, reroll: boolean) => {
      if (!g) return;
      if (reroll) { flashResult(pickCore(g, coreId, true)); rerolled = true; return; }
      // pickCore qua core API: cần import — thực hiện qua dynamic không được; đã import pickCore? Chưa.
      void rerolled;
      applyCorePick(coreId);
    });
  }
  // Victory.
  if (g.phase === 'gameOver' && g.winner !== null) {
    sfx.win();
    showVictory(g.winner, g.players[g.winner].tribe, () => window.location.reload());
  }
}

import { pickCore } from '../core/turn.ts';
function applyCorePick(coreId: CoreId): void {
  if (!g) return;
  const r = pickCore(g, coreId);
  flashResult(r);
  interactLocked = false;
  afterAction();
}

// ===== Sau mỗi hành động: battle popup, FX, trạng thái =====
function afterAction(): void {
  if (!g) return;
  // FX theo log mới nhất.
  const last = g.log[g.log.length - 1];
  if (last) {
    const fxKind = ({ trap: 'F09', temple: 'F10', heal: 'F08', goal: 'F07' } as Record<string, string | undefined>)[last.kind];
    if (fxKind) {
      const pc = g.players[last.player].pieces.find(isOnRing);
      if (pc) {
        const t = RING_TILES[ringOf(pc)];
        if (t) renderer.addFx({ col: t.col, row: t.row }, fxKind);
      }
    }
  }
  // Battle popup từ ActionResult cuối.
  const r = lastResult;
  if (r?.battle) {
    interactLocked = true;
    sfx[r.battle.crit ? 'crit' : 'hit']();
    showBattle(r.battle, (pid) => {
      const [pi, ci] = pid.replace('P', '').split(':').map(Number);
      const pc = g!.players[pi]?.pieces[ci];
      if (!pc) return pid;
      return `${TRIBES[pc.tribe].name} ${CLASSES[pc.cls].name}# ${ci + 1}`;
    }, () => {
      interactLocked = false;
      refresh();
    });
  } else {
    if (last?.kind === 'goal') sfx.goal();
  }
  refresh();
}

let lastResult: ActionResult | null = null;

function flashResult(r: { ok: boolean; error?: string }): void {
  lastResult = r;
  if (!r.ok) {
    sfx.error();
    document.getElementById('phaseBadge')!.textContent = r.error ?? 'Lỗi';
  }
}

// Resize giữ pixelated fit.
function fit(): void {
  const wrap = document.getElementById('boardWrap')!;
  const style = getComputedStyle(wrap);
  const width = wrap.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const height = wrap.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  renderer.fitTo(width, height);
  refresh();
}
window.addEventListener('resize', fit);
fit();

// Vòng vẽ idle (bob animation + FX).
function loop(now: number): void {
  if (g) {
    renderer.draw(g, highlights, selectedPieceId, now);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Quân đang đứng trên 52 ô vòng (track p≤51); p>51 là đường về.
function isOnRing(pc: Piece): boolean {
  return pc.pos.zone === 'track' && pc.pos.p <= 51;
}
function ringOf(pc: Piece): number {
  const pos = pc.pos;
  if (pos.zone !== 'track' || pos.p > 51) return -1;
  return (13 * pc.player + pos.p) % 52;
}
