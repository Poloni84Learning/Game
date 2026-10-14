-- gen_icons.lua — v2: C01–C08, K01–K12, S01–S08, I01–I04 (16×16, 1 frame)
-- Redesign v2 (ASSET_V2.md). Fixes audit v1:
--   * MỌI icon: 1 anchor silhouette + outline o (đọc trên nền tile đậm nhất).
--   * K (lõi): push vibe "kỳ dị" GDD §7.1 — mỗi icon 1 chi tiết bất ổn
--     (con ngươi đỏ, bóng trong gương, mắt hé, xúc xắc đổ máu...).
--   * C05/C06 phân biệt: 2 quân = 2 cánh đơn nghiêng; 4 quân = 4 cánh + hào quang tòa sen.
--   * S06 Tam Liên Kích: 3 mũi tên tỏa từ 1 gốc trỏ ra ngoài (không rời rạc).
--   * I04 Ngọc 4 lá: 4 cánh + outline, không blob.

local M = dofile('tools/aseprite/art/lib.lua')
local OUT = app.params['outdir'] or 'assets/v2'

-- ============ C — Cộng hưởng & Tàn Đoàn ============

local function icon_shield_tribe(img, phe, bright) -- C01 Người
  -- khiên P viền o, chữ thập m, đinh Q góc
  M.rect(img, 3, 3, 10, 8, 'o')
  M.rect(img, 4, 4, 8, 6, phe)
  M.rect(img, 7, 5, 2, 4, bright)
  M.rect(img, 5, 6, 6, 2, bright)
  M.rect(img, 5, 11, 6, 3, 'o')
  M.rect(img, 6, 11, 4, 2, phe)
  img:drawPixel(4, 4, M.COLORS['m'])
  img:drawPixel(11, 4, M.COLORS['m'])
end

local function icon_leaf_halo(img) -- C02 Tiên Linh
  -- lá xanh f + halo c trên đỉnh, gân t
  M.disc(img, 8, 3, 1, 'c')
  M.line(img, 8, 4, 8, 6, 'c')
  M.line(img, 8, 7, 4, 11, 'f')
  M.line(img, 8, 7, 12, 11, 'f')
  M.line(img, 8, 7, 8, 13, 't')
  M.line(img, 7, 9, 10, 9, 't')
  img:drawPixel(6, 12, M.COLORS['F'])
  img:drawPixel(10, 12, M.COLORS['F'])
  img:drawPixel(8, 14, M.COLORS['t'])
end

local function icon_horns(img) -- C03 Yêu
  -- sừng L cặp cong đối xứng + trán o giữa
  M.line(img, 4, 13, 4, 8, 'l')
  M.line(img, 4, 8, 6, 5, 'l')
  M.line(img, 12, 13, 12, 8, 'l')
  M.line(img, 12, 8, 10, 5, 'l')
  M.rect(img, 6, 5, 4, 2, 'o')
  M.rect(img, 7, 6, 2, 2, 'o')
  img:drawPixel(5, 14, M.COLORS['L'])
  img:drawPixel(11, 14, M.COLORS['L'])
end

local function icon_scales(img) -- C04 Long
  -- vảy u chồng 3 tầng hình chữ U lật + râu U dưới
  M.rect(img, 4, 4, 8, 2, 'u')
  M.rect(img, 5, 6, 6, 2, 'u')
  M.rect(img, 6, 8, 4, 2, 'u')
  img:drawPixel(7, 10, M.COLORS['U'])
  img:drawPixel(8, 10, M.COLORS['U'])
  M.line(img, 7, 11, 7, 14, 'U')
  M.line(img, 8, 11, 8, 14, 'U')
  img:drawPixel(6, 4, M.COLORS['U'])
  img:drawPixel(9, 4, M.COLORS['U'])
end

local function icon_res2(img) -- C05 cộng hưởng 2 quân
  -- 2 cánh đơn nghiêngsong song + 2 chấm gốc
  M.line(img, 3, 11, 8, 4, 'w')
  M.line(img, 8, 11, 13, 4, 'w')
  M.line(img, 4, 12, 9, 5, 'c')
  M.line(img, 9, 12, 14, 5, 'c')
  img:drawPixel(6, 13, M.COLORS['c'])
  img:drawPixel(11, 13, M.COLORS['c'])
end

