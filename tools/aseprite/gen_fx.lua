-- gen_fx.lua — v2: F01–F10, FX 24×24, 2–3 frame
-- Redesign v2 (ASSET_V2.md). Fixes audit v1:
--   * MỌI FX theo arc 3 nhịp: bắt (nhỏ/đậm) → đỉnh (to/sáng) → tàn (rã/thưa).
--   * Palette LIÊN TỤC trong từng FX: giữ nguyên hệ màu xuyên suốt các frame
--     (v1 sai ở F01 đổi màu giữa chừng, F03 nhảy cyan, F06 nâu→trắng).
--   * Bóng đổ e dưới hiệu ứng (ground anchor) cho FX có nguồn đất.
--   * Frame đỉnh luôn có W core để không chìm trên nền tối.
-- GDD §2.4: toàn bộ chuỗi giao tranh ≤ 10s → mỗi FX 2–3 frame, ngắn.

local M = dofile('tools/aseprite/art/lib.lua')
local OUT = app.params['outdir'] or 'assets/v2'

-- ============ F01 Bước di (2 frame) — bụi chân + vệt lướt ============
-- Palette: y bụi sáng + w hạt bay. Ghost hai vệt theo chiều ngang.
local function fx_move1(img)
  -- bước đặt chân: bụi hơi bốc 2 cụm
  M.disc(img, 7, 14, 2, 'y')
  img:drawPixel(9, 12, M.COLORS['w'])
  img:drawPixel(7, 13, M.COLORS['W'])   -- hạt sáng đỉnh bụi
  M.disc(img, 16, 15, 2, 'y')
  img:drawPixel(14, 13, M.COLORS['w'])
  img:drawPixel(16, 14, M.COLORS['W'])  -- hạt sáng đỉnh bụi 2
  M.line(img, 4, 16, 10, 16, 'e')     -- vệt bóng đất
  M.line(img, 14, 16, 19, 16, 'e')
end
local function fx_move2(img)
  -- bước kế: bụi lùi sau, hạt cao hơn
  M.disc(img, 6, 15, 2, 'y')
  img:drawPixel(8, 11, M.COLORS['w'])
  img:drawPixel(6, 14, M.COLORS['W'])   -- hạt sáng đỉnh bụi
  M.disc(img, 17, 14, 2, 'y')
  img:drawPixel(15, 12, M.COLORS['w'])
  img:drawPixel(17, 13, M.COLORS['W'])  -- hạt sáng đỉnh bụi 2
  img:drawPixel(12, 9, M.COLORS['w'])
  M.line(img, 3, 16, 9, 16, 'e')
  M.line(img, 15, 16, 20, 16, 'e')
end
local function fx_battle1(img)
  -- bắt: khối nhỏ đặc
  M.disc(img, 12, 12, 4, 'l')
  M.disc(img, 12, 12, 2, 'L')
  img:drawPixel(12, 12, M.COLORS['W'])
  M.ring(img, 12, 12, 6, 'r')
end
local function fx_battle2(img)
  -- đỉnh→tàn: sao 8 tia nở, core W giữ, tia L thưa dần
  M.disc(img, 12, 12, 2, 'W')
  for i = 0, 7 do
    local a = i * math.pi / 4
    local dx, dy = math.cos(a), math.sin(a)
    M.line(img, math.floor(12 + 2 * dx), math.floor(12 + 2 * dy),
               math.floor(12 + 7 * dx), math.floor(12 + 7 * dy), 'L')
    img:drawPixel(math.floor(12 + 8 * dx), math.floor(12 + 8 * dy), M.COLORS['l'])
  end
  -- góc chéo thêm chấm l rời (mảnh văng)
  img:drawPixel(3, 3, M.COLORS['l'])
  img:drawPixel(20, 3, M.COLORS['l'])
  img:drawPixel(3, 20, M.COLORS['l'])
  img:drawPixel(20, 20, M.COLORS['l'])
end

