-- gen_heroes.lua — v2: H01–H16, hero 16×16, 4 frame (đứng + 3 bước)
-- Redesign v2 (chi tiết ASSET_V2.md). Fixes audit v1:
--   * Outline o toàn khối + rim Q theo phe — đọc được trên mọi nền tile.
--   * Vũ khí NGOÀI khối thân ở cột biên, 5–8px, profile riêng:
--       Hiệp sĩ = khiên 4×6 cột 1–4 + kiếm dọc 7px cột 13–14
--       Pháp sư = trượng dọc 8px cột 2 (cán m + đầu c) + cầu phép c
--       Cung thủ = cung 7px cột 2–3 (cánh o + dây b) + tên khi đứng
--       Sát thủ = đoản đao kép chéo cột 1–3 / 13–14
--   * Mắt 2px e trên nền s; highlight đầu Q theo phe.
--   * 4 frame: bob 1px (đầu) ở F2/F4; chân bước F2 trái / F4 phải.
--   * Bóng e 1 hàng dưới chân.
-- Phe: P = màu tộc (r/f/l/u), Q = màu sáng (R/F/L/U) — contract trùng B07.

local M = dofile('tools/aseprite/art/lib.lua')
local OUT = app.params['outdir'] or 'assets/v2'

local BLANK = ('.'):rep(16)
local function blanks(n)
  local t = {}
  for i = 1, n do t[i] = BLANK end
  return t
end

-- Chèn src vào hàng row tại cột col (1-based). Ký tự '.' trong src = giữ nguyên
-- pixel cũ (overlay không phá), ký tự khác = đè.
local function stamp(row, src, col)
  local out = row
  for i = 1, #src do
    local c = src:sub(i, i)
    if c ~= '.' then
      local pos = col + i - 1
      out = out:sub(1, pos - 1) .. c .. out:sub(pos + 1)
    end
  end
  return out
end

-- ================== ĐẦU THEO TỘC (y1..y7, bob 0|1) ==================
-- 7 hàng: hair/horn/halo (1–2) · sọ s (2–4) · mắt (5) · cằm (6) · phụ (7).
-- Quy ước: Q = màu phe sáng dùng làm highlight tóc/crest; mắt e 2px; sỏi S.
local function head_7(tribe, Q, bob)
  local r = blanks(7)
  if tribe == 'nguoi' then
    -- tóc ngắn o + băng đô Q quanh trán
    r[1] = '.....oooo.......'
    r[2] = '....oQQQQo......'
    r[3] = '....osssso......'
    r[4] = '....osssso......'
    r[5] = '....oeeseo......'   -- 2 mắt e, đuôi mắt S
    r[6] = '.....osso........'
  elseif tribe == 'tienlinh' then
    -- halo c hàng 1, tai nhọn s nhô 2 cột mỗi bên hàng 3–4
    r[1] = '......cc........'
    r[2] = '.....oQQo........'
    r[2] = '.....oQQQQo.....'
    r[3] = '..s.oQQQQo.s....'
    r[4] = '..sosssssso.s...'  -- tai trái/phải nhọn
    r[4] = '..ssosssssoss...'
    r[5] = '....oeeseo......'
    r[6] = '.....osso........'
  elseif tribe == 'yeu' then
    -- sừng L hai bên nối sọ, mặt S tối, nanh W
    r[1] = '...L........L...'
    r[2] = '....Lo....oL....'
    r[2] = '....LooooL.....'
    r[3] = '....oSSSSo......'
    r[4] = '....oSSSSo......'
    r[5] = '....oeeSeo......'
    r[6] = '....oWoSo.......'   -- nanh 1px W dưới cằm
  elseif tribe == 'long' then
    -- mào vảy Q trên đỉnh + sọc Q trong sọ + râu U cằm
    r[1] = '......QQ........'
    r[2] = '.....oQQQo......'
    r[3] = '....oQQQQo......'
    r[4] = '....ossssSo.....'
    r[5] = '....oesseo......'
    r[6] = '.....oUUo.......'   -- râu cằm U
  end
  if bob == 1 then
    -- đầu nhún xuống 1px: hàng 1 trống, mọi thứ dời 1
    local sh = blanks(7)
    for i = 1, 6 do sh[i + 1] = r[i] end
    r = sh
  end
  return r