local function icon_res4(img) -- C06 cộng hưởng 4 quân
  -- 4 cánh tỏa 4 hướng từ tâm W + hào quang c vòng ngoài
  M.disc(img, 8, 8, 2, 'W')
  M.line(img, 8, 8, 8, 3, 'c')
  M.line(img, 8, 8, 13, 8, 'c')
  M.line(img, 8, 8, 3, 8, 'c')
  M.line(img, 8, 8, 8, 13, 'c')
  M.ring(img, 8, 8, 6, 'w')
  M.ring(img, 8, 8, 7, 'u')
  img:drawPixel(8, 1, M.COLORS['W'])
  img:drawPixel(15, 8, M.COLORS['W'])
  img:drawPixel(1, 8, M.COLORS['W'])
  img:drawPixel(8, 15, M.COLORS['W'])
end

local function icon_tan2(img) -- C07 Tàn Đoàn 2 quân (khiên sứt + kiếm)
  -- khiên u khuyết 1 góc + kiếm m xuyên chéo sau
  M.line(img, 12, 3, 12, 13, 'm')
  img:drawPixel(12, 2, M.COLORS['M'])
  M.rect(img, 3, 5, 8, 7, 'o')
  M.rect(img, 4, 6, 6, 5, 'u')
  M.line(img, 4, 6, 4, 8, 'e')   -- vết sứt mẻ tối
  img:drawPixel(3, 5, M.COLORS['e'])
  img:drawPixel(8, 6, M.COLORS['U'])
  img:drawPixel(6, 8, M.COLORS['U'])
end

local function icon_tan1(img) -- C08 Tàn Đoàn 1 quân (kiếm đơn + áo rách)
  -- kiếm M đứng + khăn choàng rách e vạt dưới jagged
  img:drawPixel(8, 2, M.COLORS['W'])
  M.line(img, 8, 3, 8, 9, 'M')
  img:drawPixel(7, 9, M.COLORS['m']); img:drawPixel(9, 9, M.COLORS['m'])
  M.rect(img, 6, 10, 5, 2, 'e')
  -- vạt rách: răng cưa dưới
  img:drawPixel(6, 12, M.COLORS['e']); img:drawPixel(8, 12, M.COLORS['e'])
  img:drawPixel(10, 12, M.COLORS['e'])
  img:drawPixel(7, 13, M.COLORS['e'])
  img:drawPixel(9, 13, M.COLORS['e'])
end

-- ============ K — 12 lõi (kỳ dị push) ============
-- Mỗi lõi 1 anchor + 1 chi tiết bất ổn.

local function core_blood_pact(img) -- K01 Huyết Khế
  -- bản khế w + dòng chữ e + TRIÂNẤN MÁU r (bất ổn: con dấu đang chảy)
  M.rect(img, 3, 2, 10, 12, 'o')
  M.rect(img, 4, 3, 8, 10, 'w')
  M.line(img, 5, 5, 11, 5, 'e')
  M.line(img, 5, 7, 11, 7, 'e')
  M.line(img, 5, 9, 9, 9, 'e')
  -- con dấu máu
  M.disc(img, 8, 12, 2, 'r')
  img:drawPixel(8, 14, M.COLORS['r'])   -- máu chảy xuống dưới khế
  img:drawPixel(6, 12, M.COLORS['R'])
  img:drawPixel(10, 12, M.COLORS['R'])
end

local function core_rust_armor(img) -- K02 Giáp Sét Gỉ
  -- giáp ngực hình giọt ngược (cổ khoét tròn, vai nở, eo thắt) + rỉ mảng
  M.rect(img, 3, 4, 10, 2, 'm')        -- hàng vai
  M.rect(img, 2, 5, 12, 5, 'o')        -- outline thân
  M.rect(img, 3, 6, 10, 3, 'm')        -- thân giáp
  M.rect(img, 4, 9, 8, 3, 'm')         -- bụng thắt
  M.rect(img, 5, 12, 6, 2, 'm')        -- đuôi nhọn
  -- khoét cổ tròn (lỗ trống)
  M.rect(img, 6, 4, 4, 2, 'e')
  img:drawPixel(5, 5, M.COLORS['e'])
  img:drawPixel(10, 5, M.COLORS['e'])
  -- độ bóng vai trái trên
  M.rect(img, 3, 6, 3, 1, 'M')
  -- 2 tấm bụng (đường giữa)
  M.line(img, 8, 6, 8, 12, 'M')
  -- mảng rỉ liền: cụm lớn dưới-phải + lan dọc mép
  M.rect(img, 8, 9, 3, 3, 'l')
  img:drawPixel(7, 11, M.COLORS['b'])
  img:drawPixel(10, 8, M.COLORS['l'])
  img:drawPixel(4, 10, M.COLORS['b'])
  img:drawPixel(5, 12, M.COLORS['l'])
  img:drawPixel(11, 12, M.COLORS['l'])
  -- vết nứt chéo thân
  M.line(img, 4, 6, 6, 8, 'e')
