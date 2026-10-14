// Data: 8 kỹ năng (2/hệ), CD theo lượt phe (GDD §3.6).
import type { SkillId } from '../core/types.ts';

export interface SkillDef {
  id: SkillId;
  cls: 'knight' | 'mage' | 'archer' | 'assassin';
  name: string;
  desc: string;
  cd: number;               // số lượt phe chờ sau khi dùng
  unlockLevel: number;      // mốc cấp mở khóa
}

export const SKILLS: Record<SkillId, SkillDef> = {
  // Hiệp sĩ
  shieldWall: {
    id: 'shieldWall', cls: 'knight', name: 'Khiên Thành Chủ',
    desc: 'Chặn mọi nỗ lực bắt trong lượt này',
    cd: 4, unlockLevel: 3,
  },
  chargeFormation: {
    id: 'chargeFormation', cls: 'knight', name: 'Trận Địa Xung Phong',
    desc: 'Sau khi di xong: đi tiếp bắt buộc 3 ô',
    cd: 6, unlockLevel: 5,
  },
  // Pháp sư
  bind: {
    id: 'bind', cls: 'mage', name: 'Trói Trận',
    desc: '1 địch không được di trong lượt kế của nó',
    cd: 6, unlockLevel: 3,
  },
  enlighten: {
    id: 'enlighten', cls: 'mage', name: 'Khai Sáng',
    desc: 'Toàn đội hồi 3 HP; −1 CD một đồng minh',
    cd: 8, unlockLevel: 5,
  },
  // Cung thủ
  legShot: {
    id: 'legShot', cls: 'archer', name: 'Bắn Chân',
    desc: 'Xạ Kích trúng → địch mất lượt di kế tiếp',
    cd: 4, unlockLevel: 3,
  },
  tripleShot: {
    id: 'tripleShot', cls: 'archer', name: 'Tam Tiễn',
    desc: 'Bắn 3 mục tiêu; mỗi phát là giao tranh đầy đủ, không crit',
    cd: 8, unlockLevel: 5,
  },
  // Sát thủ
  darkVeil: {
    id: 'darkVeil', cls: 'assassin', name: 'Bóng Đêm',
    desc: '1 lượt không thể bị bắt',
    cd: 4, unlockLevel: 3,
  },
  rob: {
    id: 'rob', cls: 'assassin', name: 'Cướp Đoạt',
    desc: 'Thắng giao tranh → cướp 1 item của nạn nhân',
    cd: 6, unlockLevel: 5,
  },
};
