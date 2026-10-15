/** Native pixel-art source for the zcode asset set. No image resampling, no runtime deps.
 * Run: node tools/gen_assets_zcode.mjs. Outputs matrices, PNGs and contact sheets.
 * Every contour is drawn at the target resolution. Old v1/v2/v3 sources are retained.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { coreIconsV5 } from './core_icons_v5.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/zcode');
fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });

// PNGs are filed under assets/zcode/png/<label>/ by authoring batch, not regeneration day.
// The registry pins each asset id to its folder label; BATCH_SEEDS route new ids into
// dated topic folders, unknown ids fall back to the run date. A deleted registry rebuilds.
const DATES_FILE = path.join(OUT, 'ASSET_DATES.json');
const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const firstRun = !fs.existsSync(DATES_FILE);
const assetDates = firstRun ? {} : JSON.parse(fs.readFileSync(DATES_FILE, 'utf8'));
// Seeds backdate the pre-registry sets (base pack 11/10/2026, core icons + custom hero 14/10/2026).
const BATCH_SEEDS = [
  [/^V\d{2}$/, '2026-10-14-van-hoa-viet'],
  [/^K\d{2}$|^H_CUSTOM_01$/, '2026-10-14'],
];
const dateFor = id => {
  if (!assetDates[id]) {
    const seed = BATCH_SEEDS.find(([re]) => re.test(id));
    assetDates[id] = seed ? seed[1] : (firstRun ? '2026-10-11' : todayStr);
  }
  return assetDates[id];
};
// Drop stale flat PNGs left from before the date-folder layout; date subdirs are kept.
for (const f of fs.readdirSync(path.join(OUT, 'png'))) {
  const p = path.join(OUT, 'png', f);
  if (f.endsWith('.png') && fs.statSync(p).isFile()) fs.rmSync(p);
}
const colors = {
  ink: '#151e29', edge: '#293343', shadow: '#323e4b', slate: '#495669', stone: '#667388',
  silver: '#98a8b9', steel: '#c4d2db', white: '#edf1dc', goldDark: '#795237', gold: '#ba8748',
  honey: '#e2b563', cream: '#f6df9c', bark: '#523c34', wood: '#886046', woodLight: '#b58a59',
  skinDark: '#ad735f', skin: '#dca27b', skinLight: '#f1c79a', hair: '#4e3534',
  redDark: '#66313c', red: '#b34d50', redLight: '#e77b68', redWhite: '#f7b391',
  greenDark: '#294d43', green: '#467865', greenLight: '#7bb58b', greenWhite: '#bdd7a1',
  purpleDark: '#433954', purple: '#776090', purpleLight: '#ac8bbb', purpleWhite: '#dcc5dc',
  blueDark: '#314664', blue: '#527ca2', blueLight: '#89bad1', blueWhite: '#cbe7ed',
  sandDark: '#75573f', sand: '#a58259', sandLight: '#c4a371', sandWhite: '#debd87',
  mossDark: '#263e37', moss: '#3f5b47', mossLight: '#638063', mossWhite: '#95aa7b',
  grassDark: '#344d45', grass: '#567568', grassLight: '#85a187', grassWhite: '#bdc6a0',
  iceDark: '#354e65', ice: '#52768b', iceLight: '#80a7b4', iceWhite: '#b9d4d5',
  cyanDark: '#2b696e', cyan: '#54adad', cyanLight: '#a6e4da', orange: '#db824a',
};
const symbols = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_=+[]{};:,<>?';
const PAL = Object.fromEntries(Object.entries(colors).map(([name, hex], i) => [symbols[i], hex]));
const key = Object.fromEntries(Object.keys(colors).map((name, i) => [name, symbols[i]]));
class Art {
  constructor(w, h = w) { this.w = w; this.h = h; this.p = Array.from({ length: h }, () => Array(w).fill('.')); }
  dot(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y][x] = key[c] ?? c; return this; }
  rect(x, y, w, h, c) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.dot(xx, yy, c); return this; }
  line(x0, y0, x1, y1, c, width = 1) {
    let dx = Math.abs(x1-x0), sx=x0<x1?1:-1, dy=-Math.abs(y1-y0), sy=y0<y1?1:-1, err=dx+dy;
    for (;;) { this.rect(x0, y0, width, width, c); if (x0===x1 && y0===y1) break; const e=2*err; if(e>=dy){err+=dy;x0+=sx;} if(e<=dx){err+=dx;y0+=sy;} } return this;
  }
  poly(points, c) {
    const ys=points.map(p=>p[1]);
    for(let y=Math.min(...ys);y<=Math.max(...ys);y++) {
      const cuts=[]; for(let i=0,j=points.length-1;i<points.length;j=i++) { const [xi,yi]=points[i],[xj,yj]=points[j]; if((yi<=y&&yj>y)||(yj<=y&&yi>y)) cuts.push(xi+(y-yi)*(xj-xi)/(yj-yi)); }
      cuts.sort((a,b)=>a-b); for(let i=0;i<cuts.length;i+=2) for(let x=Math.ceil(cuts[i]);x<=Math.floor(cuts[i+1]);x++) this.dot(x,y,c);
    }
    for(let i=0;i<points.length;i++) this.line(...points[i],...points[(i+1)%points.length],c); return this;
  }
  oval(cx, cy, rx, ry, c) { for(let y=cy-ry;y<=cy+ry;y++) for(let x=cx-rx;x<=cx+rx;x++) if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1) this.dot(x,y,c); return this; }
  blit(other,x,y) { other.p.forEach((r,yy)=>r.forEach((c,xx)=>{if(c!=='.')this.dot(x+xx,y+yy,c);})); return this; }
  rows() { return this.p.map(r=>r.join('')); }
}
const assets = [];
const add=(id,frames)=>{ assets.push({id,frames:frames.map(a=>a.rows())}); const dir=path.join(OUT,'png',dateFor(id)); fs.mkdirSync(dir,{recursive:true}); frames.forEach((a,i)=>png(a,path.join(dir,`${id}_${i+1}.png`))); };
const rng = (seed) => () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };

// Bevelled, quiet ground: broad light clusters, authored cracks, sparse vegetation.
function tile(region, variant) {
  const a=new Art(48), tones=[['mossDark','moss','mossLight','mossWhite'],['sandDark','sand','sandLight','sandWhite'],['grassDark','grass','grassLight','grassWhite'],['iceDark','ice','iceLight','iceWhite']][region];
  a.rect(0,0,48,48,'ink').rect(1,1,46,45,tones[0]).rect(2,2,44,41,tones[1]);
  a.line(3,2,43,2,tones[2]).line(2,3,2,39,tones[2]).line(4,44,44,44,'edge').line(45,4,45,43,tones[0]);
  a.poly([[3,3],[25,3],[16,8],[3,11]],tones[2]);
  a.line(13,4,23,4,tones[3]);
  const random=rng(1301+region*41+variant);
  for(let i=0;i<14;i++){const x=4+Math.floor(random()*38), y=5+Math.floor(random()*34); a.line(x,y,x+2,y, i%3===0?tones[2]:tones[0]);}
  if(region===0 || region===2) {
    for(const [x,y] of [[6,32],[35,9],[37,35]]){ a.line(x,y,x-2,y-4,tones[0]);a.line(x,y,x+2,y-6,tones[2]);a.line(x,y-1,x,y-5,tones[3]); }
    if(variant){a.oval(10,12,6,4,tones[0]).oval(9,10,5,3,tones[2]);a.line(6,9,10,9,tones[3]);}
    if(region===2){a.dot(37,36,'cream').dot(6,31,'white');}
  } else if(region===1) {
    a.line(6,29,18,29,tones[2]).line(18,28,28,28,tones[2]);a.line(29,27,37,27,tones[2]);
    if(variant){a.poly([[6,10],[11,8],[16,10],[16,13],[10,15],[6,13]],tones[0]);a.line(8,9,12,9,tones[3]);}
  } else {
    a.line(9,8,18,17,tones[0]).line(18,17,16,25,tones[0]).line(16,25,28,36,tones[0]);
    a.line(10,8,19,17,tones[3]).line(17,25,29,36,tones[2]);
    if(variant){a.poly([[31,5],[39,11],[35,18],[29,16]],tones[2]);a.line(31,6,35,11,tones[3]);}
  }
  return a;
}
for(let i=0;i<4;i++)add(`B0${i+1}`,[tile(i,0),tile(i,1)]);

function star(a,cx,cy,r=11) {
  const pts=[];for(let i=0;i<10;i++){const t=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push([Math.round(cx+Math.cos(t)*rr),Math.round(cy+Math.sin(t)*rr)]);}
  a.poly(pts,'goldDark');const inner=pts.map(([x,y])=>[Math.round(cx+(x-cx)*.82),Math.round(cy+(y-cy)*.82)]);a.poly(inner,'honey').line(cx,cy-r+3,cx,cy+3,'cream').line(cx-4,cy,cx+4,cy,'cream');
}
function chest(a,x,y,scale=1) {
  const b=new Art(32); b.rect(5,10,23,16,'ink').rect(6,11,21,13,'goldDark').rect(7,12,19,5,'woodLight').rect(7,18,19,6,'wood');
  b.line(7,17,25,17,'ink').line(8,13,24,13,'honey').rect(9,11,2,13,'gold').rect(23,11,2,13,'gold').rect(16,16,4,5,'honey').dot(18,18,'ink').line(8,25,25,25,'edge');
  a.blit(b,x,y);
}
function heart(a,cx,cy) {
  a.poly([[cx-10,cy-4],[cx-6,cy-8],[cx-2,cy-8],[cx,cy-5],[cx+3,cy-8],[cx+7,cy-8],[cx+11,cy-4],[cx+10,cy+1],[cx,cy+12],[cx-10,cy+1]],'ink');
  a.poly([[cx-8,cy-3],[cx-5,cy-6],[cx-2,cy-6],[cx,cy-2],[cx+3,cy-6],[cx+6,cy-6],[cx+9,cy-3],[cx+8,cy+1],[cx,cy+9],[cx-8,cy+1]],'red');
  a.line(cx-6,cy-3,cx-3,cy-3,'redWhite').line(cx-7,cy-2,cx-7,cy,'redLight').line(cx,cy+6,cx+6,cy,'redLight');
}
function flame(a,x,y) {
  a.poly([[x,y-14],[x+4,y-7],[x+3,y-3],[x+7,y-6],[x+8,y+2],[x+4,y+7],[x-4,y+7],[x-8,y+2],[x-5,y-7],[x-2,y-4]],'redDark');
  a.poly([[x,y-11],[x+2,y-4],[x+5,y-2],[x+5,y+3],[x+1,y+6],[x-4,y+3],[x-4,y-2]],'orange');
  a.poly([[x,y-4],[x+2,y+1],[x+1,y+5],[x-2,y+3]],'cream');
}
const overlays=[];
for(let i=0;i<5;i++){
  const a=new Art(48);
  if(i===0){a.oval(24,29,15,5,'greenDark');star(a,24,22,13);a.dot(11,13,'cream').dot(37,25,'honey');}
  if(i===1){a.oval(24,35,14,3,'ink');chest(a,8,7);}
  if(i===2){a.oval(24,27,16,9,'ink').oval(24,25,14,7,'slate').oval(24,26,10,5,'ink');for(let x=14;x<37;x+=6)a.poly([[x,22],[x+2,15],[x+4,22]],'silver');a.line(11,31,36,31,'stone');}
  if(i===3){a.rect(11,33,26,4,'ink').rect(13,30,22,4,'stone').rect(16,26,16,5,'slate').rect(18,22,12,4,'gold');flame(a,24,18);}
  if(i===4){a.oval(24,34,15,5,'cyanDark');a.line(11,34,37,34,'cyan');heart(a,24,19);a.rect(35,10,1,5,'white').rect(33,12,5,1,'white');}
  overlays.push(a);
}add('B05',overlays);
function home(goal=false){const a=new Art(48);a.rect(0,0,48,48,'ink').rect(2,2,44,42,'edge').rect(3,3,42,37,'slate').line(4,3,42,3,'silver').line(4,40,42,40,'shadow');if(goal){a.oval(24,23,15,15,'goldDark').oval(24,22,13,13,'gold').oval(24,22,11,11,'edge');star(a,24,22,9);}else{a.poly([[12,18],[24,9],[36,18],[32,22],[24,16],[16,22]],'goldDark').poly([[14,17],[24,10],[34,17],[32,19],[24,14],[16,19]],'cream');a.poly([[12,29],[24,20],[36,29],[32,33],[24,27],[16,33]],'gold');}return a;}add('B06',[home(),home(true)]);
function pen(){const a=new Art(96);a.rect(1,1,94,92,'ink').rect(3,3,90,86,'goldDark').rect(5,5,86,81,'edge').line(5,5,90,5,'honey').line(5,6,5,85,'gold');for(const x of [7,49])for(const y of [7,49]){a.rect(x,y,39,35,'shadow').rect(x+2,y+2,35,29,'slate').line(x+3,y+2,x+32,y+2,'stone');a.oval(x+19,y+23,13,6,'edge');}for(const [x,y]of [[4,4],[87,4],[4,83],[87,83]])a.rect(x,y,5,5,'cream').dot(x+2,y+2,'goldDark');return a;}add('B07',[pen()]);

// 32px heroes. Tribe anatomy and class silhouette are authored separately.
const tribes=['human','demon','elf','dragon'];
const classes=['knight','mage','archer','assassin'];
const cloth={human:['redDark','red','redLight','redWhite'],demon:['sandDark','orange','honey','cream'],elf:['greenDark','green','greenLight','greenWhite'],dragon:['purpleDark','purple','purpleLight','purpleWhite']};
function hero(tribe,cls,style,frame){
  const a=new Art(32),[dark,mid,light,bright]=cloth[tribe], bob=frame===1?1:0;
  // asymmetric cape / quiver / robes behind the figure
  if(cls==='mage'||style==='cloak')a.poly([[11,13],[21,13],[25,28],[8,28]],'ink').poly([[12,14],[20,14],[23,27],[10,26]],dark).line(12,16,10,25,mid).line(19,17,22,25,mid);
  if(cls==='archer')a.poly([[19,11],[23,10],[24,23],[21,24]],'ink').line(22,11,23,22,'wood').line(21,11,23,5,'steel').line(23,12,26,6,'cream');
  // boots and split legs
  const stepL=frame===2?1:0,stepR=frame===3?1:0;
  a.rect(11,23,5,6-stepL,'ink').rect(17,23,5,6-stepR,'ink').rect(12,24,3,3-stepL,'shadow').rect(18,24,3,3-stepR,'shadow');
  a.rect(10,28-stepL,6,3,'ink').rect(17,28-stepR,6,3,'ink').line(11,28-stepL,14,28-stepL,'woodLight').line(18,28-stepR,21,28-stepR,'woodLight');
  const body=new Art(32);
  // shoulders, hand silhouettes, torso
  body.poly([[10,13],[20,13],[24,17],[22,21],[20,20],[20,25],[11,25],[11,20],[9,21],[6,18]],'ink');
  body.poly([[11,14],[19,14],[21,17],[20,22],[18,25],[12,24],[10,17]],mid).rect(12,15,7,6,light).rect(17,16,2,7,mid).line(12,15,16,15,bright);
  body.rect(10,22,11,2,'goldDark').rect(15,22,3,2,'honey').dot(16,22,'cream');
  body.rect(7,17,3,4,'skinDark').rect(7,17,2,2,'skin').rect(21,18,3,4,'skinDark').rect(21,18,2,2,'skinLight');
  if(cls==='knight'||style==='armor'){
    body.poly([[10,14],[14,14],[13,18],[8,18],[7,16]],'slate').line(8,15,12,15,'steel');
    body.poly([[19,14],[22,14],[25,17],[21,18],[19,17]],'stone').line(20,15,22,15,'white');
    body.poly([[12,16],[18,16],[19,20],[16,22],[12,20]],'slate').line(13,17,17,17,'silver').line(13,18,13,20,'steel');body.rect(15,18,2,3,mid);
  }
  if(cls==='mage'){body.poly([[11,20],[20,20],[23,27],[9,27]],dark).line(12,20,11,25,light).line(19,20,20,25,mid).line(10,27,22,27,'gold').rect(14,15,2,6,'honey').dot(15,17,'cream');}
  if(cls==='archer'){body.line(11,14,19,22,'goldDark',2).line(12,14,20,22,'woodLight');body.rect(12,18,2,3,dark);}
  if(cls==='assassin'){body.rect(10,14,11,3,dark).rect(11,15,7,1,light).line(10,14,6,12,mid).line(6,12,4,12,light);body.rect(14,18,2,3,'shadow');}
  // face, strong 1px silhouette, eyes distinct from shadow
  const headY=style==='chibi'?3:4;
  body.poly([[12,headY],[18,headY],[21,headY+3],[20,11],[17,13],[12,12],[10,8],[10,headY+3]],'ink');
  body.rect(12,headY+2,7,6,'skin').rect(12,headY+2,2,4,'skinLight').rect(18,headY+3,2,5,'skinDark').line(13,11,17,11,'skinDark');
  if(tribe==='elf'){body.poly([[10,7],[7,5],[8,10],[11,10]],'skinDark').poly([[20,7],[24,5],[22,10],[20,10]],'skin').dot(22,7,'skinLight');}
  if(tribe==='demon'){body.poly([[10,6],[8,1],[8,0],[12,4]],'goldDark').line(9,2,11,5,'cream');body.poly([[19,5],[22,0],[23,1],[21,7]],'goldDark').line(21,4,22,2,'honey');body.rect(12,6,7,4,'redLight').rect(18,7,1,3,'red');}
  if(tribe==='dragon'){body.poly([[11,5],[9,1],[12,2],[14,4]],'purpleLight').poly([[18,4],[21,1],[23,1],[20,6]],'purpleLight').rect(12,6,7,4,'purpleLight').rect(18,7,1,3,'purple');body.dot(15,11,'purpleWhite');}
  // hairstyle, hood or helmet, with different outline per class
  if(cls==='knight'){
    body.poly([[11,4],[14,2],[18,2],[21,5],[20,8],[11,8]],'slate').line(12,4,18,4,'steel').rect(12,5,7,2,'silver').rect(15,2,2,7,'gold');body.rect(12,8,7,2,'ink').dot(13,8,'blueWhite').dot(18,8,'blueWhite').rect(10,8,2,3,'stone').rect(20,7,2,4,'slate');
    if(tribe==='demon'){body.line(9,1,11,5,'honey');body.line(22,1,20,5,'honey');}
  } else if(cls==='mage'){
    body.poly([[10,7],[14,1],[17,0],[20,7],[23,8],[22,10],[9,10],[8,8]],'ink').poly([[11,7],[15,2],[17,2],[19,7]],dark).line(15,3,13,6,mid).rect(10,7,12,2,mid).line(11,7,20,7,'honey').dot(16,5,bright);
  } else if(cls==='assassin'){
    body.poly([[10,6],[12,3],[18,2],[21,5],[21,10],[19,12],[18,6],[12,7],[11,11],[9,9]],dark).line(12,4,17,3,light).rect(12,10,7,3,mid).line(13,11,17,11,light);
  } else {
    body.poly([[10,6],[11,3],[17,2],[20,4],[20,7],[17,5],[13,5],[11,8]],'hair').line(12,3,16,3,'woodLight').rect(11,5,9,1,mid);
    if(tribe==='elf')body.poly([[17,4],[23,1],[21,4]],'greenLight');
  }
  if(cls!=='knight'){body.dot(13,8,'ink').dot(17,8,'ink').dot(13,7,'white');if(tribe==='dragon')body.dot(17,8,'cream');}
  a.blit(body,0,bob);
  // signature weapons (not recolored skin blobs)
  if(cls==='knight'){
    a.poly([[2,14],[8,12],[12,14],[11,23],[7,27],[3,24]],'ink').poly([[3,15],[8,13],[11,15],[10,22],[7,25],[4,23]],'gold').poly([[4,16],[8,15],[10,16],[9,22],[7,24],[5,22]],dark).line(7,16,7,22,'honey').line(5,18,9,18,'honey').dot(5,15,'cream');
    a.poly([[26,4],[29,2],[29,16],[26,19],[25,16]],'ink').poly([[27,5],[28,4],[28,15],[26,17]],'silver').line(27,5,27,14,'white').rect(24,18,7,2,'gold').rect(26,20,2,5,'wood').dot(26,24,'honey');
  } else if(cls==='mage'){
    a.line(27,9,25,29,'ink',3).line(28,10,26,28,'woodLight');a.rect(25,10,6,2,'gold');
    a.poly([[28,1],[31,5],[30,9],[27,11],[24,8],[24,5]],'ink').poly([[28,2],[30,5],[29,8],[27,9],[25,7],[25,5]],'cyan').line(28,3,26,6,'cyanLight').dot(28,8,'cyanDark');a.dot(22,3,'cyan').dot(30,0,'white');
  } else if(cls==='archer'){
    a.line(27,5,29,9,'ink',2).line(29,9,30,17,'ink',2).line(30,17,28,25,'ink',2).line(28,25,25,28,'ink',2);
    a.line(27,6,29,10,'honey').line(29,10,30,17,'woodLight').line(30,17,28,24,'gold').line(28,24,26,27,'honey').line(26,7,25,26,'steel');
    a.line(21,18,31,13,'woodLight').poly([[30,11],[31,13],[29,15]],'white').rect(23,17,2,2,'skinLight');
  } else {
    a.line(4,17,7,24,'ink',2).line(3,12,4,18,'ink',2).line(4,13,5,19,'steel').line(4,13,4,16,'white').line(3,20,7,19,'gold').rect(6,21,2,3,'wood');
    a.line(25,24,29,17,'ink',2).line(28,17,30,12,'ink',2).line(29,13,27,20,'silver').dot(29,13,'white').line(25,20,29,22,'gold').rect(24,23,2,2,'wood');
  }
  return a;
}
for(const [style,start] of [['armor',21],['cloak',41],['chibi',61]])for(let c=0;c<4;c++)for(let t=0;t<4;t++)add(`H${start+c*4+t}`,Array.from({length:4},(_,f)=>hero(tribes[t],classes[c],style,f)));
for(let t=0;t<4;t++)for(let c=0;c<4;c++)add(`H${String(1+t*4+c).padStart(2,'0')}`,Array.from({length:4},(_,f)=>hero(tribes[t],classes[c],'armor',f)));

// Custom Elf Mage variant - Moonlight Elf Mage (blue robes instead of green)
function moonlightElfMage(frame){
  const a = new Art(32);
  const bob = frame === 1 ? 1 : 0;
  
  // Cape behind character (for mage)
  a.poly([[11,13],[21,13],[25,28],[8,28]], 'ink');
  a.poly([[12,14],[20,14],[23,27],[10,26]], 'iceDark'); // dark blue robes
  a.line(12,16, 10, 25, 'ice');
  a.line(19,17, 22, 25, 'ice');
  
  // Boots
  a.rect(11, 23, 5, 6 - bob, 'ink');
  a.rect(17, 23, 5, 6 - bob, 'ink');
  a.rect(12, 24, 3, 3 - bob, '#323e4b'); // shadow
  a.rect(18, 24, 3, 3 - bob, '#323e4b'); // shadow
  
  // Body torso
  const body = new Art(32);
  
  // Shoulders and hands
  body.poly([[10,13],[20,13],[24,17],[22,21],[20,20],[20,25],[11,25],[11,20],[9,21],[6,18]], 'ink');
  body.poly([[11,14],[19,14],[21,17],[20,22],[18,25],[12,24],[10,17]], 'ice');
  body.rect(12, 15, 7, 6, 'iceLight');
  body.rect(17, 16, 2, 7, 'ice');
  body.line(12, 15, 16, 15, 'iceWhite');
  
  // Arms
  body.rect(7, 17, 3, 4, 'skinDark');
  body.rect(7, 17, 2, 2, 'skin');
  body.rect(21, 18, 3, 4, 'skinDark');
  body.rect(21, 18, 2, 2, 'skinLight');
  
  // Mage robes at bottom (BLUE variant)
  body.poly([[11,20],[20,20],[23,27],[9,27]], 'iceDark');
  body.line(12,20, 11, 25, 'iceLight');
  body.line(19,20, 20, 25, 'ice');
  body.line(10,27, 22, 27, 'honey'); // gold trim
  
  // Robe ornament (crystal star pattern)
  body.rect(14, 15, 2, 6, 'gold');
  body.dot(15, 17, 'cream');
  
  // Face/Head area
  const headY = 4;
  body.poly([[12,headY],[18,headY],[21,headY+3],[20,11],[17,13],[12,12],[10,8],[10,headY+3]], 'ink');
  body.rect(12, headY+2, 7, 6, 'skin');
  body.rect(12, headY+2, 2, 4, 'skinLight');
  body.rect(18, headY+3, 2, 5, 'skinDark');
  body.line(13, 11, 17, 11, 'skinDark');
  
  // ELF EARS (pointed ears characteristic)
  body.poly([[10,7],[7,5],[8,10],[11,10]], 'skinDark');
  body.poly([[20,7],[24,5],[22,10],[20,10]], 'skin');
  body.dot(22, 7, 'skinLight'); // ear highlight
  
  // LONG ELVEN HAIR (silver/blue for moonlight elf)
  body.poly([[10,6],[11,3],[17,2],[20,4],[20,7],[17,5],[13,5],[11,8]], 'purpleDark');
  body.line(12, 3, 16, 3, 'purpleLight'); // silver highlight
  body.rect(11, 5, 9, 1, 'blue'); // blue strip in hair
  
  // Add eyes
  body.dot(13, 8, 'ink');
  body.dot(17, 8, 'ink');
  body.dot(13, 7, 'white'); // white highlight
  
  a.blit(body, 0, bob);
  
  // MAGIC STAFF (signature weapon for mage) - BLUE VARIANT
  // Staff shaft
  a.line(27, 9, 25, 29, 'ink', 3);
  a.line(28, 10, 26, 28, 'woodLight'); // wood staff
  
  // Crystal orb at top of staff (CYAN/MAGIC color)
  a.poly([[28,1],[31,5],[30,9],[27,11],[24,8],[24,5]], 'ink');
  a.poly([[28,2],[30,5],[29,8],[27,9],[25,7],[25,5]], 'cyan'); // cyan magic orb
  a.line(28, 3, 26, 6, 'cyanLight'); // glow
  body.dot(28, 8, 'cyanDark'); // base
  
  // Magic glow particles around crystal
  body.dot(22, 3, 'cyan');
  body.dot(30, 0, 'white');
  
  return a;
}
add('H_CUSTOM_01', Array.from({length: 4}, (_, f) => moonlightElfMage(f)));

// Văn hoá Việt batch (14/10/2026): nón lá warrior, Đông Sơn bronze drum, lotus.
function nonLaWarrior(frame){
  const a=new Art(32), bob=frame===1?1:0, stepL=frame===2?1:0, stepR=frame===3?1:0;
  // trắng quần: white trousers under the split hem, dark feet
  a.rect(11,24,5,5-stepL,'ink').rect(17,24,5,5-stepR,'ink');
  a.rect(12,25,3,3-stepL,'white').rect(18,25,3,3-stepR,'white');
  a.rect(16,24,1,3,'white');
  a.rect(10,28-stepL,6,3,'ink').rect(17,28-stepR,6,3,'ink').line(11,28-stepL,14,28-stepL,'woodLight').line(18,28-stepR,21,28-stepR,'woodLight');
  const body=new Art(32);
  // face under the hat brim
  body.rect(11,9,9,5,'ink').rect(12,10,7,3,'skin').rect(12,10,2,2,'skinLight').rect(18,10,1,3,'skinDark');
  body.dot(13,11,'ink').dot(17,11,'ink');
  // áo dài: long split-hem tunic, gold collar, belt and hem trim
  body.poly([[10,12],[21,12],[24,17],[23,28],[17,28],[16,23],[15,28],[8,28],[7,17]],'ink');
  body.poly([[11,13],[20,13],[22,17],[21,26],[17,26],[16,22],[14,26],[10,26],[9,17]],'red');
  body.rect(12,14,7,6,'redLight');
  body.line(13,13,16,16,'gold').line(19,13,16,16,'gold');
  body.line(11,13,20,13,'redWhite');
  body.rect(9,20,13,2,'goldDark').rect(10,20,11,1,'gold').dot(15,20,'cream');
  body.line(10,27,14,27,'gold').line(17,27,21,27,'gold');
  // left sleeve and hand
  body.rect(6,15,4,7,'ink').rect(7,15,3,6,'red').rect(7,20,3,2,'skinDark').rect(7,20,2,1,'skin');
  // nón lá: conical straw hat, light from top-left
  body.poly([[5,10],[16,2],[27,10]],'ink');
  body.poly([[6,9],[16,3],[16,9]],'sandLight');
  body.poly([[16,3],[26,9],[16,9]],'sand');
  body.line(8,7,13,4,'sandWhite');
  body.line(5,9,27,9,'sandDark');
  body.dot(16,2,'gold');
  a.blit(body,0,bob);
  // giáo: spear with steel leaf head, gold ferrule and red tassel
  a.poly([[27,0],[30,4],[27,6],[24,4]],'ink').poly([[27,1],[29,4],[27,5],[25,4]],'steel').line(27,1,27,4,'white');
  a.line(27,6,27,29,'ink',3).line(27,7,27,28,'woodLight');
  a.rect(24,6,7,1,'gold');
  a.line(25,7,25,10,'red').line(29,7,29,9,'redLight');
  a.rect(25,15,3,4,'skinDark').rect(25,15,2,3,'skin');
  return a;
}
add('V01',Array.from({length:4},(_,f)=>nonLaWarrior(f)));

// Trống đồng Đông Sơn: bronze with patina, face star, sawtooth bands.
add('V02',[(()=>{
  const a=new Art(32);
  a.oval(16,8,13,5,'ink').oval(16,8,11,4,'greenDark').oval(16,8,10,3,'green');
  for(let i=0;i<12;i++){const t=i*Math.PI/6;a.dot(Math.round(16+Math.cos(t)*9),Math.round(8+Math.sin(t)*2),'honey');}
  const pts=[];for(let i=0;i<16;i++){const t=-Math.PI/2+i*Math.PI/8,rr=i%2?1.5:4;pts.push([Math.round(16+Math.cos(t)*rr),Math.round(8+Math.sin(t)*2)]);}
  a.poly(pts,'goldDark');const inner=pts.map(([x,y])=>[Math.round(16+(x-16)*.6),Math.round(8+(y-8)*.6)]);a.poly(inner,'honey').dot(16,8,'cream');
  a.poly([[3,11],[29,11],[25,17],[7,17]],'ink').poly([[5,12],[27,12],[24,16],[8,16]],'green');
  for(let x=7;x<21;x+=4)a.poly([[x,12],[x+2,14],[x+4,12]],'gold');
  a.line(5,15,27,15,'goldDark');
  a.rect(7,17,18,4,'ink').rect(8,18,16,3,'greenDark').line(9,18,23,18,'green');
  a.poly([[7,21],[25,21],[28,27],[4,27]],'ink').poly([[8,22],[24,22],[26,26],[6,26]],'green');
  for(let x=9;x<19;x+=4)a.poly([[x,23],[x+2,25],[x+4,23]],'honey');
  a.oval(16,27,12,3,'ink').oval(16,27,10,2,'greenDark');
  a.line(6,6,12,5,'greenLight');
  return a;
})()]);

// Hoa sen: five petals on a leaf base.
add('V03',[(()=>{
  const a=new Art(32);
  a.poly([[6,14],[10,8],[14,13],[13,21],[7,20]],'ink').poly([[7,14],[10,9],[13,13],[12,20],[8,19]],'redLight');
  a.poly([[26,14],[22,8],[18,13],[19,21],[25,20]],'ink').poly([[25,14],[22,9],[19,13],[20,20],[24,19]],'redLight');
  a.poly([[10,10],[13,4],[16,3],[19,4],[22,10],[21,22],[11,22]],'ink').poly([[11,10],[13,5],[16,4],[19,5],[21,10],[20,21],[12,21]],'red');
  a.line(12,8,14,6,'redWhite').line(15,5,17,5,'redWhite');
  a.poly([[8,20],[12,17],[16,21],[20,17],[24,20],[22,25],[10,25]],'ink').poly([[9,20],[12,18],[16,21],[20,18],[23,20],[21,24],[11,24]],'redLight');
  a.poly([[4,24],[10,21],[16,24],[22,21],[28,24],[24,28],[8,28]],'ink').poly([[6,24],[12,22],[16,24],[21,22],[26,24],[23,27],[9,27]],'green');
  a.line(7,24,12,23,'greenLight').dot(24,24,'greenLight');
  return a;
})()]);

// Shared icon vocabulary: real objects, 1px outlines, directional material light.
function shield(a,cx=16,cy=15,accent='blue'){
  a.poly([[cx-10,cy-9],[cx,cy-12],[cx+10,cy-9],[cx+9,cy+4],[cx,cy+12],[cx-9,cy+4]],'ink').poly([[cx-8,cy-8],[cx,cy-10],[cx+8,cy-8],[cx+7,cy+3],[cx,cy+9],[cx-7,cy+3]],'gold');
  a.poly([[cx-6,cy-6],[cx,cy-8],[cx+6,cy-6],[cx+5,cy+2],[cx,cy+7],[cx-5,cy+2]],accent).line(cx-6,cy-7,cx-1,cy-9,'cream').line(cx,cy-5,cx,cy+4,'steel').line(cx-4,cy-1,cx+4,cy-1,'steel');
}
function sword(a,dx=0,dy=0){a.poly([[22+dx,2+dy],[27+dx,3+dy],[26+dx,8+dy],[12+dx,23+dy],[8+dx,21+dy]],'ink').poly([[23+dx,4+dy],[25+dx,4+dy],[24+dx,8+dy],[12+dx,20+dy],[10+dx,20+dy]],'silver').line(23+dx,5+dy,11+dx,19+dy,'white').line(8+dx,18+dy,15+dx,25+dy,'goldDark',2).line(8+dx,18+dy,14+dx,24+dy,'honey').line(10+dx,24+dy,5+dx,29+dy,'wood',2).rect(3+dx,28+dy,4,3,'gold');}
function arrow(a,x0,y0,x1,y1){a.line(x0,y0,x1,y1,'ink',3).line(x0+1,y0,x1+1,y1,'woodLight');a.poly([[x1-4,y1+4],[x1+1,y1-3],[x1+5,y1+1]],'steel').dot(x1+1,y1-1,'white');a.line(x0-2,y0-1,x0+3,y0+3,'silver');}
function crown(a){a.poly([[4,8],[10,14],[16,4],[22,14],[28,8],[26,26],[6,26]],'ink').poly([[6,11],[11,17],[16,8],[21,17],[26,11],[24,24],[8,24]],'gold').line(8,22,24,22,'honey',2).line(8,23,23,23,'cream').rect(14,17,4,4,'redDark').rect(15,17,2,2,'redLight').dot(16,9,'cream');}
function eye(a){a.poly([[3,16],[9,9],[16,6],[23,9],[29,16],[23,23],[16,26],[9,23]],'ink').poly([[5,16],[10,11],[16,9],[22,11],[27,16],[22,21],[16,23],[10,21]],'white').oval(16,16,6,7,'cyanDark').oval(16,16,4,6,'cyan').rect(15,11,3,11,'ink').rect(17,12,2,3,'white');}
function leaf(a){a.poly([[5,25],[6,15],[12,7],[25,3],[27,7],[25,17],[19,25],[9,27]],'ink').poly([[7,23],[8,15],[13,9],[25,5],[23,16],[18,23],[10,25]],'green').line(8,24,23,8,'greenWhite').line(12,20,10,13,'greenLight').line(16,16,21,17,'greenLight').line(17,15,16,9,'greenLight');}
function skull(a){a.oval(16,13,11,11,'ink').oval(16,12,9,9,'cream').rect(9,19,14,7,'ink').rect(10,19,12,5,'honey').rect(10,12,4,5,'ink').rect(18,12,4,5,'ink').rect(15,17,3,3,'goldDark');for(let x=11;x<23;x+=3)a.rect(x,21,1,4,'ink');a.line(10,6,16,4,'white');}
function bottle(a){a.rect(12,2,8,4,'ink').rect(13,3,6,2,'woodLight').rect(12,6,8,6,'ink').oval(16,21,10,10,'ink').oval(16,20,8,9,'blueLight').oval(16,22,7,6,'red').rect(13,8,6,5,'blueLight').rect(11,16,2,5,'white').line(13,14,19,14,'blueWhite').line(12,26,18,27,'redLight');}
function dice(a){a.poly([[6,5],[24,3],[29,9],[27,26],[9,29],[4,22]],'ink').poly([[7,7],[23,5],[26,10],[10,13],[6,10]],'white').poly([[7,12],[12,15],[12,26],[7,22]],'gold').poly([[14,15],[26,11],[25,25],[14,27]],'cream');a.rect(17,15,3,3,'ink').rect(22,21,3,3,'ink').rect(9,17,2,3,'ink').line(12,9,18,8,'gold');}
function wings(a,n){for(let i=0;i<n;i++){const x=i%2?22:10,y=i<2?13:23; a.poly([[16,y+3],[x,y-7],[x+(x<16?-7:7),y-10],[x+(x<16?-5:5),y],[16,y+6]],'ink').poly([[16,y+1],[x,y-5],[x+(x<16?-5:5),y-7],[x+(x<16?-3:3),y-1]],'silver');}a.rect(14,14,4,11,'gold').rect(15,13,2,8,'cream');}
const iconBuilders={
  C01:a=>shield(a,16,15,'red'), C02:leaf, C03:a=>{a.poly([[5,27],[3,18],[5,5],[8,3],[8,14],[13,18],[16,17],[20,18],[25,13],[25,3],[28,5],[29,18],[26,27]],'ink').poly([[6,25],[5,18],[6,8],[8,16],[13,21],[19,21],[24,16],[27,8],[27,19],[24,25]],'orange').line(6,18,7,23,'cream').line(26,18,25,23,'honey').rect(11,21,10,7,'redDark').dot(13,23,'cream').dot(19,23,'cream');},
  C04:a=>{a.poly([[4,21],[6,12],[13,9],[19,3],[23,3],[20,10],[27,14],[29,21],[24,25],[11,28]],'ink').poly([[6,21],[8,14],[15,12],[20,6],[19,13],[25,16],[27,21],[22,23],[11,25]],'purple').line(10,15,15,13,'purpleLight').rect(18,15,4,2,'cream').rect(23,19,3,2,'purpleDark').poly([[9,20],[13,23],[19,22],[17,25],[11,25]],'purpleLight');},
  C05:a=>wings(a,2), C06:a=>wings(a,4), C07:a=>shield(a,16,15,'slate'), C08:crown,
  K01:a=>{heart(a,16,13);a.line(17,23,17,29,'red',2).dot(18,30,'redLight').line(8,24,5,27,'steel').line(22,7,26,3,'steel');},
  K02:a=>{a.poly([[20,2],[7,17],[14,18],[10,30],[26,13],[18,13]],'ink').poly([[19,5],[10,16],[17,16],[13,25],[23,15],[15,15]],'honey').line(18,7,13,14,'cream').dot(17,19,'wood').dot(20,15,'goldDark');},
  K03:a=>{for(const [x,y]of [[16,1],[29,16],[16,29],[2,16]])a.line(16,16,x,y,'gold');a.oval(16,16,9,9,'ink').oval(16,16,7,7,'gold').oval(16,16,4,4,'cream').line(11,15,19,7,'white');},
  K04:a=>{a.line(15,18,15,29,'ink',5).line(16,18,16,28,'woodLight',2).rect(11,17,10,3,'gold');flame(a,16,13);a.dot(22,4,'purpleLight');},
  K05:a=>{dice(a);a.line(18,24,18,30,'red',2).dot(21,28,'redLight');},
  K06:a=>{a.oval(16,14,11,13,'ink').oval(16,13,9,11,'gold').oval(16,13,7,9,'purpleDark').rect(12,25,8,4,'goldDark').line(11,29,21,29,'honey');a.poly([[11,18],[14,10],[18,10],[22,19]],'ink').dot(14,13,'cyanLight').dot(18,13,'cyanLight').line(11,9,17,5,'purpleLight');},
  K07:eye,
  K08:a=>{a.line(5,12,5,6,'ink',4).line(5,6,24,6,'cyanDark',3).poly([[22,2],[29,7],[22,12]],'cyan');a.line(24,21,24,27,'ink',4).line(24,27,7,27,'purple',3).poly([[9,21],[2,26],[9,31]],'purpleLight');a.line(8,5,22,5,'cyanLight');},
  K09:skull, K10:crown,
  K11:a=>{a.oval(10,10,8,8,'ink').oval(10,10,6,6,'gold').oval(10,10,3,3,'purpleDark').line(15,16,26,27,'ink',5).line(16,16,27,27,'honey',2).line(19,20,21,18,'gold',3).line(23,24,25,22,'gold',3).line(5,7,9,4,'cream');},
  K12:a=>{a.poly([[4,6],[12,4],[21,7],[28,5],[27,27],[20,29],[11,26],[3,28]],'ink').poly([[6,8],[12,6],[20,9],[26,7],[25,25],[20,27],[11,24],[5,26]],'honey').line(12,7,11,23,'gold').line(20,9,20,25,'goldDark');a.line(16,12,23,19,'red',2).line(23,12,16,19,'red',2).line(7,18,15,18,'wood');},
  S01:a=>shield(a), S02:a=>{sword(a);a.line(2,8,11,8,'honey').line(2,12,9,12,'gold').line(3,16,6,16,'gold');},
  S03:a=>{for(const [x,y]of [[10,10],[17,17],[23,24]])a.oval(x,y,6,7,'ink').oval(x,y,4,5,'silver').oval(x,y,2,3,'ink');a.line(9,5,11,5,'white').line(16,12,18,12,'white');},
  S04:a=>{a.poly([[3,8],[9,5],[16,9],[23,5],[29,8],[28,27],[23,25],[16,28],[9,25],[4,27]],'ink').poly([[5,9],[10,7],[15,11],[15,25],[10,23],[6,24]],'cream').poly([[17,11],[23,7],[27,9],[26,24],[22,23],[17,25]],'honey').line(8,11,12,13,'goldDark').line(8,16,12,17,'goldDark').line(21,12,24,11,'goldDark');},
  S05:a=>{arrow(a,6,25,23,6);a.rect(3,26,5,3,'red').dot(8,29,'redLight');},
  S06:a=>{arrow(a,4,28,8,6);arrow(a,10,28,18,4);arrow(a,17,28,26,9);},
  S07:a=>{a.oval(16,16,12,12,'ink').oval(16,16,10,10,'purpleLight').oval(20,12,9,10,'ink');a.dot(8,8,'white').dot(24,24,'purpleWhite');},
  S08:a=>{a.poly([[7,11],[23,11],[28,23],[24,29],[8,29],[4,23]],'ink').poly([[9,12],[21,12],[25,23],[22,27],[9,27],[7,22]],'wood').poly([[10,4],[22,4],[19,12],[12,12]],'gold').rect(10,11,13,3,'goldDark').line(10,16,8,22,'woodLight');a.oval(17,21,5,5,'gold').oval(16,20,3,3,'honey').dot(15,18,'cream');},
  I01:sword, I02:a=>shield(a,16,15,'slate'), I03:bottle,
  I04:a=>{a.line(15,16,16,29,'ink',3);for(const [x,y]of [[10,9],[21,9],[10,20],[21,20]])a.oval(x,y,6,6,'ink').oval(x,y,4,4,'green').dot(x-1,y-2,'greenWhite');a.dot(16,15,'honey');},
};
Object.assign(iconBuilders, coreIconsV5);
for(const [id,draw]of Object.entries(iconBuilders)){const a=new Art(32);draw(a);add(id,[a]);}
// Five special overlays also serve as small 32px UI icons (drawn in their own source).
for(const [id,draw]of Object.entries({U01:a=>star(a,16,16,13),U02:a=>chest(a,0,-1),U03:a=>shield(a),U04:a=>flame(a,16,16),U05:a=>heart(a,16,13)})){const a=new Art(32);draw(a);add(id,[a]);}
for(let n=1;n<=6;n++){const a=new Art(32);a.rect(2,2,28,28,'ink').rect(3,3,26,24,'honey').rect(4,4,24,21,'cream').line(5,4,26,4,'white');const spots=n===1?[[16,15]]:n===2?[[10,9],[22,21]]:n===3?[[10,9],[16,15],[22,21]]:n===4?[[10,9],[22,9],[10,21],[22,21]]:n===5?[[10,9],[22,9],[16,15],[10,21],[22,21]]:[[10,8],[22,8],[10,15],[22,15],[10,22],[22,22]];for(const[x,y]of spots)a.rect(x-2,y-2,4,4,'ink').dot(x-1,y-1,'goldDark');add(`D0${n}`,[a]);}

// Animated, coherent FX: three frames, expanding silhouettes, clear impact cores.
for(let n=1;n<=10;n++){
  const frames=[];
  for(let f=0;f<3;f++){
    const a=new Art(48),r=8+f*5,cols=['honey','cyan','redLight','blueLight','purpleLight','orange','cream','greenLight','silver','honey'],col=cols[n-1];
    if(n===1||n===3||n===6){a.poly([[24-r,28+r],[22,19],[24+r,10-r],[27,20],[24,27]],col).line(24-r+2,26+r,24+r-2,12-r,'white');}
    else if(n===4||n===5){for(let i=0;i<6;i++){const t=i*Math.PI/3, x=Math.round(24+Math.cos(t)*r),y=Math.round(24+Math.sin(t)*r);a.line(24,24,x,y,col);a.rect(x-1,y-1,3,3,'white');}}
    else {a.oval(24,26,r,r*.6,col).oval(24,25,r-2,r*.6-2,'.');for(let i=0;i<4;i++){const x=10+i*8,y=24-f*4-(i%2)*5;a.line(x,y,x,y-5,col);a.dot(x,y-6,'white');}}
    if(f===0)a.rect(22,21,5,5,'white');frames.push(a);
  }
  add(`F${String(n).padStart(2,'0')}`,frames);
}

// Scenery props: not interactive, deliberately darker than the playable path.
function tree(kind=0){const a=new Art(64);a.oval(32,55,24,6,'ink').rect(28,35,8,21,'bark').rect(29,36,3,17,'wood');const c=kind===0?['mossDark','moss','mossLight']:['grassDark','grass','grassLight'];for(const[x,y,rx,ry]of [[20,31,15,12],[42,30,15,12],[32,18,18,16],[31,9,10,8]]){a.oval(x,y+2,rx,ry,'ink').oval(x,y,rx-1,ry-1,c[0]).oval(x-2,y-3,rx-3,ry-4,c[1]).line(x-5,y-6,x+2,y-6,c[2]);}a.line(29,52,24,55,'wood').line(35,53,39,56,'bark');return a;}
add('P01',[tree()]);add('P02',[tree(1)]);
function rock(ice=false){const a=new Art(64),c=ice?['iceDark','ice','iceLight']:['shadow','slate','stone'];a.oval(32,48,24,5,'ink').poly([[8,43],[16,26],[29,17],[44,23],[56,41],[50,49],[17,49]],c[0]).poly([[12,40],[18,27],[29,20],[42,25],[34,38]],c[2]).poly([[34,38],[42,25],[51,40],[47,46],[29,47]],c[1]).line(19,29,28,23,ice?'iceWhite':'silver').line(29,21,34,36,c[0]);return a;}add('P03',[rock()]);add('P04',[rock(true)]);

// Native nine-slice pixel frames for the DOM interface.
for(const[id,dark,mid,light]of [['Q01','goldDark','gold','cream'],['Q02','shadow','stone','silver']]){
  const a=new Art(16);a.rect(0,0,16,16,'ink').rect(1,1,14,14,dark).rect(2,2,12,12,mid).rect(3,3,10,10,'edge').rect(4,4,8,8,'.');
  a.line(4,2,11,2,light).line(2,4,2,11,light);
  for(const[x,y]of [[0,0],[11,0],[0,11],[11,11]])a.rect(x,y,5,5,'ink').rect(x+1,y+1,3,3,mid).dot(x+2,y+2,light);
  add(id,[a]);
}

// Compile matrices. Private palette avoids changing legacy art contracts.
// Lossless row RLE: count character (codepoint = 32 + count), then palette symbol.
// Decode once at module load; much smaller delivery than repeated matrix pixels.
const packRow = row => {
  let out='';for(let i=0;i<row.length;){let j=i+1;while(j<row.length&&row[j]===row[i])j++;out+=String.fromCharCode(32+j-i)+row[i];i=j;}return out;
};
const unpackRow = row => {let out='';for(let i=0;i<row.length;i+=2)out+=row[i+1].repeat(row.charCodeAt(i)-32);return out;};
const packed=assets.map(a=>[a.id,a.frames.map(f=>f.map(packRow))]);
for(let i=0;i<assets.length;i++)for(let f=0;f<assets[i].frames.length;f++)for(let y=0;y<assets[i].frames[f].length;y++)if(unpackRow(packed[i][1][f][y])!==assets[i].frames[f][y])throw new Error(`RLE mismatch ${assets[i].id}`);
const source=`// Generated by tools/gen_assets_zcode.mjs — native 2x pixel art, lossless row RLE.\nimport type { AssetDef } from './assets.ts';\nexport const PALETTE_ZCODE: Record<string, string> = ${JSON.stringify(PAL,null,2)};\nconst PACKED: [string, string[][]][] = ${JSON.stringify(packed)};\nfunction rowDecode(row: string): string {\n  let out = '';\n  for (let i = 0; i < row.length; i += 2) out += row[i + 1].repeat(row.charCodeAt(i) - 32);\n  return out;\n}\nexport const ASSETS_ZCODE: AssetDef[] = PACKED.map(([id, frames]) => ({id, frames: frames.map(f => f.map(rowDecode))}));\n`;
fs.writeFileSync(path.join(ROOT,'src/data/gfx/assets_zcode.ts'),source);
fs.writeFileSync(DATES_FILE, JSON.stringify(assetDates, null, 2));
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({pack:'zcode',version:4,tile:48,hero:32,icon:32,pen:96,colors:Object.keys(PAL).length,assets:assets.map(a=>({id:a.id,width:a.frames[0][0].length,height:a.frames[0].length,frames:a.frames.length,created:assetDates[a.id]}))},null,2));

// PNG encoder using only Node built-ins; assets remain true palette pixels.
function crc(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;}
function chunk(type,buf){const t=Buffer.from(type),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(buf.length);c.writeUInt32BE(crc(Buffer.concat([t,buf])));return Buffer.concat([l,t,buf,c]);}
function png(a,dest){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(a.w);ihdr.writeUInt32BE(a.h,4);ihdr[8]=8;ihdr[9]=6;const raw=Buffer.alloc(a.h*(a.w*4+1));for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){const c=a.p[y][x];if(c==='.')continue;const hex=PAL[c];if(!hex)throw new Error(`Unknown pixel ${c}`);const at=y*(a.w*4+1)+1+x*4;raw[at]=parseInt(hex.slice(1,3),16);raw[at+1]=parseInt(hex.slice(3,5),16);raw[at+2]=parseInt(hex.slice(5,7),16);raw[at+3]=255;}fs.writeFileSync(dest,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
function fromRows(rows){const a=new Art(rows[0].length,rows.length);a.p=rows.map(r=>r.split(''));return a;}
const sheet=new Art(640,540);sheet.rect(0,0,640,540,'ink');
// Hero contact sheet: 4 classes x 4 tribes, 3 styles, each at 3x native pixels.
for(let s=0;s<3;s++)for(let c=0;c<4;c++)for(let t=0;t<4;t++){
  const id=`H${[21,41,61][s]+c*4+t}`,a=fromRows(assets.find(a=>a.id===id).frames[0]);sheet.blit(a,12+t*38+s*210,12+c*40);
}
for(let i=0;i<4;i++)sheet.blit(tile(i,1),12+i*58,188);
for(let i=0;i<5;i++)sheet.blit(overlays[i],262+i*58,188);
let k=0;for(const a of assets.filter(a=>/^[CKSIUD]/.test(a.id))){sheet.blit(fromRows(a.frames[0]),12+(k%16)*38,254+Math.floor(k/16)*40);k++;}
for(let n=1;n<=10;n++){const a=assets.find(a=>a.id===`F${String(n).padStart(2,'0')}`);sheet.blit(fromRows(a.frames[1]),12+(n-1)*58,410);}
for(let n=1;n<=4;n++)sheet.blit(fromRows(assets.find(a=>a.id===`P0${n}`).frames[0]),12+(n-1)*76,466);
png(sheet,path.join(OUT,'CONTACT_SHEET.png'));
const zoom=new Art(sheet.w*2,sheet.h*2);for(let y=0;y<sheet.h;y++)for(let x=0;x<sheet.w;x++)zoom.rect(x*2,y*2,2,2,sheet.p[y][x]);png(zoom,path.join(OUT,'CONTACT_SHEET_2X.png'));
const coreSheet=new Art(288,192);coreSheet.rect(0,0,288,192,'ink');
for(let i=0;i<24;i++){const def=assets.find(a=>a.id===`K${String(i+1).padStart(2,'0')}`);if(!def)throw new Error(`Missing core ${i+1}`);coreSheet.blit(fromRows(def.frames[0]),i%6*48+8,Math.floor(i/6)*48+8);}
const coreZoom=new Art(1152,768);for(let y=0;y<192;y++)for(let x=0;x<288;x++)coreZoom.rect(x*4,y*4,4,4,coreSheet.p[y][x]);png(coreZoom,path.join(OUT,'CORES_K01_K24_4X.png'));
// Văn hoá Việt check sheet: hero frames + icons at 4x.
const vnSheet=new Art(240,40);vnSheet.rect(0,0,240,40,'ink');
for(let f=0;f<4;f++)vnSheet.blit(fromRows(assets.find(a=>a.id==='V01').frames[f]),f*40+4,4);
vnSheet.blit(fromRows(assets.find(a=>a.id==='V02').frames[0]),164,4);
vnSheet.blit(fromRows(assets.find(a=>a.id==='V03').frames[0]),204,4);
const vnZoom=new Art(960,160);for(let y=0;y<40;y++)for(let x=0;x<240;x++)vnZoom.rect(x*4,y*4,4,4,vnSheet.p[y][x]);
png(vnZoom,path.join(OUT,'VANHOAVIET_4X.png'));
let frameCount=0;for(const a of assets)for(const f of a.frames){frameCount++;if(f.some(r=>r.length!==f[0].length)||f.some(r=>[...r].some(p=>p!=='.'&&!PAL[p])))throw new Error(`Invalid ${a.id}`);}
console.log(`ZCODE_OK: ${assets.length} assets, ${frameCount} frames, ${Object.keys(PAL).length} colors. 48px tiles / 32px heroes and icons.`);
const byDate={};for(const a of assets)(byDate[assetDates[a.id]]??=[]).push(a.id);
console.log('Date folders: '+Object.keys(byDate).sort().map(d=>`png/${d} (${byDate[d].length} assets)`).join(', '));
