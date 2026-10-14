// Data: 4 hệ (class) — chỉ số gốc Lv1 + đặc tính (GDD §3.2).
import type { ClassId, StatBlock } from '../core/types.ts';

export interface ClassDef {
  id: ClassId;
  name: string;               // tiếng Việt hiển thị
  base: StatBlock;            // Lv1
  trait: string;              // mô tả đặc tính
  skillLevels: [number, number]; // cấp mở skill 1 / skill 2
  skillIds: [string, string];
}

export const CLASSES: Record<ClassId, ClassDef> = {
  knight: {
    id: 'knight',
    name: 'Hiệp sĩ',
    base: { hp: 12, atk: 3, def: 3 },
    trait: 'Miễn nhiễm bẫy',
    skillLevels: [3, 5],
    skillIds: ['shieldWall', 'chargeFormation'],
  },
  mage: {
    id: 'mage',
    name: 'Pháp sư',
    base: { hp: 7, atk: 5, def: 1 },
    trait: 'Skill mạnh, CD dài',
    skillLevels: [3, 5],
    skillIds: ['bind', 'enlighten'],
  },
  archer: {
    id: 'archer',
    name: 'Cung thủ',
    base: { hp: 8, atk: 4, def: 1 },
    trait: 'Xạ Kích: bắn địch cách 3–5 ô, không cần đáp xuống',
    skillLevels: [3, 5],
    skillIds: ['legShot', 'tripleShot'],
  },
  assassin: {
    id: 'assassin',
    name: 'Sát thủ',
    base: { hp: 8, atk: 4, def: 1 },
    trait: '25% chí mạng (×2 điểm roll giao tranh)',
    skillLevels: [3, 5],
    skillIds: ['darkVeil', 'rob'],
  },
};

// +1 HP mỗi cấp Lv2..Lv10; +1 ATK vào cấp 3/5/7/9 (GDD §3.6).
export function levelGains(level: number): StatBlock {
  let hp = 0, atk = 0;
  for (let lv = 2; lv <= level; lv++) {
    hp += 1;
    if (lv % 2 === 1 && lv >= 3 && lv <= 9) atk += 1; // 3,5,7,9
  }
  return { hp, atk, def: 0 };
}

// Ngưỡng EXP tích lũy để đạt cấp (GDD §3.6): Lv2=100 ... Lv10=4500.
export const LEVEL_THRESHOLDS: readonly number[] = [0, 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500] as const;
export const MAX_LEVEL = 10;