end

local function core_punish_light(img) -- K03 Ánh Sáng Trừng Phạt
  -- tia W xuyên xuống; ĐÁM MÂY TỐI e quanh tia (không phải cột); đất nứt toả
  -- đám mây tối: 2 khối tròn 2 bên + băng ngang trên, tia xuyên giữa
  M.disc(img, 3, 3, 3, 'e')
  M.disc(img, 12, 3, 3, 'e')
  M.rect(img, 1, 1, 14, 2, 'e')
  img:drawPixel(1, 3, M.COLORS['e'])
  img:drawPixel(14, 3, M.COLORS['e'])
  -- tia sáng xuyên mây
  M.line(img, 8, 0, 8, 8, 'W')
  M.line(img, 7, 1, 7, 8, 'w')
  M.line(img, 9, 1, 9, 8, 'w')
  -- vùng sáng chạm đất: phễu ngược w
  M.line(img, 8, 8, 5, 13, 'w')
  M.line(img, 8, 8, 11, 13, 'w')
  M.line(img, 5, 13, 11, 13, 'W')
  -- đất nứt toả ra 2 bên
  M.line(img, 3, 14, 6, 13, 'e')
  M.line(img, 10, 13, 13, 14, 'e')
  img:drawPixel(2, 15, M.COLORS['e'])
  img:drawPixel(13, 15, M.COLORS['e'])
end

local function core_night_torch(img) -- K04 Ngọn Đuốc Đêm
  -- đuốc b cán + lửa 3 tông R/r/W lớn + qoanh tối e (bất ổn: lửa to trong tối)
  M.rect(img, 6, 9, 4, 2, 'm')       -- đế
  M.line(img, 8, 11, 8, 14, 'b')     -- cán gỗ
  img:drawPixel(7, 14, M.COLORS['b'])
  -- lửa lớn chiếm 8px cao
  M.disc(img, 8, 6, 3, 'r')
  M.disc(img, 8, 6, 2, 'R')
  img:drawPixel(8, 4, M.COLORS['W'])
  img:drawPixel(8, 5, M.COLORS['W'])
  img:drawPixel(7, 5, M.COLORS['R'])
  img:drawPixel(9, 5, M.COLORS['R'])
  img:drawPixel(8, 3, M.COLORS['r'])
  -- qoanh tối 4 góc (bất ổn)
  img:drawPixel(2, 3, M.COLORS['e'])
  img:drawPixel(13, 3, M.COLORS['e'])
  img:drawPixel(2, 12, M.COLORS['e'])
  img:drawPixel(13, 12, M.COLORS['e'])
end

local function core_blood_debt(img) -- K05 Nợ Máu Thần Xác Suất
  -- 2 xúc xắc w nghiêng + mách nứt giữa + máu r nhỏ dưới (bất ổn: xúc xắc đổ máu)
  -- xúc xắc 1 (trái)
  M.rect(img, 2, 4, 6, 6, 'o')
  M.rect(img, 3, 5, 4, 4, 'w')
  M.rect(img, 4, 6, 2, 2, 'e')
  img:drawPixel(3, 5, M.COLORS['W'])
  -- xúc xắc 2 (phải, nghiêng - chồng mép)
  M.rect(img, 8, 6, 6, 6, 'o')
  M.rect(img, 9, 7, 4, 4, 'w')
  img:drawPixel(10, 8, M.COLORS['e'])
  img:drawPixel(12, 10, M.COLORS['e'])
  img:drawPixel(11, 9, M.COLORS['e'])
  -- máu nhỏ dưới giữa
  img:drawPixel(7, 12, M.COLORS['r'])
  img:drawPixel(8, 13, M.COLORS['r'])
  img:drawPixel(7, 14, M.COLORS['R'])
end

