-- gen_tiles.lua — v2: B01–B07 (tiles bàn cờ & vùng đất)
-- Redesign v2 (ASSET_V2.md). Fixes audit v1: speckle đơn điểm → macro shape;
-- thêm directional light (sáng góc trên-trái, tối dưới-phải) + viền khe tối.
--   * Mỗi vùng 1 hệ 4 tông: base / dark / light / accent, clamped trong palette.
--   * Biến thể frame 2 = macro feature lớn (bụi cây / đụn cát / dải sương / mảng băng nứt).
--   * B05: overlay symbol-first, outline o quanh symbol, đọc trên 4 nền.
--   * B07: chuồng 4 slot có viền phe + nền lõm, khoảng sáng trên-trái mỗi slot.
-- Seed PRNG cố định 7331 → reproducible.

local M = dofile('tools/aseprite/art/lib.lua')
local OUT = app.params['outdir'] or 'assets/v2'
M.rand_seed(7331)

local W = 24

-- ============ Nền vùng: ramp sáng-tối có hướng ============
-- Phủ base; góc trên-trái (8×8) pha light, dải dưới-phải pha dark.
-- Phủ base; band sáng cố định 2px dọc cạnh trên + trái, band tối 2px cạnh
-- dưới + phải (trước grout), giữa pha ngẫu nhiên xác suất theo hướng d.
local function base_field(img, base, dark, light)
  M.rect(img, 0, 0, W, W, base)
  -- band sáng cố định: cạnh trên 1px + cạnh trái 1px (đ light rõ ràng)
  M.rect(img, 0, 0, W, 1, light)
  M.rect(img, 0, 0, 1, W, light)
  for y = 1, W - 2 do
    for x = 1, W - 2 do
      local d = (x + y) / (2 * (W - 1))   -- 0 góc trên-trái → 1 dưới-phải
      if d < 0.35 and M.rand() < (0.35 - d) * 2.6 then
        img:drawPixel(x, y, M.COLORS[light])
      end
      if d > 0.62 and M.rand() < (d - 0.62) * 2.4 then
        img:drawPixel(x, y, M.COLORS[dark])
      end
    end
  end
  -- band tối cố định: cạnh dưới 2px + phải 2px (trừ hàng/cột grout cuối)
  M.rect(img, 0, W - 3, W, 2, dark)
  M.rect(img, W - 3, 0, 2, W, dark)
end

-- Viền khe: 1px dark ở cạnh dưới + phải (đ separation khi ghép bàn).
local function grout(img, dark)
  M.rect(img, 0, W - 1, W, 1, dark)
  M.rect(img, W - 1, 0, 1, W, dark)
end

-- ============ B01 Rừng (Bắc) — g G t n ============
local function tile_forest(img, variant)
  base_field(img, 'G', 'g', 't')
  if variant == 2 then
    -- bụi cây macro 2 tầng: tán g + chồi n + gốc o
    M.disc(img, 7, 8, 4, 'g')
    M.disc(img, 7, 7, 2, 't')
    img:drawPixel(7, 12, M.COLORS['o'])
    M.disc(img, 17, 15, 3, 'g')
    img:drawPixel(16, 14, M.COLORS['t'])
    img:drawPixel(17, 18, M.COLORS['o'])
    img:drawPixel(15, 18, M.COLORS['n'])
    img:drawPixel(12, 5, M.COLORS['n'])
  else
    -- chồi non cụ thể 3 điểm, mỗi chồi 2-3px
    img:drawPixel(5, 6, M.COLORS['n']); img:drawPixel(6, 6, M.COLORS['t'])
    img:drawPixel(16, 9, M.COLORS['n']); img:drawPixel(17, 9, M.COLORS['t'])
    img:drawPixel(9, 17, M.COLORS['n']); img:drawPixel(10, 17, M.COLORS['t'])
  end
  grout(img, 'g')
end

-- ============ B02 Sa mạc (Đông) — d D b ============
local function tile_desert(img, variant)
  base_field(img, 'd', 'b', 'D')
  if variant == 2 then
    -- đụn cát sóng: cung cong D trên nền d, đá b rải
    for x = 2, 21 do
      local y1 = 6 + math.floor(2 * math.sin(x * 0.55))
      img:drawPixel(x, y1, M.COLORS['D'])
      img:drawPixel(x, y1 + 7, M.COLORS['D'])
      img:drawPixel(x, y1 + 13, M.COLORS['b'])
    end
    M.rect(img, 6, 6, 2, 1, 'b')
    M.rect(img, 16, 17, 3, 1, 'b')
  else
    -- vài hòn đá + xương khô
    M.rect(img, 5, 5, 3, 2, 'b')
    img:drawPixel(6, 4, M.COLORS['b'])
    M.rect(img, 15, 14, 2, 1, 'b')
    img:drawPixel(18, 18, M.COLORS['D'])
    img:drawPixel(19, 18, M.COLORS['D'])
  end
  grout(img, 'b')