-- ============ F03 Crit (3 frame) — chém chéo trắng + vỡ ============
-- Palette liên tục: W core + w tia + L văng. KHÔNG nhảy cyan.
local function fx_crit1(img)
  -- bắt: vệt chém chéo hẹp
  M.line(img, 5, 5, 17, 17, 'W')
  M.line(img, 5, 6, 16, 17, 'w')
  img:drawPixel(4, 4, M.COLORS['w'])
  img:drawPixel(18, 18, M.COLORS['w'])
end
local function fx_crit2(img)
  -- đỉnh: chém rộng + tia điện dọc 2 bên + mảnh vỡ L
  M.line(img, 3, 3, 19, 19, 'W')
  M.line(img, 3, 4, 18, 19, 'W')
  M.line(img, 4, 3, 19, 18, 'w')
  M.line(img, 7, 4, 6, 8, 'w')       -- tia điện trái
  M.line(img, 17, 15, 18, 19, 'w')   -- tia điện phải
  img:drawPixel(2, 2, M.COLORS['L'])
  img:drawPixel(21, 21, M.COLORS['L'])
  img:drawPixel(20, 3, M.COLORS['L'])
  img:drawPixel(3, 20, M.COLORS['L'])
end
local function fx_crit3(img)
  -- tàn: vệt mờ rã + mảnh vỡ rơi
  M.line(img, 6, 6, 16, 16, 'w')
  img:drawPixel(4, 4, M.COLORS['w'])
  img:drawPixel(18, 18, M.COLORS['w'])
  img:drawPixel(19, 4, M.COLORS['L'])
  img:drawPixel(4, 19, M.COLORS['L'])
  img:drawPixel(14, 19, M.COLORS['L'])
  img:drawPixel(9, 20, M.COLORS['L'])
  M.line(img, 6, 21, 9, 21, 'e')     -- bóng nhạt
end

-- ============ F04 Hào quang thắng/thua (2 frame) ============
-- Vòng W→w→c thắt dần vào tâm (implosion → burst).
local function fx_aura1(img)
  -- bắt: 2 vòng rộng
  M.ring(img, 12, 12, 9, 'w')
  M.ring(img, 12, 12, 7, 'W')
  img:drawPixel(12, 12, M.COLORS['c'])
end
local function fx_aura2(img)
  -- đỉnh: vòng trong sáng bùng + 4 tia chéo
  M.ring(img, 12, 12, 6, 'w')
  M.ring(img, 12, 12, 4, 'W')
  M.disc(img, 12, 12, 1, 'W')       -- flash trắng tâm ở đỉnh
  M.line(img, 12, 4, 12, 1, 'W')
  M.line(img, 12, 20, 12, 23, 'W')
  M.line(img, 4, 12, 1, 12, 'W')
  M.line(img, 20, 12, 23, 12, 'W')
  img:drawPixel(5, 5, M.COLORS['c'])
  img:drawPixel(19, 5, M.COLORS['c'])
  img:drawPixel(5, 19, M.COLORS['c'])
  img:drawPixel(19, 19, M.COLORS['c'])
end

-- ============ F05 Về chuồng (2 frame) ============
-- Quân tụt xuống hố: khối e rơi + tia r trailing + mép hố o.
local function fx_home1(img)
  -- bắt: quân trên mép, hố mở có VÒNG SÁNG w mép + khối quân M nổi
  M.disc(img, 12, 16, 5, 'e')
  M.ring(img, 12, 16, 6, 'w')         -- vòng sáng mép hố (thay o tối)
  M.ring(img, 12, 16, 7, 'o')        -- viền ngoài tối tách nền
  M.rect(img, 10, 8, 4, 4, 'm')      -- khối quân thép
  M.rect(img, 10, 8, 4, 1, 'M')      -- highlight trên quân
  M.line(img, 12, 12, 12, 14, 'w')   -- tia rơi bắt đầu
  img:drawPixel(12, 15, M.COLORS['W']) -- chấm sáng chạm đáy
