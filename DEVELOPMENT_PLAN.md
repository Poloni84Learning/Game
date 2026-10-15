# Kế hoạch phát triển Cá Ngựa Chiến Thần

Ngày đánh giá: 11/10/2026 (cập nhật asset 14/10/2026). Phạm vi: bản web hot-seat 2–4 người, tiếng Việt, chạy trên PC và mobile.

## 1. Hiện trạng đã kiểm chứng

- Stack: TypeScript strict, Vite, Canvas 2D, DOM/CSS overlay, Web Audio; không có dependency runtime trong package.json.
- Engine tách khỏi UI; đã có di chuyển, giao tranh, kỹ năng, cộng hưởng, lõi, EXP, vật phẩm và auto-play cơ bản.
- UI đã có chọn số người, draft tộc, chọn phong cách hero, HUD, giao tranh, chọn lõi và màn thắng.
- Sprite: bộ zcode (đổi tên từ v4, độ phân giải gốc 2×) — 146 asset / 373 frame, PNG gom theo batch `assets/zcode/png/<nhãn ngày>/`, chi tiết trong ASSET_ZCODE.md. Đã có batch Văn hoá Việt 14/10/2026 (V01–V03) chưa gắn vào gameplay.
- `npm test`: 38/40 mục pass; hai test fail là K03 punishingLight (thiết kế v5 chưa chuyển xong, lỗi có sẵn, không do asset).
- `npm run build` và typecheck: pass sau đổi tên zcode (JS 320.09 kB / gzip 56.15 kB).
- GDD ghi 110 test Vitest, trong khi mã hiện tại dùng Node test runner. Không tìm thấy BALANCE.md được GDD tham chiếu.
- Chưa kiểm chứng tương tác trực tiếp trong browser, chất lượng hiển thị mobile hoặc cân bằng thực tế. Build pass không chứng minh các phần này.

## 2. Mục tiêu bản phát hành đầu tiên

Một nhóm 2–4 người có thể tự bắt đầu trận, hiểu nước đi hợp lệ, dùng đầy đủ tính năng hiện có, chơi đến hết trận và tiếp tục sau khi tải lại trang. Ưu tiên tính đúng luật và dễ hiểu trước khi mở rộng nội dung.

Chưa đưa multiplayer online, tài khoản, draft tự do hoặc thêm tộc vào phạm vi bản đầu. Draft tự do cần định nghĩa cộng hưởng hệ trước.

## 3. Lộ trình theo thứ tự phụ thuộc

### P0 — Sửa luồng chơi và thống nhất luật (ước lượng 3–5 ngày làm việc)

1. Sửa xử lý click từ vòng p≤51 sang đường về p52–56 hoặc đích p57. UI hiện chỉ xử lý đích home/goal khi quân đã ở p>51. Bổ sung highlight đường về và đích, vì Highlight hiện chỉ biểu diễn ô vòng.
2. Đưa lựa chọn lõi và reroll về engine: lưu ba lựa chọn trong state, dùng RNG có seed, kiểm tra lõi được chọn nằm trong danh sách. UI hiện dùng Math.random; callback reroll chỉ đổi biến cục bộ, không gọi API ghi nhận reroll. Đảm bảo mỗi mốc chỉ reroll một lần.
3. Cho chọn quân khi nhiều quân chung ô, chọn đối thủ khi ô có nhiều địch, chọn quân B khi dùng Nợ Máu. UI hiện lấy quân đầu tiên ở các trường hợp này.
4. Chặn toàn bộ hành động HUD khi popup giao tranh hoặc lựa chọn bắt buộc đang mở; rà soát trạng thái chọn quân và mode lõi sau đổi lượt.
5. Rà soát Con Mắt Tiên Tri và DevMode: tránh ghi trực tiếp die/phase để bỏ qua xử lý lượt; ẩn công cụ debug mặc định trong bản release.
6. Đối chiếu các quyết định D1–D14 trong GDD với mã, ghi rõ luật đang áp dụng và luật còn cần quyết định. Ưu tiên hết nước hợp lệ, skill thay nước di, đi thêm và cộng hưởng Long/Tiên Linh.

Điều kiện hoàn thành: test hồi quy cho lỗi chuyển đường về và reroll; chơi hết trận 2, 3, 4 người trên browser; không kẹt phase, không mất quyền chọn hợp lệ. Mỗi tính năng ghi trong bản release phải đi được từ UI tới engine.

### P1 — Hoàn thiện trải nghiệm hot-seat (4–6 ngày)