end

-- ============ B03 Thung lũng sương (Nam) — v x y Y ============
local function tile_valley(img, variant)
  base_field(img, 'x', 'v', 'y')
  if variant == 2 then
    -- dải sương trắng nghiêng dài Y/y (sóng chéo)
    for i = 0, 13 do
      local x = 2 + i
      if x < 22 then
        img:drawPixel(x, 5 + math.floor(i * 0.6), M.COLORS['Y'])
        img:drawPixel(x, 6 + math.floor(i * 0.6), M.COLORS['y'])
      end
      local x2 = 8 + i
      if x2 < 23 then
        img:drawPixel(x2, 14 + math.floor(i * 0.4), M.COLORS['y'])
      end
    end
  else
    -- bụi cỏ sương 3 cụm, mỗi cụm 3px + đọng sương Y
    img:drawPixel(5, 7, M.COLORS['y']); img:drawPixel(6, 7, M.COLORS['t'])
    img:drawPixel(6, 6, M.COLORS['Y'])
    img:drawPixel(17, 12, M.COLORS['y']); img:drawPixel(18, 12, M.COLORS['t'])
    img:drawPixel(17, 11, M.COLORS['Y'])
    img:drawPixel(8, 18, M.COLORS['y']); img:drawPixel(9, 18, M.COLORS['Y'])
  end
  grout(img, 'v')
end

-- ============ B04 Vực băng (Tây) — i I k K ============
local function tile_ice(img, variant)
  base_field(img, 'I', 'i', 'k')
  if variant == 2 then
    -- mảng băng K góc trên-trái + vết nứt gãy khúc i xuyên
    M.line(img, 2, 3, 7, 3, 'K')
    M.line(img, 2, 4, 5, 4, 'K')
    M.line(img, 3, 4, 8, 9, 'i')
    M.line(img, 8, 9, 6, 14, 'i')
    M.line(img, 6, 14, 11, 18, 'i')
    M.line(img, 17, 3, 21, 8, 'i')
    M.line(img, 17, 16, 13, 21, 'i')
    img:drawPixel(18, 19, M.COLORS['K'])
  else
    -- tuyết rơi + băng vỡ mịn
    img:drawPixel(4, 4, M.COLORS['K']); img:drawPixel(5, 4, M.COLORS['K'])
    img:drawPixel(13, 8, M.COLORS['K'])
    img:drawPixel(19, 15, M.COLORS['K'])
    img:drawPixel(8, 18, M.COLORS['K'])
    M.line(img, 10, 5, 13, 8, 'k')
    M.line(img, 15, 12, 18, 15, 'k')
  end
  grout(img, 'i')
end

-- ============ B05 Ô đặc biệt (5 loại, nền transparent) ============
-- Symbol-first + outline o để đọc trên mọi nền vùng.

local function special_star(img)
  -- sao 4 cánh W core w, outline o
  M.line(img, 11, 4, 11, 17, 'o'); M.line(img, 4, 11, 17, 11, 'o')
  M.line(img, 11, 5, 11, 16, 'w'); M.line(img, 5, 11, 16, 11, 'w')
  img:drawPixel(10, 7, M.COLORS['w']); img:drawPixel(12, 7, M.COLORS['w'])
  img:drawPixel(10, 15, M.COLORS['w']); img:drawPixel(12, 15, M.COLORS['w'])
  img:drawPixel(7, 10, M.COLORS['w']); img:drawPixel(7, 12, M.COLORS['w'])
  img:drawPixel(15, 10, M.COLORS['w']); img:drawPixel(15, 12, M.COLORS['w'])
  M.rect(img, 10, 10, 2, 2, 'W')
end

