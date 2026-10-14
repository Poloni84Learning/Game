// Screens: draft, battle popup, core pick, treasure pick, victory — DOM overlay modals.
import type { BattleView, CoreId, GameState, ItemId, TribeId } from '../core/types.ts';
import { CLASSES } from '../data/classes.ts';
import { CORES, CORE_GROUP } from '../data/cores.ts';
import { coreOffers } from '../core/turn.ts';
import { TRIBES } from '../data/tribes.ts';
import { ITEMS } from '../data/items.ts';
import { coreIcon, heroSprite, itemIcon, setHeroStyle, sprite, TRIBE_HEX, TRIBE_ICON, uiSprite, type HeroStyle } from '../gfx/sprites.ts';
import { PLAYER_HEX } from '../gfx/layout.ts';

export const TRIBE_IDS: readonly TribeId[] = ['human', 'elf', 'demon', 'dragon'];
const CLASS_IDS: readonly ('knight' | 'mage' | 'archer' | 'assassin')[] = ['knight', 'mage', 'archer', 'assassin'];

const overlay = (): HTMLElement => document.getElementById('overlay')!;

export function hideOverlay(): void {
  overlay().classList.add('hidden');
  overlay().innerHTML = '';
}

function showModal(html: string): HTMLElement {
  const ov = overlay();
  ov.innerHTML = `<div class="modal">${html}</div>`;
  ov.classList.remove('hidden');
  return ov.firstElementChild as HTMLElement;
}

// ===== Draft =====
export interface DraftResult { tribes: TribeId[]; heroStyle: HeroStyle; }

