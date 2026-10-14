"""Mockup bàn cờ v2: ghép tiles + hero + icon lên canvas lớn để duyệt thị giác.

Mô phỏng 1 góc bàn: 6×6 tiles (4 vùng + B05 overlay), 4 hero các tộc ở hàng 2,
icon K/C/S/I 1 hàng dưới. Scale 4x. Nền tối giống runtime.
"""
from PIL import Image

SC = 4
T = 24 * SC
W, H = 6 * T, 6 * T
board = Image.new('RGBA', (W, H), (33, 24, 33, 255))

def paste(id_, frame, cx, cy, half=1):
    im = Image.open(f'assets/v2/png/{id_}_{frame}.png').convert('RGBA')
    im = im.resize((im.width * SC, im.height * SC), Image.NEAREST)
    board.alpha_composite(im, (cx, cy))

# Lưới tile: xen kẽ 4 vùng, frame 1
grid = [
    ['B01','B01','B02','B02','B03','B03'],
    ['B01','B02','B02','B03','B03','B04'],
    ['B02','B02','B03','B03','B04','B04'],
    ['B02','B03','B03','B04','B04','B01'],
    ['B03','B03','B04','B04','B01','B01'],
    ['B03','B04','B04','B01','B01','B02'],
]
for y, row in enumerate(grid):
    for x, tid in enumerate(row):
        paste(tid, 1, x * T, y * T)

# B05 overlay lên vài tile
for (x, y, fr) in [(1, 1, 1), (3, 1, 2), (5, 1, 3), (1, 3, 4), (3, 3, 5), (5, 3, 1)]:
    paste('B05', fr, x * T, y * T)

# B06 frame 1 vào hàng 5
paste('B06', 1, 0 * T, 5 * T)
paste('B06', 2, 2 * T, 5 * T)

# Hero 4 tộc giữa tile (tile 24, hero 16 → offset 4px*scale)
for i, hid in enumerate(['H01', 'H05', 'H09', 'H13']):
    fr = (i % 4) + 1
    paste(hid, fr, i * T + 4 * SC + 0, 1 * T + 3 * SC)

# Icon hàng dưới (đè tiles hàng 4)
icons = ['C01','C05','K01','K05','K06','S06','I01','I04','K09','K10']
for i, iid in enumerate(icons):
    paste(iid, 1, (i % 6) * T + 4 * SC, 3 * T + 4 * SC + (i // 6) * (16 * SC + 4 * SC))

board.save('assets/v2/png/_sheets/BOARD_mockup.png')
print('MOCKUP_OK')
