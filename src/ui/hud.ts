// HUD: panel phe, xúc xắc, danh sách quân, nút skill/lõi, log — cập nhật mỗi tick.
import type { GameState, Piece, SkillId, TribeId } from '../core/types.ts';
import { CLASSES } from '../data/classes.ts';
import { TRIBES } from '../data/tribes.ts';
import { CORES } from '../data/cores.ts';
import { ITEMS } from '../data/items.ts';
import { SKILLS } from '../data/skills.ts';
import { computeStats, onBoardCount } from '../core/stats.ts';
import { PLAYER_HEX } from '../gfx/layout.ts';
import { heroSprite, skillIcon, sprite, TRIBE_ICON, uiSprite } from '../gfx/sprites.ts';

export interface HudActions {
  onPieceClick(pc: Piece): void;
  onSkillClick(pc: Piece, sid: SkillId): void;
  onCoreAction(action: string): void;
  onRoll(): void;
  onDevDie(n: number): void;
}

const $ = (id: string): HTMLElement => document.getElementById(id)!;

export function renderHud(g: GameState, selectedPieceId: number | null, peek: number | null, actions: HudActions): void {
  renderTop(g);
  renderPlayers(g);
  renderDice(g, actions);
  renderPieces(g, selectedPieceId, actions);
  renderCorePanel(g, peek, actions);
  renderLog(g);
}

function renderTop(g: GameState): void {
  $('turnBadge').textContent = `Lượt ${g.turn + 1} — Phe ${g.current + 1} (${TRIBES[g.players[g.current].tribe].name})`;
  $('turnBadge').style.color = PLAYER_HEX[g.current];
  const phaseText: Record<string, string> = {
    draft: 'Chọn đội hình', roll: 'Tung xúc xắc', move: 'Chọn quân đi / hành động',
    resolve: 'Giải ô', battle: 'Giao tranh', corePick: 'Chọn lõi', endTurn: 'Kết lượt', gameOver: 'Kết thúc',
  };
  $('phaseBadge').textContent = phaseText[g.phase] ?? g.phase;
}

function renderPlayers(g: GameState): void {
  $('players').innerHTML = g.players.map((pl, i) => {
    const onBoard = onBoardCount(g, i);
    const goal = pl.pieces.filter((p) => p.pos.zone === 'goal').length;
    const coreNames = pl.cores.map((c) => CORES[c].name).join(', ') || '—';
    return `<div class="playerCard ${i === g.current && g.phase !== 'gameOver' ? 'active' : ''}" style="--pc:${PLAYER_HEX[i]}">
      <span class="playerIcon" data-tribe="${pl.tribe}"></span>
      <span class="pname">Phe ${i + 1} · ${TRIBES[pl.tribe].name}</span>
      <span class="pinfo">trên sân ${onBoard} · đích ${goal}/4 · đi thêm ${pl.extraMoves}</span>
      <div class="cores">Lõi: ${coreNames}</div>
    </div>`;
  }).join('');
  $('players').querySelectorAll<HTMLElement>('.playerIcon').forEach((el) => {
    el.appendChild(uiSprite(sprite(TRIBE_ICON[el.dataset.tribe as TribeId]), 26));
  });
}

function renderDice(g: GameState, actions: HudActions): void {
  const die = $('dieFace');
  die.replaceChildren();
  if (g.die !== null) die.appendChild(uiSprite(sprite(`D0${g.die}`), 56));
  else die.textContent = '?';
  die.setAttribute('aria-label', g.die === null ? 'Chưa tung xúc xắc' : `Xúc xắc ${g.die}`);
  const canRoll = g.phase === 'roll' && g.winner === null;
  ($('btnRoll') as HTMLButtonElement).disabled = !canRoll;
  $('extraMoves').textContent = g.players[g.current].extraMoves > 0
    ? `×${g.players[g.current].extraMoves} đi thêm` : '';
  // DevMode bar giữ nguyên nếu đã render.
  if (!document.getElementById('devBar')) {
    const bar = document.createElement('div');
    bar.id = 'devBar';
    bar.style.display = 'none';
    bar.innerHTML = [1, 2, 3, 4, 5, 6].map((n) => `<button data-n="${n}">${n}</button>`).join('');
    $('diceArea').appendChild(bar);
    bar.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => actions.onDevDie(Number(b.getAttribute('data-n'))));
    });
  }
}

