-- lib.lua — module dùng chung cho các script Aseprite sinh asset v1
-- Chạy trong Aseprite CLI (-b). Cung cấp: palette 31 màu, PRNG seeded, helpers vẽ, validator.
--
-- Quy ước palette (ASSET_REQUIREMENTS.md §1): 31 màu đặc + transparent, dùng chung toàn game.
-- Ký tự palette là "tên màu" — sprite code-sinh tham chiếu qua ký tự, không hex.

local M = {}

-- ================== PALETTE 31 MÀU ==================
-- Bảng định nghĩa: { ký tự, r, g, b, mô tả }
-- Cấu trúc tông màu theo 4 vùng GDD §4 + tộc/hệ/FX.
M.PAL_DEF = {
  -- outline / skin
  { 'o',   33,  24,  33, 'outline' },
  { 's',  238, 189, 143, 'skin' },
  { 'S',  197, 136, 106, 'skin shade' },
  -- rừng (Bắc) — 4
  { 'g',   36,  70,  52, 'rừng đậm' },
  { 'G',   60, 104,  72, 'rừng vừa' },
  { 't',   95, 143,  90, 'rừng nhạt' },
  { 'n',  140, 176, 113, 'chồi non' },
  -- sa mạc (Đông) — 4
  { 'd', 193, 146,  98, 'cát đậm' },
  { 'd', 193, 146,  98, 'cát' },
  { 'D', 225, 182, 130, 'cát nhạt' },
  { 'b', 150, 102,  64, 'đá đỏ' },
  -- thung lũng (Nam) — 4
  { 'v',   80, 120,  88, 'thung lũng cỏ' },
  { 'x', 140, 172, 138, 'cỏ sương' },
  { 'y', 193, 209, 187, 'sương trắng' },
  { 'Y', 224, 234, 220, 'sương sáng' },
  -- vực băng (Tây) — 4
  { 'i',  89, 124, 158, 'băng đậm' },
  { 'I', 136, 176, 205, 'băng vừa' },
  { 'k', 186, 221, 240, 'băng nhạt' },
  { 'K', 230, 245, 252, 'tuyết' },
  -- phe/tộc (4 phe)
  { 'r', 198,  42,  42, 'đỏ phe A' },
  { 'R', 233,  68,  56, 'đỏ sáng' },
  { 'l', 229, 128,  36, 'cam phe B' },
  { 'L', 255, 152,  52, 'cam sáng' },
  { 'f',   64, 168,  86, 'xanh lá phe C' },
  { 'F',  102, 208, 118, 'xanh lá sáng' },
  { 'u', 112,  60, 162, 'tím phe D' },
  { 'U', 143,  84, 199, 'tím sáng' },
  -- hệ (điểm nhấn vũ khí/đôi) — Hiệp sĩ/Pháp sư/Cung thủ/Sát thủ
  { 'm', 130, 130, 140, 'thép xám' },
  { 'M', 180, 182, 190, 'thép sáng' },
  { 'w', 234, 230, 204, 'trắng phép' },
  { 'W', 255, 255, 255, 'trắng tinh' },
  { 'c',  65, 238, 228, 'phép màu cyan' },
  { 'e',  51,  51,  63, 'tối phép' },
}

local function build_pal()
  local seen = {}
  local out = {}
  local n = 0
  for _, def in ipairs(M.PAL_DEF) do
    if not seen[def[1]] then
      seen[def[1]] = true
      n = n + 1
      out[n] = def
    end
  end
  return out
end

-- Pal sau khi lọc trùng (giữ lần đầu).
M.PAL = build_pal()

-- Ký tự → Color (dùng chung mọi sprite).
M.COLORS = {}
M.COLOR_INDEX = {}   -- ký tự → index trong palette Aseprite
M.INDEX_COLOR = {}   -- index → ký tự
do
  for i, def in ipairs(M.PAL) do
    M.COLORS[def[1]] = Color{ r = def[2], g = def[3], b = def[4] }
    M.COLOR_INDEX[def[1]] = i - 1   -- palette Aseprite index từ 0
    M.INDEX_COLOR[i - 1] = def[1]
  end
end

-- Số màu thực (để in manifest).
function M.pal_size() return #M.PAL end

-- ================== PRNG (xorshift32, seeded) ==================
local PRNG_STATE = 1
function M.rand_seed(seed) PRNG_STATE = seed % 4294967296 end
function M.rand()
  local x = PRNG_STATE
  x = x ~ (x << 13)
  x = x ~ (x >> 17)
  x = x ~ (x << 5)
  PRNG_STATE = x & 0xFFFFFFFF
  return PRNG_STATE / 4294967296
