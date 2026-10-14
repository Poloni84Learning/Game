# Cá Ngựa Chiến Thần — Asset v1.0 manifest

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 |
| Cập nhật | 2026-09-06 |
| Phạm vi | 65 asset code-sinh theo `ASSET_REQUIREMENTS.md` §2: B01–B07, H01–H16, C01–C08, K01–K12, S01–S08, I01–I04, F01–F10 |
| Công cụ | Aseprite 1.3.17 CLI (`-b`) + Lua scripting (Lua 5.4) |
| Kích thước | tile 24×24, hero/icon 16×16, chuồng 48×48, FX 24×24 |
| Palette | 32 màu (31 đặc + transparent), dùng chung toàn game, định nghĩa tại `src/data/gfx/assets.ts` |
| Trạng thái | Tất cả qua validator palette + đối chiếu matrix↔PNG 134/134 frame khớp pixel |

Không dùng asset từ 3 pack có sẵn (Sunnyside, Minifantasy, .aseprite nguồn) — chỉ giữ làm tham khảo; toàn bộ pixel là code-sinh theo GDD §5.2.

---

## 1. Cấu trúc thư mục

```
tools/aseprite/
  art/lib.lua          module dùng chung: palette 32, PRNG seeded, helpers vẽ, validator, export
  gen_tiles.lua        sinh B01–B07
  gen_heroes.lua       sinh H01–H16 (4 frame: đứng + 3 bước)
  gen_icons.lua        sinh C01–C08, K01–K12, S01–S08, I01–I04
  gen_fx.lua           sinh F01–F10 (2–3 frame)
  gen_palette.lua      xuất string-matrix TypeScript sang src/data/gfx/assets.ts
tools/make_preview.py  ghép preview sheet các strip PNG (Pillow, scale 4×)

assets/v1/
  ase/<ID>.ase         sprite Aseprite gốc (frame + tag theo ID)
  png/<ID>_<N>.png     frame PNG riêng
  png/_strips/<ID>_strip.png  strip ngang các frame
  png/_sheets/*        preview sheet duyệt thị giác

src/data/gfx/
  assets.ts            string-matrix: PALETTE 32 màu + 65 AssetDef (mỗi asset 1+ frame)
```

## 2. Quy trình tái sinh (reproducible)

Chạy từ thư mục `E:/CodeLinhTinh/Game`:

```bat
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v1 --script tools/aseprite/gen_tiles.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v1 --script tools/aseprite/gen_heroes.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v1 --script tools/aseprite/gen_icons.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v1 --script tools/aseprite/gen_fx.lua
"D:/Aseprite/Aseprite.exe" -b --script-param outdir=assets/v1 --script-param tsout=src/data/gfx --script tools/aseprite/gen_palette.lua
```

PRNG seed cố định (tiles: 7331) → chạy lại cho output giống hệt. Mọi script in `validate=<số>` cho từng asset; số 0 = mọi pixel nằm trong palette 32 màu.

## 3. Danh mục 65 asset

| Nhóm | Mã | Kích thước | Frame | Ghi chú |
|---|---|---|---|---|
| B | B01–B04 | 24×24 | 2 | Nền 4 vùng: B01 rừng, B02 sa mạc, B03 thung lũng sương, B04 vực băng; frame 2 = biến thể (bụi cây/gợn cát/sương/vết nứt) |
| B | B05 | 24×24 | 5 | Ô đặc biệt: sao/rương/bẫy/đền/hồi máu, nền transparent đè tile vùng |
| B | B06 | 24×24 | 2 | Đường về màu tím + ô đích có cờ |
| B | B07 | 48×48 | 1 | Chuồng 4 slot, viền màu phe r/f/l/u |
| H | H01–H04 | 16×16 | 4 | Người (đỏ): Hiệp sĩ/Pháp sư/Cung thủ/Sát thủ |
| H | H05–H08 | 16×16 | 4 | Tiên Linh (xanh lá): halo vàng, tai nhọn |
| H | H09–H12 | 16×16 | 4 | Yêu (cam): sừng đôi |
| H | H13–H16 | 16×16 | 4 | Long (tím): vảy + râu cằm |
| C | C01–C04 | 16×16 | 1 | Phù hiệu 4 tộc: khiên/lá+halo/sừng/vảy |
| C | C05–C06 | 16×16 | 1 | Cộng hưởng 2 quân/4 quân |
| C | C07–C08 | 16×16 | 1 | Tàn Đoàn 2 quân/1 quân |
| K | K01–K12 | 16×16 | 1 | 12 lõi, biểu tượng đúng tên (mắt tiên tri hé, bóng trong gương...) |
| S | S01–S08 | 16×16 | 1 | 8 skill theo GDD §3.6 |
| I | I01–I04 | 16×16 | 1 | Kiếm/Khiên/Dược Huyết/Ngọc May Mắn |
| F | F01–F10 | 24×24 | 2–3 | FX: di/nổ/crit×3/hào quang/về chuồng/xạ kích×3/về đích/hồi máu/bẫy/đền |

## 4. Palette 32 màu

| Ký tự | HEX | Vai trò |
|---|---|---|
| o | #211821 | outline chung |
| s | #EEBD8F | skin |
| S | #C5886A | skin shade |
| g G t n | #244634 #3C6848 #5F8F5A #8CB071 | rừng 4 tông |
| d D b | #C19262 #E1B682 #966640 | sa mạc |
| v x y Y | #507858 #8CAC8A #C1D1BB #E0EADC | thung lũng sương |
| i I k K | #597C9E #88B0CD #BADDF0 #E6F5FC | vực băng |
| r R | #C62A2A #E94438 | phe Người (đỏ) |
| f F | #40A856 #66D076 | phe Tiên Linh (xanh lá) |
| l L | #E58024 #FF9834 | phe Yêu (cam) |
| u U | #703CA2 #8F54C7 | phe Long (tím) |
| m M | #82828C #B4B6BE | thép |
| w W | #EAE6CC #FFFFFF | trắng phép |
| c | #41EEE4 | phép màu cyan |
| e | #33333F | tối phép |

## 5. Kiểm chứng đã chạy

- Validator palette (nội bộ lib.lua): 65/65 asset = 0 pixel ngoài palette.
- Đối chiếu string-matrix `src/data/gfx/assets.ts` vẽ lại so với PNG xuất: 134/134 frame khớp 100% pixel (kích thước + màu + alpha).
- Kích thước strip: hero 64×16 (4 frame), tile 2 frame 48×24, B05 5 frame 120×24, FX 48–72×24 — đúng khai báo.
- Preview sheet duyệt thị giác: `assets/v1/png/_sheets/` (TILES, HEROES ×2, ICONS_C/K/S/I, FX).

## 6. Việc còn mở (kế hoạch v2)

- Hero frame animation 8 frame + hướng 4 chiều (hiện 4 frame hướng chéo xuống).
- Ô đặc biệt B05 cần nhấp nháy 2 frame khi runtime.
- SFX A01–A10 (Web Audio) chưa sản xuất — nhóm P2 theo `ASSET_REQUIREMENTS.md` §6.
- Màn UI U01–U15 là DOM/CSS, không thuộc phạm vi asset pixel này.
