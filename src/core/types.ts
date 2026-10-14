// Cá Ngựa Chiến Thần — types dùng chung của rules engine (GDD §5.3).
// core/ không biết canvas tồn tại: nhận và trả về plain object.

// ===== Phương vị =====
export type TribeId = 'human' | 'elf' | 'demon' | 'dragon'; // Người/Tiên Linh/Yêu/Long
export type ClassId = 'knight' | 'mage' | 'archer' | 'assassin'; // Hiệp sĩ/Pháp sư/Cung thủ/Sát thủ

export interface StatBlock { hp: number; atk: number; def: number; }

// ===== Quân cờ =====
export type PiecePos =
  | { zone: 'pen' }                                       // chuồng (chưa ra / bị bắt về)
  | { zone: 'track'; p: number }                          // p = 0..57 theo góc nhìn phe chủ
  | { zone: 'goal' };                                     // đã về đích (phong thần)

export interface Piece {
  id: number;                 // 0..3 trong đội hình
  player: number;             // phe chủ 0..3
  cls: ClassId;
  tribe: TribeId;
  level: number;              // 1..10
  exp: number;                // tích lũy thô
  hp: number;                 // hiện tại
  items: ItemId[];            // tối đa 2
  pos: PiecePos;
  skillsLearned: number[];    // mốc cấp đã học skill (3, 5)
  skillCd: Record<string, number>; // skillId -> lượt phe còn chờ
  skipTurns: number;          // dẫm bẫy/Bắn Chân: mất N lượt di kế tiếp (tick đầu lượt phe mình)
  frozenTurns: number;        // Trói Trận: không được di lượt kế
  shieldTurn: boolean;        // Khiên Thành Chủ: chặn bắt đến lượt kế phe giữ
  darkVeilTurn: boolean;      // Bóng Đêm: không thể bị bắt đến lượt kế phe giữ
  legShotArmed: boolean;      // Bắn Chân đã arming: XK trúng lần tới → địch mất lượt di kế
  robArmed: boolean;          // Cướp Đoạt đã arming: thắng giao tranh kế → cướp 1 item
  chargeArmed: boolean;       // Trận Địa Xung Phong đã arming: sau di xong đi tiếp 3 ô
  mirrorUsed: boolean;        // Gương Bóng Tử Địa đã kích hoạt 1 lần/quân/trận
}

// ===== Phe chơi =====
export interface Player {
  id: number;                 // 0..3; Bắc→Đông→Nam→Tây
  tribe: TribeId;
  classes: ClassId[];         // 4 vai không trùng (draft chuẩn)
  pieces: Piece[];
  cores: CoreId[];            // lõi đã chọn, tối đa 3
  corePickPending: number | null; // mốc cấp chờ chọn lõi (3/6/9)
  coreOffers: CoreId[];
  coreRerollUsed: Record<number, boolean>; // mốc -> đã reroll
  coreFlags: Record<string, boolean>; // prophetEyeSwapUsed, universeKeyUsed (1 lần/trận)
  sixStreak: number;          // chuỗi tung 6 liên tiếp trong lượt
  rollCount: number;          // số lần đã tung trong lượt
  luckyRerollStock: number;   // số Ngọc May Mắn phe đang giữ
  extraMoves: number;         // nước đi thêm còn lại trong lượt (6/thắng/đích)
}

// ===== Item & lõi & skill =====
export type ItemId = 'sword' | 'shield' | 'potion' | 'lucky';
export type CoreId =
  | 'bloodPact' | 'rustLightning' | 'punishingLight' | 'nightTorch' // nhóm A
  | 'bloodDebt' | 'deadMirror' | 'prophetEye' | 'reverseFlow'       // nhóm B
  | 'headHunter' | 'loneKing' | 'universeKey' | 'treasureMap';
export type SkillId =
  | 'shieldWall' | 'chargeFormation'      // Hiệp sĩ
  | 'bind' | 'enlighten'                  // Pháp sư
  | 'legShot' | 'tripleShot'              // Cung thủ
  | 'darkVeil' | 'rob'                    // Sát thủ

// ===== Bàn cờ =====
export type RegionId = 'forest' | 'desert' | 'valley' | 'ice';
// Cung k = 0..3: r ∈ [13k, 13k+12]; Bắc(0)=Rừng, Đông(1)=Sa Mạc, Nam(2)=Thung Lũng, Tây(3)=Vực Băng
export const REGIONS: readonly RegionId[] = ['forest', 'desert', 'valley', 'ice'] as const;

export type SpecialCell = 'star' | 'chest' | 'trap' | 'temple' | 'heal';

// ===== FX & state machine =====
export type Phase = 'draft' | 'roll' | 'move' | 'resolve' | 'battle' | 'corePick' | 'endTurn' | 'gameOver';

export interface GameState {
  seed: number;
  turn: number;               // số lượt tuyệt đối (mỗi phe 1 lượt)
  playerCount: number;        // 2..4
  players: Player[];
  phase: Phase;
  current: number;            // index phe đang chơi
  die: number | null;          // kết quả tung hiện tại (đã áp reroll/ép)
  dieRolled: boolean;
  winner: number | null;
  openedChests: Set<number>;   // r theo ô vòng; mỗi rương mở 1 lần/trận
  battle: BattleView | null;   // đang trình chiếu giao tranh
  log: LogEntry[];            // journal cho UI + replay
  rngState: number;           // trạng thái PRNG hiện tại
}

export interface LogEntry {
  turn: number;
  player: number;
  kind: 'roll' | 'move' | 'battle' | 'chest' | 'trap' | 'temple' | 'heal' | 'levelup' | 'core' | 'skill' | 'item' | 'goal' | 'pen' | 'system';
  text: string;
  detail?: Record<string, unknown>;
}

// ===== Giao tranh =====
export interface BattleSide {
  pieceId: string;            // "P<p>:<i>"
  d6: number;
  base: number;               // d6 gốc trước mod/crit
  mods: ModLine[];            // breakdown pipeline
  total: number;
}

export interface ModLine { source: string; label: string; amount: number; }

export interface BattleResult {
  attacker: BattleSide;
  defender: BattleSide;
  attackerIsArcherXk: boolean; // true nếu khởi phát từ Xạ Kích (Cung thủ tấn công, không crit)
  crit: boolean;
  outcome: 'attacker' | 'defender';
  damage: number;             // HP trừ khi attacker thua (D5); hòa = 0
  expGained: { attacker: number; defender: number };
}

export interface BattleView extends BattleResult {
  reason: 'landOn' | 'shoot';
}

// ===== Kết quả hành động của core (để UI render) =====
export interface ActionResult {
  ok: boolean;
  error?: string;
  battle?: BattleView;
  movePath?: number[];        // các p đã đi qua (highlight đường)
  events?: LogEntry[];        // sự kiện phát sinh để UI trình chiếu
  finishedGame?: boolean;
}