end

-- ================== THÂN (y8..y11) THEO HỆ ==================
local function torso_4(cls, P, Q)
  if cls == 'hiepsi' then
    return {
      '.....oQMMo......',
      '....oMMMMMo.....',
      '....oMPPPMo.....',
      '.....oMMMo......',
    }
  elseif cls == 'phapsu' then
    return {
      '....oPPPQPo.....',
      '...oPPPPPPPo....',
      '...oPPePPPo.....',
      '....oPPPPo......',
    }
  elseif cls == 'cungthu' then
    return {
      '.....oSSPo......',
      '....oSPPSSo.....',
      '....oSPPSSo.....',
      '.....oSSo.......',
    }
  elseif cls == 'sathu' then
    return {
      '.....oSSPo......',
      '....oSeSSSo.....',
      '....oSeSSSo.....',
      '.....oSSo.......',
    }
  end
end

-- ================== BUILD 1 FRAME ==================
local function build_hero(tribe, cls, phe, frame)
  local bright = { r = 'R', f = 'F', l = 'L', u = 'U' }
  local P = phe
  local Q = bright[phe]
  local bob = (frame == 2 or frame == 4) and 1 or 0

  local rows = blanks(16)

  -- ĐẦU: 7 hàng tại y1 (+bob dịch nội dung, hàng 8 trống khi bob)
  local h = head_7(tribe, Q, 0)
  if bob == 1 then
    h = head_7(tribe, Q, 1)
  end
  for i = 1, 7 do
    if h[i] and h[i] ~= BLANK then rows[i] = h[i] end
  end

  -- THÂN y8..y11
  local t = torso_4(cls, P, Q)
  for i = 1, 4 do rows[8 + i - 1] = t[i] end

  -- VŨ KHÍ — cột biên, đè sau thân
  if cls == 'hiepsi' then
    -- KHIÊN trái cột 1–4 (khối 4×5, viền o, Q highlight, core P)
    rows[7]  = stamp(rows[7],  '.oo.............', 1)
    rows[8]  = stamp(rows[8],  'oQQo.oQMMo......', 1)
    rows[9]  = stamp(rows[9],  'oPPPoMMMMMo.....', 1)
    rows[10] = stamp(rows[10], 'oPQPoMPPPMo.....', 1)
    rows[11] = stamp(rows[11], 'oPPo.oMMMo......', 1)
    rows[12] = stamp(rows[12], '.oo.............', 1)
    -- KIẾM phải cột 13–14: chuôi y10, blade m dọc y7–y9, ng<HTMLInputElement đỉnh M
    rows[7]  = stamp(rows[7],  'oM', 13)
    rows[8]  = stamp(rows[8],  'oM', 13)
    rows[9]  = stamp(rows[9],  'oM', 13)
    rows[10] = stamp(rows[10], 'oo', 13)
  elseif cls == 'phapsu' then
    -- TRƯỢNG cột 2: đầu c y5–y6, cán m y7–y11, không đè thân
    rows[5]  = stamp(rows[5],  '.c', 2)
    rows[6]  = stamp(rows[6],  '.c', 2)
    rows[7]  = stamp(rows[7],  '.m', 2)
    rows[8]  = stamp(rows[8],  '.o.oPPPQPo.....', 1)
    rows[9]  = stamp(rows[9],  '.o.oPPPPPPPo...', 1)
    rows[10] = stamp(rows[10], '.o.oPPePPPo....', 1)
    rows[11] = stamp(rows[11], '.o.oPPPPo......', 1)
    -- cán trượng tiếp xuống dưới tay (y9-y11 cột 2), tay ôm tại y9
    rows[9]  = stamp(rows[9],  '.m', 2)
    rows[10] = stamp(rows[10], '.m', 2)
    rows[11] = stamp(rows[11], '.m', 2)
  elseif cls == 'cungthu' then
    -- CUNG cột 2–3: cánh o/b cong y7–y11, dây b thẳng cột 3
    rows[7]  = stamp(rows[7],  '.ob.............', 1)
    rows[8]  = stamp(rows[8],  '.ob.oSSPo......', 1)
    rows[9]  = stamp(rows[9],  '.oboSPPSSo.....', 1)
    rows[10] = stamp(rows[10], '.oboSPPSSo.....', 1)
    rows[11] = stamp(rows[11], '.ob.oSSo.......', 1)
    rows[12] = stamp(rows[12], '.o..o..........', 1)
    -- TÊN: chỉ frame 1 (đứng), ngang cột 5–12, đầu tên M bên phải
    if frame == 1 then
      rows[9] = stamp(rows[9], 'oWMMMMMo', 6)
    end
  elseif cls == 'sathu' then
    -- ĐOẢN ĐAO KÉP: chéo xuống-ngoài hai bên thân, 4px mỗi đao
    rows[8]  = stamp(rows[8],  '..M..oSSPo...M.', 1)
    rows[9]  = stamp(rows[9],  '.M.M.oSeSSSo.M.', 1)
    rows[10] = stamp(rows[10], 'M...M.oSeSSSo.M.', 1)
    rows[11] = stamp(rows[11], 'o...o.oSSo..o..', 1)
  end

  -- CHÂN y13–y15 theo frame
  local leg_sets = {
    { '......mm.mm.....', '......mm.mm.....', '......oo.oo.....' }, -- F1
    { '.....mm...mm....', '....mm.....m....', '....oo.....o....' }, -- F2 trái
    { '......m...m.....', '......m...m.....', '......o...o.....' }, -- F3
    { '....mm...mm.....', '....m.....mm....', '....o.....oo....' }, -- F4 phải
  }
  local legs = leg_sets[frame]
  rows[13] = legs[1]
  rows[14] = legs[2]
  rows[15] = legs[3]

  -- BÓNG y16 dưới hai chân
  if frame == 2 then rows[16] = '....ee....ee....' end
  if frame == 4 then rows[16] = '....ee....ee....' end
  if frame == 1 or frame == 3 then rows[16] = '.....ee..ee.....' end

  return rows
