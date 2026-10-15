/** Friendly variant concept sheet for the Long Tinh Tử hero. No runtime asset changes.
 * Run: node tools/preview_long_mage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/ref');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  ink: '#151e29', shadow: '#323e4b', slate: '#495669', goldDark: '#795237', gold: '#ba8748',
  honey: '#e2b563', cream: '#f6df9c', woodLight: '#b58a59', purpleDark: '#433954',
  purple: '#776090', purpleLight: '#ac8bbb', purpleWhite: '#dcc5dc', cyan: '#54adad',
  cyanLight: '#a6e4da', white: '#edf1dc',
};

class Art {
  constructor(w, h = w) { this.w = w; this.h = h; this.p = Array.from({ length: h }, () => Array(w).fill('.')); }
  dot(x, y, color) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y][x] = color; return this; }
  rect(x, y, w, h, color) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.dot(xx, yy, color); return this; }
  line(x0, y0, x1, y1, color, width = 1) {
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      this.rect(x0, y0, width, width, color);
      if (x0 === x1 && y0 === y1) break;
      const e = 2 * err;
      if (e >= dy) { err += dy; x0 += sx; }
      if (e <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  poly(points, color) {
    const ys = points.map(p => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const cuts = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi <= y && yj > y) || (yj <= y && yi > y)) cuts.push(xi + (y - yi) * (xj - xi) / (yj - yi));
      }
      cuts.sort((a, b) => a - b);
      for (let i = 0; i < cuts.length; i += 2) for (let x = Math.ceil(cuts[i]); x <= Math.floor(cuts[i + 1]); x++) this.dot(x, y, color);
    }
    for (let i = 0; i < points.length; i++) this.line(...points[i], ...points[(i + 1) % points.length], color);
    return this;
  }
  oval(cx, cy, rx, ry, color) {
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.dot(x, y, color);
    }
    return this;
  }
  blit(other, x, y) { other.p.forEach((row, yy) => row.forEach((color, xx) => { if (color !== '.') this.dot(x + xx, y + yy, color); })); return this; }
}

function hero(frame) {
  const a = new Art(32);
  const bob = frame === 1 ? -1 : 0;
  const stepL = frame === 2 ? 1 : 0, stepR = frame === 3 ? 1 : 0;

  // Soft, compact robe and rounded boots keep the silhouette approachable.
  a.poly([[11,15],[20,15],[23,19],[21,25],[19,27],[12,27],[10,25],[9,19]], 'ink')
    .poly([[12,16],[19,16],[21,19],[20,24],[18,26],[13,26],[11,24],[10,19]], 'purple')
    .poly([[12,16],[17,16],[17,19],[12,19]], 'purpleLight')
    .line(12,20,12,23,'purpleWhite').line(19,20,20,23,'purpleDark');
  a.rect(12,25-stepL,4,4,'ink').rect(17,25-stepR,4,4,'ink')
    .rect(13,26-stepL,2,2,'slate').rect(18,26-stepR,2,2,'shadow')
    .rect(11,28-stepL,6,3,'ink').rect(17,28-stepR,6,3,'ink')
    .rect(12,28-stepL,4,1,'woodLight').rect(18,28-stepR,4,1,'woodLight');
  a.rect(11,23,10,2,'goldDark').rect(12,23,8,1,'honey').dot(16,23,'cream')
    .poly([[14,23],[16,21],[18,23],[16,25]],'ink').dot(16,23,'cyanLight');

  // Oversized rounded dragon face with little curved horns and bright eyes.
  const hy = 5 + bob;
  a.oval(16,hy+5,7,7,'ink').oval(16,hy+5,6,6,'purpleLight')
    .rect(12,hy+2,3,5,'purpleWhite').rect(17,hy+3,3,4,'purple');
  a.poly([[11,hy+2],[9,hy],[8,hy+1],[9,hy+4],[12,hy+5]],'ink')
    .poly([[11,hy+2],[9,hy+1],[10,hy+3],[12,hy+4]],'honey')
    .poly([[20,hy+2],[22,hy],[23,hy+1],[22,hy+4],[19,hy+5]],'ink')
    .poly([[20,hy+2],[22,hy+1],[21,hy+3],[19,hy+4]],'honey');
  a.oval(13,hy+5,1,2,'ink').oval(19,hy+5,1,2,'ink')
    .dot(13,hy+4,'white').dot(19,hy+4,'white')
    .line(14,hy+8,15,hy+9,'purpleDark').line(15,hy+9,17,hy+9,'purpleDark').line(17,hy+9,18,hy+8,'purpleDark');
  // A short chin tuft keeps the dragon cue while reading as cute, not fierce.
  a.poly([[14,hy+10],[18,hy+10],[17,hy+12],[16,hy+13],[15,hy+12]],'ink')
    .poly([[15,hy+10],[17,hy+10],[17,hy+11],[16,hy+12],[15,hy+11]],'purple');
  a.dot(12,hy+8,'purpleWhite').dot(20,hy+8,'purpleWhite');

  // Soft wizard cap with a round crystal ornament.
  a.poly([[10,hy+3],[12,hy],[15,hy-2],[18,hy-1],[21,hy+3],[20,hy+4],[12,hy+4]],'ink')
    .poly([[11,hy+3],[13,hy],[15,hy-1],[17,hy],[20,hy+3],[18,hy+3],[12,hy+3]],'purpleDark')
    .line(13,hy,16,hy,'purpleLight').dot(16,hy,'cyanLight');

  // Clearly separated staff with a friendly glowing crystal.
  a.line(27,12,26,29,'ink',3).line(27,13,26,28,'woodLight')
    .rect(24,13,6,2,'goldDark').line(25,13,28,13,'honey')
    .oval(27,7,4,4,'ink').oval(27,7,3,3,'cyan')
    .dot(26,6,'white').dot(28,8,'cyanLight').line(27,10,27,11,'gold');
  a.poly([[10,17],[12,16],[14,17],[12,19]],'ink').poly([[11,17],[12,17],[13,18],[12,18]],'purpleWhite')
    .poly([[19,17],[21,16],[23,18],[21,19]],'ink').poly([[20,17],[21,17],[22,18],[21,18]],'purpleLight');
  return a;
}

function crc(buf) {
  let c = 0xffffffff;
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, buf) {
  const t = Buffer.from(type), len = Buffer.alloc(4), checksum = Buffer.alloc(4);
  len.writeUInt32BE(buf.length);
  checksum.writeUInt32BE(crc(Buffer.concat([t, buf])));
  return Buffer.concat([len, t, buf, checksum]);
}
function png(art, dest, scale = 1) {
  const w = art.w * scale, h = art.h * scale;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const color = art.p[Math.floor(y / scale)][Math.floor(x / scale)];
    if (color === '.') continue;
    const hex = C[color];
    if (!hex) throw new Error(`Unknown color ${color}`);
    const at = y * (w * 4 + 1) + 1 + x * 4;
    raw[at] = parseInt(hex.slice(1, 3), 16);
    raw[at + 1] = parseInt(hex.slice(3, 5), 16);
    raw[at + 2] = parseInt(hex.slice(5, 7), 16);
    raw[at + 3] = 255;
  }
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  fs.writeFileSync(dest, Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

const frames = [0, 1, 2, 3].map(hero);
for (const [i, frame] of frames.entries()) png(frame, path.join(OUT, `long_mage_friendly_f${i}.png`));
const sheet = new Art(4 * 32 + 5 * 8, 32 + 16);
frames.forEach((frame, i) => sheet.blit(frame, 8 + i * 40, 8));
png(sheet, path.join(OUT, 'long_mage_friendly_concept.png'), 4);
console.log(`Previewed friendly Long Tinh Tử: ${frames.length} frames at 32x32, contact sheet at ${sheet.w * 4}x${sheet.h * 4}.`);