local function special_chest(img)
  -- rương: thân b + đai m + khoá W, outline o
  M.rect(img, 5, 9, 14, 9, 'o')
  M.rect(img, 6, 10, 12, 6, 'b')
  M.rect(img, 6, 10, 12, 2, 'd')      -- nắp đậm
  M.rect(img, 6, 12, 12, 1, 'm')      -- đai ngang
  img:drawPixel(11, 12, M.COLORS['W']); img:drawPixel(12, 12, M.COLORS['W'])
  img:drawPixel(11, 13, M.COLORS['m']); img:drawPixel(12, 13, M.COLORS['m'])
  img:drawPixel(6, 16, M.COLORS['D'])
  img:drawPixel(17, 16, M.COLORS['D'])
end

local function special_trap(img)
  -- bẫy: miệng hố tròn, răng W đều khắp chu vi chĩa vào tâm, nền hố e
  M.disc(img, 11, 12, 6, 'o')
  M.disc(img, 11, 12, 5, 'e')
  -- răng: 8 điểm quanh vòng bán kính 4, mỗi răng 1px W chĩa tâm
  local teeth = {
    { 11, 8 }, { 14, 9 }, { 15, 12 }, { 14, 15 },
    { 11, 16 }, { 8, 15 }, { 7, 12 }, { 8, 9 },
  }
  for _, t in ipairs(teeth) do
    img:drawPixel(t[1], t[2], M.COLORS['W'])
  end
  -- tâm hố tối sâu + 1 pixel xương nhắc "bẫy đã nhai"
  img:drawPixel(11, 12, M.COLORS['o'])
  img:drawPixel(12, 13, M.COLORS['w'])
end

local function special_temple(img)
  -- đền: mái w 2 cột m, ô cửa e, lửa đứng 3px R/r/W rõ trung tâm
  M.rect(img, 4, 7, 14, 2, 'o')           -- mái outline
  M.rect(img, 5, 8, 12, 1, 'w')
  M.rect(img, 5, 10, 2, 8, 'm'); M.rect(img, 15, 10, 2, 8, 'm')
  M.rect(img, 7, 10, 8, 8, 'e')
  M.rect(img, 4, 18, 14, 2, 'o')
  M.rect(img, 5, 19, 12, 1, 'm')
  -- lửa lớn giữa cửa: W lõi, R thân, r gốc — 3 cấp rõ
  img:drawPixel(11, 12, M.COLORS['W'])
  img:drawPixel(11, 13, M.COLORS['W']); img:drawPixel(12, 13, M.COLORS['R'])
  img:drawPixel(10, 14, M.COLORS['R']); img:drawPixel(11, 14, M.COLORS['R']); img:drawPixel(12, 14, M.COLORS['r'])
  img:drawPixel(11, 15, M.COLORS['r']); img:drawPixel(12, 15, M.COLORS['r'])
  img:drawPixel(10, 12, M.COLORS['r']); img:drawPixel(12, 12, M.COLORS['r'])
end

local function special_heal(img)
  -- trái tim R/r outline o + highlight W
  M.rect(img, 6, 8, 4, 2, 'o'); M.rect(img, 14, 8, 4, 2, 'o')
  M.rect(img, 5, 10, 14, 4, 'o')
  M.rect(img, 6, 14, 12, 2, 'o')
  M.rect(img, 8, 14, 8, 2, 'o')
  M.rect(img, 10, 16, 4, 2, 'o')
  M.rect(img, 7, 9, 3, 1, 'R'); M.rect(img, 14, 9, 3, 1, 'R')
  M.rect(img, 6, 11, 12, 3, 'R')
  M.rect(img, 8, 15, 8, 1, 'R')
  M.rect(img, 10, 17, 4, 1, 'r')
  img:drawPixel(7, 9, M.COLORS['W'])
end

-- ============ B06 Đường về + đích ============
-- frame 1: ô đường về; frame 2: ô đích có cờ. Vẫn giữ violet làm màu gốc
-- vì B06 là asset chung (tint theo phe ở runtime qua viền P bên dưới).
local function tile_home_path(img, frame)
  base_field(img, 'u', 'e', 'U')
  M.rect_outline(img, 0, 0, 24, 24, 'o')
  if frame == 2 then
    -- cờ đích: cột m + cờ W viền o
    img:drawPixel(12, 5, M.COLORS['o'])
    M.line(img, 12, 6, 12, 15, 'm')
    img:drawPixel(12, 16, M.COLORS['o'])
    M.rect(img, 13, 5, 6, 4, 'W')
    M.rect_outline(img, 13, 5, 6, 4, 'o')
    img:drawPixel(15, 7, M.COLORS['c'])
    img:drawPixel(16, 7, M.COLORS['c'])
  else
    -- mũi hướng về đích: chevron W viền o (tương phản cao trên nền u)
    for i = 0, 3 do
      img:drawPixel(8 + i, 7 + i, M.COLORS['W'])
      img:drawPixel(15 - i, 7 + i, M.COLORS['W'])
      if i < 3 then
        img:drawPixel(8 + i, 8 + i, M.COLORS['o'])
        img:drawPixel(15 - i, 8 + i, M.COLORS['o'])
      end
    end
    img:drawPixel(11, 12, M.COLORS['W']); img:drawPixel(12, 12, M.COLORS['W'])
    img:drawPixel(11, 13, M.COLORS['o']); img:drawPixel(12, 13, M.COLORS['o'])
  end
  grout(img, 'e')
