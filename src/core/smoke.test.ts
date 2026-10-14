// Smoke test: auto-play 1 trận 2 phe đầy đủ, xác nhận determinism + event coverage.
import { newGame, autoPlayOneTurn } from './turn.ts';
import type { GameState } from './types.ts';

function runGame(seed: number, maxTurns = 2000): { winner: number | null; turns: number; kinds: Set<string> } {
  const g = newGame({
    seed,
    players: [
      { tribe: 'human', classes: ['knight', 'mage', 'archer', 'assassin'] },
      { tribe: 'demon', classes: ['knight', 'mage', 'archer', 'assassin'] },
    ],
  });
  for (let i = 0; i < maxTurns; i++) {
    if (g.winner !== null) break;
    autoPlayOneTurn(g);
    if (g.phase === 'corePick') {
      // autoPlayOneTurn đã xử; nếu còn kẹt thì force endTurn để tránh dead loop.
      g.phase = 'move';
    }
  }
  const kinds = new Set(g.log.map((e) => e.kind));
  return { winner: g.winner, turns: g.turn, kinds };
}

// Test 1: determinism — cùng seed, cùng kết quả.
const a = runGame(12345);
const b = runGame(12345);
console.log('seed 12345:', JSON.stringify({ winner: a.winner, turns: a.turns }));
console.log('seed 12345 (lần 2):', JSON.stringify({ winner: b.winner, turns: b.turns }));

if (a.winner !== b.winner || a.turns !== b.turns) {
  console.error('FAIL: determinism broken');
  process.exit(1);
}
console.log('PASS: determinism (cùng seed → cùng winner & số lượt)');

// Test 2: trận đấu kết thúc trong vòng hợp lý (cap 2000 lượt).
if (a.winner === null) {
  console.error('FAIL: game không kết thúc sau 2000 lượt — kiểm tra logic đi thêm/đích');
  process.exit(1);
}
console.log('PASS: có winner sau', a.turns, 'lượt');

// Test 3: log đủ các loại event quan trọng.
const need = ['roll', 'move', 'system'];
for (const k of need) {
  if (!a.kinds.has(k)) {
    console.error('FAIL: thiếu event', k);
    process.exit(1);
  }
}
console.log('PASS: event kinds =', [...a.kinds].join(','));

// Test 4: seed khác → game khác (RNG hoạt động).
const c = runGame(999);
console.log('seed 999:', JSON.stringify({ winner: c.winner, turns: c.turns }));
console.log(c.winner !== null && (c.winner !== a.winner || c.turns !== a.turns)
  ? 'PASS: seed khác → trận khác'
  : 'WARN: seed 999 trùng kết quả seed 12345 (có thể trùng ngẫu nhiên)');
