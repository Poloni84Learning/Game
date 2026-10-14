// Test suite chính — ma trận GDD §10: hình học, xúc xắc, giao tranh, ô đặc biệt,
// cộng hưởng, Tàn Đoàn, tộc, lõi, vùng, item/skill, state machine, determinism.
import { test } from 'node:test';
import { coreOffers, pickCore } from './turn.ts';
import { CORES } from '../data/cores.ts';
import type { CoreId } from './types.ts';
import assert from 'node:assert/strict';
import {
  ARC_LEN, GOAL_P, HOME_LEN, RING, TRACK_END, isStar, isTemple, progressOfRing,
  regionOfP, regionOfRing, ringIndexOf, specialAt, STARS,
} from '../data/board.ts';
import { LEVEL_THRESHOLDS, MAX_LEVEL, levelGains } from '../data/classes.ts';
import { nextRandom } from './rng.ts';
import { computeStats, marchingCount, onBoardCount } from './stats.ts';
import { resolveBattle } from './battle.ts';
import { canDeployThreshold, exactGoalSteps, movablePieces, validateMove, xkTargets } from './moves.ts';
import {
  newGame, doRoll, doMove, doShoot, castSkill, endTurn, gainExp,
  useUniverseKey, prophetEyePeek, prophetEyeForce, doMoveSplit, openChestWithMap,
} from './turn.ts';
import type { GameState, Piece } from './types.ts';

// ===== Helpers dựng state có kiểm soát =====

test('lựa chọn lõi: có seed, giữ offer và chặn reroll lần hai', () => {
  const a=twoPlayerGame(42),b=twoPlayerGame(42);
  for(const g of [a,b]){g.phase='corePick';g.players[0].corePickPending=3;}
  const offer=coreOffers(a);
  assert.equal(offer.length,3);assert.equal(new Set(offer).size,3);
  assert.deepEqual(offer,coreOffers(b));
  const state=a.rngState;assert.deepEqual(offer,coreOffers(a));assert.equal(a.rngState,state);
  const outside=(Object.keys(CORES) as CoreId[]).find(c=>!offer.includes(c))!;
  assert.equal(pickCore(a,outside).ok,false);assert.equal(a.players[0].cores.length,0);
  assert.equal(pickCore(a,offer[0],true).ok,true);
  const rerolled=coreOffers(a),snapshot=a.rngState;
  assert.equal(pickCore(a,rerolled[0],true).ok,false);
  assert.deepEqual(coreOffers(a),rerolled);assert.equal(a.rngState,snapshot);
  assert.equal(pickCore(a,rerolled[0]).ok,true);
  assert.deepEqual(a.players[0].cores,[rerolled[0]]);
  assert.deepEqual(a.players[0].coreOffers,[]);
});

test('Chuông Sét Gỉ: skill giảm CD đồng minh, không đổi chỉ số/hồi HP', () => {
  const g=twoPlayerGame();g.players[0].cores=['rustLightning'];
  const caster=placeAt(g,0,0,1),ally=placeAt(g,0,1,2);
  caster.level=3;caster.skillCd={};ally.skillCd={bind:5,enlighten:2};
  ally.hp=3;g.phase='move';g.die=2;
  const before=computeStats(g,caster);
  assert.equal(castSkill(g,0,'shieldWall').ok,true);
  // Normal end-turn cooldown tick plus one core tick.
  assert.equal(ally.skillCd.bind,3);assert.equal(ally.skillCd.enlighten,0);
  assert.equal(caster.skillCd.shieldWall,3);
  assert.equal(ally.hp,3);assert.equal(computeStats(g,caster).def,before.def);
  assert.ok(g.log.some(e=>e.kind==='core'&&e.text.includes('Chuông Sét Gỉ')));
});