end
local function fx_home2(img)
  -- tàn: quân chìm nửa, tia rơi W dài + vòng sóng mép nở
  M.disc(img, 12, 17, 5, 'e')
  M.ring(img, 12, 17, 6, 'w')
  M.ring(img, 12, 17, 7, 'o')
  M.line(img, 12, 6, 12, 13, 'w')
  img:drawPixel(11, 8, M.COLORS['W'])
  img:drawPixel(13, 10, M.COLORS['W'])
  M.rect(img, 10, 13, 4, 2, 'M')     -- đỉnh quân chìm (SÁNG)
  img:drawPixel(9, 15, M.COLORS['w'])
  img:drawPixel(15, 15, M.COLORS['w'])
  -- sóng lan 2 bên mép hố
  img:drawPixel(4, 17, M.COLORS['w'])
  img:drawPixel(19, 17, M.COLORS['w'])
end

-- ============ F06 Xạ Kích (3 frame) — mũi tên bay chéo ============
-- Palette liên tục: b gỗ thân + M đầu + W sáng đầu. Tia speed w.
local function fx_arrow1(img)
  -- bắt: tên khởi động từ góc trên-trái, cung thành vệt
  M.line(img, 3, 3, 5, 5, 'b')
  M.line(img, 5, 5, 12, 12, 'M')     -- thân tên
  img:drawPixel(12, 12, M.COLORS['W']) -- đầu sáng
  M.line(img, 4, 4, 3, 5, 'b')       -- lông đuôi
  M.line(img, 5, 3, 6, 4, 'b')
  M.line(img, 2, 2, 4, 4, 'w')       -- tia speed
end
local function fx_arrow2(img)
  -- giữa: tên giữa không trung, vệt dài sau đuôi
  M.line(img, 2, 2, 12, 12, 'w')    -- vệt dài
  M.line(img, 8, 8, 15, 15, 'b')    -- thân
  M.line(img, 15, 15, 17, 17, 'M')
  img:drawPixel(17, 17, M.COLORS['W'])
  M.line(img, 8, 8, 6, 10, 'b')     -- lông đuôi chéo
  img:drawPixel(5, 11, M.COLORS['b'])
end
local function fx_arrow3(img)
  -- đỉnh chạm: tia va chạm nở tại đích, tên cắm
  M.line(img, 6, 6, 15, 15, 'w')
  M.line(img, 15, 15, 17, 17, 'b')
  M.line(img, 17, 17, 19, 19, 'M')
  img:drawPixel(19, 19, M.COLORS['W'])
  -- nổ va chạm nhỏ tại đích
  M.disc(img, 19, 19, 2, 'w')
  M.line(img, 19, 16, 19, 14, 'L')
  M.line(img, 16, 19, 14, 19, 'L')
  M.line(img, 21, 21, 22, 22, 'L')
end

-- ============ F07 Về đích phong thần (2 frame) ============
-- Cột sáng c/W bốc lên + đế đền + ngôi sao rơi xuống đỉnh.
local function fx_win_goal1(img)
  -- bắt: cột sáng bắt đầu bốc
  M.rect(img, 10, 10, 4, 6, 'c')
  M.rect(img, 11, 8, 2, 8, 'w')
  M.line(img, 6, 17, 18, 17, 'm')    -- bệ đền
  M.line(img, 8, 16, 16, 16, 'M')
  img:drawPixel(12, 6, M.COLORS['W'])
end
local function fx_win_goal2(img)
  -- đỉnh: cột sáng đầy + tia toả + ngôi sao đỉnh
  M.rect(img, 9, 6, 6, 10, 'c')
  M.rect(img, 10, 4, 4, 12, 'w')
  M.line(img, 6, 17, 18, 17, 'm')
  M.line(img, 8, 16, 16, 16, 'M')
  -- ngôi sao đỉnh W 4 cánh
  img:drawPixel(12, 2, M.COLORS['W'])
  img:drawPixel(11, 3, M.COLORS['W']); img:drawPixel(13, 3, M.COLORS['W'])
  img:drawPixel(12, 4, M.COLORS['W'])
  -- tia toả ngang
  M.line(img, 4, 12, 7, 12, 'w')
  M.line(img, 17, 12, 20, 12, 'w')
  M.line(img, 3, 6, 6, 9, 'w')
  M.line(img, 21, 6, 18, 9, 'w')