end
function M.randi(n) return math.floor(M.rand() * n) + 1 end
function M.rand_pick(t) return t[M.randi(#t)] end

-- ================== Helpers vẽ ==================
local function color_of(ch)
  return M.COLORS[ch]
end

-- Vẽ string-matrix vào image tại (x, y). Chỉ vẽ ký tự có trong map (mặc định toàn palette + '.').
-- '.' và ' ' = không vẽ (transparent).
function M.blit(img, x, y, rows)
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      local c = color_of(ch)
      if c then img:drawPixel(x + i - 1, y + j - 1, c) end
    end
  end
end

-- Vẽ 1 frame vào sprite (thay image cel layer 1, giữ nguyên số frame).
function M.set_frame(spr, fi, rows)
  local img = Image(spr.spec)
  M.blit(img, 0, 0, rows)
  local cel = spr.layers[1]:cel(spr.frames[fi])
  if cel == nil then
    spr:newCel(spr.layers[1], spr.frames[fi], img, Point(0, 0))
  else
    cel.image = img
  end
end

-- Tạo sprite mới, n frame, có palette chuẩn, tag frame.
-- Trả về sprite.
function M.new_spr(w, h, nframe, tag)
  local spr = Sprite(w, h, ColorMode.RGB)
  -- cài palette
  local pal = Palette(#M.PAL)
  for i, def in ipairs(M.PAL) do
    pal:setColor(i - 1, Color{ r = def[2], g = def[3], b = def[4] })
  end
  spr:setPalette(pal)
  -- frame 1 tồn tại sẵn; frame tiếp theo newFrame
  for i = 2, nframe do spr:newFrame() end
  if tag then spr:newTag(tag, 1, nframe) end
  return spr
end

-- Hình học cơ bản
function M.rect(img, x, y, w, h, ch)
  local c = color_of(ch)
  for j = 0, h - 1 do
    for i = 0, w - 1 do
      img:drawPixel(x + i, y + j, c)
    end
  end
end

function M.rect_outline(img, x, y, w, h, ch)
  local c = color_of(ch)
  for i = 0, w - 1 do
    img:drawPixel(x + i, y, c)
    img:drawPixel(x + i, y + h - 1, c)
  end
  for j = 0, h - 1 do
    img:drawPixel(x, y + j, c)
    img:drawPixel(x + w - 1, y + j, c)
  end
end

function M.disc(img, cx, cy, r, ch)
  local c = color_of(ch)
  for j = -r, r do
    for i = -r, r do
      if i * i + j * j <= r * r then
        img:drawPixel(cx + i, cy + j, c)
      end
    end
  end
end

function M.ring(img, cx, cy, r, ch)
  -- vành ngoài disc bán kính r (1px)
  local c = color_of(ch)
  for j = -r, r do
    for i = -r, r do
      local d = i * i + j * j
 if d <= r * r and d > (r - 1) * (r - 1) then
        img:drawPixel(cx + i, cy + j, c)
      end
    end
  end
end

function M.line(img, x0, y0, x1, y1, ch)
  -- Bresenham
  local c = color_of(ch)
  local dx = math.abs(x1 - x0)
  local dy = math.abs(y1 - y0)
  local sx = x0 < x1 and 1 or -1
  local sy = y0 < y1 and 1 or -1
  local err = dx - dy
  local x, y = x0, y0
  while true do
    img:drawPixel(x, y, c)
    if x == x1 and y == y1 then break end
    local e2 = 2 * err
    if e2 > -dy then err = err - dy; x = x + sx end
    if e2 < dx then err = err + dx; y = y + sy end
  end
end

-- ================== Validator ==================
-- Kiểm mọi pixel của cel có màu nằm trong palette không.
-- Trả về số pixel ngoài palette (0 = sạch).
function M.validate(spr)
  local pc = app.pixelColor
  local ok = {}
  for _, def in ipairs(M.PAL) do
    ok[pc.rgba(def[2], def[3], def[4], 255)] = true
  end
  local bad = 0
  for _, fr in ipairs(spr.frames) do
    local cel = spr.layers[1]:cel(fr)
    if cel then
      local img = cel.image
      for y = 0, img.height - 1 do
        for x = 0, img.width - 1 do
          local v = img:getPixel(x, y)
          if pc.rgbaA(v) > 0 and not ok[v] then bad = bad + 1 end
        end
      end
    end
  end
  return bad
end

-- ================== Export ==================
-- Lưu sprite: .ase vào dir_ase, frame PNG vào dir_png, strip vào dir_strip.
function M.export(spr, id, dir_ase, dir_png, dir_strip)
  spr:saveAs(dir_ase .. '/' .. id .. '.ase')
  for i, fr in ipairs(spr.frames) do
    local s2 = Sprite(spr.width, spr.height, ColorMode.RGB)
    local src = spr.layers[1]:cel(fr)
    if src then
      local img = Image(s2.spec)
      img:drawImage(src.image, Point(0, 0))
      local cel = s2.layers[1]:cel(s2.frames[1])
      if cel == nil then
        s2:newCel(s2.layers[1], s2.frames[1], img, Point(0, 0))
      else
        cel.image = img
      end
      s2:saveAs(dir_png .. '/' .. id .. '_' .. i .. '.png')
    end
    s2:close()
  end
  local strip = Sprite(spr.width * #spr.frames, spr.height, ColorMode.RGB)
  local dst = strip.layers[1]:cel(strip.frames[1]).image
  for i, fr in ipairs(spr.frames) do
    local src = spr.layers[1]:cel(fr)
    if src then
      dst:drawImage(src.image, Point((i - 1) * spr.width, 0))
    end
  end
  strip.layers[1]:cel(strip.frames[1]).image = dst
  strip:saveAs(dir_strip .. '/' .. id .. '_strip.png')
  strip:close()
end

return M
