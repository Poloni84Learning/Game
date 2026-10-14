"""Đối chiếu string-matrix trong src/data/gfx/assets.ts với PNG xuất từ .ase.

Mỗi frame: vẽ lại matrix bằng PIL rồi so pixel-per-pixel với PNG tương ứng
(màu + alpha). PASS khi 134/134 frame khớp 100%.
"""
import re
import sys
from PIL import Image

TS_FILES = ['src/data/gfx/assets.ts', 'src/data/gfx/heroes_v3.ts']
PNG = 'assets/v2/png'

sources = {p: open(p, encoding='utf-8').read() for p in TS_FILES}
src = sources[TS_FILES[0]]

# parse PALETTE: 'x': '#RRGGBB'
pal = {}
for m in re.finditer(r"'(.)': '#([0-9A-F]{6})'", src):
    pal[m.group(1)] = (int(m.group(2)[0:2], 16), int(m.group(2)[2:4], 16),
                       int(m.group(2)[4:6], 16), 255)
# parse assets: export const XX: AssetDef = { ... frames: [ ['..', ...], ... ] }
# Lấy phần body sau 'frames: [' tới ']' khớp, rồi tách frame phẳng theo cặp [ ]
def parse_frames(src, start):
    # start = index của '[' sau 'frames:'
    depth = 0
    i = start
    while i < len(src):
        if src[i] == '[':
            depth += 1
        elif src[i] == ']':
            depth -= 1
            if depth == 0:
                return src[start + 1:i], i
        i += 1
    return None, i

assets = {}
for path, cur in sources.items():
    for m in re.finditer(r"export const ([A-Z]\d\d): AssetDef = \{", cur):
        aid = m.group(1)
        fi = cur.find('frames: [', m.end())
        if fi < 0:
            continue
        fi = fi + len('frames: ')
        body, _ = parse_frames(cur, fi)
        if body is None:
            continue
        frames = []
        for fm in re.finditer(r"\[([^\[\]]*)\]", body):
            rows = re.findall(r"'((?:[^'\\]|\\.)*)'", fm.group(1))
            if rows:
                frames.append(rows)
        if frames:
            assets[aid] = frames

total = ok = 0
bad = []
for aid, frames in sorted(assets.items()):
    for fi, rows in enumerate(frames, 1):
        total += 1
        h = len(rows)
        w = max(len(r) for r in rows)
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        px = im.load()
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch in pal:
                    px[x, y] = pal[ch]
        png = Image.open(f'{PNG}/{aid}_{fi}.png').convert('RGBA')
        if png.size != im.size or list(png.getdata()) != list(im.getdata()):
            bad.append(f'{aid}_{fi} size={im.size} vs {png.size}')
        else:
            ok += 1

print(f'frames parsed: {total}, match: {ok}/{total}')
if bad:
    print('MISMATCH:')
    for b in bad:
        print(' ', b)
sys.exit(0 if not bad and ok == total and total > 0 else 1)
