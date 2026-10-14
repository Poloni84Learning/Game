# Thần khí v5 — bộ 24 lõi đã chốt

Ngày: 14/10/2026. Đây là thiết kế đích để triển khai; không phải mô tả tính năng engine hiện đã hoàn thành.

Lõi thuộc cả đội, tối đa ba lõi. Mỗi lựa chọn phải thay đổi cách chơi, có trigger và giới hạn rõ. Không có lõi chỉ cộng/trừ ATK, DEF hay maxHP. Icon là vật phẩm fantasy gợi cảm giác, không cần minh họa chính xác hiệu ứng.

| ID | Lõi | Cơ chế | Giới hạn và đánh đổi |
|---|---|---|---|
| K01 / bloodPact | Khế Máu | Chọn quân trên vòng hiến 3 HP để gọi một đồng minh từ chuồng đến ô xuất phát. | Một lần mỗi lượt phe; quân hiến phải còn ít nhất 4 HP; tiêu hao nước di. |
| K02 / rustLightning | Chuông Sét Gỉ | Khi dùng skill, giảm một lượt hồi cho các skill đang hồi của đồng minh khác. | Không giảm skill của người vừa dùng, không tạo chuỗi kích hoạt. |
| K03 / punishingLight | Phán Quyết Bình Minh | Giao tranh tấn công dùng DEF của quân mình thay ATK. | Chủ động đổi cách xây đội; không áp vào phòng thủ; sao vẫn an toàn. |
| K04 / nightTorch | Đuốc Dẫn Hồn | Khi bị đưa về chuồng, lưu ô cũ; lần ra quân tiếp theo được trở về ô đó nếu không có địch. | Một lần mỗi quân mỗi trận; ô cũ phải là vòng thường; không kích hoạt ô hoặc giao tranh khi trở lại. |
| K05 / bloodDebt | Nợ Máu | Chia kết quả xúc xắc cho hai quân khác nhau trên bàn, mỗi quân nhận ít nhất một bước. | Giải quân A rồi B; kiểm tra cả hai trước khi mutation; không dùng cho quân trong chuồng. |
| K06 / deadMirror | Gương Bóng Tử Địa | Khi thua giao tranh cận chiến, đưa đối thủ thắng về chuồng cùng mình. | Một lần mỗi quân giữ lõi mỗi trận; không xuyên sao hoặc skill bảo vệ; không áp xạ kích. |
| K07 / prophetEye | Mắt Tiên Tri | Xem kết quả xúc xắc kế mà không tiêu RNG; một lần mỗi trận chọn giá trị lần tung kế của mình. | Ép số vẫn đi qua xử lý tung chuẩn, chuỗi 6 và nước hợp lệ; không sửa trực tiếp phase. |
| K08 / reverseFlow | La Bàn Nghịch Lưu | Dẫm bẫy đưa quân đến đền gần nhất theo khoảng cách vòng. | Chỉ đền không có địch; ưu tiên chỉ số ô nhỏ khi hòa; không lặp kích hoạt ô sau teleport. |
| K09 / headHunter | Chuông Truy Hồn | Thắng giao tranh lấy một chiến lợi phẩm; đủ hai chiến lợi phẩm đổi lấy quyền gọi quân từ chuồng bằng mọi số tung. | Quyền gọi bị tiêu thụ khi thực sự ra quân; không tích quá một quyền gọi. |
| K10 / loneKing | Vương Miện Cô Hành | Quân cách mọi đồng minh đang chạy ít nhất bốn bước được dùng số bù 7−die. | Người chơi chọn số thường hoặc số bù; tuân thủ về đích đúng số; không áp quân chuồng. |
| K11 / universeKey | Chìa Vũ Trụ | Đổi vị trí hai đồng minh trên vòng. | Một lần mỗi trận, tiêu hao nước di; không kích hoạt ô sau hoán đổi. |
| K12 / treasureMap | Bản Đồ Thất Lạc | Khi đáp rương chưa mở, chọn kiếm/khiên/bình máu thay vì nhận ngẫu nhiên. | Lựa chọn bắt buộc giữ phase; túi đầy đổi EXP; mỗi rương chỉ nhận thưởng một lần. |
| K13 / hourglass | Đồng Hồ Cát | Bỏ nước di để lưu die; lần đi tiếp theo chọn dùng số lưu hoặc số mới. | Một ô lưu, không cộng hai số; số lưu bị xóa khi sử dụng; không lưu lại khi đã có số. |
| K14 / moonDial | Nhật Nguyệt Luân | Đổi die hiện tại thành 7−die. | Một lần mỗi lượt phe; không thay nguồn đi thêm từ lần tung 6 gốc. |
| K15 / pilgrimBoots | Giày Hành Hương | Di chuyển đến vùng mới lần đầu của từng quân nhận thêm EXP. | Mỗi quân/mỗi vùng một lần; chỉ di chuyển thật, không hoán đổi/teleport; không áp đường về. |
| K16 / phoenixFeather | Lông Phượng | Lần đầu mỗi quân mất hết HP được giữ ở ô xuất phát nước đi và hồi một HP. | Một lần mỗi quân mỗi trận; không ngăn bị bắt do đối phương thắng khi đang phòng thủ. |
| K17 / thornSeed | Hạt Gai | Đặt bẫy tạm tại ô vòng thường của quân mình, sau đó di chuyển bình thường. | Một bẫy mỗi phe; chặn một lượt di của địch đáp lên và biến mất; knight/elf vẫn miễn. |
| K18 / caravanBell | Chuông Lữ Hành | Chuyển một kiếm hoặc khiên từ quân mình sang đồng minh khác. | Một lần mỗi lượt phe; cả hai trên bàn, bên nhận còn chỗ; không tiêu hao nước di. |
| K19 / sanctuary | Đèn Trú Ẩn | Quân đáp ô hồi được xóa trạng thái trói/bẫy và giảm một CD của chính mình. | Chỉ đáp thật; giảm skill đang hồi đầu tiên theo thứ tự class; không áp hồi từ nguồn khác. |
| K20 / stormBottle | Bình Bão | Khi xạ kích hụt, đánh dấu mục tiêu; xạ kích tiếp theo vào đúng mục tiêu được tung lại xúc xắc công và lấy kết quả cao hơn. | Một dấu mỗi phe; tiêu dấu khi bắn lại; không áp crit/cận chiến. |
| K21 / waystone | Đá Dẫn Đường | Chọn quân đang trên vòng lùi đúng hai bước để tránh giao tranh/địa hình. | Một lần mỗi lượt phe; không lùi qua p0, không áp đường về; vẫn giải ô đến và địch. |
| K22 / echoMask | Mặt Nạ Vọng Âm | Dùng skill bảo vệ đặt hiệu ứng bảo vệ tương ứng lên một đồng minh nữa. | Đồng minh gần nhất trên vòng trong sáu ô; không phát lại skill, không phát lại trigger. |
| K23 / gateSeal | Ấn Khải Hoàn | Mỗi quân về đích lần đầu trao một quyền gọi quân từ chuồng bằng mọi số. | Tối đa một quyền chờ; không chuyển cho phe khác, không có tác dụng nếu hết quân chuồng. |
| K24 / scholarLantern | Đèn Ký Ức | Khi một quân lên cấp, đồng minh cấp thấp nhất còn chạy nhận EXP nghiên cứu. | Không truyền lại từ EXP nghiên cứu; chọn id thấp khi hòa; quân chuồng/đích không nhận. |

