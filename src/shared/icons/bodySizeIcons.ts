// 画像で表すボディサイズ（メガ・ギガ・超ギガ）のアイコン画像をまとめる。
// スタンダード/スモールは文字バッジで表すため、ここには含めない。
import type { BodySize } from '@/types/monster';
import iconMega from '@/assets/images/icons/size/icon-m.jpg';
import iconGiga from '@/assets/images/icons/size/icon-g.png';
import iconSuperGiga from '@/assets/images/icons/size/icon-sg.png';

/** サイズ → アイコン画像URL。画像を持たないサイズは未登録（Partial）。 */
export const BODY_SIZE_ICON: Partial<Record<BodySize, string>> = {
  メガボディ: iconMega,
  ギガボディ: iconGiga,
  超ギガボディ: iconSuperGiga,
};