local function core_death_mirror(img) -- K06 Gương Bóng Tử Địa
  -- khung m + mặt gương e + BÓNG NGƯỜI w với 2 mắt c (bất ổn: bóng trong gương)
  M.rect(img, 3, 3, 10, 10, 'o')
  M.rect(img, 4, 4, 8, 8, 'm')       -- khung
  M.rect(img, 5, 5, 6, 6, 'e')       -- mặt kính tối
  -- bóng người: đầu + vai + mắt cyan
  -- bóng người: đầu 4px + vai + 2 MẮT cyan CÁCH NHAU 1px (không liền vệt)
  img:drawPixel(6, 6, M.COLORS['w']); img:drawPixel(7, 6, M.COLORS['w'])
  img:drawPixel(8, 6, M.COLORS['w']); img:drawPixel(9, 6, M.COLORS['w'])
  M.rect(img, 6, 7, 4, 3, 'w')
  img:drawPixel(7, 7, M.COLORS['c'])
  img:drawPixel(9, 7, M.COLORS['c'])
  -- highlight khung
  M.line(img, 4, 4, 11, 4, 'M')
  -- chân đế
  M.rect(img, 5, 13, 6, 1, 'm')
  img:drawPixel(4, 14, M.COLORS['m'])
  img:drawPixel(11, 14, M.COLORS['m'])
end

local function core_seer_eye(img) -- K07 Con Mắt Tiên Tri
  -- mắt W hé nửa (mí e phủ trên) + con ngươi c + tia nhìn xéo (bất ổn: đang quan sát bạn)
  M.disc(img, 8, 9, 5, 'W')
  M.disc(img, 8, 9, 3, 'w')
  M.rect(img, 2, 2, 12, 5, 'e')     -- phông tối sau mí
  M.line(img, 3, 7, 12, 7, 'e')     -- viền mí (trong khung, không ló)
  M.line(img, 2, 3, 13, 3, 'm')      -- dây mí kim loại
  -- (bỏ tia nhìn stray: mắt đã đủ bất ổn với mí hé)
end

local function core_reverse_flow(img) -- K08 Dòng Chảy Nghịch
  -- mũi tên c 2 đầu đối đầu, dòng chảy gãy khúc giữa 2 mảnh nền (bẫy e / đền m)
  -- nửa trái: ô bẫy e + mũi tên phải
  M.rect(img, 1, 4, 5, 8, 'e')
  M.rect(img, 2, 5, 3, 6, 'e')
  img:drawPixel(2, 6, M.COLORS['W']); img:drawPixel(4, 6, M.COLORS['W'])
  M.line(img, 2, 8, 4, 8, 'W')       -- răng bẫy
  -- nửa phải: đền m + mũi tên trái
  M.rect(img, 10, 4, 5, 8, 'm')
  M.rect(img, 11, 5, 3, 6, 'm')
  img:drawPixel(11, 6, M.COLORS['R']); img:drawPixel(13, 6, M.COLORS['R']) -- lửa đền
  -- dòng chảy c: chạm CẢ 2 mảnh — mũi tên đôi giữa, chốt 2 đầu
  M.line(img, 5, 8, 10, 8, 'c')       -- thân dòng chảy liền 2 mảnh
  img:drawPixel(5, 7, M.COLORS['c'])  -- mũi trái
  img:drawPixel(5, 9, M.COLORS['c'])
  img:drawPixel(10, 7, M.COLORS['c']) -- mũi phải
  img:drawPixel(10, 9, M.COLORS['c'])
  img:drawPixel(7, 7, M.COLORS['W'])  -- điểm gãy sáng giữa
  img:drawPixel(8, 9, M.COLORS['W'])
end

local function core_pig_pot(img) -- K09 Săn Đầu Ấm
  -- nồi có MẶT LỢN to rõ: đầu 8px rộng, mắt 2px đôi, mũi b oval 2 lỗ o,
  -- tai tam giác; khói w bốc trên; (bất ổn: nồi nhìn bạn)
  -- tai
  img:drawPixel(3, 6, M.COLORS['S'])
  img:drawPixel(12, 6, M.COLORS['S'])
  img:drawPixel(2, 7, M.COLORS['S'])
  img:drawPixel(13, 7, M.COLORS['S'])
  -- đầu/nồi: khối S outline o
  M.rect(img, 3, 7, 10, 6, 'o')
  M.rect(img, 4, 8, 8, 4, 'S')
  -- MẮT 2px đôi e (trái + phải), cách xa mũi
  M.rect(img, 5, 9, 1, 2, 'e')
  M.rect(img, 10, 9, 1, 2, 'e')
  -- MŨI b oval 2 lỗ o — feature trung tâm to
  M.rect(img, 6, 10, 4, 3, 'b')
  img:drawPixel(7, 11, M.COLORS['o'])
  img:drawPixel(8, 11, M.COLORS['o'])
  img:drawPixel(6, 10, M.COLORS['D'])
  img:drawPixel(9, 10, M.COLORS['D'])
  -- miệng cong w
  img:drawPixel(6, 13, M.COLORS['w'])
  img:drawPixel(9, 13, M.COLORS['w'])
  -- khói bốc lượn 2 vệt w
  img:drawPixel(5, 5, M.COLORS['w'])
  img:drawPixel(10, 5, M.COLORS['w'])
  img:drawPixel(6, 3, M.COLORS['w'])
  img:drawPixel(9, 3, M.COLORS['w'])
  img:drawPixel(7, 2, M.COLORS['y'])
  img:drawPixel(8, 2, M.COLORS['y'])
  -- chân nồi
  img:drawPixel(4, 14, M.COLORS['o'])
  img:drawPixel(11, 14, M.COLORS['o'])
