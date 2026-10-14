"""Kiểm chứng cấu trúc hero v2 bằng pixel analysis (không cần vision).

Đọc strip PNG, với mỗi hero kiểm:
1. 4 frame có khác nhau (chân bước) — diff pixel giữa frame > 0.
2. Vũ khí ngoài thân: cột biên (cột 1-4 trái / 12-16 phải) có pixel ở frame 1
   tại khoảng y thân (7-12) — proof vũ khí không chìm trong khối thân.
3. Bob: diff hàng đầu (y1-7) giữa frame 1 vs 2 > 0.
4. Outline: đếm pixel #211821 quanh viền khối (proxy: tổng pixel tối > ngưỡng).
5. Mắt: có pixel tối trong vùng mặt y5 cột 5-11.
"""
import sys
from PIL import Image

OUTLINE = (33, 24, 33, 255)
DARK = (33, 24, 33, 255)
CYAN = (65, 238, 228, 255)

def check(path, hero_id, cls):
    im = Image.open(path).convert('RGBA')
    fw, fh = 16, 16
    frames = [im.crop((i*16, 0, (i+1)*16, fh)) for i in range(4)]
    issues = []
    px = [f.load() for f in frames]

    # 1. frames khác nhau
    diffs = []
    for a in range(3):
        d = sum(1 for y in range(16) for x in range(16)
                if px[a][x, y] != px[a+1][x, y])
        diffs.append(d)
    if all(d == 0 for d in diffs):
        issues.append('frames identical')

    # 2. vũ khí ngoài thân — cột biên có pixel vùng y7-12
    left = any(px[0][x, y][3] > 0 for x in range(0, 4) for y in range(6, 13))
    right = any(px[0][x, y][3] > 0 for x in range(12, 16) for y in range(6, 13))
    if cls in ('hiepsi', 'cungthu') and not left:
        issues.append('no left weapon pixels')
    if cls == 'hiepsi' and not right:
        issues.append('no right sword pixels')
    if cls == 'sathu' and not (left and right):
        issues.append(f'daggers missing L={left} R={right}')
    if cls == 'phapsu' and not left:
        issues.append('no staff pixels')

    # 3. bob: frame1 vs frame2 diff ở vùng đầu
    headdiff = sum(1 for y in range(0, 8) for x in range(16)
                   if px[0][x, y] != px[1][x, y])
    if headdiff == 0:
        issues.append('no head bob')

    # 4. outline count
    o = sum(1 for y in range(16) for x in range(16) if px[0][x, y] == OUTLINE)
    if o < 8:
        issues.append(f'outline thin ({o})')

    # 5. mắt tối vùng mặt y5-y6 cột 4-11 frame 1
    eye = any(px[0][x, y] == DARK and px[0][x, y][3] == 255
              for y in (4, 5, 6) for x in range(4, 12))
    if not eye:
        issues.append('no eye pixels')

    # 6. 法 sư: cyan orb trên trượng
    if cls == 'phapsu':
        if not any(px[0][x, y] == CYAN for y in range(0, 8) for x in range(0, 5)):
            issues.append('no cyan orb on staff')

    status = 'PASS' if not issues else 'FAIL ' + '; '.join(issues)
    print(f'{hero_id} {cls:9s} {status}  (outline={o}, framediff={diffs}, headdiff={headdiff})')
    return not issues

if __name__ == '__main__':
    base = 'assets/v2/png/_strips/'
    classes = ['hiepsi', 'phapsu', 'cungthu', 'sathu'] * 4
    ok = 0
    for i in range(1, 17):
        hid = f'H{i:02d}'
        ok += check(base + hid + '_strip.png', hid, classes[i-1])
    print(f'PASS {ok}/16')
    sys.exit(0 if ok == 16 else 1)