end

-- ============ F08 Hồi máu (2 frame) ============
-- Tim R/r + vòng sáng W bay lên (liên tục palette đỏ-trắng).
local function fx_heal1(img)
  -- bắt: tim nhỏ + 2 chấm sáng
  M.rect(img, 9, 12, 2, 2, 'R'); M.rect(img, 13, 12, 2, 2, 'R')
  M.rect(img, 8, 14, 8, 3, 'R')
  M.rect(img, 10, 17, 4, 2, 'r')
  M.rect(img, 11, 19, 2, 1, 'r')
  img:drawPixel(9, 13, M.COLORS['W'])
  img:drawPixel(12, 14, M.COLORS['r'])
end
local function fx_heal2(img)
  -- đỉnh: tim sáng hơn + 3 hạt W bay vòng
  M.rect(img, 9, 11, 2, 2, 'R'); M.rect(img, 13, 11, 2, 2, 'R')
  M.rect(img, 8, 13, 8, 3, 'R')
  M.rect(img, 10, 16, 4, 2, 'R')
  M.rect(img, 11, 18, 2, 1, 'r')
  img:drawPixel(9, 12, M.COLORS['W'])
  img:drawPixel(12, 14, M.COLORS['W'])
  -- hạt sáng bay vòng quanh tim
  M.ring(img, 12, 14, 7, 'w')
  img:drawPixel(12, 7, M.COLORS['W'])
  img:drawPixel(12, 21, M.COLORS['W'])
  img:drawPixel(5, 14, M.COLORS['W'])
  img:drawPixel(19, 14, M.COLORS['W'])
end

-- ============ F09 Bẫy kích hoạt (2 frame) ============
-- Hàm bẫy đóng snap: răng W khít trên nền e, tia l văng khi kẹp.
local function fx_trap1(img)
  -- bắt: hàm đang mở (răng 2 hàng trên dưới)
  M.disc(img, 12, 13, 6, 'e')
  M.ring(img, 12, 13, 7, 'o')
  M.line(img, 6, 8, 18, 8, 'W')      -- hàng răng trên
  img:drawPixel(7, 7, M.COLORS['W']); img:drawPixel(12, 7, M.COLORS['W'])
  img:drawPixel(17, 7, M.COLORS['W'])
  M.line(img, 6, 18, 18, 18, 'W')    -- hàng răng dưới
  img:drawPixel(7, 19, M.COLORS['W']); img:drawPixel(12, 19, M.COLORS['W'])
  img:drawPixel(17, 19, M.COLORS['W'])
end
local function fx_trap2(img)
  -- đỉnh: hàm SNAP khít — răng khớp giữa + tia lấn l văng 2 bên
  M.disc(img, 12, 13, 6, 'e')
  M.ring(img, 12, 13, 7, 'o')
  M.line(img, 6, 12, 18, 12, 'W')    -- răng khít ngang giữa
  img:drawPixel(7, 11, M.COLORS['W']); img:drawPixel(12, 11, M.COLORS['W'])
  img:drawPixel(17, 11, M.COLORS['W'])
  M.line(img, 6, 14, 18, 14, 'W')
  img:drawPixel(7, 15, M.COLORS['W']); img:drawPixel(12, 15, M.COLORS['W'])
  img:drawPixel(17, 15, M.COLORS['W'])
  -- tia văng
  M.line(img, 2, 10, 4, 8, 'l')
  M.line(img, 22, 10, 20, 8, 'l')
  M.line(img, 2, 16, 4, 18, 'l')
  M.line(img, 22, 16, 20, 18, 'l')
  img:drawPixel(1, 7, M.COLORS['L'])
  img:drawPixel(23, 7, M.COLORS['L'])