end

local function core_lone_king(img) -- K10 Vua Đơn Côi
  -- vương miện 3 ĐỈNH NHỌN (giữa cao nhất) + ngọc r đỉnh giữa + đế m
  -- (bất ổn: ngọc đỏ thắp sáng trong chiều rộng trống)
  -- 3 đỉnh nhọn: trái/giữa/phải, giữa cao
  M.line(img, 4, 9, 4, 5, 'm')
  img:drawPixel(3, 9, M.COLORS['M'])
  M.line(img, 8, 9, 8, 3, 'm')        -- đỉnh giữa cao nhất
  img:drawPixel(7, 9, M.COLORS['M'])
  M.line(img, 11, 9, 11, 5, 'm')
  img:drawPixel(12, 9, M.COLORS['M'])
  -- thân miện nối 3 đỉnh
  M.rect(img, 4, 9, 8, 3, 'm')
  M.rect(img, 4, 9, 8, 1, 'M')
  -- ngọc đỏ 2px trên đỉnh giữa (điểm sáng duy nhất)
  img:drawPixel(8, 2, M.COLORS['r'])
  img:drawPixel(7, 3, M.COLORS['r'])
  -- đế trắng nổi
  M.rect(img, 3, 12, 10, 2, 'm')
  M.rect(img, 3, 12, 10, 1, 'M')
  -- chấm e trống trải 2 bên đế
  img:drawPixel(1, 13, M.COLORS['e'])
  img:drawPixel(14, 13, M.COLORS['e'])
end

local function core_cosmic_key(img) -- K11 Chìa Khóa Vũ Trụ
  -- đầu chìa xoáy c + thân m + răng; sao nhỏ xung quanh (bất ổn: đang xoay)
  M.disc(img, 5, 5, 3, 'c')
  M.disc(img, 5, 5, 1, 'e')         -- lỗ xoáy tối
  M.line(img, 6, 8, 11, 13, 'm')    -- thân chéo
  M.line(img, 7, 8, 12, 13, 'M')
  M.rect(img, 11, 11, 2, 2, 'M')    -- răng 1
  M.rect(img, 13, 9, 2, 2, 'M')     -- răng 2
  -- sao quanh
  img:drawPixel(13, 2, M.COLORS['W'])
  img:drawPixel(1, 11, M.COLORS['W'])
  img:drawPixel(10, 1, M.COLORS['c'])
end

local function core_treasure_map(img) -- K12 Kho Báu Bản Đồ
  -- bản đồ d + đường kẻ e + X r lớn + mảnh bản đồ rách góc (bất ổn: X bằng máu)
  M.rect(img, 2, 3, 12, 10, 'o')
  M.rect(img, 3, 4, 10, 8, 'd')     -- da thuộc
  M.rect(img, 3, 4, 10, 1, 'D')     -- sáng mép trên
  -- đường kẻ đứt dẫn đến X
  M.line(img, 4, 6, 6, 6, 'e')
  M.line(img, 7, 7, 9, 9, 'e')
  -- X đỏ to
  M.line(img, 10, 6, 13, 9, 'r')
  M.line(img, 13, 6, 10, 9, 'r')
  img:drawPixel(11, 7, M.COLORS['R'])
  img:drawPixel(12, 8, M.COLORS['R'])
  -- góc rách: khuyết pixel góc dưới-phải
  img:drawPixel(12, 12, M.COLORS['e'])
  img:drawPixel(13, 11, M.COLORS['e'])
  -- kim la bàn nhỏ
  img:drawPixel(5, 11, M.COLORS['m'])
  img:drawPixel(6, 12, M.COLORS['m'])
end

-- ============ S — 8 skill ============
-- Mỗi skill 1 hành động rõ + outline.

