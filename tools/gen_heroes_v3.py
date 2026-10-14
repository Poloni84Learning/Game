"""Sinh 32 hero v3 (2 bộ: H21-H36 giáp, H41-H56 choàng) + PNG derived + preview sheet.

- 3 phong cách × (4 tộc × 4 class) = 48 hero; style A (chibi) giữ H01-H16 hiện có
  và được hoàn thiện lại tại đây (H61-H76) để 3 bộ cùng tiêu chuẩn vũ khí.
- Frame: f0 đứng, f1 nhún (dịch xuống 1px), f2 chân trái co, f3 chân phải co.
- Chạy: python tools/gen_heroes_v3.py
  Xuất: src/data/gfx/heroes_v3.ts, assets/v2/png/H*_N.png (derived), preview sheets.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- Palette từ src/data/gfx/assets.ts ----
src = open(os.path.join(ROOT, 'src/data/gfx/assets.ts'), encoding='utf-8').read()
PAL = {}
for m in re.finditer(r"'(.)': '#([0-9A-F]{6})'", src):
    PAL[m.group(1)] = '#' + m.group(2)

TRIBE_ACCENT = {'human': ('r', 'R'), 'demon': ('l', 'L'), 'elf': ('f', 'F'), 'dragon': ('u', 'U')}


def recolor(rows, dark, light):
    """Đổi accent màu phe trong matrix (r/R → dark/light)."""
    return [row.replace('R', '\x00').replace('r', dark).replace('\x00', light) for row in rows]


# ================= TEMPLATE FRAME 0 (accent = r/R, tộc human) =================
# Chibi A — vũ khí hoàn thiện: khiên M viền W, trượng đầu c, cung dày + dây, 2 đoản đao W.
A = {
    'knight': [
        '................',
        '.....ooooo......',
        '....ossssso.....',
        '....ossssso.....',
        '....oesoeso.....',
        '....ossssso.....',
        '.....osssso.....',
        '...oorrrroo.....',
        '..oMrRRRRrMo....',
        '..oMrRRRRrMo.WW.',
        '..oMoRRRRoM.WW..',
        '...oMMMMMo.WW...',
        '...ommmmoWW.....',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
    'mage': [
        '............c...',
        '.....ooooo..b...',
        '....osssssob....',
        '....osssssob....',
        '....oesoeso.b...',
        '....osssssob....',
        '.....ossssob....',
        '...oorrrroo.b...',
        '..oMrRRRRrMob...',
        '..oMrRRRRrMo....',
        '..oMoRRRRoM.....',
        '...oMMMMMo......',
        '...ommmmo.......',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
    'archer': [
        '............b...',
        '.....ooooo..W...',
        '....osssssobW...',
        '....osssssobW...',
        '....oesoeso.bW..',
        '....ossssso.bW..',
        '.....osssso.bW..',
        '...oorrrroo.bW..',
        '..oMrRRRRrMobW..',
        '..oMrRRRRrMo.b..',
        '..oMoRRRRoM..b..',
        '...oMMMMMo...b..',
        '...ommmmo.......',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
    'assassin': [
        '................',
        '.....ooooo......',
        '....ossssso.....',
        '....ossssso.....',
        '....oesoeso.....',
        '....ossssso.....',
        '.....osssso.....',
        '...oorrrroo.....',
        '.WoMrRRRRrMoW...',
        '.WoMrRRRRrMoW...',
        '.WMoRRRRoM..W...',
        '...oMMMMMMo.....',
        '...ommmmmo......',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
}

# Armor B — mũ giáp M, vai rộng, vũ khí cầm trước ngực.
B = {
    'knight': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMrRRMo......',
        '..oMrRRRRMo.....',
        '..oMrRRRRMo.....',
        '..oMoRRRRoMMMW..',
        '...oMMMMMMoMMo..',
        '...ommmmmoMo....',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'mage': [
        '...........cb...',
        '.....ooooo..b...',
        '....oMMMMMo.b...',
        '....oMsssmo.b...',
        '....oesoeso.b...',
        '.....osso...b...',
        '....oMMMMo..b...',
        '...oMrRRMo..b...',
        '..oMrRRRRMob....',
        '..oMrRRRRMo.....',
        '..oMoRRRRoM.....',
        '...oMMMMMMo.....',
        '...ommmmmo......',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'archer': [
        '...........b....',
        '.....ooooo.W....',
        '....oMMMMMobW...',
        '....oMsssmobW...',
        '....oesoeso.bW..',
        '.....osso...bW..',
        '....oMMMMo..bW..',
        '...oMrRRMo..bW..',
        '..oMrRRRRMo.bW..',
        '..oMrRRRRMo..b..',
        '..oMoRRRRoM..b..',
        '...oMMMMMMo..b..',
        '...ommmmmo......',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'assassin': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMrRRMo......',
        '.WoMrRRRRMoW....',
        '.WoMrRRRRMoW....',
        '.WMoRRRRoM......',
        '...oMMMMMMo.....',
        '...ommmmmo......',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
}

# Cloak C — outline dày, áo choàng màu phe, pose theo class.
C = {
    'knight': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooRRRRoo.....',
        '.oMMoRRRRo......',
        '.oMMoRRRRo......',
        '.oMMoRRRRoWW....',
        '.oMMoRRRRoWW....',
        '..oooRRRRo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'mage': [
        '..........cb....',
        '.....ooooo.b....',
        '....oMMMMMo.b...',
        '....oMssssob....',
        '....oesoeso.b...',
        '.....osssso.b...',
        '..oooRRRRoo.b...',
        '.oMMoRRRRo......',
        '.oMMoRRRRo......',
        '.oMMoRRRRoWW....',
        '.oMMoRRRRoWW....',
        '..oooRRRRo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'archer': [
        '..........b.....',
        '.....oooooW.....',
        '....oMMMMMobW...',
        '....oMssssobW...',
        '....oesoeso.bW..',
        '.....osssso.bW..',
        '..oooRRRRoo.bW..',
        '.oMMoRRRRo..bW..',
        '.oMMoRRRRo...b..',
        '.oMMoRRRRoWW....',
        '.oMMoRRRRoWW....',
        '..oooRRRRo...b..',
        '...oooooo....b..',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'assassin': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooRRRRoo.....',
        '.oMMoRRRRoW.....',
        '.oMMoRRRRoW.....',
        '.oMMoRRRRoW.....',
        '.oMMoRRRRoW.....',
        '..oooRRRRo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
}

STYLES = {'A': A, 'B': B, 'C': C}
STYLE_BASE = {'A': 61, 'B': 21, 'C': 41}  # A hoàn thiện lại thành bộ H61-H76; B giáp; C choàng
STYLE_ID = {'A': 'chibi', 'B': 'armor', 'C': 'cloak'}


def frames_from_base(base):
    """4 frame từ frame0: đứng, nhún (dịch xuống 1px), chân trái co, chân phải co."""
    f0 = base
    f1 = ['.' * 16] + f0[:-1]  # nhún: dịch toàn thân xuống 1px, cắt hàng cuối
    # f2: chân trái co — nửa trái (cols 0..7) hàng 14,15: boot trái rút lên 1px
    def leg_up(rows, left):
        rows = list(rows)
        c0, c1 = (0, 8) if left else (8, 16)
        # tìm hàng boot (hàng có 'SS' hoặc 'oo' chân) thấp nhất trong nửa
        for r in range(15, 9, -1):
            seg = rows[r][c0:c1]
            if any(ch in 'So' for ch in seg):
                rows[r] = rows[r][:c0] + '.' * (c1 - c0) + rows[r][c1:]
                # nối lại: dịch phần dưới chân lên — đơn giản: boot thấp nhất biến mất (co chân)
                return rows
        return rows
    f2 = leg_up(f0, True)
    f3 = leg_up(f0, False)
    return [f0, f1, f2, f3]


def validate(rows):
    w = len(rows[0])
    for i, r in enumerate(rows):
        assert len(r) == w, f'row {i} width {len(r)} != {w}: {r}'
        for ch in r:
            if ch != '.':
                assert ch in PAL, f'unknown palette char {ch!r}'


def build_set(style_key):
    """Trả về list (id, frames[4]) cho 16 hero của 1 style."""
    base = STYLE_BASE[style_key]
    out = []
    idx = base
    tribes = ['human', 'demon', 'elf', 'dragon']
    classes = ['knight', 'mage', 'archer', 'assassin']
    tmpl = STYLES[style_key]
    for cls in classes:
        for tri in tribes:
            dark, light = TRIBE_ACCENT[tri]
            if cls == 'knight':
                rows = tmpl['knight']
                rows = recolor(rows, dark, light)
                hero_id = f'H{idx:02d}'
                idx += 1
                frames = frames_from_base(rows)
                validate(frames[0])
                out.append((hero_id, tri, cls, frames))
    for cls in ['mage', 'archer', 'assassin']:
        rows0 = tmpl[cls]
        for tri in tribes:
            dark, light = TRIBE_ACCENT[tri]
            rows = recolor(rows0, dark, light)
            hero_id = f'H{idx:02d}'
            idx += 1
            frames = frames_from_base(rows)
            validate(frames[0])
            out.append((hero_id, tri, cls, frames))
    return out


def render_png(rows, path, scale=1, bg=(0, 0, 0, 0)):
    from PIL import Image
    w, h = len(rows[0]), len(rows)
    im = Image.new('RGBA', (w, h), bg)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            hexc = PAL[ch]
            im.putpixel((x, y), tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
    if scale > 1:
        im = im.resize((w * scale, h * scale), Image.NEAREST)
    im.save(path)


def ts_block(hero_id, frames):
    lines = [f'export const {hero_id}: AssetDef = {{']
    lines.append(f"  id: '{hero_id}',")
    lines.append('  frames: [')
    for fr in frames:
        lines.append('    [')
        for row in fr:
            lines.append(f"      '{row}',")
        lines.append('    ],')
    lines.append('  ],')
    lines.append('};')
    lines.append('')
    return '\n'.join(lines)


def main():
    from PIL import Image
    os.makedirs(os.path.join(ROOT, 'assets/v2/png'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets/ref'), exist_ok=True)

    all_sets = {}
    ts_all = ['// Hero v3 — 3 phong cách quân cờ 16×16 sinh từ tools/gen_heroes_v3.py.',
              '// A (H61-H76) chibi · B (H21-H36) giáp · C (H41-H56) choàng.',
              '// Frame: 0 đứng, 1 nhún, 2 chân trái co, 3 chân phải co.',
              "import type { AssetDef } from './assets.ts';",
              '']
    for sk in ['B', 'C', 'A']:
        heroes = build_set(sk)
        all_sets[sk] = heroes
        for hid, tri, cls, frames in heroes:
            ts_all.append(ts_block(hid, frames))
            for fi, fr in enumerate(frames, 1):
                render_png(fr, os.path.join(ROOT, f'assets/v2/png/{hid}_{fi}.png'))

    ts_path = os.path.join(ROOT, 'src/data/gfx/heroes_v3.ts')
    ids_all = [hid for heroes in all_sets.values() for (hid, _t, _c, _f) in heroes]
    ts_all.append('export const HEROES_V3: AssetDef[] = [')
    for i in range(0, len(ids_all), 8):
        ts_all.append('  ' + ', '.join(ids_all[i:i + 8]) + ',')
    ts_all.append('];')
    open(ts_path, 'w', encoding='utf-8', newline='\n').write('\n'.join(ts_all))
    print(f'wrote {ts_path}')

    # Preview sheets: mỗi style 1 sheet 16 hero (4 hàng × 4 cột), phóng 6x
    for sk, heroes in all_sets.items():
        scale = 6
        cell, gap = 16 * scale, 14
        cols, rows_n = 4, 4
        W = gap + cols * (cell + gap)
        H = gap + rows_n * (cell + gap)
        sheet = Image.new('RGBA', (W, H), '#1a141a')
        for i, (hid, tri, cls, frames) in enumerate(heroes):
            im = render_png(frames[0], None) if False else None
            # render inline (không save)
            w, h = 16, 16
            im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            for y, row in enumerate(frames[0]):
                for x, ch in enumerate(row):
                    if ch == '.':
                        continue
                    hexc = PAL[ch]
                    im.putpixel((x, y), tuple(int(hexc[i2:i2 + 2], 16) for i2 in (1, 3, 5)) + (255,))
            im = im.resize((cell, cell), Image.NEAREST)
            cx = gap + (i % cols) * (cell + gap)
            cy = gap + (i // cols) * (cell + gap)
            sheet.paste(im, (cx, cy), im)
        sheet.save(os.path.join(ROOT, f'assets/ref/heroes_v3_{STYLE_ID[sk]}.png'))
        print(f'preview: assets/ref/heroes_v3_{STYLE_ID[sk]}.png ({len(heroes)} heroes)')


if __name__ == '__main__':
    main()
