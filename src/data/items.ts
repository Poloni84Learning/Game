// Data: vật phẩm rương + hiệu ứng vùng (GDD §3.7, §4.2).
import type { ItemId, RegionId } from '../core/types.ts';

export interface ItemDef {
  id: ItemId;
  name: string;
  desc: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  sword: { id: 'sword', name: 'Kiếm', desc: '+2 ATK' },
  shield: { id: 'shield', name: 'Khiên', desc: '+2 DEF' },
  potion: { id: 'potion', name: 'Bình Máu', desc: 'Hồi 4 HP ngay lập tức' },
  lucky: { id: 'lucky', name: 'Ngọc May Mắn', desc: 'Reroll 1 lần tự động khi bất lợi (giữ trên quân)' },
};

// Hiệu ứng vùng áp cho quân ĐỨNG TRONG vùng (cá nhân + affinity tộc xử lý ở stats.ts).
export interface RegionDef {
  id: RegionId;
  name: string;
  globalText: string;   // hiệu ứng cho mọi phe
  affinityText: string; // bonus tộc sở hữu vùng
}

export const REGION_EFFECTS: Record<RegionId, RegionDef> = {
  forest: {
    id: 'forest',
    name: 'Rừng Nguyên Sinh',
    globalText: 'Chặn Xạ Kích & chí mạng nhắm quân đứng trong rừng',
    affinityText: 'Tiên Linh: +1 DEF',
  },
  desert: {
    id: 'desert',
    name: 'Sa Mạc Cháy',
    globalText: 'Đầu lượt: mỗi quân đứng trong sa mạc −1 HP (tối thiểu 1)',
    affinityText: 'Yêu: miễn cháy, +1 ATK',
  },
  valley: {
    id: 'valley',
    name: 'Thung Lũng Sương',
    globalText: '+1 HP đầu lượt; bẫy vô hiệu',
    affinityText: 'Người: hồi 2 HP đầu lượt',
  },
  ice: {
    id: 'ice',
    name: 'Vực Băng Vĩnh Cứu',
    globalText: 'Kẻ tấn công quân đứng trong vực: −1 điểm roll',
    affinityText: 'Long: miễn −1 roll, +1 DEF',
  },
};