local function skill_shield_wall(img) -- S01 Khiên Thành Chủ
  -- thành lũy: tường gạch d + chân thành m + khiên vĩm m nổi trên
  M.rect(img, 2, 6, 12, 6, 'o')
  M.rect(img, 3, 7, 10, 4, 'd')     -- tường đá
  M.rect(img, 3, 7, 10, 1, 'D')
  -- mấu tường
  img:drawPixel(4, 8, M.COLORS['b'])
  img:drawPixel(7, 9, M.COLORS['b'])
  img:drawPixel(10, 8, M.COLORS['b'])
  -- khiên nổi trên tường
  M.rect(img, 6, 2, 4, 4, 'm')
  M.rect(img, 7, 3, 2, 2, 'M')
  M.rect(img, 2, 12, 12, 2, 'm')    -- nền móng
  M.rect(img, 2, 12, 12, 1, 'M')
end

local function skill_charge(img) -- S02 Xung Phong Trận
  -- quân cờ m lao phải + vệt tốc độ w sau + bụi y dưới
  M.disc(img, 10, 8, 3, 'm')         -- thân quân
  M.disc(img, 10, 8, 1, 'M')
  M.line(img, 10, 4, 10, 5, 'm')     -- đầu nhọn
  img:drawPixel(10, 3, M.COLORS['M'])
  -- vệt tốc độ 3 gạch
  M.line(img, 2, 6, 5, 6, 'w')
  M.line(img, 1, 8, 6, 8, 'w')
  M.line(img, 2, 10, 5, 10, 'w')
  -- bụi
  img:drawPixel(3, 12, M.COLORS['y'])
  img:drawPixel(6, 13, M.COLORS['y'])
end

local function skill_bind(img) -- S03 Trói Trận
  -- xiềng xích m: 3 vòng liên kết chéo + khóa W ở cuối
  M.disc(img, 3, 4, 2, 'm')
  M.disc(img, 6, 6, 2, 'm')
  M.disc(img, 9, 8, 2, 'm')
  M.disc(img, 12, 10, 2, 'm')
  -- lỗ vòng tối
  img:drawPixel(3, 4, M.COLORS['e'])
  img:drawPixel(6, 6, M.COLORS['e'])
  img:drawPixel(9, 8, M.COLORS['e'])
  img:drawPixel(12, 10, M.COLORS['e'])
  -- khoá
  M.rect(img, 12, 12, 2, 2, 'W')
  M.rect(img, 12, 12, 2, 1, 'M')
  -- tia trói c nhỏ
  img:drawPixel(5, 2, M.COLORS['c'])
  img:drawPixel(8, 3, M.COLORS['c'])
end

local function skill_awaken(img) -- S04 Giác Ngộ
  -- vòng sáng W quanh đầu + hoa sen f dưới (tam hợp)
  M.disc(img, 8, 5, 3, 'w')
  M.ring(img, 8, 5, 4, 'W')
  -- 3 tia tam hợp tỏa
  img:drawPixel(8, 0, M.COLORS['W'])
  img:drawPixel(2, 10, M.COLORS['W'])
  img:drawPixel(14, 10, M.COLORS['W'])
  -- sen dưới
  M.rect(img, 6, 11, 4, 2, 'f')
  M.rect(img, 7, 10, 2, 1, 'F')
  M.rect(img, 5, 13, 6, 1, 't')
  -- chấm c ánh trong sen
  img:drawPixel(8, 12, M.COLORS['c'])
end

local function skill_foot_shot(img) -- S05 Bắn Chân
  -- chân trói: bàn chân s + mũi tên M ghim ngang + dây trói c
  M.rect(img, 5, 3, 6, 6, 's')       -- bàn chân
  M.rect(img, 5, 3, 6, 1, 'S')
  M.rect(img, 6, 9, 4, 3, 's')       -- gót
  M.rect(img, 6, 12, 4, 1, 'S')
  -- mũi tên ghim ngang qua chân
  M.line(img, 1, 6, 14, 6, 'M')
  img:drawPixel(0, 5, M.COLORS['M']); img:drawPixel(0, 7, M.COLORS['M'])
  img:drawPixel(14, 5, M.COLORS['M']); img:drawPixel(14, 7, M.COLORS['M'])
  img:drawPixel(15, 6, M.COLORS['W'])
  -- dây trói quanh
  M.line(img, 5, 4, 4, 3, 'c')
  M.line(img, 11, 4, 12, 3, 'c')
end

