"""Mockup 3 phương án tạo hình quân cờ 16×16 (phóng 8×) để duyệt phong cách.

Mỗi phương án: 1 hàng 8 hero = [Knight × 4 tộc] + [4 class của tộc Người].
Chạy: python tools/mockup_hero_styles.py  → assets/ref/heroes_style_{a,b,c}.png
"""
import os
import re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- Palette từ src/data/gfx/assets.ts (đọc động để luôn đồng bộ) ----
src = open(os.path.join(ROOT, 'src/data/gfx/assets.ts'), encoding='utf-8').read()
PAL = {}  # type: dict
for m in re.finditer(r"'(.)': '#([0-9A-F]{6})'", src):
    PAL[m.group(1)] = '#' + m.group(2)


def render(rows, scale=8, bg="#2d2230"):
    w, h = len(rows[0]), len(rows)
    im = Image.new('RGBA', (w, h), bg)
    for y, row in enumerate(rows):
        assert len(row) == w, f'row {y} width {len(row)} != {w}: {row}'
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            hexc = PAL.get(ch)
            assert hexc, f'unknown char {ch!r}'
            im.putpixel((x, y), tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
    return im.resize((w * scale, h * scale), Image.NEAREST)


# ================= PHƯƠNG ÁN A — "Chibi thân thiện" (Sunnyside-like) =================
# Đầu to 7px, mắt sáng 2 px, thân nhỏ, vũ khí cỡ đại đọc rõ, màu phe trên áo.
# Chars: o outline, s da sáng, S da tối, e mắt, W trắng, M giáp sáng, m giáp tối,
# r/l/f/u màu phe đậm, R/L/F/U màu phe sáng, b nâu (vũ khí gỗ), c cyan, w kem.

A_KNIGHT = {
    'r': [
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
    'l': [
        '................',
        '.....ooooo......',
        '....ossssso.....',
        '....ossssso.....',
        '....oesoeso.....',
        '....ossssso.....',
        '.....osssso.....',
        '...oolllooo.....',
        '..oMlLLLLlMo....',
        '..oMlLLLLlMo.WW.',
        '..oMoLLLLoM.WW..',
        '...oMMMMMo.WW...',
        '...ommmmoWW.....',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
    'f': [
        '................',
        '.....ooooo......',
        '....ossssso.....',
        '....ossssso.....',
        '....oesoeso.....',
        '....ossssso.....',
        '.....osssso.....',
        '...oofffoo......',
        '..oMfFFFFfMo....',
        '..oMfFFFFfMo.WW.',
        '..oMoFFFFoM.WW..',
        '...oMMMMMo.WW...',
        '...ommmmoWW.....',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
    'u': [
        '................',
        '.....ooooo......',
        '....ossssso.....',
        '....ossssso.....',
        '....oesoeso.....',
        '....ossssso.....',
        '.....osssso.....',
        '...oouuuuo......',
        '..oMuUUUUuMo....',
        '..oMuUUUUuMo.WW.',
        '..oMoUUUUoM.WW..',
        '...oMMMMMo.WW...',
        '...ommmmoWW.....',
        '...om..mo.......',
        '..oSS..SSo......',
        '..oo....oo......',
    ],
}

A_MAGE = [
    '.......c........',
    '.....oocoo......',
    '....ossssso.....',
    '....ossssso.....',
    '....oesoeso.....',
    '....ossssso.....',
    '.....osssso..b..',
    '...oorrrro..b...',
    '..oMrRRRRrMo.b..',
    '..oMrRRRRrMobb..',
    '..oMoRRRRoM.b...',
    '...oMMMMMo..b...',
    '...ommmmo.......',
    '...om..mo.......',
    '..oSS..SSo......',
    '..oo....oo......',
]

A_ARCHER = [
    '................',
    '.....ooooo......',
    '....ossssso.....',
    '....ossssso.....',
    '....oesoeso.....',
    '....ossssso.....',
    '.....osssso.....',
    '...oorrrro...b..',
    '..oMrRRRRrMo.b..',
    '..oMrRRRRrMob.b.',
    '..oMoRRRRoM.b.b.',
    '...oMMMMMo..b.b.',
    '...ommmmo....b..',
    '...om..mo.......',
    '..oSS..SSo......',
    '..oo....oo......',
]

A_ASSASSIN = [
    '................',
    '.....ooooo......',
    '....ossssso.....',
    '....ossssso.....',
    '....oesoeso.....',
    '....ossssso.....',
    '.....osssso.....',
    '...oorrrro......',
    '..oMrRRRRrMo....',
    '..oMrRRRRrMoM...',
    '..oMoRRRRoMMM...',
    '...oMMMMMo..M...',
    '...ommmmo...M...',
    '...om..mo.......',
    '..oSS..SSo......',
    '..oo....oo......',
]

# ================= PHƯƠNG ÁN B — "Chiến binh Fire-Emblem" =================
# Vai rộng, mũ/giáp theo class, vũ khí chéo trước ngực, accent phe trên ngực + vai.

B_TRIBE_KNIGHT = {
    'r': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMrRRMo......',
        '..oMrRRRRMo.....',
        '..oMrRRRRMo.MM..',
        '..oMoRRRRoMMoM..',
        '...oMMMMMMoMo...',
        '...ommmmmoM.....',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'l': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMlLLMo......',
        '..oMlLLLLMo.....',
        '..oMlLLLLMo.MM..',
        '..oMoLLLLoMMoM..',
        '...oMMMMMMoMo...',
        '...ommmmmoM.....',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'f': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMfFFMo......',
        '..oMfFFFFMo.....',
        '..oMfFFFFMo.MM..',
        '..oMoFFFFoMMoM..',
        '...oMMMMMMoMo...',
        '...ommmmmoM.....',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
    'u': [
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssmo.....',
        '....oesoeso.....',
        '.....osso.......',
        '....oMMMMo......',
        '...oMuUUMo......',
        '..oMuUUUUMo.....',
        '..oMuUUUUMo.MM..',
        '..oMoUUUUoMMoM..',
        '...oMMMMMMoMo...',
        '...ommmmmoM.....',
        '...omm..mmo.....',
        '..oSS....SSo....',
        '..oo......oo....',
    ],
}

B_MAGE = [
    '........c.......',
    '.....oooco......',
    '....oMMMoco.....',
    '....oMssoco.....',
    '....oeso.o.b....',
    '.....osso.ob....',
    '....oMMMMob.....',
    '...oMrRRMob.....',
    '..oMrRRRRMo.....',
    '..oMrRRRRMo.....',
    '..oMoRRRRoM.....',
    '...oMMMMMo......',
    '...ommmmo.......',
    '...omm..mmo.....',
    '..oSS....SSo....',
    '..oo......oo....',
]

B_ARCHER = [
    '..........b.....',
    '.....ooo.ob.....',
    '....oMMMso.b....',
    '....oMsssobb....',
    '....oesoeo.ob...',
    '.....osso..ob...',
    '....oMMMMo..b...',
    '...oMrRRMo......',
    '..oMrRRRRMo.....',
    '..oMrRRRRMo.....',
    '..oMoRRRRoM.....',
    '...oMMMMMo......',
    '...ommmmo.......',
    '...omm..mmo.....',
    '..oSS....SSo....',
    '..oo......oo....',
]

B_ASSASSIN = [
    '................',
    '.....ooooo......',
    '....oMMMMMo.....',
    '....oMsssmo.....',
    '....oesoeso.....',
    '.....osso.......',
    '....oMMMMo......',
    '...oMrRRMo......',
    '..oMrRRRRMo.....',
    '..oMrRRRRMoM.M..',
    '..oMoRRRRoMMMM..',
    '...oMMMMMo..M...',
    '...ommmmo.......',
    '...omm..mmo.....',
    '..oSS....SSo....',
    '..oo......oo....',
]

# ================= PHƯƠNG ÁN C — "Silhouette Advance-Wars" =================
# Outline dày, mỗi class một pose khác hẳn, màu phe chiếm vùng lớn (áo choàng).

C_KNIGHT = {
    'r': [
        '................',
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooRRRRoo.....',
        '.oMMoRRRRo......',
        '.oMMoRRRRoWW....',
        '.oMMoRRRRoWW....',
        '..oooRRRRo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'l': [
        '................',
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooLLLLoo.....',
        '.oMMoLLLLo......',
        '.oMMoLLLLoWW....',
        '.oMMoLLLLoWW....',
        '..oooLLLLo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'f': [
        '................',
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooFFFFoo.....',
        '.oMMoFFFFo......',
        '.oMMoFFFFoWW....',
        '.oMMoFFFFoWW....',
        '..oooFFFFo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
    'u': [
        '................',
        '................',
        '.....ooooo......',
        '....oMMMMMo.....',
        '....oMsssso.....',
        '....oesoeso.....',
        '.....osssso.....',
        '..oooUUUUoo.....',
        '.oMMoUUUUo......',
        '.oMMoUUUUoWW....',
        '.oMMoUUUUoWW....',
        '..oooUUUUo......',
        '...oooooo.......',
        '...oSS.oSSo.....',
        '..oSSo.oSSo.....',
        '..ooo...ooo.....',
    ],
}

C_MAGE = [
    '........c.......',
    '.......oco......',
    '.....oooco......',
    '....oMMMoco.....',
    '....oMsssob.....',
    '....oesoeob.....',
    '.....ossob......',
    '..ooooRRoob.....',
    '.oMMoRRRRo......',
    '.oMMoRRRRo......',
    '.oMMoRRRRo......',
    '..oooRRRRo......',
    '...oooooo.......',
    '...oSS.oSSo.....',
    '..oSSo.oSSo.....',
    '..ooo...ooo.....',
]

C_ARCHER = [
    '..........b.....',
    '.....ooo.ob.....',
    '....oMMMob......',
    '....oMsssob.....',
    '....oesoeob.....',
    '.....ossob......',
    '..ooooRRo.b.....',
    '.oMMoRRRRo......',
    '.oMMoRRRRo......',
    '.oMMoRRRRo......',
    '.oMMoRRRRo......',
    '..oooRRRRo......',
    '...oooooo.......',
    '...oSS.oSSo.....',
    '..oSSo.oSSo.....',
    '..ooo...ooo.....',
]

C_ASSASSIN = [
    '................',
    '................',
    '................',
    '.....ooooo......',
    '....oMMMMMo.....',
    '....oMsssso.....',
    '....oesoeso.....',
    '..oooRRRRoo.....',
    '.oMMoRRRRo.M....',
    '.oMMoRRRRoMMM...',
    '.oMMoRRRRo..M...',
    '..oooRRRRo......',
    '...oooooo.......',
    '..oSS...oSSo....',
    '..oSSo.oSSo.....',
    '..ooo...ooo.....',
]


def sheet(rows_list):
    imgs = [render(r) for r in rows_list]
    gap = 12
    W = sum(i.width for i in imgs) + gap * (len(imgs) + 1)
    H = max(i.height for i in imgs) + gap * 2
    out = Image.new('RGBA', (W, H), '#1a141a')
    x = gap
    for im in imgs:
        out.paste(im, (x, gap), im)
        x += im.width + gap
    return out


os.makedirs(os.path.join(ROOT, 'assets/ref'), exist_ok=True)

# A: knight 4 tộc + mage/archer/assassin tộc người
a_rows = list(A_KNIGHT.values()) + [A_MAGE, A_ARCHER, A_ASSASSIN]
sheet(a_rows).save(os.path.join(ROOT, 'assets/ref/heroes_style_a.png'))

# B: tương tự
b_rows = list(B_TRIBE_KNIGHT.values()) + [B_MAGE, B_ARCHER, B_ASSASSIN]
sheet(b_rows).save(os.path.join(ROOT, 'assets/ref/heroes_style_b.png'))

# C: tương tự
c_rows = list(C_KNIGHT.values()) + [C_MAGE, C_ARCHER, C_ASSASSIN]
sheet(c_rows).save(os.path.join(ROOT, 'assets/ref/heroes_style_c.png'))

print('OK: assets/ref/heroes_style_a.png, heroes_style_b.png, heroes_style_c.png')
