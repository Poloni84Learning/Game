# Cá Ngựa Chiến Thần — Asset v2.0 manifest (redesign toàn bộ)

| Mục | Giá trị |
|---|---|
| Phiên bản | 2.0 |
| Cập nhật | 2026-09-10 |
| Phạm vi | Redesign art 65 asset v1 (giữ nguyên mã, kích thước, số frame, palette 32 màu): B01–B07, H01–H16, C01–C08, K01–K12, S01–S08, I01–I04, F01–F10 |
| Công cụ | Aseprite 1.3.17 CLI (`-b`) + Lua scripting (Lua 5.4) |
| Kích thước | tile 24×24, hero/icon 16×16, chuồng 48×48, FX 24×24 (giữ nguyên) |
| Palette | 32 màu (31 đặc + transparent) — **giữ nguyên hex v1** (contract màu phe r/f/l/u + `src/data/gfx/assets.ts`) |
| Trạng thái | 134/134 frame matrix↔PNG khớp pixel; 16/16 hero qua structural check; vision QA từng nhóm PASS; board mockup PASS |

v2 là redesign **art** sau audit v1 (hero không outline, tile phẳng speckle, K không eerie, FX đứt palette). v1 vẫn còn nguyên tại `assets/v1/` để rollback. Không dùng asset từ 3 pack có sẵn — chỉ tham khảo (D17).

## 0. Audit v1 → fixes v2

| Vấn đề audit v1 | Fix v2 |
|---|---|
| Hero chìm: outline thưa, vũ khí 1–2px đè lên thân | Outline toàn khối `o` ≥27px; vũ khí đưa ra cột biên ngoài thân (khiên 4×5 cột 1–4, kiếm dọc cột 13, trượng 8px cột 2, cung y7–y11 cột 2–3, đoản đao kép chéo 2 bên) |
| Tóc/đầu tan trên nền tối | Tóc = `o` + băng đô Q theo phe; feature đầu đọc qua khối 2–4px |
| Tile phẳng, speckle không đọc được | Band sáng 1px cạnh trên/trái + band tối 2px cạnh dưới/phải (directional light); macro features frame 2 (bụi cây disc, sóng cát sin, sương chéo, nứt gãy khúc); grout 1px |
| B05 khó đọc | Redesign từng icon: sao outline, rương nắp+đai+khoá, bẫy hố + 8 răng W, đền lửa 3 tông 3px, tim R/r+W highlight |
| B06 chevron chìm | Chevron viền `o`, W highlight |
| B07 slot rối | 4 slot viền phe 2px + W highlight + glyph số phe |
| K01–K12 chỉ 1/12 đạt vibe "kỳ dị" (GDD §7.1) | Mỗi icon 1 chi tiết bất ổn: K01 dấu máu chảy, K05 xúc xắc đổ máu, K06 bóng trong gương mắt cyan, K07 mắt hé mí nửa, K08 mũi tên đôi chạm 2 mảnh, K09 nồi mặt lợn mắt+nũi 2 lỗ, K10 vương miện 3 đỉnh ngọc đỏ, K11 chìa xoay sao, K12 X máu + góc rách |
| C05/C06 lẫn | C05 = 2 cánh song chéo mảnh; C06 = 4 cánh + tòa sen |
| FX đứt palette giữa chuỗi | Mỗi FX 1 palette liên tục xuyên suốt frame + W core ở frame đỉnh |

## 1. Cấu trúc thư mục

```
tools/aseprite/
  art/lib.lua          module dùng chung: palette 32, PRNG seeded, helpers vẽ, validator, export
  gen_tiles.lua        sinh B01–B07 (v2: band light + macro features)
  gen_heroes.lua       sinh H01–H16 (v2: outline toàn khối + vũ khí cột biên)
  gen_icons.lua        sinh C01–C08, K01–K12, S01–S08, I01–I04 (v2: eerie push)
  gen_fx.lua           sinh F01–F10 (v2: arc 3 nhịp + palette liên tục)
  gen_palette.lua      xuất string-matrix TypeScript sang src/data/gfx/assets.ts
tools/make_preview.py  ghép preview sheet các strip PNG (Pillow, scale 4×)
tools/make_mockup.py   ghép board mockup duyệt hero/icon trên nền tile thật
tools/check_assets.py  validator matrix↔PNG (134/134, §3.5 REQUIREMENTS)
tools/check_heroes.py  structural check hero (outline, frame-diff, head-diff, vũ khí cột biên)

assets/v2/
  ase/<ID>.ase         sprite Aseprite gốc (frame + tag theo ID)
  png/<ID>_<N>.png     frame PNG riêng
  png/_strips/<ID>_strip.png  strip ngang các frame
  png/_sheets/*        preview sheet duyệt thị giác (TILES, HEROES, ICONS_K, ICONS_CSI, FX, BOARD_mockup)

src/data/gfx/
  assets.ts            string-matrix: PALETTE 32 màu + 65 AssetDef
```

## 2. Quy trình tái sinh (reproducible)

Chạy từ thư mục `E:/CodeLinhTinh/Game`:

```bat
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v2 --script tools/aseprite/gen_tiles.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v2 --script tools/aseprite/gen_heroes.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v2 --script tools/aseprite/gen_icons.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v2 --script tools/aseprite/gen_fx.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v2 --script-param tsout=src/data/gfx --script tools/aseprite/gen_palette.lua
```