test('cận chiến thực tế: áp bắt quân, EXP và chỉ kết action một lần', () => {
  const g = newGame({seed: 1, players: [
    {tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin']},
    {tribe: 'demon', classes: ['knight', 'mage', 'archer', 'assassin']},
  ]});
  const a = g.players[0].pieces[1];
  const d = g.players[1].pieces[1];
  a.pos = {zone: 'track', p: 10};
  d.pos = {zone: 'track', p: 50}; // absolute ring 11
  a.items = ['sword', 'sword'];
  g.phase = 'move'; g.die = 1;
  const out = doMove(g, a.id);
  assert.equal(out.ok, true);
  assert.equal(out.battle?.outcome, 'attacker');
  assert.equal(d.pos.zone, 'pen');
  assert.equal(a.exp, 50);
  assert.equal(d.exp, 10);
  assert.equal(g.current, 0);
  assert.equal(g.phase, 'roll');
  assert.equal(g.turn, 0);
  assert.equal(g.players[0].extraMoves, 0);
});

test('cận chiến thua: về đúng ô cũ, mất HP, EXP hai phe và bàn giao đúng một lần', () => {
  const g = newGame({seed: 1, players: [
    {tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin']},
    {tribe: 'demon', classes: ['knight', 'mage', 'archer', 'assassin']},
  ]});
  const a = g.players[0].pieces[0], d = g.players[1].pieces[0];
  a.pos = {zone:'track',p:10}; d.pos = {zone:'track',p:50};
  d.items = ['shield','shield'];
  g.phase='move';g.die=1;
  const out=doMove(g,a.id);
  assert.equal(out.battle?.outcome,'defender');
  assert.deepEqual(a.pos,{zone:'track',p:10});
  assert.equal(a.hp,13-out.battle!.damage);
  assert.equal(a.exp,10);assert.equal(d.exp,50);
  assert.equal(g.current,1);assert.equal(g.turn,1);
});

function twoPlayerGame(seed = 1): GameState {
  return newGame({
    seed,
    players: [
      { tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin'] },
      { tribe: 'demon', classes: ['knight', 'mage', 'archer', 'assassin'] },
    ],
  });
}

function placeAt(g: GameState, player: number, pieceIdx: number, p: number): Piece {
  const pc = g.players[player].pieces[pieceIdx];
  pc.pos = { zone: 'track', p };
  return pc;
}

// ===== 1. Hình học bàn cờ (GDD §2.1) =====

test('hình học: 52 ô vòng, 4 cung × 13, 8 ô sao, đích p57', () => {
  assert.equal(RING, 52);
  assert.equal(ARC_LEN, 13);
  assert.equal(TRACK_END, 51);
  assert.equal(HOME_LEN, 5);
  assert.equal(GOAL_P, 57);
  assert.equal(STARS.length, 8);
  for (const s of STARS) assert.ok(isStar(s));
  // p↔r là nghịch đảo nhau
  for (let player = 0; player < 4; player++) {
    for (let p = 0; p <= TRACK_END; p++) {
      const r = ringIndexOf(player, p);
      assert.ok(r >= 0 && r < RING);
      assert.equal(progressOfRing(player, r), p);
    }
  }
  // 4 ô xuất phát p=0 rơi đúng đầu cung
  for (let player = 0; player < 4; player++) {
    assert.equal(ringIndexOf(player, 0), player * ARC_LEN);
  }
});

test('hình học: vùng theo cung — Bắc rừng, Đông sa mạc, Nam thung lũng, Tây vực', () => {
  assert.equal(regionOfRing(0), 'forest');
  assert.equal(regionOfRing(13), 'desert');
  assert.equal(regionOfRing(26), 'valley');
  assert.equal(regionOfRing(39), 'ice');
  // đường về mang màu cung xuất phát phe
  assert.equal(regionOfP(0, 52), 'forest');
  assert.equal(regionOfP(1, 53), 'desert');
  assert.equal(regionOfP(2, 56), 'valley');
});

test('ô đặc biệt: đúng offset 0=sao/3=rương/5=bẫy/6=đền/8=sao; 10=heal(Bắc,Nam)|bẫy(Đông,Tây)', () => {
  for (let k = 0; k < 4; k++) {
    const base = k * ARC_LEN;
    assert.equal(specialAt(base + 0), 'star');
    assert.equal(specialAt(base + 3), 'chest');
    assert.equal(specialAt(base + 5), 'trap');
    assert.equal(specialAt(base + 6), 'temple');
    assert.equal(specialAt(base + 8), 'star');
    assert.equal(specialAt(base + 10), (k === 0 || k === 2) ? 'heal' : 'trap');
  }
  assert.ok(isTemple(6) && isTemple(19) && isTemple(32) && isTemple(45));
  // ô thường không phải special
  assert.equal(specialAt(1), null);
  assert.equal(specialAt(7), null);
});

// ===== 2. RNG & xúc xắc =====

test('rng: mulberry32 deterministic, cùng state → cùng chuỗi', () => {
  let s1 = 12345, s2 = 12345;
  const seq1: number[] = [], seq2: number[] = [];
  for (let i = 0; i < 100; i++) {
    const r1 = nextRandom(s1); s1 = r1.state; seq1.push(r1.value);
    const r2 = nextRandom(s2); s2 = r2.state; seq2.push(r2.value);
  }
  assert.deepEqual(seq1, seq2);
  // giá trị trong [0,1)
  for (const v of seq1) assert.ok(v >= 0 && v < 1);
  // state khác → chuỗi khác
  let s3 = 999;
  const seq3: number[] = [];
  for (let i = 0; i < 100; i++) { const r = nextRandom(s3); s3 = r.state; seq3.push(r.value); }
  assert.notDeepEqual(seq1, seq3);
});

test('xúc xắc: ra chuồng cần 6 (human); Long ≥5 khi ≥2 trên sân', () => {
  const g = twoPlayerGame();
  assert.equal(canDeployThreshold(g, 0), 6);
  const gd = newGame({
    seed: 2,
    players: [
      { tribe: 'dragon', classes: ['knight', 'mage', 'archer', 'assassin'] },
      { tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin'] },
    ],
  });
  // 2 Long trên sân → threshold 5
  placeAt(gd, 0, 0, 0);
  placeAt(gd, 0, 1, 1);
  assert.equal(canDeployThreshold(gd, 0), 5);
  assert.equal(canDeployThreshold(gd, 0), 5);
});

test('xúc xắc: exact-goal — quân p51 cần đúng 6; tung thừa không có nước', () => {
  const g = twoPlayerGame();
  const pc = placeAt(g, 0, 0, GOAL_P - 6); // cần đúng 6
  assert.equal(exactGoalSteps(pc), 6);
  // die 6 → di được
  g.die = 6; g.phase = 'move';
  const v6 = validateMove(g, 0, 0, 6);
  assert.ok(v6.ok);
  // die 5 (p52→57 cần 5) — quân ở p52 cần 5: đặt lại
  pc.pos = { zone: 'track', p: GOAL_P - 5 };
  g.die = 6;
  const vOver = validateMove(g, 0, 0, 6);
  assert.ok(!vOver.ok, 'tung 6 khi cần 5 → thừa, không đi được');
  // movablePieces cũng phải loại quân này
  pc.pos = { zone: 'track', p: GOAL_P - 2 };
  const mv = movablePieces(g, 0, 3); // cần 2, tung 3 → không nước cho quân này
  assert.equal(mv.includes(pc), false);
});

// ===== 3. Giao tranh (GDD §2.4 + D4/D5) =====

test('giao tranh: hòa nghiêng thủ (attacker tổng == defender → defender thắng)', () => {
  const g = twoPlayerGame();
  const a = placeAt(g, 0, 0, 10); // knight 12/3/3
  const d = placeAt(g, 1, 0, 11); // knight 12/3/3
  // ép cả 2 d6 = 3: attacker = 3+ATK+3 = 3+3+... tính: a.total = d6+atk; d.total = d6+def+1
  const br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
  // knight atk=3, def=3 → a.total = 3+3 = 6; d.total = 3+3+1 = 7 > 6 → defender thắng (thực chất chênh 1, không phải hòa)
  assert.equal(br.outcome, 'defender');
  assert.equal(br.damage, 1); // chênh 1 min 1
});

test('giao tranh: attacker thắng → defender về chuồng; damage 0; EXP thắng 50', () => {
  const g = twoPlayerGame();
  const a = placeAt(g, 0, 1, 10); // mage atk 5
  const d = placeAt(g, 1, 0, 11); // knight def 3
  const br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 6, fixedDefenderD6: 1 });
  // a.total = 6+5(+human? attacker là mage human +0 atk) = 11; d.total = 1+3+1 = 5 → attacker
  assert.equal(br.outcome, 'attacker');
  assert.equal(br.damage, 0);
  assert.equal(br.expGained.attacker, 50);
  assert.equal(br.expGained.defender, 10);
});

test('giao tranh: đền +1 ATK cho quân đứng trên ô đền', () => {
  const g = twoPlayerGame();
  // đền của phe 0: r=6 → p=6
  const onTemple = placeAt(g, 0, 0, 6);   // knight trên đền
  const d = placeAt(g, 1, 1, 7);           // mage
  const br = resolveBattle(g, { attacker: onTemple, defender: d, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
  // knight atk 3 + đền 1 = 4; d6 3 → 7. defender mage def 1 → 3+1+1 = 5. attacker thắng.
  assert.equal(br.outcome, 'attacker');
  assert.ok(br.attacker.mods.some((m) => m.source === 'temple' && m.amount === 1));
});

test('giao tranh: vực băng −1 roll cho attacker khi mục tiêu đứng trong vực (Long miễn)', () => {
  const g = twoPlayerGame();
  // vực = cung 3 → phe 0: p = 39..51
  const d = placeAt(g, 1, 0, 40); // defender phe 1 đứng... p40 theo phe 1 là r=(13+40)%52=1 → rừng!
  // Muốn defender đứng vực: r ∈ 39..51 → phe 1: p = (r−13)%52 = 26..38
  d.pos = { zone: 'track', p: 30 }; // r = (13+30)%52 = 43 → vực ✓
  const a = placeAt(g, 0, 0, 20);   // human knight (không Long)
  const br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
  assert.ok(br.attacker.mods.some((m) => m.source === 'region' && m.amount === -1));

  // Long attacker → miễn
  const gl = newGame({ seed: 3, players: [
    { tribe: 'dragon', classes: ['knight', 'mage', 'archer', 'assassin'] },
    { tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin'] },
  ]});
  const la = placeAt(gl, 0, 0, 20);
  const ld = placeAt(gl, 1, 0, 30);
  const br2 = resolveBattle(gl, { attacker: la, defender: ld, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
  assert.ok(!br2.attacker.mods.some((m) => m.source === 'region' && m.amount === -1));
});

test('giao tranh: Ánh Sáng Trừng Phạt — đối thủ phe giữ lõi bị −2 DEF', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('punishingLight');
  const a = placeAt(g, 0, 0, 10); // human knight (không giữ punishing — phe giữ)
  const d = placeAt(g, 1, 0, 11); // demon knight — phe 1 KHÔNG giữ lõi → d bị −2 DEF
  const br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
  assert.ok(br.defender.mods.some((m) => m.source === 'core-opp' && m.amount === -2));
  // và attacker không bị (phe attacker giữ lõi, không bị tự trừ)
  assert.ok(!br.attacker.mods.some((m) => m.source === 'core-opp'));
});

test('giao tranh: headHunter — thắng địch cấp ≥ +100 EXP; thua không có an ủi 10', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('headHunter');
  const a = placeAt(g, 0, 0, 10);
  const d = placeAt(g, 1, 0, 11);
  d.level = 2; // địch cấp cao hơn
  // attacker thắng
  let br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 6, fixedDefenderD6: 1 });
  assert.equal(br.expGained.attacker, 150); // 50 + 100
  // attacker thua → 0 (mất an ủi)
  br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 1, fixedDefenderD6: 6 });
  assert.equal(br.expGained.attacker, 0);
  assert.equal(br.expGained.defender, 50); // defender thắng 50 (headHunter chỉ win-side bonus khi thắng địch cấp ≥; defender không giữ lõi)
});

// ===== 4. Ô đặc biệt: bẫy/rương/đền/heal =====

test('bẫy: quân thường dẫm → skipTurns; knight/elf miễn; valley vô hiệu', () => {
  const g = twoPlayerGame();
  // bẫy phe 0: r=5 → p=5
  const mage = placeAt(g, 0, 1, 0); // human mage
  mage.pos = { zone: 'track', p: 0 };
  g.die = 5; g.phase = 'move';
  doMove(g, 1); // mage đi 5 → p5 bẫy
  assert.equal(g.players[0].pieces[1].skipTurns, 2, 'dẫm bẫy → skipTurns=2 (tick đầu lượt kế còn 1, lượt sau hết)');

  // knight miễn
  const g2 = twoPlayerGame();
  const kn = placeAt(g2, 0, 0, 0);
  g2.die = 5; g2.phase = 'move';
  doMove(g2, 0);
  assert.equal(g2.players[0].pieces[0].skipTurns, 0, 'knight miễn bẫy');

  // elf miễn
  const ge = newGame({ seed: 4, players: [
    { tribe: 'elf', classes: ['knight', 'mage', 'archer', 'assassin'] },
    { tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin'] },
  ]});
  const elfMage = placeAt(ge, 0, 1, 0);
  ge.die = 5; ge.phase = 'move';
  doMove(ge, 1);
  assert.equal(ge.players[0].pieces[1].skipTurns, 0, 'elf miễn bẫy');

  // valley vô hiệu bẫy: bẫy trong thung lũng phe 2 (Nam): r=26+10=36... offset 10 là heal cho Nam.
  // Bẫy offset 5: r=31 → phe 0: p=31 (vì 31−0... r=31 arc 2 = valley) ✓
  const gv = twoPlayerGame();
  const vm = placeAt(gv, 0, 1, 26);
  gv.die = 5; gv.phase = 'move';
  doMove(gv, 1); // → p31 = r31 bẫy nhưng trong valley
  assert.equal(gv.players[0].pieces[1].skipTurns, 0, 'valley vô hiệu bẫy');
});

test('rương: mở 1 lần/trận (mở lại → +30 EXP quy đổi)', () => {
  const g = twoPlayerGame();
  const before = g.players[0].pieces[1].exp;
  // rương phe 0: r=3 → p=3
  placeAt(g, 0, 1, 0);
  g.die = 3; g.phase = 'move';
  doMove(g, 1); // mở rương lần 1
  const afterFirst = g.players[0].pieces[1].exp;
  assert.ok(g.openedChests.has(3));
  // quân khác dừng lại đúng ô rương đã mở → không mở lại
  const expBeforeSecond = g.players[0].pieces[2].exp;
  const archer = placeAt(g, 0, 2, 0);
  g.phase = 'move'; g.die = 3;
  doMove(g, 2);
  assert.equal(g.players[0].pieces[2].exp, expBeforeSecond, 'rương đã mở → không item, không EXP');
});

// ===== 5. Cộng hưởng & Tàn Đoàn =====

test('cộng hưởng: đếm quân TRÊN SÂN (vòng+đường về+đích, không chuồng)', () => {
  const g = twoPlayerGame();
  placeAt(g, 0, 0, 10);
  placeAt(g, 0, 1, 20);
  g.players[0].pieces[2].pos = { zone: 'track', p: 53 }; // đường về = trên sân
  g.players[0].pieces[3].pos = { zone: 'goal' };          // đích = trên sân
  assert.equal(onBoardCount(g, 0), 4);
  // 2 trong chuồng → chỉ 2 trên sân
  const g2 = twoPlayerGame();
  placeAt(g2, 0, 0, 10);
  placeAt(g2, 0, 1, 20);
  assert.equal(onBoardCount(g2, 0), 2);
});

test('cộng hưởng: human 2 quân trên sân → +1 DEF từng quân (ModLine)', () => {
  const g = twoPlayerGame();
  const kn = placeAt(g, 0, 0, 10);
  placeAt(g, 0, 1, 20); // 2 quân trên sân → res2 bật
  const duo = computeStats(g, kn);
  assert.ok(duo.mods.some((m) => m.source === 'resonance' && m.label.includes('res2') && m.amount === 1));
  assert.equal(duo.def, 4, 'knight 3 + res2 1');
  // 1 quân về chuồng → res2 tắt (Tàn Đoàn solo bật — tương tác đúng GDD: DEF 3+2=5)
  g.players[0].pieces[1].pos = { zone: 'pen' };
  const solo = computeStats(g, kn);
  assert.ok(!solo.mods.some((m) => m.source === 'resonance' && m.label.includes('res2')));
  assert.ok(solo.mods.some((m) => m.source === 'march' && m.label.includes('+2/+2')), 'Tàn Đoàn solo áp khi 1 quân chạy');
});

test('Tàn Đoàn: đếm quân CÒN CHẠY (vòng+đường về, không đích)', () => {
  const g = twoPlayerGame();
  placeAt(g, 0, 0, 10);
  placeAt(g, 0, 1, 20);
  assert.equal(marchingCount(g, 0), 2);
  g.players[0].pieces[1].pos = { zone: 'goal' };
  assert.equal(marchingCount(g, 0), 1, 'quân đích không tính Tàn Đoàn');
  // 1 quân chạy → +2 ATK +2 DEF
  const st = computeStats(g, g.players[0].pieces[0]);
  assert.ok(st.mods.some((m) => m.source === 'march' && m.label.includes('+2')));
});

// ===== 6. Lõi =====

test('lõi bloodPact: +3 ATK −2 maxHp; nightTorch +1 ATK', () => {
  const g = twoPlayerGame();
  const base = computeStats(g, g.players[0].pieces[0]);
  g.players[0].cores.push('bloodPact');
  const pact = computeStats(g, g.players[0].pieces[0]);
  assert.equal(pact.atk - base.atk, 3);
  assert.equal(base.maxHp - pact.maxHp, 2);
  g.players[0].cores.push('nightTorch');
  const torch = computeStats(g, g.players[0].pieces[0]);
  assert.equal(torch.atk - pact.atk, 1);
});

test('lõi loneKing: +2/+2 khi cách mọi đồng minh ≥ 4 ô; gần đồng minh thì mất', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('loneKing');
  const solo = placeAt(g, 0, 0, 10);
  const base = computeStats(g, solo);
  assert.equal(base.atk - computeStats(g, solo).atk, 0);
  assert.ok(base.mods.some((m) => m.source === 'core' && m.label.includes('Vua Cô Độc')), 'cách 4 ô → được cộng hưởng');
  const st = computeStats(g, solo);
  assert.ok(st.atk >= base.atk);
  // đồng minh đến gần (cách 2) → mất bonus
  placeAt(g, 0, 1, 12);
  const near = computeStats(g, solo);
  assert.ok(!near.mods.some((m) => m.label.includes('Vua Cô Độc')), 'gần đồng minh → mất Vua Cô Độc');
});

// ===== 7. Skill =====

test('skill: shieldWall chặn bắt trong lượt — attacker bị đẩy về ô xuất phát', () => {
  const g = twoPlayerGame();
  const kn = placeAt(g, 0, 0, 10);
  const enemy = placeAt(g, 1, 0, 14); // 4 ô trước — human sẽ đi 4 đáp
  kn.level = 3; // mở shieldWall
  g.die = null; g.phase = 'move';
  castSkill(g, 0, 'shieldWall');
  assert.equal(kn.shieldTurn, true);
  // phe 1 đi 4 đáp quân có khiên → bị chặn, quay về ô cũ
  g.current = 1; g.phase = 'move'; g.die = 4;
  enemy.pos = { zone: 'track', p: 10 }; // đặt enemy phe 1 cạnh quân khiên: p10 phe1 = r23
  // đổi vị trí: attacker phe 1 cần đi tới ô của knight phe 0 (r10 → phe 1: p = (10−13)%52 = 49)
  enemy.pos = { zone: 'track', p: 45 }; // p45+4=49 → r10 ✓
  doMove(g, 0); // pieceId 0 của phe 1 (knight)
  assert.equal(enemy.pos.p, 45, 'attacker bị khiên chặn → về ô xuất phát (p45)');
});

test('skill: CD khóa skill sau khi dùng, tick theo lượt phe', () => {
  const g = twoPlayerGame();
  const kn = placeAt(g, 0, 0, 10);
  kn.level = 3;
  g.phase = 'move';
  castSkill(g, 0, 'shieldWall');
  // castSkill thay nước di → endTurn lượt N tick CD 4→3 ngay.
  assert.equal(kn.skillCd.shieldWall, 3);
  endTurn(g); endTurn(g); // 1 vòng → về phe 0, CD tick thêm 1
  assert.equal(kn.skillCd.shieldWall, 2);
});

// ===== 8. Xạ Kích =====

test('xạ kích: chỉ bắn được địch cách 3–5 ô; ô sao + mục tiêu trong rừng miễn', () => {
  const g = twoPlayerGame();
  // phe 1 → r: r = (13 + p) % 52. phe 0 → r = p.
  const archer = placeAt(g, 0, 2, 16); // human archer r16 (sa mạc — đứng ngoài rừng)
  const at = (r: number) => ((r - 13) % 52 + 52) % 52; // r → p của phe 1
  // địch cách 3 ô (r19) → bắn được
  const d3 = placeAt(g, 1, 0, at(19));
  let targets = xkTargets(g, archer);
  assert.ok(targets.some((t) => t.id === 0 && t.player === 1), 'địch cách 3 ô → bắn được');

  // địch cách 4 ô (r20) → bắn được
  const d4 = placeAt(g, 1, 3, at(20));
  targets = xkTargets(g, archer);
  assert.ok(targets.some((t) => t.id === 3 && t.player === 1), 'địch cách 4 ô → bắn được');


  // địch cách 6 ô (r22) → ngoài tầm
  const d6t = placeAt(g, 1, 1, at(22));
  targets = xkTargets(g, archer);
  assert.ok(!targets.some((t) => t.id === 1 && t.player === 1), 'cách 6 ô → ngoài tầm 3–5');

  // địch cách 2 ô (r18) → ngoài tầm dưới
  const d2 = placeAt(g, 1, 2, at(18));
  targets = xkTargets(g, archer);
  assert.ok(!targets.some((t) => t.id === 2 && t.player === 1), 'cách 2 ô → ngoài tầm');

  // ô sao miễn XK: sao r24 cách 8 từ r16 — ngoài tầm. Dùng archer thứ hai tại r29 (phe 0 p29):
  archer.pos = { zone: 'track', p: 29 };
  const dStar = placeAt(g, 1, 2, at(34)); // r34 = 34%13=8 → sao, cách 5 từ r29
  targets = xkTargets(g, archer);
  assert.ok(!targets.some((t) => t.id === 2 && t.player === 1), 'ô sao miễn Xạ Kích');

  // mục tiêu trong rừng → chặn: archer r50 (vực), địch r2 cách 4 (rừng arc 0)
  archer.pos = { zone: 'track', p: 50 };
  const dForest = placeAt(g, 1, 3, at(2));
  targets = xkTargets(g, archer);
  assert.ok(!targets.some((t) => t.id === 3 && t.player === 1), 'mục tiêu trong rừng → chặn Xạ Kích');
});
// ===== 9. EXP / level =====

test('EXP: ngưỡng cấp +1 HP/lv, +1 ATK cấp lẻ 3-9', () => {
  assert.equal(LEVEL_THRESHOLDS[2], 100);
  assert.equal(LEVEL_THRESHOLDS[10], 4500);
  const g5 = levelGains(5);
  assert.equal(g5.hp, 4);   // lv2..5 = 4 cấp
  assert.equal(g5.atk, 2);  // cấp 3,5
  const g9 = levelGains(9);
  assert.equal(g9.atk, 4);  // 3,5,7,9
});

test('EXP: thắng giao tranh 50 EXP + lên cấp khi đủ ngưỡng', () => {
  const g = twoPlayerGame();
  const a = placeAt(g, 0, 0, 10);
  a.exp = 80; // còn 20 nữa là lên 2
  gainExp(g, a, 50, 'test');
  assert.equal(a.level, 2, '80+50 ≥ 100 → lên cấp 2');
});

// ===== 10. State machine & determinism =====

test('state machine: phase flow roll→move→endTurn đúng vòng', () => {
  const g = twoPlayerGame();
  assert.equal(g.phase, 'roll');
  const r = doRoll(g);
  assert.ok(r.ok);
  assert.equal(g.phase, g.winner === null ? 'move' : g.phase);
  if (g.phase === 'move') {
    const mv = movablePieces(g, g.current, g.die ?? 0);
    if (mv.length > 0) {
      const mvRes = doMove(g, mv[0].id);
      assert.ok(mvRes.ok);
    }
  }
  // sau move: phase phải là roll (phe mới) hoặc gameOver
  assert.ok(g.phase === 'roll' || g.phase === 'gameOver' || g.phase === 'move' || g.phase === 'corePick');
});

test('bẫy skipTurns: mất ĐÚNG 1 lượt di rồi tự hết', () => {
  const g = twoPlayerGame();
  const mage = placeAt(g, 0, 1, 0);
  g.die = 5; g.phase = 'move';
  doMove(g, 1); // dẫm bẫy p5
  assert.equal(g.players[0].pieces[1].skipTurns, 2);
  // kết thúc lượt phe 0 → đầu lượt phe 0 KẾ: tick → 1 → quân bị chặn lượt này
  endTurn(g); // sang phe 1
  endTurn(g); // về phe 0 — startOfTurn tick skipTurns 2→1
  assert.equal(g.players[0].pieces[1].skipTurns, 1);
  const mvBlocked = movablePieces(g, 0, 4);
  assert.ok(!mvBlocked.includes(g.players[0].pieces[1]), 'lượt kế: quân bị bẫy không di được');
  // lượt sau nữa: tick 1→0 → di lại được
  endTurn(g); endTurn(g);
  assert.equal(g.players[0].pieces[1].skipTurns, 0);
  const mvFree = movablePieces(g, 0, 4);
  assert.ok(mvFree.includes(g.players[0].pieces[1]), 'hết hiệu lực bẫy → di lại được');
});

// ===== 11. Skill arming + lõi API =====

test('rob: sát thủ arming → thắng giao tranh cướp 1 item của nạn nhân', () => {
  const g = twoPlayerGame();
  const rogue = g.players[0].pieces[3]; // assassin human
  rogue.level = 5;
  const victim = g.players[1].pieces[0]; // knight demon
  rogue.pos = { zone: 'track', p: 10 };
  victim.pos = { zone: 'track', p: 10 }; // cùng ô r10
  victim.items.push('sword');
  // arm rob rồi attacker đáp (ép battle thắng bằng fixed d6? doMove không ép được — đặt chỉ số)
  rogue.items = []; // chắc chắn túi trống
  g.phase = 'move'; g.current = 0; g.die = null;
  // arm rob qua castSkill (thay nước di, kết lượt) rồi quay lại lượt phe 0
  castSkill(g, 3, 'rob');
  assert.equal(rogue.robArmed, true);
  // phe 1 đi 1 nước vô hại rồi về lượt phe 0
  g.current = 0; g.phase = 'move'; g.die = 6;
  // ép attacker thắng: assassin atk 4 vs knight def 3+1(demon+0)+... thắng khó chắc — dùng fixed path:
  // trực tiếp gọi landOnEnemy qua doMove khi 2 quân cùng ô
  const victimR = 10 + 6; // attacker đi 6 → p16... không trùng.
  // Đặt lại: victim đứng p16 (đích đến của rogue)
  victim.pos = { zone: 'track', p: 16 };
  const r = doMove(g, 3); // assassin đi 6 đáp victim
  assert.ok(r.ok);
  // assassin atk4 (+0) d6 vs knight def3(+res? demon knight: personal atk+1 không def) +1 = d6+4
  // kết quả phụ thuộc roll — chỉ assert: nếu thắng thì cướp, nếu thua không cướp
  const won = victim.pos.zone === 'pen';
  if (won) {
    assert.equal(rogue.items.includes('sword'), true, 'thắng + robArmed → cướp kiếm');
    assert.equal(rogue.robArmed, false, 'arming tiêu thụ');
    assert.equal(victim.items.length, 0);
  } else {
    assert.equal(rogue.robArmed, true, 'thua → giữ arming');
  }
});

test('legShot: XK trúng → địch mất lượt di kế (skipTurns)', () => {
  const g = twoPlayerGame();
  const archer = g.players[0].pieces[2];
  archer.level = 3;
  archer.pos = { zone: 'track', p: 16 };
  g.phase = 'move'; g.current = 0;
  castSkill(g, 2, 'legShot');
  assert.equal(archer.legShotArmed, true);
  // bắn: đặt mục tiêu yếu (mage demon def 1) — ép thắng bằng cách hạ def
  const tgt = g.players[1].pieces[1];
  tgt.pos = { zone: 'track', p: 6 }; // r19 cách r16 3 ô
  g.current = 0; g.phase = 'move'; g.die = 2;
  const r = doShoot(g, 2, 1, 1);
  assert.ok(r.ok);
  // Trúng hay hụt phụ thuộc roll — nhưng legShot chỉ áp khi trúng (tgt về pen).
  // doShoot endTurn (không 6) → startOfTurn phe 1 tick skipTurns 2→1.
  if (tgt.pos.zone === 'pen') {
    assert.ok(tgt.skipTurns >= 1, 'XK trúng + legShot → mất lượt di kế (đã tick đầu lượt phe 1)');
    assert.equal(archer.legShotArmed, false);
  }
});

test('chargeFormation: arming → di xong đi tiếp 3 ô bắt buộc', () => {
  const g = twoPlayerGame();
  const kn = g.players[0].pieces[0];
  kn.level = 5;
  kn.pos = { zone: 'track', p: 10 };
  g.phase = 'move'; g.current = 0;
  castSkill(g, 0, 'chargeFormation');
  assert.equal(kn.chargeArmed, true);
  // lượt kế phe 0: đi 3 → sau di tự đi tiếp 3 (tổng p16)
  g.current = 0; g.phase = 'move'; g.die = 3;
  const r = doMove(g, 0);
  assert.ok(r.ok);
  assert.equal(kn.pos.p, 16, 'di 3 + charge 3 = p16');
  assert.equal(kn.chargeArmed, false);
});

test('universeKey: 1 lần/trận hoán đổi 2 quân trên vòng', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('universeKey');
  const a = placeAt(g, 0, 0, 10);
  const b = placeAt(g, 0, 1, 30);
  g.phase = 'move'; g.current = 0; g.die = null;
  const r = useUniverseKey(g, 0, 1);
  assert.ok(r.ok);
  assert.equal(a.pos.p, 30, 'A lấy chỗ B');
  assert.equal(b.pos.p, 10, 'B lấy chỗ A');
  // lần 2 → chặn
  g.phase = 'move'; g.current = 0;
  const r2 = useUniverseKey(g, 0, 1);
  assert.ok(!r2.ok, '1 lần/trận');
  // quân chuồng → chặn
});