end

-- ================== SINH 16 HERO ==================
local TRIBES = { 'nguoi', 'tienlinh', 'yeu', 'long' }
local CLASSES = { 'hiepsi', 'phapsu', 'cungthu', 'sathu' }
local PHE = { ['nguoi'] = 'r', ['tienlinh'] = 'f', ['yeu'] = 'l', ['long'] = 'u' }

local function ensure_dir(path)
  os.execute('mkdir "' .. path:gsub('/', '\\') .. '" 2>NUL')
end
ensure_dir(OUT .. '/ase')
ensure_dir(OUT .. '/png')
ensure_dir(OUT .. '/png/_strips')

local count = 0
for ti, tribe in ipairs(TRIBES) do
  for ci, cls in ipairs(CLASSES) do
    local id = string.format('H%02d', (ti - 1) * 4 + ci)
    local spr = M.new_spr(16, 16, 4, id)
    for f = 1, 4 do
      M.set_frame(spr, f, build_hero(tribe, cls, PHE[tribe], f))
    end
    local bad = M.validate(spr)
    print(id .. ' validate=' .. bad)
    M.export(spr, id, OUT .. '/ase', OUT .. '/png', OUT .. '/png/_strips')
    spr:close()
    count = count + 1
  end
end
print('HEROES_DONE ' .. count)