1. Thêm màn bàn giao lượt: hiển thị người tiếp theo, nút sẵn sàng, che thông tin Tiên Tri trước khi bàn giao.
2. Thêm hướng dẫn trận đầu và trang luật ngắn: tung → chọn quân → chọn đích; giải thích sao, vùng, HP, EXP và lõi ngay tại ngữ cảnh.
3. Làm rõ trạng thái không thể di chuyển/dùng skill, lỗi thao tác và lựa chọn bắt buộc. Giữ thông báo lỗi đủ lâu để đọc.
4. Hoàn thiện breakdown chỉ số và giao tranh, thể hiện nguồn cộng hưởng và vùng thay vì chỉ tổng số.
5. Rà soát mobile dọc/ngang: kích thước bàn, vùng chạm, cuộn HUD, modal không bị cắt; thêm điều khiển focus/bàn phím cho DOM và nút tắt âm thanh.
6. Dùng events/movePath từ ActionResult để gắn FX vào đúng quân và ô; không suy ra vị trí từ quân đầu tiên trong log.

Điều kiện hoàn thành: người mới hoàn thành lượt đầu với hướng dẫn trong game; mọi lựa chọn đọc và chạm được trên mobile; giao tranh có thể đóng/bỏ qua nhanh.

### P2 — Lưu trận và nền tảng phát hành (2–4 ngày)

1. Tự lưu state sau hành động hoàn tất; có schemaVersion, kiểm tra dữ liệu khi tải, tiếp tục trận và bắt đầu trận mới.
2. Lưu seed và lịch sử action có cấu trúc để tái hiện lỗi. Không coi log văn bản là replay đầy đủ.
3. Bổ sung README với lệnh chạy/build/test, yêu cầu Node theo toolchain thực tế, sơ đồ thư mục và luật đã chốt; cập nhật GDD cho đúng hiện trạng.
4. Thêm script typecheck và quy trình kiểm tra tự động: test → typecheck → build. Kiểm thử browser tập trung vào đường đi đầy đủ của một trận và các điểm P0.
5. Chuẩn hóa cấu hình static hosting, kiểm tra build trên đường dẫn gốc và subpath. Chuẩn bị bản preview để playtest; việc xuất bản được thực hiện khi có yêu cầu.

Điều kiện hoàn thành: tải lại trang tiếp tục đúng lượt/quân/lõi/RNG; save lỗi không làm game crash; checkout sạch chạy được theo README.

### P3 — Đo nhịp trận và cân bằng (3–5 ngày, cộng thời gian thu thập playtest)

1. Tạo runner mô phỏng có seed cho 2/3/4 người; luân phiên tộc và ghế để giảm thiên lệch thứ tự.
2. Đo tỷ lệ thắng theo tộc/ghế, số lượt, tỷ lệ trận không kết thúc, giao tranh, mốc lõi đạt được, skill/item sử dụng và thời gian hot-seat thực tế.
3. Chạy lô nhỏ để kiểm tra runner, sau đó khoảng 1.000 trận cho mỗi cấu hình số người. Báo cả kích thước mẫu và mức bất định; không dùng 40 trận để kết luận chắc chắn cân bằng.
4. Nâng policy auto-play nếu cần: hiện ưu tiên quân di được đầu tiên và chọn lõi đầu tiên. Kết quả policy này chỉ là baseline, không đại diện đầy đủ cho người chơi có chiến thuật.
5. Chốt mục tiêu thời lượng trận và số lõi mong muốn; tune EXP dựa trên số đo, giữ snapshot trước/sau trong BALANCE.md.

Điều kiện hoàn thành: có báo cáo tái lập bằng seed, luật EXP được chốt, không có tình huống bế tắc đã biết; số đo mô phỏng được đối chiếu với playtest người thật.

### P4 — Mở rộng sau bản hot-seat ổn định

- Đấu máy: dùng lớp chọn action hợp lệ chung với UI; tăng độ khó bằng heuristic di chuyển/giao tranh/lõi.
- Hoàn thiện chuyển động quân, âm thanh và hiệu ứng trên nền art hiện có sau khi đường tương tác ổn định.
- Draft tự do chỉ sau khi xác định cộng hưởng hệ và có kiểm chứng cân bằng.
- Multiplayer online là giai đoạn riêng: cần giao thức action, đồng bộ state, quyền xác thực lượt và reconnect; không chỉ thêm phòng chơi vào UI hiện tại.

## 4. Ước lượng và bước bắt đầu

Ước lượng sơ bộ cho một lập trình viên: 12–20 ngày làm việc tới bản hot-seat sẵn sàng playtest/phát hành, chưa gồm thời gian chờ người chơi và các thay đổi lớn phát sinh từ luật. Kiểm chứng browser ở P0 sẽ giúp điều chỉnh ước lượng.

Bắt đầu bằng một đợt P0 nhỏ: sửa đường vào nhà/đích → sửa lõi/reroll → lựa chọn quân và mục tiêu → kiểm thử hết trận. Sau khi đợt này pass mới mở rộng save game, UX và cân bằng. Giữ core/data/gfx/ui hiện tại; chưa cần đổi framework hoặc viết lại engine.