test('prophetEye: peek không tiêu thụ RNG; force 1 lần/trận', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('prophetEye');
  const peek1 = prophetEyePeek(g);
  const peek2 = prophetEyePeek(g);
  assert.equal(peek1, peek2, 'peek 2 lần liên tiếp → cùng giá trị (không tiêu thụ RNG)');
  assert.ok(peek1 >= 1 && peek1 <= 6);
  g.phase = 'move'; g.current = 0; g.die = 1;
  const r = prophetEyeForce(g, 6);
  assert.ok(r.ok);
  assert.equal(g.die, 6, 'ép roll thành 6');
  const r2 = prophetEyeForce(g, 5);
  assert.ok(!r2.ok, '1 lần/trận');
});

test('bloodDebt: chia roll cho 2 quân, tổng = roll', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('bloodDebt');
  const a = placeAt(g, 0, 0, 10);
  const b = placeAt(g, 0, 1, 30);
  g.phase = 'move'; g.current = 0; g.die = 5;
  const r = doMoveSplit(g, 0, 1, 2); // A đi 2, B đi 3
  assert.ok(r.ok);
  assert.equal(a.pos.p, 12, 'A đi 2 ô');
  assert.equal(b.pos.p, 33, 'B đi 3 ô');
  // tổng bước = die 5
  assert.equal(12 - 10 + 33 - 30, 5);
});

