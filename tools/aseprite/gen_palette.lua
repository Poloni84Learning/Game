-- gen_palette.lua — xuất string-matrix mọi sprite sang src/data/gfx/
-- Mỗi asset: { id, frames[i] = rows[] } trong palette ký tự (lib M.PAL_DEF).
-- Out: src/data/gfx/assets.ts (dùng chung cho runtime draw) + bảng palette.

local M = dofile('tools/aseprite/art/lib.lua')
local OUT = app.params['outdir'] or 'assets/v1'
local TS_OUT = app.params['tsout'] or 'src/data/gfx'

-- Thứ tự danh mục asset.
local ORDER = {
  'B01','B02','B03','B04','B05','B06','B07',
  'H01','H02','H03','H04','H05','H06','H07','H08','H09','H10','H11','H12','H13','H14','H15','H16',
  'C01','C02','C03','C04','C05','C06','C07','C08',
  'K01','K02','K03','K04','K05','K06','K07','K08','K09','K10','K11','K12',
  'S01','S02','S03','S04','S05','S06','S07','S08',
  'I01','I02','I03','I04',
  'F01','F02','F03','F04','F05','F06','F07','F08','F09','F10',
}

-- Đọc sprite .ase -> mảng string-matrix theo palette ký tự.
local pc = app.pixelColor
local function pc_key(r, g, b) return r * 65536 + g * 256 + b end

-- ánh xạ màu -> ký tự palette
local PAL_CHARS = {}
do
  for i, def in ipairs(M.PAL) do
    PAL_CHARS[pc_key(def[2], def[3], def[4])] = def[1]
  end
end

local function to_matrix(spr, frame_index)
  local cel = spr.layers[1]:cel(spr.frames[frame_index])
  if cel == nil then return {} end
  local img = cel.image
  local ox, oy = cel.position.x, cel.position.y
  local rows = {}
  for y = 0, spr.height - 1 do
    local row = {}
    for x = 0, spr.width - 1 do
      local v = img:getPixel(x - ox, y - oy)
      local ch = '.'
      if pc.rgbaA(v) > 0 then
        local key = pc_key(pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v))
        ch = PAL_CHARS[key] or '?'
      end
      table.insert(row, ch)
    end
    table.insert(rows, table.concat(row))
  end
  return rows
end

-- Load lại từng sprite .ase và serialize.
local out = {}
table.insert(out, '// ĐỀ XUẤT - sinh tự động từ tools/aseprite/gen_palette.lua')
table.insert(out, '// Mỗi string-matrix: 1 ký tự = 1 màu; "." = transparent.')
table.insert(out, '// Palette ánh xạ tại PALETTE phía dưới.')
-- Bọc ký tự màu trong nháy đơn cho TS (ký tự đơn, không cần escape).
local function quote_char(c)
  return "'" .. c .. "'"
end
table.insert(out, 'export const PALETTE: Record<string, string> = {')
for _, def in ipairs(M.PAL) do
  table.insert(out, string.format("  %s: '#%02X%02X%02X',", quote_char(def[1]), def[2], def[3], def[4]))
end
table.insert(out, '};')
table.insert(out, '')
table.insert(out, 'export type SpriteMatrix = string[];')
table.insert(out, 'export interface AssetDef { id: string; frames: SpriteMatrix[]; }')
table.insert(out, '')

local n_ok = 0
for _, id in ipairs(ORDER) do
  local path = OUT .. '/ase/' .. id .. '.ase'
  local f = io.open(path, 'rb')
  if f == nil then
    print('MISSING ' .. path)
  else
    io.close(f)
    local spr = app.open(path)
    local frames = {}
    for fi = 1, #spr.frames do
      local rows = to_matrix(spr, fi)
      table.insert(frames, rows)
    end
    spr:close()
    table.insert(out, 'export const ' .. id .. ': AssetDef = {')
    table.insert(out, "  id: '" .. id .. "',")
    table.insert(out, '  frames: [')
    for _, rows in ipairs(frames) do
      table.insert(out, '    [')
      for _, row in ipairs(rows) do
        table.insert(out, "      '" .. row .. "',")
      end
      table.insert(out, '    ],')
    end
    table.insert(out, '  ],')
    table.insert(out, '};')
    table.insert(out, '')
    n_ok = n_ok + 1
  end
end


os.execute('mkdir "' .. TS_OUT:gsub('/', '\\') .. '" 2>NUL')
local fh = io.open(TS_OUT .. '/assets.ts', 'wb')
fh:write(table.concat(out, '\n'))
fh:close()
print('MATRIX_DONE ' .. n_ok)
