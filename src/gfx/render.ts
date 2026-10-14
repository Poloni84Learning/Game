// Canvas 2D renderer: board, quân, highlight, FX. Đọc state plain-object từ core.
import { specialAt, regionOfRing } from '../data/board.ts';
import type { GameState, Piece } from '../core/types.ts';
import { computeStats } from '../core/stats.ts';
import { CANVAS_H, CANVAS_W, GOAL_TILE, HOME_TILES, PEN_TILES, PLAYER_HEX, RING_TILES, TILE, px, tileOf } from './layout.ts';
import { heroSprite, sprite } from './sprites.ts';

export interface Highlight { r: number; kind: 'move' | 'target'; }
export interface FxEvent { tile: { col: number; row: number }; fx: string; t: number; }

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private fx: FxEvent[] = [];
  private t0 = performance.now();
  private background: HTMLCanvasElement;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d')!;
    this.background = this.makeBackground();
  }

  addFx(tile: { col: number; row: number }, fx: string): void {
    this.fx.push({ tile, fx, t: performance.now() });
    if (this.fx.length > 24) this.fx.shift();
  }

  // Canvas hiển thị theo kích thước CSS (giữ pixelated). Scale liên tục để
  // lấp đầy không gian sẵn có — floor nguyên làm bàn cờ co cụm (1.97x → 1x).
  fitTo(w: number, h: number): void {
    this.scale = Math.max(0.01, Math.min(w / CANVAS_W, h / CANVAS_H));
    this.canvas.style.width = `${Math.round(CANVAS_W * this.scale)}px`;
    this.canvas.style.height = `${Math.round(CANVAS_H * this.scale)}px`;
  }

  draw(g: GameState, highlights: Highlight[], selectedPieceId: number | null, now: number): void {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.background, 0, 0);

    this.drawRing(c, g);
    this.drawHomes(c, g);
    this.drawGoal(c);
    this.drawPens(c, g);
    this.drawHighlights(c, highlights);
    this.drawPieces(c, g, selectedPieceId, now);
    this.drawFx(c, now);
  }

  // Static scenery is cached once, so the game loop only draws active elements.
  private makeBackground(): HTMLCanvasElement {
    const bg = document.createElement('canvas');
    bg.width = CANVAS_W; bg.height = CANVAS_H;
    const c = bg.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#111a24'; c.fillRect(0, 0, CANVAS_W, CANVAS_H);
    c.fillStyle = '#795237'; c.fillRect(87, 87, 738, 738);
    c.fillStyle = '#e2b563'; c.fillRect(89, 89, 734, 734);
    c.fillStyle = '#293343'; c.fillRect(92, 92, 728, 728);
    // Four quiet landscape quadrants; bright tiles are the playable route.
    const grounds = ['#263a34', '#493c30', '#30463f', '#293d4b'];
    const quads = [[144,144], [456,144], [456,456], [144,456]];
    quads.forEach(([x,y], i) => {
      c.fillStyle = grounds[i]; c.fillRect(x,y,312,312);
      c.fillStyle = ['#30453c','#554333','#3b5045','#324854'][i];
      for (let n=0;n<25;n++) {
        const xx=x+12+(n*83+i*19)%282, yy=y+10+(n*53)%286;
        c.fillRect(xx,yy,6+(n%3)*3,2);
      }
    });
    // Central masonry axes frame the home lanes without suggesting extra moves.
    c.fillStyle = '#202d36';
    c.fillRect(416,144,80,624); c.fillRect(144,416,624,80);
    c.fillStyle = '#3a454a';
    c.fillRect(419,144,2,624); c.fillRect(491,144,2,624);
    c.fillRect(144,419,624,2); c.fillRect(144,491,624,2);
    for(const [id,x,y] of [
      ['P01',190,169],['P01',270,236],['P01',185,321],['P01',333,164],
      ['P03',540,182],['P03',642,255],['P03',561,330],
      ['P02',563,573],['P02',673,523],['P02',638,665],['P02',531,682],
      ['P04',192,550],['P04',299,626],['P04',203,679],
    ] as [string,number,number][]) c.drawImage(sprite(id),x,y);
    // Inset compass emblem, with stepped geometry and a restrained gold rim.
    c.fillStyle = '#151e29'; c.fillRect(394,394,124,124);
    c.fillStyle = '#795237'; c.fillRect(398,398,116,116);
    c.fillStyle = '#ba8748'; c.fillRect(400,400,112,112);
    c.fillStyle = '#293343'; c.fillRect(403,403,106,106);
    for (const [x,y] of [[397,397],[506,397],[397,506],[506,506]]) {
      c.fillStyle='#f6df9c';c.fillRect(x,y,9,9);c.fillStyle='#795237';c.fillRect(x+3,y+3,3,3);
    }
    return bg;
  }

  private drawRing(c: CanvasRenderingContext2D, g: GameState): void {
    for (let r = 0; r < RING_TILES.length; r++) {
      const t = RING_TILES[r];
      const { x, y } = px(t.col, t.row);
      c.drawImage(sprite(`B0${(Math.floor(r / 13) + 1)}`), x, y);
      // Nền altern frame 2 theo vị trí để bớt đơn điệu.
      if ((t.col + t.row) % 3 === 0) c.drawImage(sprite(`B0${(Math.floor(r / 13) + 1)}`, 1), x, y);
      const sp = specialAt(r);
      if (sp) {
        // B05 frame: 1 sao / 2 rương / 3 bẫy / 4 đền / 5 hồi.
        const f = { star: 1, chest: 2, trap: 3, temple: 4, heal: 5 }[sp] ?? 1;
        c.drawImage(sprite('B05', f - 1), x, y);
      }
      void g;
    }
  }

  private drawHomes(c: CanvasRenderingContext2D, g: GameState): void {
    for (let p = 0; p < 4; p++) {
      if (p >= g.playerCount) continue;
      for (let i = 0; i < HOME_TILES[p].length; i++) {
        const t = HOME_TILES[p][i];
        const { x, y } = px(t.col, t.row);
        c.save();
        c.translate(x + TILE / 2, y + TILE / 2);
        c.rotate(Math.PI + p * Math.PI / 2);
        c.drawImage(sprite('B06', i === 4 ? 1 : 0), -TILE / 2, -TILE / 2);
        c.restore();
        // Tô nhẹ màu phe để nhận đường về của ai.
        c.globalAlpha = 0.16;
        c.fillStyle = PLAYER_HEX[p];
        c.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        c.globalAlpha = 1;
      }
    }
  }

  private drawGoal(c: CanvasRenderingContext2D): void {
    const { x, y } = px(GOAL_TILE.col, GOAL_TILE.row);
    c.drawImage(sprite('B06', 1), x, y);
  }

  private drawPens(c: CanvasRenderingContext2D, g: GameState): void {
    for (let p = 0; p < g.playerCount; p++) {
      const base = PEN_TILES[p];
      const { x, y } = px(base.col, base.row);
      c.drawImage(sprite('B07'), x, y);
      c.fillStyle = PLAYER_HEX[p];
      c.fillRect(x + 6, y + 6, 84, 3);
      c.fillRect(x + 6, y + 86, 84, 3);
    }
  }

  private drawHighlights(c: CanvasRenderingContext2D, highlights: Highlight[]): void {
    for (const h of highlights) {
      const t = RING_TILES[h.r];
      if (!t) continue;
      const { x, y } = px(t.col, t.row);
      c.strokeStyle = h.kind === 'move' ? '#e8c85a' : '#e94438';
      c.lineWidth = 4;
      const pulse = 3 + Math.sin(performance.now() / 180) * 1.6;
      c.strokeRect(x + pulse, y + pulse, TILE - pulse * 2, TILE - pulse * 2);
    }
  }

  private drawPieces(c: CanvasRenderingContext2D, g: GameState, selectedPieceId: number | null, now: number): void {
    // Vẽ quân trên ring theo thứ tự r để chồng đúng; quân cùng ô xếp offset nhỏ.
    const byCell = new Map<string, Piece[]>(); // key `${zone}:${player}:${p}` — dynamic
    for (const pl of g.players) {
      for (const pc of pl.pieces) {
        const key = pc.pos.zone === 'track'
          ? pc.pos.p <= 51 ? `r:${(13 * pc.player + pc.pos.p) % 52}` : `h:${pc.player}:${pc.pos.p}`
          : pc.pos.zone === 'pen' ? `pen:${pc.player}:${pc.id}` : 'goal';
        const arr = byCell.get(key) ?? [];
        arr.push(pc);
        byCell.set(key, arr);
      }
    }
    for (const [, arr] of byCell) {
      arr.forEach((pc, idx) => {
        let tile: { col: number; row: number };
        if (pc.pos.zone === 'track' && pc.pos.p <= 51) tile = tileOf(pc.player, 'track', (13 * pc.player + pc.pos.p) % 52, pc.id);
        else if (pc.pos.zone === 'track') tile = tileOf(pc.player, 'home', pc.pos.p, pc.id);
        else if (pc.pos.zone === 'goal') tile = { col: GOAL_TILE.col, row: GOAL_TILE.row };
        else tile = tileOf(pc.player, 'pen', 0, pc.id);
        const { x, y } = px(tile.col, tile.row);
        // Bob 1px theo frame chân bước; quân được chọn nhảy cao hơn.
        const bob = (Math.floor(now / 600) % 2) && pc.pos.zone !== 'pen' ? 1 : 0;
        const sel = pc.id === selectedPieceId && pc.player === g.current;
        const lift = sel ? 4 + Math.round(Math.abs(Math.sin(now / 220)) * 4) : 0;
        const ox = Math.min(idx, 3) * 4;
        c.fillStyle = '#151e29';
        c.fillRect(x + 9 + ox, y + 30, 29, 6);
        c.fillStyle = PLAYER_HEX[pc.player];
        c.fillRect(x + 13 + ox, y + 34, 21, 2);
        if (sel) {
          c.strokeStyle = '#f6df9c'; c.lineWidth = 2;
          c.strokeRect(x + 5, y + 3, 38, 39);
        }
        c.drawImage(heroSprite(pc.tribe, pc.cls, bob), x + 8 + ox, y + 1 - lift);
        c.globalAlpha = 1;

        // Badge cấp + HP bar + cờ trạng thái.
        c.font = 'bold 10px monospace';
        c.fillStyle = '#151e29'; c.fillRect(x + 3 + ox, y + 34, 11, 11);
        c.fillStyle = '#f6df9c';
        c.fillText(`${pc.level}`, x + 5 + ox, y + 43);
        const st = pc.hp;
        const maxHp = computeStats(g, pc).maxHp;
        const w = Math.max(0, Math.min(27, Math.round((st / maxHp) * 27)));
        c.fillStyle = '#151e29'; c.fillRect(x + 15 + ox, y + 38, 29, 6);
        c.fillStyle = st <= maxHp * 0.3 ? '#e77b68' : '#7bb58b';
        c.fillRect(x + 16 + ox, y + 39, w, 3);

        const flags: string[] = [];
        if (pc.skipTurns > 0) flags.push('⏸');
        if (pc.frozenTurns > 0) flags.push('❄');
        if (pc.shieldTurn) flags.push('⛨');
        if (pc.darkVeilTurn) flags.push('☾');
        if (pc.legShotArmed || pc.robArmed || pc.chargeArmed) flags.push('✚');
        if (flags.length) {
          c.font = '16px monospace';
          c.fillStyle = '#e8c85a';
          c.fillText(flags.join(''), x + TILE - 8 - flags.length * 12, y + 16);
        }
      });
    }
  }

  private drawFx(c: CanvasRenderingContext2D, now: number): void {
    this.fx = this.fx.filter((e) => now - e.t < 700);
    for (const e of this.fx) {
      const age = (now - e.t) / 700;
      const { x, y } = px(e.tile.col, e.tile.row);
      c.globalAlpha = 1 - age;
      const f = Math.min(2, Math.floor(age * 3));
      const cv = sprite(e.fx, f);
      c.drawImage(cv, x, y - 12);
      c.globalAlpha = 1;
    }
  }
}

// FX theo kind log: ánh xạ event → sprite F01-F10 tại ô của quân liên quan.
export const FX_BY_KIND: Record<string, string> = {
  trap: 'F09', temple: 'F10', heal: 'F08', goal: 'F07',
};

// Ô đích của nước đi hợp lệ (dùng highlight): dest p → r (nếu còn trên vòng).
export function destRing(player: number, destP: number): number | null {
  if (destP > 51) return null;
  return ((13 * player + destP) % 52 + 52) % 52;
}

export function regionColor(r: number): string {
  return { forest: '#3c6848', desert: '#c19262', valley: '#5f8f5a', ice: '#88b0cd' }[regionOfRing(r)] ?? '#555';
}