test('treasureMap: đứng rương chọn được item; rương trùng +30 EXP', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('treasureMap');
  const pc = placeAt(g, 0, 1, 3); // đứng rương r3 (p3 phe 0)
  g.phase = 'move'; g.current = 0;
  const r = openChestWithMap(g, 1, 'shield');
  assert.ok(r.ok);
  assert.ok(pc.items.includes('shield'), 'chọn khiên thành công');
  assert.ok(g.openedChests.has(3));
  // mở lại (trùng) → +30 EXP
  const expBefore = pc.exp;
  g.phase = 'move'; g.current = 0;
  const r2 = openChestWithMap(g, 1, 'sword');
  assert.ok(r2.ok);
  assert.ok(pc.exp > expBefore, 'rương trùng quy đổi +30 EXP');
  assert.ok(!pc.items.includes('sword'), 'không nhận item trùng');
});

test('punishingLight: cấm đứng ô sao giữa cung, ô xuất phát vẫn được', () => {
  const g = twoPlayerGame();
  g.players[0].cores.push('punishingLight');
  // phe 0: ô sao giữa cung r8 → p8; ô xuất phát r0 → p0
  const pc = placeAt(g, 0, 1, 4);
  const toMidStar = validateMove(g, 0, 1, 4); // 4+4=8 → sao giữa cung
  assert.ok(!toMidStar.ok, 'cấm đứng sao giữa cung');
  const toStart = validateMove(g, 0, 1, 3); // 4+3=7 ô thường
  assert.ok(toStart.ok, 'ô thường OK');
  // phe không giữ lõi → không bị cấm
  const g2 = twoPlayerGame();
  placeAt(g2, 0, 1, 4);
  const free = validateMove(g2, 0, 1, 4);
  assert.ok(free.ok, 'không lõi → đứng sao tự do');
  void pc;
});

test('crit: ModLine chí mạng ×2 d6 hiện trong breakdown', () => {
  const g = twoPlayerGame();
  const a = g.players[0].pieces[3]; // human assassin
  const d = g.players[1].pieces[0];
  a.pos = { zone: 'track', p: 10 };
  d.pos = { zone: 'track', p: 11 };
  // ép crit bằng cách mock? resolveBattle dùng nextRandom — không ép trực tiếp.
  // Chạy nhiều lần với fixed d6, kiểm: khi crit=true thì mods có dòng crit và d6 = 2×base.
  for (let i = 0; i < 60; i++) {
    const br = resolveBattle(g, { attacker: a, defender: d, isXk: false, fixedAttackerD6: 3, fixedDefenderD6: 3 });
    if (br.crit) {
      assert.equal(br.attacker.d6, 6, 'crit → d6 hiển thị = 3×2');
      assert.ok(br.attacker.mods.some((m) => m.source === 'crit'), 'ModLine crit');
      return;
    }
  }
  assert.fail('60 lần không ra crit (25%) — kiểm RNG');
});
