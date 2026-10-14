// Data: 12 lõi K (Core) — thần khí chọn tại mốc Lv 3/6/9 (GDD §3.5).
import type { CoreId } from '../core/types.ts';

export interface CoreDef {
  id: CoreId;
  name: string;           // tên tiếng Việt
  boon: string;           // lợi ích
  price: string;          // cái giá
}

// Nhóm A: không dòng máu (dùng lần là có). Nhóm B: nền máu (mang về đội sau mới dùng).
export const CORES: Record<CoreId, CoreDef> = {
  bloodPact: {
    id: 'bloodPact',
    name: 'Khế Máu',
    boon: '+3 ATK cho quân mang lõi',
    price: '−2 maxHP vĩnh viễn',
  },
  rustLightning: {
    id: 'rustLightning',
    name: 'Chuông Sét Gỉ',
    boon: 'Dùng skill: mọi skill đang hồi của đồng minh khác giảm 1 lượt',
    price: 'Không giảm CD của người dùng; không kích hoạt lại skill',
  },
  punishingLight: {
    id: 'punishingLight',
    name: 'Phán Quyết Bình Minh',
    boon: 'Khi tấn công: dùng DEF của quân mình thay ATK',
    price: 'Áp cả cận chiến và Xạ Kích; không đổi phòng thủ, ô sao vẫn an toàn',
  },
  nightTorch: {
    id: 'nightTorch',
    name: 'Đuốc Bóng Đêm',
    boon: '+1 ATK (+1 nữa khi tấn công)',
    price: 'Chặn mọi hồi phục từ ô & vùng (lõi, cộng hưởng vẫn hoạt động)',
  },
  bloodDebt: {
    id: 'bloodDebt',
    name: 'Nợ Máu',
    boon: 'Chia số roll cho 2 quân mang lõi (mỗi quân ≥ 0, tổng = roll)',
    price: 'Mọi roll của phe −1',
  },
  deadMirror: {
    id: 'deadMirror',
    name: 'Gương Bóng Tử Địa',
    boon: 'Thua giao tranh: quân địch thắng cũng phải về chuồng (1 lần/quân/trận)',
    price: '—',
  },
  prophetEye: {
    id: 'prophetEye',
    name: 'Mắt Tiên Tri',
    boon: 'Xem trước roll sắp tới của địch; 1 lần/trận được đổi kết quả',
    price: '—',
  },
  reverseFlow: {
    id: 'reverseFlow',
    name: 'Đảo Ngược Dòng Chảy',
    boon: 'Dẫm bẫy toàn bàn → đến đền gần nhất, đền này cho +1 ATK',
    price: '—',
  },
  headHunter: {
    id: 'headHunter',
    name: 'Săn Đầu Hàng',
    boon: 'Thắng địch cấp ≥ mình: +100 EXP',
    price: 'Mất phần an ủi 10 EXP khi thua',
  },
  loneKing: {
    id: 'loneKing',
    name: 'Vua Cô Độc',
    boon: 'Quân được chỉ định +2 ATK +2 DEF khi cách mọi đồng minh ≥ 4 ô',
    price: '—',
  },
  universeKey: {
    id: 'universeKey',
    name: 'Chìa Vũ Trụ',
    boon: '1 lần/trận: thay nước di, hoán đổi vị trí 2 quân bất kỳ (không chuồng/đích)',
    price: '—',
  },
  treasureMap: {
    id: 'treasureMap',
    name: 'Bản Đồ Kho Báu',
    boon: 'Mở rương được chọn 1/3 item',
    price: 'Rương trùng (đã mở): đổi thành +30 EXP',
  },
};

// Lõi nhóm B (nền máu) — hiển thị nhóm cho UI chọn lõi.
export const CORE_GROUP: Record<CoreId, 'A' | 'B'> = {
  bloodPact: 'A', rustLightning: 'A', punishingLight: 'A', nightTorch: 'A',
  bloodDebt: 'B', deadMirror: 'B', prophetEye: 'B', reverseFlow: 'B',
  headHunter: 'B', loneKing: 'B', universeKey: 'B', treasureMap: 'B',
};