function renderPieces(g: GameState, selectedPieceId: number | null, actions: HudActions): void {
  const pl = g.players[g.current];
  $('pieceList').innerHTML = pl.pieces.map((pc) => {
    const st = computeStats(g, pc);
    const cls = CLASSES[pc.cls];
    const zoneText = pc.pos.zone === 'pen' ? 'chuồng'
      : pc.pos.zone === 'goal' ? 'ĐÍCH ✓'
      : pc.pos.zone === 'track' && pc.pos.p > 51 ? `đường về ${pc.pos.p - 51}` : `p${pc.pos.p}`;
    const status: string[] = [];
    if (pc.skipTurns > 0) status.push(`bị khoá ${pc.skipTurns} lượt`);
    if (pc.frozenTurns > 0) status.push('bị trói');
    if (pc.shieldTurn) status.push('khiên');
    if (pc.darkVeilTurn) status.push('bóng đêm');
    if (pc.legShotArmed) status.push('Bắn Chân chờ');
    if (pc.robArmed) status.push('Cướp chờ');
    if (pc.chargeArmed) status.push('Xung Phong chờ');

    const skills = (cls.skillIds as SkillId[]).map((sid) => {
      const def = SKILLS[sid];
      const learned = pc.skillsLearned.includes(def.unlockLevel);
      const cd = pc.skillCd[sid] ?? 0;
      const ready = learned && cd === 0 && pc.pos.zone !== 'goal' && pc.pos.zone !== 'pen'
        && pc.pos.p !== undefined;
      const arming = (pc.legShotArmed && sid === 'legShot')
        || (pc.robArmed && sid === 'rob') || (pc.chargeArmed && sid === 'chargeFormation');
      return `<button class="skillBtn ${ready ? 'ready' : ''} ${arming ? 'arming' : ''}"
        data-pc="${pc.id}" data-sid="${sid}" ${ready ? '' : 'disabled'}
        title="${def.desc} — CD ${def.cd}">${def.name}${cd > 0 ? ` (${cd})` : ''}</button>`;
    }).join('');

    const items = pc.items.map((it) => `${ITEMS[it].name}`).join('+') || '';
    const pct = Math.round((pc.hp / st.maxHp) * 100);
    return `<div class="pieceRow ${pc.id === selectedPieceId ? 'selected' : ''}" data-pc="${pc.id}" role="button" tabindex="0" aria-label="Chọn ${cls.name}, cấp ${pc.level}" aria-pressed="${pc.id === selectedPieceId}">
      <span class="piecePortrait"></span>
      <div class="pieceDetails">
        <div class="pieceHeading"><span class="clsName">${cls.name}</span><span class="lv">Lv${pc.level}</span><span class="zoneTag">${zoneText}</span></div>
        <div class="pieceHealth"><div class="hpBar"><div class="hpFill ${pct <= 30 ? 'low' : ''}" style="width:${pct}%"></div></div><span>${pc.hp}/${st.maxHp}</span></div>
        <span class="badges">ATK ${st.atk} · DEF ${st.def}${items ? ` · ${items}` : ''}${status.length ? ` · ${status.join(', ')}` : ''}</span>
        <span class="skillBtns">${skills}</span>
      </div>
    </div>`;
  }).join('');

  $('pieceList').querySelectorAll('.pieceRow').forEach((el) => {
    const pc = pl.pieces.find((x) => x.id === Number(el.getAttribute('data-pc')))!;
    el.querySelector('.piecePortrait')!.appendChild(uiSprite(heroSprite(pc.tribe, pc.cls), 48));
    el.addEventListener('click', (ev) => {
      if ((ev.target as HTMLElement).closest('.skillBtn')) return;
      const pc = pl.pieces.find((x) => x.id === Number(el.getAttribute('data-pc')));
      if (pc) actions.onPieceClick(pc);
    });
    el.addEventListener('keydown', (ev) => {
      if ((ev.target as HTMLElement).closest('.skillBtn')) return;
      const key = (ev as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') { ev.preventDefault(); actions.onPieceClick(pc); }
    });
  });
  $('pieceList').querySelectorAll('.skillBtn').forEach((el) => {
    el.addEventListener('click', () => {
      const pc = pl.pieces.find((x) => x.id === Number(el.getAttribute('data-pc')));
      if (pc) actions.onSkillClick(pc, el.getAttribute('data-sid') as SkillId);
    });
  });
}

function renderCorePanel(g: GameState, peek: number | null, actions: HudActions): void {
  const pl = g.players[g.current];
  const btns: string[] = [];
  if (pl.cores.includes('universeKey')) {
    btns.push(`<button class="coreBtn" data-act="universeKey" ${pl.coreFlags.universeKeyUsed || g.phase !== 'move' ? 'disabled' : ''}>
      🔑 Chìa Vũ Trụ — hoán đổi 2 quân (chọn quân A rồi B trên bàn)</button>`);
  }
  if (pl.cores.includes('bloodDebt')) {
    btns.push(`<button class="coreBtn" data-act="bloodDebt" ${g.phase !== 'move' || g.die === null ? 'disabled' : ''}>
      🩸 Nợ Máu — chia ${g.die ?? '–'} bước cho 2 quân</button>`);
  }
  if (pl.cores.includes('treasureMap')) {
    btns.push(`<button class="coreBtn" data-act="treasureMap" ${g.phase !== 'move' ? 'disabled' : ''}>
      🗺 Bản Đồ — mở rương tại ô quân được chọn</button>`);
  }
  if (pl.cores.includes('prophetEye')) {
    btns.push(`<button class="coreBtn" data-act="prophetPeek">👁 Mắt Tiên Tri — xem trước roll của phe kế</button>`);
    btns.push(`<button class="coreBtn" data-act="prophetForce" ${pl.coreFlags.prophetSwapUsed ? 'disabled' : ''}>
      ✋ Ép roll kế (1 lần/trận)</button>`);
  }
  $('corePanel').innerHTML = btns.join('')
    + (peek !== null ? `<div id="peekValue">👁 Roll kế của phe kế tiếp: <b>${peek}</b></div>` : '');
  $('corePanel').querySelectorAll('.coreBtn').forEach((el) => {
    el.addEventListener('click', () => actions.onCoreAction(el.getAttribute('data-act')!));
  });
}

function renderLog(g: GameState): void {
  const panel = $('logPanel');
  const atBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 40;
  panel.innerHTML = g.log.slice(-80).map((e) =>
    `<div class="lk-${e.kind}">[${e.turn + 1}|P${e.player + 1}] ${e.text}</div>`).join('');
  if (atBottom) panel.scrollTop = panel.scrollHeight;
}

export function setDevBarVisible(v: boolean): void {
  const bar = document.getElementById('devBar');
  if (bar) bar.style.display = v ? 'flex' : 'none';
}

export function spriteIconFor(sid: SkillId): HTMLCanvasElement {
  return skillIcon(sid);
}
