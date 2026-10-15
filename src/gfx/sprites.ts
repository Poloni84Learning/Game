// Sprite cache: string-matrix (assets.ts, heroes_v3.ts) → HTMLCanvasElement, vẽ 1 lần rồi blit.
import type { AssetDef } from '../data/gfx/assets.ts';
import { ASSETS_ZCODE, PALETTE_ZCODE } from '../data/gfx/assets_zcode.ts';
import type { ClassId, TribeId } from '../core/types.ts';

const cache = new Map<string, HTMLCanvasElement>(); // key `${id}:${frame}` — dựng động runtime

// zcode pack has twice the authored pixels: tile 48, hero/icon 32, pen 96.
// Keep the same logical board size: draw native pixels, rather than 2x old pixels.
export const SPR = 1;

function rasterize(def: AssetDef, frame: number): HTMLCanvasElement {
  const key = `${def.id}:${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = def.frames[frame] ?? def.frames[0];
  const w = rows[0].length, h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w * SPR; cv.height = h * SPR;
  const ctx = cv.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = PALETTE_ZCODE[ch] ?? '#f0f';
      ctx.fillRect(x * SPR, y * SPR, SPR, SPR);
    }
  }
  cache.set(key, cv);
  return cv;
}

export function sprite(id: string, frame = 0): HTMLCanvasElement {
  const def = DEFS[id];
  if (!def) throw new Error(`Asset thiếu: ${id}`);
  return rasterize(def, frame);
}

// Hero theo (phong cách, tộc, class). 3 phong cách v3:
// chibi H61-H76 · armor H21-H36 · cloak H41-H56. Legacy v2 H01-H16 giữ làm fallback.
// Thứ tự trong mỗi set: knight/mage/archer/assassin × human/demon/elf/dragon.
export type HeroStyle = 'chibi' | 'armor' | 'cloak';

const HERO_SETS: Record<HeroStyle, Record<TribeId, Record<ClassId, string>>> = {
  chibi: {
    human:  { knight: 'H61', mage: 'H65', archer: 'H69', assassin: 'H73' },
    demon:  { knight: 'H62', mage: 'H66', archer: 'H70', assassin: 'H74' },
    elf:    { knight: 'H63', mage: 'H67', archer: 'H71', assassin: 'H75' },
    dragon: { knight: 'H64', mage: 'H68', archer: 'H72', assassin: 'H76' },
  },
  armor: {
    human:  { knight: 'H21', mage: 'H25', archer: 'H29', assassin: 'H33' },
    demon:  { knight: 'H22', mage: 'H26', archer: 'H30', assassin: 'H34' },
    elf:    { knight: 'H23', mage: 'H27', archer: 'H31', assassin: 'H35' },
    dragon: { knight: 'H24', mage: 'H28', archer: 'H32', assassin: 'H36' },
  },
  cloak: {
    human:  { knight: 'H41', mage: 'H45', archer: 'H49', assassin: 'H53' },
    demon:  { knight: 'H42', mage: 'H46', archer: 'H50', assassin: 'H54' },
    elf:    { knight: 'H43', mage: 'H47', archer: 'H51', assassin: 'H55' },
    dragon: { knight: 'H44', mage: 'H48', archer: 'H52', assassin: 'H56' },
  },
};

let heroStyle: HeroStyle = 'chibi';
export function setHeroStyle(s: HeroStyle): void {
  heroStyle = s in HERO_SETS ? s : 'chibi';
}

export function heroSprite(tribe: TribeId, cls: ClassId, frame = 0): HTMLCanvasElement {
  return sprite(HERO_SETS[heroStyle][tribe][cls], frame);
}

const ZCODE_BY_ID: Record<string, AssetDef> = Object.fromEntries(ASSETS_ZCODE.map((d) => [d.id, d]));

const DEFS = ZCODE_BY_ID;

/** DOM copy: never move a cached canvas into the UI. */
export function uiSprite(source: HTMLCanvasElement, size = 32): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = source.width; cv.height = source.height;
  cv.getContext('2d')!.drawImage(source, 0, 0);
  cv.style.width = `${size}px`; cv.style.height = `${size * source.height / source.width}px`;
  cv.setAttribute('aria-hidden', 'true');
  return cv;
}

// Icon lõi K01-K12 theo CoreId (thứ tự CORES).
import type { CoreId, ItemId, SkillId } from '../core/types.ts';

const CORE_ICON: Record<CoreId, string> = {
  bloodPact: 'K01', rustLightning: 'K02', punishingLight: 'K03', nightTorch: 'K04',
  bloodDebt: 'K05', deadMirror: 'K06', prophetEye: 'K07', reverseFlow: 'K08',
  headHunter: 'K09', loneKing: 'K10', universeKey: 'K11', treasureMap: 'K12',
};
export function coreIcon(id: CoreId): HTMLCanvasElement {
  return sprite(CORE_ICON[id]);
}

const SKILL_ICON: Record<SkillId, string> = {
  shieldWall: 'S01', chargeFormation: 'S02', bind: 'S03', enlighten: 'S04',
  legShot: 'S05', tripleShot: 'S06', darkVeil: 'S07', rob: 'S08',
};
export function skillIcon(id: SkillId): HTMLCanvasElement {
  return sprite(SKILL_ICON[id]);
}

const ITEM_ICON: Record<ItemId, string> = {
  sword: 'I01', shield: 'I02', potion: 'I03', lucky: 'I04',
};
export function itemIcon(id: ItemId): HTMLCanvasElement {
  return sprite(ITEM_ICON[id]);
}

export const TRIBE_ICON: Record<TribeId, string> = {
  human: 'C01', elf: 'C02', demon: 'C03', dragon: 'C04',
};
export const TRIBE_HEX: Record<TribeId, string> = {
  human: '#e77b68', elf: '#7bb58b', demon: '#e2b563', dragon: '#ac8bbb',
};
