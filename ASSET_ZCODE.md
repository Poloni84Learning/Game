# Asset zcode — độ phân giải gốc 2× (đổi tên từ v4)

Cập nhật: 11/10/2026. Đã tích hợp vào game, không chỉ là bản concept.

| Nhóm | Trước | Zcode |
|---|---:|---:|
| Ô bàn cờ, overlay, FX | 24×24 | 48×48 |
| Hero, tộc, lõi, skill, vật phẩm | 16×16 | 32×32 |
| Chuồng | 48×48 | 96×96 |
| Palette | 31 màu đặc | 55 màu đặc + trong suốt |

Tổng 130 asset / 351 frame, bao gồm bộ hero legacy ID, ba bộ Chibi/Giáp/Choàng, icon xúc xắc, props cây/đá và khung UI nine-slice. Các ID và số frame của asset gameplay cũ được giữ; nguồn v1/v2/v3 còn trong repository.

## Hướng hình ảnh

Fantasy pixel art, viền tối một pixel, ánh sáng từ trên trái. Thép có dải sáng lạnh; vải, gỗ và vàng có dải sáng ấm. Hiệp sĩ có khiên/kiếm; pháp sư có trượng tinh thể/áo dài; cung thủ có cung và bao tên; sát thủ có khăn che mặt và song đao. Tộc có chi tiết tai, sừng, màu da và trang phục riêng.

Ô chơi sáng hơn cảnh nền. Bốn vùng có nền và texture khác nhau; props nền được render vào một canvas cache duy nhất. Khung DOM dùng màu slate/vàng và asset viền pixel. Chữ tiếng Việt vẫn dùng font hệ thống để đọc được ở kích thước nhỏ.

## Quyết định về 2×

Tăng số pixel được vẽ ở nguồn, giữ kích thước logic bàn cờ và hệ tọa độ click. `SPR` chuyển 2 → 1; tile vẫn chiếm 48 pixel canvas. Như vậy có thêm chi tiết mà không làm bàn cờ, quân hoặc vùng click lớn gấp đôi.

Canvas vẫn 912×912. Fit tính theo vùng nội dung sau khi trừ padding, cho phép thu nhỏ trên mobile và giữ bàn hình vuông. Downscale nearest-neighbor trên viewport nhỏ có thể mất chi tiết mảnh; portrait trong HUD/draft giúp nhận diện quân. Không cần tăng canvas lên 1824×1824 để phục vụ asset 48×48.

Các hàng matrix được nén RLE không mất dữ liệu và giải mã một lần khi khởi động. Runtime chỉ nạp zcode, không nạp các bộ cũ. Build kiểm chứng: JS khoảng 306.65 kB, gzip 53.24 kB; CSS khoảng 10.14 kB, gzip 3.23 kB. Con số thay đổi theo toolchain và chỉnh sửa tiếp theo.

## Nguồn và tái tạo

- `tools/gen_assets_zcode.mjs`: nguồn vẽ trực tiếp từng pixel, dùng Node built-ins, không cần Aseprite/Python hay dependency runtime.
- `npm run assets:generate`: xuất PNG, manifest, contact sheet và `src/data/gfx/assets_zcode.ts`.
- `assets/zcode/png/<ngày>/`: PNG trong suốt theo ID/frame, kích thước gốc, gom theo ngày thực hiện. Bộ nền nằm ở `2026-10-11`; icon lõi K01–K24 và hero custom nằm ở `2026-10-14`. Bản đồ ID→ngày lưu tại `assets/zcode/ASSET_DATES.json`; asset thêm về sau tự ghi ngày chạy generator đầu tiên của nó.
- `assets/zcode/CONTACT_SHEET_2X.png`: bản xem toàn bộ hero/icon/tile/FX/props chính. Bản sheet phóng 2× để xem; PNG riêng là kích thước gốc.
- `assets/zcode/preview/`: ảnh chụp game desktop/mobile, welcome/draft/board/move.
- `tools/preview_assets_zcode.mjs`: smoke browser và ảnh chụp. Cần dev server ở 127.0.0.1:5273 và Playwright cài riêng cho công cụ QA; không thêm dependency vào game.

Không chỉnh file TypeScript sinh tự động bằng tay; sửa generator rồi tái tạo.

## Kiểm chứng

- Generator kiểm tra ma trận chữ nhật, màu hợp lệ và RLE round-trip cho mọi hàng.
- TypeScript noEmit, Vite build và 36 mục test engine/smoke pass.
- Browser headless Chrome: 1440×960 và 390×844; không pageerror hoặc tràn ngang; bàn vuông 846×846 và 366×366.
- Click chọn quân/ô đích sau fit đưa quân từ chuồng ra vòng đúng state trên cả hai viewport.
- Đã xem ảnh welcome/draft/board và contact sheet. Đây không phải kiểm chứng playtest toàn bộ skill/lõi hay trận đấu đến hết.

Các chỉnh sửa renderer đi kèm: ánh xạ vị trí quân của từng phe sang chỉ số vòng tuyệt đối; mũi tên đường về hướng vào tâm; nhóm quân theo ô chung và chuồng theo slot; thanh HP dùng maxHP thực; FX dùng đủ ba frame và thời điểm phát thực.

## Cập nhật 14/10/2026

Đổi tên bộ asset **v4 → zcode**: thư mục `assets/zcode/`, generator `tools/gen_assets_zcode.mjs`, data runtime `src/data/gfx/assets_zcode.ts` (exports `ASSETS_ZCODE`, `PALETTE_ZCODE`). PNG gom theo thư mục batch có nhãn ngày — ví dụ `png/2026-10-14-van-hoa-viet/` — bản đồ ID→thư mục tại `ASSET_DATES.json`, asset mới không khớp seed sẽ tự ghi ngày chạy.

Thêm batch Văn hoá Việt `png/2026-10-14-van-hoa-viet/` + sheet kiểm tra `VANHOAVIET_4X.png`:

- `V01`: chiến binh nón lá — nón lá rộng, áo dài đỏ viền vàng, quần trắng lộ qua khe tà, giáo mũ lông tua đỏ, 4 frame.
- `V02`: trống đồng Đông Sơn — mặt sao 16 cánh, hai dải răng cưa vàng, patina xanh đồng.
- `V03`: hoa sen — năm cánh hồng trên lá xanh.

Tổng hiện tại: **146 asset / 373 frame**. Build kiểm chứng lại sau đổi tên: tsc noEmit sạch, Vite build JS 320.09 kB / gzip 56.15 kB, test engine 38/40 (hai test K03 punishingLight fail có sẵn từ trước, chưa chuyển sang thiết kế v5).
