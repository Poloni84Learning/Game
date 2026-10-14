// Data: 4 tộc — đặc tính cá nhân + affinity vùng + cộng hưởng 2/4 quân (GDD §3.3).
import type { TribeId, RegionId } from '../core/types.ts';

export interface TribeDef {
  id: TribeId;
  name: string;
  personal: { hp?: number; atk?: number; def?: number; trapImmune?: boolean };
  personalText: string;
  affinityRegion: RegionId;
  affinityText: string;
  resonance2: string;
  resonance4: string;
}

export const TRIBES: Record<TribeId, TribeDef> = {
  human: {
    id: 'human',
    name: 'Người',
    personal: { hp: 1 },
    personalText: '+1 HP',
    affinityRegion: 'valley',
    affinityText: 'Thung Lũng: hồi 2 HP đầu lượt',
    resonance2: '+1 DEF toàn đội',
    resonance4: 'Đầu lượt: toàn đội hồi 1 HP',
  },
  elf: {
    id: 'elf',
    name: 'Tiên Linh',
    personal: { trapImmune: true },
    personalText: 'Miễn bẫy',
    affinityRegion: 'forest',
    affinityText: 'Rừng: +1 DEF',
    resonance2: 'CD skill Tiên Linh −1',
    resonance4: '1 lần/lượt: hoán đổi 2 Tiên Linh cách ≤ 6 ô',
  },
  demon: {
    id: 'demon',
    name: 'Yêu',
    personal: { atk: 1 },
    personalText: '+1 ATK',
    affinityRegion: 'desert',
    affinityText: 'Sa Mạc: miễn cháy +1 ATK',
    resonance2: 'Thắng giao tranh: hồi 2 HP (quân Yêu vừa thắng)',
    resonance4: '+2 điểm roll khi TẤN CÔNG',
  },
  dragon: {
    id: 'dragon',
    name: 'Long',
    personal: { def: 1 },
    personalText: '+1 DEF',
    affinityRegion: 'ice',
    affinityText: 'Vực Băng: miễn −1 roll +1 DEF',
    resonance2: 'Ra chuồng chỉ cần tung ≥ 5',
    resonance4: 'Tung 6: chọn thêm 1 quân đi 3 ô (giữ nước chính)',
  },
};

// Tên vùng hiển thị.
export const REGION_NAMES: Record<RegionId, string> = {
  forest: 'Rừng Nguyên Sinh',
  desert: 'Sa Mạc Cháy',
  valley: 'Thung Lũng Sương',
  ice: 'Vực Băng Vĩnh Cứu',
};