local function skill_triple(img) -- S06 Tam Liên Kích
  -- 3 mũi tên M tỏa từ 1 cung gốc trỏ ra 3 hướng (không rời rạc)
  M.disc(img, 4, 12, 2, 'b')         -- gốc chung (cây cung nhỏ)
  M.line(img, 5, 11, 12, 4, 'M')     -- mũi 1 chéo lên phải
  img:drawPixel(13, 3, M.COLORS['W']); img:drawPixel(13, 4, M.COLORS['W']); img:drawPixel(12, 3, M.COLORS['W'])
  M.line(img, 6, 12, 13, 9, 'M')     -- mũi 2 ngang phải
  img:drawPixel(14, 9, M.COLORS['W']); img:drawPixel(14, 8, M.COLORS['W']); img:drawPixel(14, 10, M.COLORS['W'])
  M.line(img, 5, 13, 10, 13, 'M')    -- mũi 3 xuống
  img:drawPixel(11, 13, M.COLORS['W']); img:drawPixel(12, 12, M.COLORS['W']); img:drawPixel(12, 14, M.COLORS['W'])
end

local function skill_shadow(img) -- S07 Bóng Đêm
  -- bóng người e dạng giọt + 2 mắt c sáng + vành khói w
  M.disc(img, 8, 7, 4, 'e')
  M.rect(img, 5, 7, 6, 6, 'e')
  M.rect(img, 6, 13, 4, 1, 'e')
  img:drawPixel(8, 2, M.COLORS['e']) -- đỉnh đầu giọt
  img:drawPixel(7, 3, M.COLORS['e'])
  img:drawPixel(9, 3, M.COLORS['e'])
  -- mắt cyan 2px
  img:drawPixel(6, 7, M.COLORS['c']); img:drawPixel(7, 7, M.COLORS['c'])
  img:drawPixel(9, 7, M.COLORS['c']); img:drawPixel(10, 7, M.COLORS['c'])
  -- vành khói mờ dưới
  img:drawPixel(3, 14, M.COLORS['w'])
  img:drawPixel(13, 14, M.COLORS['w'])
  img:drawPixel(8, 15, M.COLORS['w'])
end

local function skill_loot(img) -- S08 Vơ Đồ
  -- bao đồ d phồng + dây rút m + 2 món lộ ra (kiếm M + bình R)
  M.disc(img, 7, 10, 5, 'd')         -- thân bao
  M.rect(img, 4, 10, 7, 4, 'd')
  M.rect(img, 3, 7, 8, 3, 'd')       -- miệng bao xoắn
  M.line(img, 3, 7, 11, 7, 'm')      -- dây rút
  img:drawPixel(2, 6, M.COLORS['m'])
  img:drawPixel(12, 6, M.COLORS['m'])
  -- món lộ: kiếm nhỏ + bình đỏ
  M.line(img, 11, 3, 13, 5, 'M')
  img:drawPixel(14, 6, M.COLORS['m'])
  M.rect(img, 11, 1, 2, 2, 'r')
  img:drawPixel(12, 0, M.COLORS['R'])
end

-- ============ I — 4 item ============
local function item_sword(img) -- I01 Kiếm
  -- kiếm dọc: lưỡi M sáng mép W + cán b + guard m — silhouette rõ
  img:drawPixel(8, 1, M.COLORS['W'])
  M.line(img, 8, 2, 8, 9, 'M')
  img:drawPixel(7, 3, M.COLORS['m']); img:drawPixel(7, 5, M.COLORS['m'])
  img:drawPixel(7, 7, M.COLORS['m']); img:drawPixel(9, 4, M.COLORS['W'])
  M.rect(img, 6, 10, 4, 1, 'm')      -- guard ngang
  M.line(img, 8, 11, 8, 13, 'b')     -- cán gỗ
  M.rect(img, 7, 14, 2, 1, 'm')      -- pommel
end

local function item_shield(img) -- I02 Khiên
  -- khiên heater: m viền M highlight + boss W tâm
  M.rect(img, 4, 3, 8, 2, 'o')
  M.rect(img, 3, 5, 10, 5, 'o')
  M.rect(img, 5, 10, 6, 2, 'o')
  M.rect(img, 7, 12, 2, 1, 'o')
  M.rect(img, 5, 4, 6, 1, 'M')
  M.rect(img, 4, 6, 8, 3, 'm')
  M.rect(img, 5, 10, 6, 1, 'm')
  M.rect(img, 7, 11, 2, 1, 'm')
  M.disc(img, 8, 8, 1, 'W')
  img:drawPixel(4, 6, M.COLORS['M'])
end

