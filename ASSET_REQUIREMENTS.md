# Cá Ngựa Chiến Thần — Tài liệu yêu cầu asset

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 |
| Cập nhật | 2026-09-06 |
| Trạng thái | Định nghĩa yêu cầu asset; chưa sản xuất asset nào |
| Tài liệu cha | `CA_NGUA_CHIEN_THAN.md` (GDD v1.0) — mọi số liệu nhân vật/tộc/lõi/vùng lấy từ đó |
| Quy ước | `[Đề xuất]`/`[Cần chốt]` dùng như trong GDD; quyết định mở của tài liệu này đánh số tiếp D15+ |

Tài liệu liệt kê toàn bộ asset cần sản xuất cho bản web hot-seat 2–4 người: quy ước kỹ thuật, bảng mã theo nhóm, mức ưu tiên theo milestone GDD §8.2, và hiện trạng 3 asset pack có sẵn trong thư mục (kết quả khảo sát thực tế, mục 7).

---

## 1. Quy ước kỹ thuật nền

Cụ thể hóa GDD §5.2 (pixel art 100% code-sinh, 0 dependency runtime, Canvas 2D thuần, UI DOM/CSS, âm thanh Web Audio tổng hợp):

| Quy ước | Giá trị | Lý do |
|---|---|---|
| Tile bàn cờ | 24×24 px | Bàn 15×15 ô → 360×360 px ở scale 1, vừa bề ngang hẹp nhất 360 px của mobile browser |
| Sprite hero | 16×16 px | Nhìn rõ từng quân trên tile 24 px khi 4 phe dồn về nửa sau bàn |
| Icon | 16×16 px | Chuẩn chung cho cộng hưởng/lõi/skill/item |
| Integer upscale | 1×/2×/3× theo viewport | Chống mờ pixel khi scale |
| Palette | 32 màu chung toàn game | Hết mức ra khỏi hệ; mọi sprite dùng chung bảng này |
| Code-sinh | string-matrix: 1 ký tự = 1 màu | Sprite là chuỗi data trong `src/data/`, vẽ runtime lên offscreen canvas |
| Kiểu dấu | kiểu mới (`hòa`, `tối`, `tuổi`) | GDD đã dùng; giữ nhất quán nhãn UI |
| Font | Font pixel hỗ trợ tiếng Việt đầy đủ dấu | Ngoại lệ code-sinh — font là asset tải về, không sinh bằng string-matrix [Cần chốt D15](#8-quyết-định-cần-chốt-của-tài-liệu-này) |
| Âm thanh | Hàm Web Audio tạo sóng, không file audio | 0 dependency runtime |

Bố cục bàn theo GDD §2.1: 52 ô vòng chia 4 cung × 13 ô, mỗi cung một vùng đất; 24 ô đặc biệt đè lên theo bảng offset GDD §4.1.

---

## 2. Bảng mã asset theo nhóm

Mã asset `<NHÓM><số 2 chữ số>` (VD `H07`) dùng tham chiếu chéo trong commit/issue/kanban. Ưu tiên: **P0** chặn milestone `vite build` + smoke test (GDD §8.2); **P1** cho bản playtest; **P2** hoàn thiện cuối.

| Nhóm | Nội dung | Số asset | Ưu tiên |
|---|---|---|---|
| B | Bàn cờ & vùng đất | 7 | P0 |
| H | Hero 16 combo tộc×hệ | 16 | P0 |
| C | Cộng hưởng & Tàn Đoàn | 8 | P1 |
| K | Lõi | 12 | P1 |
| S | Skill | 8 | P2 |
| I | Item | 4 | P1 |
| F | FX animation | 10 | P1 |
| U | Màn UI (DOM/CSS) | 15 | P0 |
| A | SFX tổng hợp | 10 | P2 |

Tổng ~90 asset. Ngoài các nhóm trên, chỉ còn font là asset tải về; không có asset ảnh nào khác ngoài danh mục.

### 2.1 B — Bàn cờ & vùng đất (P0)

| Mã | Asset | Kích thước | Frame | Ghi chú |
|---|---|---|---|---|
| B01 | Tile Rừng Nguyên Sinh (Bắc) | 24×24 | 2 | Nền + biến thể chồi cây; xanh đậm |
| B02 | Tile Sa Mạc Cháy (Đông) | 24×24 | 2 | Cát vàng + gợn nhiệt |
| B03 | Tile Thung Lũng Sương (Nam) | 24×24 | 2 | Cỏ xanh nhạt + sương trắng |
| B04 | Tile Vực Băng Vĩnh Cứu (Tây) | 24×24 | 2 | Băng xanh lam + vết nứt |
| B05 | Ô đặc biệt đè lên (sao/rương/bẫy/đền/hồi máu) | 24×24 | 5 | 1 frame mỗi loại; đè tile vùng |
| B06 | Ô đường về + đích | 24×24 | 2 | Màu phe; đích có cờ nhỏ |
| B07 | Chuồng 4 phe | 48×48 | 1 | Góc bàn, 4 slot quân + viền màu phe |

### 2.2 H — Hero 16 combo tộc×hệ (P0)

16 hero = 4 tộc × 4 hệ (GDD §3.1 ép draft tộc thuần). Mỗi hero 16×16, 4 frame (1 đứng + 3 di chuyển):

- **Phân biệt tộc qua đầu** (GDD §3.3): Người tóc ngắn trần trụi thần thái, Tiên Linh tai nhọn + quầng sáng, Yêu sừng đôi, Long vảy + râu cằm.
- **Phân biệt hệ qua vũ khí** (GDD §3.2): Hiệp sĩ kiếm + khiên, Pháp sư trượng, Cung thủ cung tên, Sát thủ cặp đoản đao.
- Mỗi phe có 4 màu viền riêng để đọc nhanh quân của ai trên bàn.
- Thứ tự sản xuất `[Đề xuất]`: Long → Yêu → Tiên Linh → Người.

### 2.3 C — Cộng hưởng & Tàn Đoàn (P1)

| Mã | Asset | Nội dung |
|---|---|---|
| C01–C04 | Phù hiệu 4 tộc | Người (khiên), Tiên Linh (lá + halo), Yêu (sừng), Long (vảy + râu) |
| C05 | Cộng hưởng 2 quân | Đôi cánh đơn nhỏ |
| C06 | Cộng hưởng 4 quân | Tứ diện/hào quang |
| C07 | Tàn Đoàn — Khuyết tuyến (2 quân) | Khiên sứt mẻ + 1 kiếm |
| C08 | Tàn Đoàn — Cô Hành Hiệp Sĩ (1 quân) | Kiếm đơn + áo choàng rách |

### 2.4 K — Icon 12 lõi (P1)

K01–K12 theo GDD §3.5, mỗi icon một biểu tượng trung tâm đúng tên lõi:

| Mã | Lõi | Biểu tượng |
|---|---|---|
| K01 | Huyết Khế | Bản khế + giọt máu |
| K02 | Giáp Sét Gỉ | Tấm giáp sét bám rỉ |
| K03 | Ánh Sáng Trừng Phạt | Tia sáng xuyên mây |
| K04 | Ngọn Đuốc Đêm | Đuốc cháy |
| K05 | Nợ Máu Thần Xác Suất | Hai xúc xắc đổ máu |
| K06 | Gương Bóng Tử Địa | Gương có bóng người |
| K07 | Con Mắt Tiên Tri | Mắt hé nửa |
| K08 | Dòng Chảy Nghịch | Bẫy → đền (nửa nọ nối nửa kia) |
| K09 | Săn Đầu Ấm | Chiếc đầu lợn ấm khói |
| K10 | Vua Đơn Côi | Vương miện 1 ngọn |
| K11 | Chìa Khóa Vũ Trụ | Chìa khóa xoáy thiên hà |
| K12 | Kho Báu Bản Đồ | Rương + bản đồ |

Theo ngân sách "kỳ dị" GDD §7.1, mỗi icon cần một chi tiết bất ổn nhỏ (mắt tiên tri hé, bóng người trong gương) — không vẽ neutral.

### 2.5 S — Icon 8 skill (P2)

S01 Khiên Thành Chủ (khiên thành lũy) · S02 Xung Phong Trận (mũi tên lao) · S03 Trói Trận (xiềng xích) · S04 Giác Ngộ (ánh sáng + tam hợp) · S05 Bắn Chân (mũi tên ghim chân) · S06 Tam Liên Kích (3 mũi tên tỏa) · S07 Bóng Đêm (bóng người phủ tối) · S08 Vơ Đồ (tay + bao đồ).

### 2.6 I — Icon 4 item (P1)

I01 Kiếm (+1 ATK) · I02 Khiên (+1 DEF) · I03 Dược Huyết (bình máu) · I04 Ngọc May Mắn (ngọc 4 lá). Item rơi trên ô rương có 2 frame nhấp nháy.

### 2.7 F — FX animation (P1)

| Mã | FX | Frame | Sự kiện GDD |
|---|---|---|---|
| F01 | Bước di | 2 | MOVE |
| F02 | Nổ giao tranh | 2 | BATTLE khởi phát |
| F03 | Crit | 3 | Chí mạng ×2 |
| F04 | Hào quang thắng/thua | 2 | Kết BATTLE |
| F05 | Về chuồng | 2 | Quân bị bắt / HP về 0 |
| F06 | Mũi tên Xạ Kích | 3 | Xạ Kích 3–5 ô |
| F07 | Về đích phong thần | 2 | p = 57 |
| F08 | Hồi máu | 2 | Hồi máu đầy / hồi đầu lượt |
| F09 | Bẫy kích hoạt | 2 | Dẫm bẫy, mất lượt di kế |
| F10 | Đền sáng | 2 | Đứng trên đền +1 ATK |

### 2.8 U — Màn UI DOM/CSS (P0)

Không phải sprite — DOM/CSS thuần, 15 màn/frame chính:

| Mã | Màn | GDD |
|---|---|---|
| U01 | Màn tiêu đề + chọn số người chơi 2–4 | §5.1 |
| U02 | DRAFT bước 1: chọn tộc | §3.1 |
| U03 | DRAFT bước 2: chọn 4 vai trò không trùng | §3.1 |
| U04 | HUD bàn cờ: xúc xắc, lượt, phe | §6 |
| U05 | HUD quân: HP bar, EXP, cấp, CD skill, item 2 slot | §3.6 |
| U06 | Tooltip breakdown 10 tầng pipeline | §5.4 |
| U07 | CORE_PICK: 3 lõi + nút reroll 1 lần | §3.5 |
| U08 | Màn giao tranh: 2 vế điểm + d6 + kết quả ≤ 10s | §2.4 |
| U09 | Thông báo chuỗi 6 / mất lượt | §2.2 |
| U10 | Panel hot-seat pass-and-play (kể cả tap-để-mở D13) | §5.1 |
| U11 | Panel DevMode | §7.4 |
| U12 | Màn thắng | §2.5 |
| U13 | Màn mở rương / chọn item | §4.1 |
| U14 | Tooltip vùng đất khi hover ô | §4 |
| U15 | Bảng fortune cuối trận: EXP, cấp, lõi đã chọn | §8 |

Wireframe từng màn cần duyệt trước khi code `[Cần chốt D16](#8-quyết-định-cần-chốt-của-tài-liệu-này)`.

### 2.9 A — SFX tổng hợp (P2)

Mỗi SFX một hàm Web Audio, 10 sự kiện:

| Mã | SFX | Sự kiện |
|---|---|---|
| A01 | Xúc xắc lăn + đậu | ROLL |
| A02 | Bước di | MOVE |
| A03 | Va chạm giao tranh | BATTLE |
| A04 | Crit | Chí mạng |
| A05 | Thắng / thua hiệp | Kết BATTLE (2 biến thể nốt cao/thấp) |
| A06 | Về chuồng | Quân bị bắt |
| A07 | Về đích | p = 57 |
| A08 | Mở rương | U13 |
| A09 | Dẫm bẫy | F09 |
| A10 | Chọn lõi / skill | CORE_PICK / dùng skill |

---

## 3. Quy trình sản xuất code-sinh

1. Định nghĩa palette 32 màu đầu tiên (`src/data/gfx/palette.ts`) — chốt trước khi vẽ bất kỳ sprite nào; đổi palette sau khi vẽ là làm lại toàn bộ.
2. Mỗi sprite là string-matrix đặt cạnh data đối tượng nó đại diện: icon tộc trong `tribes.ts`, icon lõi trong `cores.ts`, icon skill trong `skills.ts` — không tách file riêng theo loại ảnh.
3. Runtime: build offscreen canvas 1 lần từ string-matrix → `drawImage`; cache theo khóa asset.
4. FX = mảng frame + thời lượng; engine FX vẽ tuần tự theo sự kiện core phát.
5. Validator `[Đề xuất]`: script test kiểm mỗi string-matrix có đúng kích thước khai báo và chỉ dùng ký tự đã đăng ký trong palette — chạy trong vitest cùng `src/core/`.

---

## 4. Traceability — asset ↔ GDD

| GDD | Asset tương ứng |
|---|---|
| §2.1 Bàn 15×15, 52 ô vòng, 4 cung vùng | B01–B07 |
| §2.3 8 ô sao an toàn | B05 |
| §2.4 Giao tranh ≤ 10s, crit | F02–F04, U08 |
| §2.4 Xạ Kích 3–5 ô | F06 |
| §2.5 4 quân về đích | F07, U12 |
| §3.1 Draft tộc + 4 vai | H01–H16, U02–U03 |
| §3.3 4 tộc, cộng hưởng 2/4 | C01–C06 |
| §3.4 Tàn Đoàn 2/1 quân | C07–C08 |
| §3.5 12 lõi, CORE_PICK | K01–K12, U07 |
| §3.6 EXP/cấp/skill/item | U05, S01–S08, I01–I04 |
| §4 4 vùng + 24 ô đặc biệt | B01–B06, F08–F10, U14 |
| §5.4 Tooltip pipeline 10 tầng | U06 |
| §5.1 Hot-seat 2–4 người | U01, U10 |
| §7.4 DevMode | U11 |

Mọi asset trong mục 2 đều có ít nhất một dòng GDD tương ứng ở bảng trên — không có asset "trang trí" không gắn cơ chế.

---

## 5. Hiện trạng asset pack trong thư mục

Kết quả khảo sát trực tiếp 3 file trong `E:/CodeLinhTinh/Game`:

### 5.1 Sunnyside World V2.1 (10.8 MB)

- Nội dung: 393 PNG thật (Characters 186, Elements 105, UI 102, Tileset 2) + project GameMaker với 5.437 sprite; nhân vật 96×64/8 frame, tileset 16px và 32px (1.024×1.024).
- Chủ đề nông trại/thị trấn (cây trồng, nhà, ống khói, cuốc, câu cá) — **không có chủ đề chiến trận**, không có tộc phi-human ngoài 1 goblin trong bản archive.
- **Không có file license nào trong zip** — giấy phép chưa xác minh. Không khẳng định được quyền sử dụng nếu không có văn bản license; trước khi dùng bất kỳ pixel nào phải lấy license thật `[Cần chốt D17](#8-quyết-định-cần-chốt-của-tài-liệu-này)`.

### 5.2 Sunnyside World ARCHIVED (10.4 MB)

Zip chứa 10 zip/psd lồng nhau (bản beta tileset, goblin v0.1, crops, buildings, characters parts v0.3.1, khói ống khói). Toàn bộ là bản trùng nội dung/lỗi thời so với V2.1 — chỉ giữ làm tham khảo, không dùng trực tiếp.

### 5.3 Minifantasy Forgotten Plains v3.6 Free (321 KB)

- Nội dung: 32 entry — tileset 16px Forgotten Plains (đồng cỏ, sông, thác), props, 2 mockup GIF; phong cách `Minifantasy` của Krishna Palacio.
- License `FreeLicense.txt` đọc trực tiếp: **chỉ cho non-commercial**, được chỉnh sửa trong dự án non-commercial, **cấm dùng thương mại, cấm tái phân phối/resell/NFT**, bắt buộc credit Krishna Palacio và gửi link dự án hoàn thành cho tác giả.
- Mức 16px đồng cỏ rất gần nhu cầu tile Thung Lũng Sương — nhưng chỉ dùng được khi toàn bộ game mang tính phi thương mại theo điều khoản license `[Cần chốt D17]`.

### 5.4 File .aseprite nhân vật (404 KB)

`sunnyside_world_chatacter_anim_human_v1.0.aseprite` — file Aseprite nhị phân gốc (nhận dạng qua đuôi file, không mở bằng zipfile được), bộ anim nhân vật người của Sunnyside. Dùng làm tài liệu tham khảo khung hình (timing/danh sách anim: idle/walk/run/attack/hurt/death...) khi thiết kế frame hero 16×16.

### 5.5 Kết luận mapping cần–có

| Nhu cầu game | Pack đáp ứng? | Chốt |
|---|---|---|
| 4 tộc phi-human (Tiên Linh/Yêu/Long) | Không — pack chỉ có human + 1 goblin | Code-sinh theo GDD |
| Tile 4 vùng | Minifantasy phủ gần Thung Lũng; 3 vùng còn lại không khớp chủ đề | Code-sinh, tham khảo tông màu |
| Hero 16×16, anim 4 frame | Không — Sunnyside là 96×64 nông dân | Code-sinh |
| UI icon | Sunnyside có 102 UI PNG nhưng license chưa xác minh | Code-sinh |
| Font tiếng Việt | Không pack nào có | Font hệ thống/pixel font [D15] |

Kết luận: chiến lược mặc định **code-sinh 100% theo GDD §5.2**, cả 3 pack chỉ giữ vai trò tham khảo tông màu, timing anim, layout tile — không nhập pixel nào vào build. Lý do: (1) GDD đã chốt pixel art 100% code-sinh làm ràng buộc kỹ thuật; (2) license Sunnyside chưa xác minh được; (3) Minifantasy cấm thương mại; (4) không pack nào có tộc phi-human. Nếu sau này muốn chuyển sang dùng pack, đó là thay đổi GDD §5.2 — quyết định D17.

---

## 6. Lộ trình sản xuất theo milestone

| Milestone GDD §8.2 | Asset chặn đường | Số lượng |
|---|---|---|
| `vite build` + smoke test | B01–B07, H01–H16, U01, U04, U08 | 29 |
| Hot-seat flow đầy đủ | U02–U03, U05–U07, U09–U10, U13–U14, C01–C08, K01–K12, I01–I04, F01–F06, F08–F10 | 45 |
| DevMode HUD hoàn thiện | U11 | 1 |
| Playtest nhịp độ | S01–S08, A01–A10, U12, U15 | 21 |

P0 xong trước khi build; P1 gắn bản playtest; P2 (skill icon + audio) cuối cùng — engine không phụ thuộc chúng, chỉ hiển thị thay thế bằng placeholder xám.

Cập nhật 2026-09-10: **65/65 asset pixel (B/H/C/K/S/I/F) redesign v2.0** qua Aseprite CLI — chi tiết + kiểm chứng tại `ASSET_V2.md` (fixes theo audit v1: hero outline+vũ khí silhouette, tile directional light, K eerie push, FX arc nhất quán; 134/134 matrix↔PNG, 16/16 hero structural). Bản v1.0 vẫn còn tại `assets/v1/` + `ASSET_V1.md` để rollback. Nhóm U (màn UI DOM/CSS) không thuộc phạm vi pixel; nhóm A (SFX) chưa sản xuất. Cột "Số lượng" ở bảng trên đếm cả asset U/A; phần pixel tương ứng đã đủ.

---

## 7. Checklist nghiệm thu asset

Mỗi asset hoàn tất phải qua checklist trước khi merge:

- [ ] Đúng kích thước quy ước (tile 24, hero/icon 16, chuồng 48).
- [ ] Chỉ dùng ký tự đã đăng ký trong palette 32 màu.
- [ ] Đọc rõ ở scale 1× trên nền tile vùng đậm nhất (kiểm tra contrast bằng mắt trên cả 4 nền).
- [ ] Nhãn UI tiếng Việt NFC, kiểu mới, không cắt chữ ở 360 px (kiểm `check_font_coverage.py` từ skill vietnamese-tech-writing với font chọn).
- [ ] Hero: phân biệt được tộc ở 16×16 (đọc đầu) và hệ (đọc vũ khí).
- [ ] FX: tổng thời lượng ≤ thời lượng sự kiện (giao tranh toàn bộ ≤ 10s gồm cả FX).
- [ ] Asset có dòng traceability ở mục 4 và mã asset trong tên commit.

---

## 8. Quyết định cần chốt của tài liệu này

| # | Quyết định | Đề xuất mặc định |
|---|---|---|
| D15 | Font pixel hỗ trợ tiếng Việt (dấu chồng `ề ộ ữ` không đứt) hay font hệ thống? | Bắt đầu bằng font hệ thống; chọn pixel font sau khi có danh sách ứng viên qua `check_font_coverage.py` |
| D16 | Wireframe 15 màn UI duyệt ở đâu? | Wireframe ASCII/text ngay trong tài liệu này, bổ sung từng mục 2.8 khi bắt đầu milestone UI |
| D17 | Có nhập asset từ 3 pack có sẵn không? | Không — code-sinh 100%; nếu đổi ý phải sửa GDD §5.2 + xác minh license Sunnyside trước |
| D18 | Thứ tự sản xuất hero Long → Yêu → Tiên Linh → Người? | Theo đề xuất mục 2.2, bắt đầu từ tộc Long để chuẩn palette lạnh cho Vực Băng |

---

## 9. Phụ lục — bảng đối chiếu số lượng với GDD

| GDD | Số lượng logic | Asset | Khớp |
|---|---|---|---|
| §3.1 4 tộc × 4 hệ | 16 combo | H01–H16 | 16 = 16 |
| §3.3 4 tộc + 2 ngưỡng cộng hưởng + 2 ngưỡng Tàn Đoàn | 8 | C01–C08 | 8 = 8 |
| §3.5 12 lõi | 12 | K01–K12 | 12 = 12 |
| §3.6 8 skill (4 hệ × 2) | 8 | S01–S08 | 8 = 8 |
| §3.6 4 item | 4 | I01–I04 | 4 = 4 |
| §4 4 vùng | 4 | B01–B04 | 4 = 4 |
| §4.1 5 loại ô đặc biệt | 5 | B05 | 5 frame = 5 loại |

Số lượng asset khớp từng dòng số liệu GDD; không thiếu, không thừa asset logic.