Kiểm chứng:

```bat
python tools/check_assets.py    -- 134/134 frame matrix↔PNG khớp pixel
python tools/check_heroes.py    -- 16/16 hero PASS structural
python tools/make_mockup.py     -- board mockup duyệt thị giác
```

PRNG seed cố định (tiles: 7331) → chạy lại cho output giống hệt. Mọi script in `validate=<số>` cho từng asset; 0 = mọi pixel trong palette 32 màu.

## 3. Danh mục 65 asset

| Nhóm | Mã | Kích thước | Frame | Ghi chú |
|---|---|---|---|---|
| B | B01–B04 | 24×24 | 2 | Nền 4 vùng: B01 rừng, B02 sa mạc, B03 thung lũng sương, B04 vực băng; frame 2 = macro feature (bụi cây/gợn cát/sương chéo/nứt gãy khúc) |
| B | B05 | 24×24 | 5 | Ô đặc biệt: sao/rương/bẫy/đền/hồi máu — nền transparent đè tile vùng |
| B | B06 | 24×24 | 2 | Đường về tím + ô đích; chevron viền o + W highlight |
| B | B07 | 48×48 | 1 | Chuồng 4 slot viền phe 2px + glyph số 1–4 |
| H | H01–H04 | 16×16 | 4 | Người (đỏ): băng đô Q; Hiệp sĩ/Pháp sư/Cung thủ/Sát thủ |
| H | H05–H08 | 16×16 | 4 | Tiên Linh (xanh lá): halo c + tai nhọn |
| H | H09–H12 | 16×16 | 4 | Yêu (cam): sừng đôi l |
| H | H13–H16 | 16×16 | 4 | Long (tím): vảy u + râu cằm |
| C | C01–C04 | 16×16 | 1 | Phù hiệu 4 tộc: khiên/lá+halo/sừng/vảy |
| C | C05–C06 | 16×16 | 1 | Cộng hưởng: 2 cánh song chéo / 4 cánh + tòa sen |
| C | C07–C08 | 16×16 | 1 | Tàn Đoàn: khiên gãy + kiếm / kiếm đơn + áo choàng rách |
| K | K01–K12 | 16×16 | 1 | 12 lõi, mỗi icon 1 chi tiết bất ổn (§0 bảng fixes) |
| S | S01–S08 | 16×16 | 1 | 8 skill theo GDD §3.6; S06 = 3 mũi tỏa từ 1 gốc |
| I | I01–I04 | 16×16 | 1 | Kiếm/Khiên/Dược Huyết/Ngọc May Mắn |
| F | F01–F10 | 24×24 | 2–3 | FX arc 3 nhịp bắt→đỉnh→tàn, palette liên tục, W core ở đỉnh |

## 4. Palette 32 màu

Giữ nguyên v1 — semantics màu phe r/f/l/u là contract runtime (B07 viền slot, hero băng đô). Bảng đầy đủ tại `ASSET_V1.md` §4 và `src/data/gfx/assets.ts` `PALETTE`.

## 5. Kiểm chứng đã chạy (v2)

- Validator palette (lib.lua nội bộ): 65/65 asset `validate=0`.
- Đối chiếu string-matrix `src/data/gfx/assets.ts` vẽ lại so PNG (`tools/check_assets.py`): **134/134 frame khớp 100% pixel** (kích thước + màu + alpha).
- Structural check hero (`tools/check_heroes.py`): **16/16 PASS** — outline `o` ≥27px, frame-diff >38 (bob 1px F2/F4 + 4 frame chân bước), head-diff >24, vũ khí cột biên xác nhận pixel (khiên cột 1–4, kiếm cột 13, trượng cột 2, cung cột 2–3, đoản đao 2 bên).
- Directional light tile: luminance đo 4 góc — TL>TR=BL>BR cho mọi tile vùng (B01: 115/71/71/58).
- FX đọc trên nền tối: F01–F10 đều có pixel W (luminance 255) ở frame đỉnh; F05 fix dark-on-dark bằng ring `w` mép hố + khối quân `M` + viền `o` ngoài.
- Vision QA từng nhóm qua preview sheet: 12/12 K đạt vibe kỳ dị; 20/20 C/S/I đọc được (C05/C08 "partial" nhưng distinctness đủ); hero 4 tộc đọc được qua ĐẦU + VŨ KHÍ theo checklist §7 ASSET_REQUIREMENTS.
- Board mockup (`assets/v2/png/_sheets/BOARD_mockup.png`): hero + icon đọc rõ trên 4 nền tile khác nhau, grout tách sạch, không clipping — Pass.

## 6. Việc còn mở

- Hero 8 frame + 4 hướng (hiện 4 frame hướng chéo xuống).
- B05 nhấp nháy runtime (đổi frame theo tick, không cần asset thêm).
- SFX A01–A10 (Web Audio) — nhóm P2 theo `ASSET_REQUIREMENTS.md` §6.
- Màn UI U01–U15 là DOM/CSS, không thuộc phạm vi asset pixel.
- Renderer Canvas 2D chưa import `src/data/gfx/assets.ts` — hiện chỉ là data layer (grep xác nhận không có consumer trong src ngoài chính nó).