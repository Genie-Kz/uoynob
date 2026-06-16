import type { Attribute } from '@/types/attribute';
import { normalizeNfkcCompact } from '@/shared/search/normalization';

const NO_SP_DESCRIPTION = 'この特性にSP特性はありません';

/** 特性データのSP説明を基準にSP化できるか判定する。 */
export function canBeSpFromAttributes(traitName: string, attributes: Attribute[]): boolean {
  const normalizedName = normalizeNfkcCompact(traitName);
  const attribute = attributes.find(
    (candidate) => normalizeNfkcCompact(candidate.name) === normalizedName,
  );
  if (!attribute) return false;
  return normalizeNfkcCompact(attribute.descriptionSp) !== NO_SP_DESCRIPTION;
}