end

-- ============ F10 Đền sáng (2 frame) ============
-- Đền m + lửa R nhảy + vòng sáng c lan từ đỉnh.
local function fx_temple1(img)
  -- bắt: đền + lửa nhỏ + vòng sáng bắt đầu
  M.rect(img, 7, 10, 10, 7, 'm')      -- thân đền
  M.rect(img, 7, 10, 10, 1, 'M')     -- nóc
  M.rect(img, 5, 8, 14, 2, 'm')      -- mái rộng
  M.rect(img, 5, 8, 14, 1, 'M')
  M.rect(img, 11, 12, 2, 3, 'R')     -- lửa nhỏ
  img:drawPixel(12, 11, M.COLORS['r'])
  M.ring(img, 12, 10, 4, 'c')        -- vòng sáng inner
end
local function fx_temple2(img)
  -- đỉnh: lửa cao 3 tông + vòng sáng lan + tia c
  M.rect(img, 7, 10, 10, 7, 'm')
  M.rect(img, 7, 10, 10, 1, 'M')
  M.rect(img, 5, 8, 14, 2, 'm')
  M.rect(img, 5, 8, 14, 1, 'M')
  -- lửa 3 tông: r gốc, R thân, W lõi
  M.rect(img, 10, 13, 4, 3, 'R')
  M.rect(img, 11, 11, 2, 3, 'R')
  img:drawPixel(11, 12, M.COLORS['W'])
  img:drawPixel(12, 12, M.COLORS['W'])
  img:drawPixel(11, 11, M.COLORS['W']) -- flash lõi đỉnh
  -- vòng sáng lan
  M.ring(img, 12, 10, 6, 'c')
  M.ring(img, 12, 10, 8, 'w')
  -- tia c từ đỉnh
  M.line(img, 12, 2, 12, 4, 'c')
  M.line(img, 4, 4, 6, 6, 'c')
  M.line(img, 20, 4, 18, 6, 'c')
  -- bóng dưới
  M.line(img, 6, 18, 18, 18, 'e')
end

-- ============ Sinh ============
local SPECS = {
  { id = 'F01', frames = { fx_move1, fx_move2 } },
  { id = 'F02', frames = { fx_battle1, fx_battle2 } },
  { id = 'F03', frames = { fx_crit1, fx_crit2, fx_crit3 } },
  { id = 'F04', frames = { fx_aura1, fx_aura2 } },
  { id = 'F05', frames = { fx_home1, fx_home2 } },
  { id = 'F06', frames = { fx_arrow1, fx_arrow2, fx_arrow3 } },
  { id = 'F07', frames = { fx_win_goal1, fx_win_goal2 } },
  { id = 'F08', frames = { fx_heal1, fx_heal2 } },
  { id = 'F09', frames = { fx_trap1, fx_trap2 } },
  { id = 'F10', frames = { fx_temple1, fx_temple2 } },
}

local function ensure_dir(path)
  os.execute('mkdir "' .. path:gsub('/', '\\') .. '" 2>NUL')
end
ensure_dir(OUT .. '/ase')
ensure_dir(OUT .. '/png')
ensure_dir(OUT .. '/png/_strips')

local count = 0
for _, spec in ipairs(SPECS) do
  local nf = #spec.frames
  local spr = M.new_spr(24, 24, nf, spec.id)
  for fi = 1, nf do
    local img = Image(spr.spec)
    spec.frames[fi](img)
    local cel = spr.layers[1]:cel(spr.frames[fi])
    if cel == nil then
      spr:newCel(spr.layers[1], spr.frames[fi], img, Point(0, 0))
    else
      cel.image = img
    end
  end
  local bad = M.validate(spr)
  print(spec.id .. ' validate=' .. bad)
  M.export(spr, spec.id, OUT .. '/ase', OUT .. '/png', OUT .. '/png/_strips')
  spr:close()
  count = count + 1
end
print('FX_DONE ' .. count)