local function item_potion(img) -- I03 Dược Huyết
  -- bình tròn r + cổ m + bong bóng W + highlight
  M.disc(img, 8, 10, 5, 'o')
  M.disc(img, 8, 10, 4, 'r')         -- máu
  M.rect(img, 7, 3, 2, 1, 'm')       -- nắp
  M.rect(img, 7, 4, 2, 3, 'w')       -- cổ thủy tinh
  img:drawPixel(6, 8, M.COLORS['R'])
  img:drawPixel(9, 9, M.COLORS['R'])
  img:drawPixel(7, 10, M.COLORS['W']) -- bong bóng sáng
  img:drawPixel(10, 11, M.COLORS['r'])
  -- highlight cổ trái
  img:drawPixel(6, 5, M.COLORS['W'])
end

local function item_gem(img) -- I04 Ngọc May Mắn
  -- ngọc 4 lá: 4 cánh c/C quanh lõi W + outline o
  M.rect(img, 7, 3, 2, 2, 'c')       -- cánh trên
  M.rect(img, 7, 11, 2, 2, 'c')      -- cánh dưới
  M.rect(img, 3, 7, 2, 2, 'c')       -- cánh trái
  M.rect(img, 11, 7, 2, 2, 'c')      -- cánh phải
  M.rect(img, 7, 7, 2, 2, 'C')       -- lõi sáng — dùng 'C'? không có C
  -- lõi W
  M.rect(img, 7, 7, 2, 2, 'W')
  -- thân nối
  img:drawPixel(8, 6, M.COLORS['c'])
  img:drawPixel(7, 10, M.COLORS['c'])
  img:drawPixel(6, 8, M.COLORS['c'])
  img:drawPixel(10, 8, M.COLORS['c'])
  -- highlight cánh trên
  img:drawPixel(7, 3, M.COLORS['k'])
  img:drawPixel(8, 3, M.COLORS['k'])
end

-- ============ Bảng sinh ============
local PHE_BRIGHT = { r = 'R', f = 'F', l = 'L', u = 'U' }
local SPECS = {
  { id = 'C01', fn = function(img) icon_shield_tribe(img, 'r', 'R') end },
  { id = 'C02', fn = icon_leaf_halo },
  { id = 'C03', fn = icon_horns },
  { id = 'C04', fn = icon_scales },
  { id = 'C05', fn = icon_res2 },
  { id = 'C06', fn = icon_res4 },
  { id = 'C07', fn = icon_tan2 },
  { id = 'C08', fn = icon_tan1 },
  { id = 'K01', fn = core_blood_pact },
  { id = 'K02', fn = core_rust_armor },
  { id = 'K03', fn = core_punish_light },
  { id = 'K04', fn = core_night_torch },
  { id = 'K05', fn = core_blood_debt },
  { id = 'K06', fn = core_death_mirror },
  { id = 'K07', fn = core_seer_eye },
  { id = 'K08', fn = core_reverse_flow },
  { id = 'K09', fn = core_pig_pot },
  { id = 'K10', fn = core_lone_king },
  { id = 'K11', fn = core_cosmic_key },
  { id = 'K12', fn = core_treasure_map },
  { id = 'S01', fn = skill_shield_wall },
  { id = 'S02', fn = skill_charge },
  { id = 'S03', fn = skill_bind },
  { id = 'S04', fn = skill_awaken },
  { id = 'S05', fn = skill_foot_shot },
  { id = 'S06', fn = skill_triple },
  { id = 'S07', fn = skill_shadow },
  { id = 'S08', fn = skill_loot },
  { id = 'I01', fn = item_sword },
  { id = 'I02', fn = item_shield },
  { id = 'I03', fn = item_potion },
  { id = 'I04', fn = item_gem },
}

local function ensure_dir(path)
  os.execute('mkdir "' .. path:gsub('/', '\\') .. '" 2>NUL')
end
ensure_dir(OUT .. '/ase')
ensure_dir(OUT .. '/png')
ensure_dir(OUT .. '/png/_strips')

local count = 0
for _, spec in ipairs(SPECS) do
  local spr = M.new_spr(16, 16, 1, spec.id)
  local img = Image(spr.spec)
  spec.fn(img)
  local cel = spr.layers[1]:cel(spr.frames[1])
  if cel == nil then
    spr:newCel(spr.layers[1], spr.frames[1], img, Point(0, 0))
  else
    cel.image = img
  end
  local bad = M.validate(spr)
  print(spec.id .. ' validate=' .. bad)
  M.export(spr, spec.id, OUT .. '/ase', OUT .. '/png', OUT .. '/png/_strips')
  spr:close()
  count = count + 1
end
print('ICONS_DONE ' .. count)