## Quy tắc chung cần engine bảo đảm

- Lượt phe gồm mọi lần đi thêm; giới hạn một lần/lượt reset khi quyền chơi chuyển sang phe kế, không reset khi tung thêm.
- Phân biệt số tung gốc và số bước hiện tại. Đổi/lưu số không tạo hay xóa nguồn đi thêm từ số 6 gốc.
- Mọi action kiểm tra phase, quyền sở hữu, mục tiêu và số nguyên trước mutation. Action thất bại không tiêu tài nguyên.
- RNG có seed quản lý cả ba lựa chọn lõi và reroll. Reroll một lần/mốc; chỉ chọn trong offer đã phát.
- Mốc Lv3/6/9 được chọn một lần/mốc/cả đội, có hàng chờ nếu nhiều mốc cùng phát sinh; không cấp lại khi quân khác đạt cùng cấp.
- Core pick và treasure pick xử lý trước bàn giao lượt, bảo toàn đi thêm, không kết lượt hai lần vì giao tranh.
- Quyền ra quân, dấu bão, ô hồi sinh và bẫy phải hiển thị trong HUD hoặc bàn cờ; có thông báo lý do khi action không hợp lệ.
- Thua cận chiến quay lại đúng ô bắt đầu action. Xạ kích không di chuyển người bắn.

## Asset

Vẽ đủ K01–K24 kích thước gốc 32×32, palette fantasy trầm của v4. Các icon mới: đồng hồ cát, đĩa mặt trăng, giày da, lông phượng, hạt gai, chuông, đèn trú ẩn, bình bão, đá rune, mặt nạ, ấn cổng và đèn sách.

Toàn bộ bộ asset phải có PNG gốc, nguồn tái tạo, manifest và ảnh kiểm tra. Hero ba phong cách phải khác hình dáng rõ ràng; FX phải khác cơ chế và đủ frame; không coi đổi màu đơn thuần là hoàn thiện.

## Trạng thái triển khai

Thiết kế: đã chốt. Icon K01–K24 đã xuất PNG và catalogue `assets/v4/CORES_K01_K24_4X.png`; generator hiện có 142 asset / 363 frame.

K02 Chuông Sét Gỉ đã thay hiệu ứng hồi HP/trừ DEF cũ bằng trigger giảm cooldown đồng minh khi dùng skill, có test hồi quy. Luồng cận chiến đã áp kết quả HP/EXP/bắt quân và chỉ hoàn tất action tại caller; hai test mới kiểm tra trực tiếp doMove thắng/thua. Bộ test hiện có 39 mục pass.

Engine/UI của các lõi còn lại vẫn cần chuyển sang thiết kế v5, và toàn bộ bộ 24 lõi cần kiểm thử cơ chế, tương tác, invalid action và browser trước khi tuyên bố hoàn thành. Danh mục CORES hiện vẫn có 12 lõi đang chơi; các icon K13–K24 đã sẵn sàng nhưng chưa mở vào pool chọn lõi.
