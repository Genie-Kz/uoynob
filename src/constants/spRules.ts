/** 特性を SP 化できるか（SP 特性を持つか）を判定するルール。 */
import type { Attribute } from '@/types/attribute';
import { normalizeNfkcCompact } from '@/shared/search/normalization';

// 「SP 特性なし」を表す特性データ側の文言。これと一致するなら SP 化不可とみなす。
const NO_SP_DESCRIPTION = 'この特性にSP特性はありません';

/** 特性データのSP説明を基準にSP化できるか判定する。 */
export function canBeSpFromAttributes(traitName: string, attributes: Attribute[]): boolean {
  // 表記ゆれ（全角/半角等）を吸収して名前を突き合わせる
  const normalizedName = normalizeNfkcCompact(traitName);
  const attribute = attributes.find(
    (candidate) => normalizeNfkcCompact(candidate.name) === normalizedName,
  );
  // 該当する特性データが無ければ SP 化できない
  if (!attribute) return false;
  // SP 説明が「SP 特性なし」でなければ SP 化できる
  return normalizeNfkcCompact(attribute.descriptionSp) !== NO_SP_DESCRIPTION;
}