end

-- ============ B07 Chuồng 4 phe (48×48) ============
-- Viền phe r/f/l/u quanh toàn khối; 4 slot 20×20 lõm nền e, mỗi slot có
-- viền o + highlight trên-trái; khoảng sáng lửa W nhẹ ở góc ngoài mỗi slot.
local function tile_nest(img)
  local PH = { 'r', 'f', 'l', 'u' }
  M.rect(img, 0, 0, 48, 48, 'e')
  M.rect_outline(img, 1, 1, 46, 46, 'o')
  M.rect_outline(img, 2, 2, 44, 44, 'm')
  local slots = { { 4, 4 }, { 24, 4 }, { 4, 24 }, { 24, 24 } }
  for i, s in ipairs(slots) do
    local x, y = s[1], s[2]
    M.rect_outline(img, x, y, 20, 20, 'o')
    M.rect(img, x + 1, y + 1, 18, 18, 'e')
    -- viền phe 4 cạnh trong slot (dày 2px cho nhận diện nhanh)
    local phe = PH[i]
    M.rect_outline(img, x + 2, y + 2, 16, 16, phe)
    -- highlight trên-trái
    M.line(img, x + 3, y + 3, x + 7, y + 3, 'W')
    M.line(img, x + 3, y + 3, x + 3, y + 7, 'W')
    -- chữ số phe i (1..4) góc dưới-phải slot, màu phe
    local glyphs = {
      { { 13, 0 }, { 13, 1 }, { 13, 2 }, { 13, 3 } },            -- 1
      { { 12, 0 }, { 13, 0 }, { 12, 1 }, { 13, 2 }, { 12, 3 } }, -- 2
      { { 12, 0 }, { 13, 0 }, { 12, 1 }, { 13, 1 }, { 12, 3 }, { 13, 3 } }, -- 3
      { { 12, 0 }, { 12, 1 }, { 13, 1 }, { 12, 2 }, { 13, 2 }, { 12, 3 }, { 13, 3 } }, -- 4
    }
    for _, g in ipairs(glyphs[i]) do
      img:drawPixel(x + g[1], y + 4 + g[2], M.COLORS[phe == 'r' and 'R' or (phe == 'f' and 'F' or (phe == 'l' and 'L' or 'U'))])
    end
  end
end

-- ============ Vòng sinh chính ============
local SPECS = {
  { id = 'B01', w = 24, h = 24, nframe = 2, gen = tile_forest },
  { id = 'B02', w = 24, h = 24, nframe = 2, gen = tile_desert },
  { id = 'B03', w = 24, h = 24, nframe = 2, gen = tile_valley },
  { id = 'B04', w = 24, h = 24, nframe = 2, gen = tile_ice },
  { id = 'B05', w = 24, h = 24, nframe = 5, gen = function(img, fi)
      local fns = { special_star, special_chest, special_trap, special_temple, special_heal }
      fns[fi](img)
    end },
  { id = 'B06', w = 24, h = 24, nframe = 2, gen = tile_home_path },
  { id = 'B07', w = 48, h = 48, nframe = 1, gen = tile_nest },
}

local function ensure_dir(path)
  os.execute('mkdir "' .. path:gsub('/', '\\') .. '" 2>NUL')
end
ensure_dir(OUT)
ensure_dir(OUT .. '/ase')
ensure_dir(OUT .. '/png')
ensure_dir(OUT .. '/png/_strips')

for _, spec in ipairs(SPECS) do
  local spr = M.new_spr(spec.w, spec.h, spec.nframe, spec.id)
  for fi = 1, spec.nframe do
    local img = Image(spr.spec)
    spec.gen(img, fi)
    -- gán cel frame fi
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
end

print('TILES_DONE')
