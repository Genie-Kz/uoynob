import type { BodySize } from '@/types/monster';
import iconMega from '@/assets/images/icons/size/icon-m.jpg';
import iconGiga from '@/assets/images/icons/size/icon-g.png';
import iconSuperGiga from '@/assets/images/icons/size/icon-sg.png';

export const BODY_SIZE_ICON: Partial<Record<BodySize, string>> = {
  メガボディ: iconMega,
  ギガボディ: iconGiga,
  超ギガボディ: iconSuperGiga,
};
