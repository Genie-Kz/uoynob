import type { Attribute } from '@/types/attribute';

const NO_SP_DESCRIPTION = 'この特性にSP特性はありません';

function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, '');
}

/** 特性データのSP説明を基準にSP化できるか判定する。 */
export function canBeSpFromAttributes(traitName: string, attributes: Attribute[]): boolean {
  const normalizedName = normalizeText(traitName);
  const attribute = attributes.find((candidate) => normalizeText(candidate.name) === normalizedName);
  if (!attribute) return false;
  return normalizeText(attribute.descriptionSp) !== NO_SP_DESCRIPTION;
}