export function showDraft(playerCount: number, onDone: (r: DraftResult) => void): void {
  let heroStyle: HeroStyle = (localStorage.getItem('heroStyle') as HeroStyle) ?? 'chibi';
  const picked: TribeId[] = [];
  let idx = 0;

  const render = (): void => {
    setHeroStyle(heroStyle);
    const modal = showModal(`
      <h2>Lập đội hình — Phe ${idx + 1}</h2>
      <div class="hint">Chọn tộc. Đội hình tộc thuần: Hiệp sĩ / Pháp sư / Cung thủ / Sát thủ (mỗi hệ 1 quân).</div>
      <div class="styleRow">
        <span class="styleLabel">Quân:</span>
        ${([['chibi', 'Chibi'], ['armor', 'Giáp'], ['cloak', 'Choàng']] as [HeroStyle, string][]).map(([s, label]) =>
          `<button class="styleBtn ${heroStyle === s ? 'sel' : ''}" data-s="${s}">${label}</button>`).join('')}
      </div>
      <div class="tribeGrid">
        ${TRIBE_IDS.map((t) => {
          const d = TRIBES[t];
          return `<div class="tribeCard" data-t="${t}">
            <div class="tribePortrait" aria-hidden="true"></div>
            <div class="tname" style="color:${TRIBE_HEX[t]}">${d.name}</div>
            <div class="tdesc">${d.personalText}<br>${d.affinityText}<br>×2: ${d.resonance2}<br>×4: ${d.resonance4}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="draftNav">
        <button class="bigBtn ghost" id="btnRandom">Chọn ngẫu nhiên</button>
        <button class="bigBtn" id="btnConfirm" disabled>Xác nhận</button>
      </div>
      <div class="hint" style="margin-top:8px">Đã chọn: ${picked.length}/${playerCount}</div>
    `);
    const previews = (): void => {
      modal.querySelectorAll<HTMLElement>('.tribeCard').forEach((el) => {
        const holder = el.querySelector('.tribePortrait')!;
        holder.replaceChildren();
        CLASS_IDS.forEach((cls) => holder.appendChild(uiSprite(heroSprite(el.dataset.t as TribeId, cls), 32)));
      });
    };
    previews();
    modal.querySelectorAll('.tribeCard').forEach((el) => {
      el.addEventListener('click', () => {
        modal.querySelectorAll('.tribeCard').forEach((x) => x.classList.remove('sel'));
        el.classList.add('sel');
        (modal.querySelector('#btnConfirm') as HTMLButtonElement).disabled = false;
      });
    });
    modal.querySelectorAll('.styleBtn').forEach((el) => {
      el.addEventListener('click', () => {
        heroStyle = el.getAttribute('data-s') as HeroStyle;
        localStorage.setItem('heroStyle', heroStyle);
        setHeroStyle(heroStyle);
        previews();
        modal.querySelectorAll('.styleBtn').forEach((x) => x.classList.remove('sel'));
        el.classList.add('sel');
      });
    });
    modal.querySelector('#btnRandom')!.addEventListener('click', () => {
      const shuffled = [...TRIBE_IDS].sort(() => Math.random() - 0.5);
      for (let i = idx; i < playerCount; i++) picked[i] = shuffled[i % 4];
      onDone({ tribes: picked.slice(0, playerCount), heroStyle });
    });
    modal.querySelector('#btnConfirm')!.addEventListener('click', () => {
      const sel = modal.querySelector('.tribeCard.sel') as HTMLElement | null;
      if (!sel) return;
      picked[idx] = sel.getAttribute('data-t') as TribeId;
      idx++;
      if (idx >= playerCount) onDone({ tribes: picked.slice(0, playerCount), heroStyle });
      else render();
    });
  };
  render();
}

export function askPlayerCount(onPick: (n: number) => void): void {
  const modal = showModal(`
    <div class="welcomeParty" aria-hidden="true"></div>
    <h2>Cá Ngựa Chiến Thần</h2>
    <div class="hint">Hot-seat 2–4 phe cùng máy. Mỗi phe: 1 tộc × 4 hệ (Hiệp sĩ / Pháp sư / Cung thủ / Sát thủ).</div>
    <div class="itemPickRow">
      ${[2, 3, 4].map((n) => `<div class="itemPick" data-n="${n}"><b>${n} phe</b></div>`).join('')}
    </div>
  `);
  const party = modal.querySelector('.welcomeParty')!;
  CLASS_IDS.forEach((cls, i) => party.appendChild(uiSprite(heroSprite(TRIBE_IDS[i], cls), 64)));
  modal.querySelectorAll('.itemPick').forEach((el) => {
    el.addEventListener('click', () => onPick(Number(el.getAttribute('data-n'))));
  });
}

// ===== Battle popup (≤10s: tự đóng) =====
export function showBattle(v: BattleView, nameOf: (pieceId: string) => string, onClose: () => void): void {
  const side = (b: typeof v.attacker, win: boolean): string => `
    <div class="bside ${win ? 'winner' : ''}">
      <div class="bname">${nameOf(b.pieceId)}</div>
      <div class="btotal">${b.total}</div>
      <div class="broll">d6 = ${b.d6}${b.d6 !== b.base ? ` (base ${b.base})` : ''}</div>
      <div class="mods">${b.mods.map((m) =>
        `<div class="${m.amount >= 0 ? 'mpos' : 'mneg'}">${m.label}: ${m.amount >= 0 ? '+' : ''}${m.amount}</div>`,
      ).join('')}</div>
    </div>`;
  const atkWin = v.outcome === 'attacker';
  showModal(`
    <div class="battleBox">
      <h2>${v.reason === 'shoot' ? '🏹 Xạ Kích!' : '⚔ Giao tranh!'}</h2>
      ${v.crit ? '<div class="battleCrit">⚡ CHÍ MẠNG ×2!</div>' : ''}
      <div class="battleRow">
        ${side(v.attacker, atkWin)}
        <div class="battleVs">VS</div>
        ${side(v.defender, !atkWin)}
      </div>
      <div class="battleVerdict">${atkWin
        ? `${nameOf(v.attacker.pieceId)} THẮNG — ${nameOf(v.defender.pieceId)} về chuồng`
        : `${nameOf(v.defender.pieceId)} THỦ THÀNH CÔNG — sát thương ${v.damage}`}</div>
      <div class="battleRow">
        <span class="hint">EXP: ${nameOf(v.attacker.pieceId)} +${v.expGained.attacker} · ${nameOf(v.defender.pieceId)} +${v.expGained.defender}</span>
        <button class="bigBtn" id="btnBattleClose">Tiếp tục</button>
      </div>
    </div>`);
  const close = (): void => { hideOverlay(); onClose(); };
  document.getElementById('btnBattleClose')!.addEventListener('click', close);
  setTimeout(() => {
    if (!overlay().classList.contains('hidden') && document.getElementById('btnBattleClose')) close();
  }, 6000);
}

// ===== CORE_PICK =====
export function showCorePick(
  g: GameState, milestone: number,
  onPick: (coreId: CoreId, reroll: boolean) => void,
): void {
  const pl = g.players[g.current];
  let options = coreOffers(g);
  const render = (): void => {
    const rerollUsed = pl.coreRerollUsed[milestone] === true;
    const modal = showModal(`
      <h2>Mốc Lv${milestone} — chọn 1 Thần Khí (lõi)</h2>
      <div class="coreGrid">
        ${options.map((id) => {
          const c = CORES[id];
          return `<div class="coreCard" data-c="${id}">
            <span style="width:32px;height:32px;image-rendering:pixelated" class="kIcon"></span>
            <div><div class="kname">${c.name} <small style="color:var(--dim)">[nhóm ${CORE_GROUP[id]}]</small></div>
            <div class="kboon">✦ ${c.boon}</div>
            <div class="kprice">✧ ${c.price}</div></div>
          </div>`;
        }).join('')}
      </div>
      ${rerollUsed
        ? '<div class="hint">Đã dùng reroll mốc này.</div>'
        : '<button class="bigBtn ghost" id="btnReroll">🎲 Reroll (1 lần/mốc)</button>'}
    `);
    // Gắn icon lõi (canvas → img).
    modal.querySelectorAll('.coreCard').forEach((el, i) => {
      const holder = el.querySelector('.kIcon') as HTMLElement;
      holder.appendChild(scaleIcon(coreIcon(options[i])));
      el.addEventListener('click', () => { hideOverlay(); onPick(options[i], false); });
    });
    const rb = modal.querySelector('#btnReroll');
    if (rb) rb.addEventListener('click', () => {
      onPick(options[0], true); // đánh dấu reroll used qua engine
      options = coreOffers(g);
      modal.remove();
      render();
    });
  };
  render();
}

// ===== TreasureMap: chọn item khi mở rương =====
export function showTreasurePick(onPick: (item: ItemId) => void): void {
  const ids: ItemId[] = ['sword', 'shield', 'potion', 'lucky'];
  const modal = showModal(`
    <h2>Bản Đồ Kho Báu — chọn món</h2>
    <div class="itemPickRow">
      ${ids.map((id) => `<div class="itemPick" data-i="${id}"><div class="iIcon"></div><div>${ITEMS[id].name}</div>
        <small style="color:var(--dim)">${ITEMS[id].desc}</small></div>`).join('')}
    </div>`);
  modal.querySelectorAll('.itemPick').forEach((el, i) => {
    (el.querySelector('.iIcon') as HTMLElement).appendChild(scaleIcon(itemIcon(ids[i])));
    el.addEventListener('click', () => { hideOverlay(); onPick(ids[i]); });
  });
}

// ===== BloodDebt: chia bước =====
export function showSplitPick(die: number, onSplit: (stepsA: number) => void): void {
  const modal = showModal(`
    <h2>Nợ Máu — chia ${die} bước cho 2 quân</h2>
    <div class="splitRow">
      Quân A: <input id="splitA" type="number" min="0" max="${die}" value="${Math.floor(die / 2)}" />
      &nbsp;Quân B nhận phần còn lại: <b id="splitB">${die - Math.floor(die / 2)}</b>
    </div>
    <div class="hint">Chọn quân A trong danh sách trước khi mở bảng này.</div>
    <button class="bigBtn" id="btnSplitOk">Đi</button>
  `);
  const input = modal.querySelector('#splitA') as HTMLInputElement;
  const bOut = modal.querySelector('#splitB') as HTMLElement;
  input.addEventListener('input', () => { bOut.textContent = `${die - Number(input.value)}`; });
  modal.querySelector('#btnSplitOk')!.addEventListener('click', () => {
    hideOverlay();
    onSplit(Number(input.value));
  });
}

// ===== Victory =====
export function showVictory(winner: number, tribe: TribeId, onRestart: () => void): void {
  const modal = showModal(`
    <div class="victory">
      <h2>👑 Phe ${winner + 1} — ${TRIBES[tribe].name} CHIẾN THẮNG!</h2>
      <div style="text-align:center;margin:14px 0" class="vIcon"></div>
      <button class="bigBtn" id="btnAgain">Chơi lại</button>
    </div>`);
  (modal.querySelector('.vIcon') as HTMLElement).appendChild(scaleIcon(sprite(TRIBE_ICON[tribe]), 2));
  modal.querySelector('#btnAgain')!.addEventListener('click', onRestart);
}

// ===== Helpers =====
function scaleIcon(cv: HTMLCanvasElement, scale = 1): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = cv.width * scale; out.height = cv.height * scale;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0, out.width, out.height);
  out.style.imageRendering = 'pixelated';
  return out;
}
