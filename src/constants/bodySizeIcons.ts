import type { BodySize } from '@/types/monster';
import iconSmall from '@/assets/images/icons/size/icon-sm.png';
import iconStandard from '@/assets/images/icons/size/icon-st.png';
import iconMega from '@/assets/images/icons/size/icon-m.jpg';
import iconGiga from '@/assets/images/icons/size/icon-g.png';
import iconSuperGiga from '@/assets/images/icons/size/icon-sg.png';

export const BODY_SIZE_ICON: Record<BodySize, string> = {
  スモールボディ: iconSmall,
  スタンダードボディ: iconStandard,
  メガボディ: iconMega,
  ギガボディ: iconGiga,
  超ギガボディ: iconSuperGiga,
};
