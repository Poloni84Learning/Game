"""Ghép preview sheet các asset v1 (dùng Pillow)."""
import sys
from PIL import Image, ImageDraw

# Ghép theo hàng: mỗi hàng 1 asset (strip các frame cạnh nhau), scale 4x, kèm nhãn.
# Dùng: python make_preview.py <out.png> <strip1.png> [<strip2.png> ...]

out = sys.argv[1]
strips = sys.argv[2:]
SC = 4
PAD = 6
LBL = 12

imgs = []
for p in strips:
    im = Image.open(p).convert('RGBA')
    imgs.append((p.split('/')[-1].replace('_strip.png', ''), im))

w = max((im.width for _, im in imgs)) * SC
h = sum(im.height * SC + PAD + LBL for _, im in imgs)
sheet = Image.new('RGBA', (w, h), (40, 34, 44, 255))
d = ImageDraw.Draw(sheet)
y = 0
for name, im in imgs:
    big = im.resize((im.width * SC, im.height * SC), Image.NEAREST)
    sheet.alpha_composite(big, (0, y))
    d.text((2, y + im.height * SC + 1), name, fill=(220, 220, 220, 255))
    y += im.height * SC + PAD + LBL
sheet.save(out)
print('PREVIEW_OK ' + out)
