/** 特性・特技のカテゴリとスラッグの対応 */
import type { AttributeCategory } from '@/types/attribute';
import type { AbilityCategory } from '@/types/ability';

/** 特性カテゴリ スラッグ → 名称 */
export const ATTRIBUTE_CATEGORY_BY_SLUG: Record<string, AttributeCategory> = {
  effect: '特性効果系',
  parameter: 'パラメータ系',
  resistance: '耐性系',
};

/** 特技カテゴリ スラッグ → 名称 */
export const ABILITY_CATEGORY_BY_SLUG: Record<string, AbilityCategory> = {
  spell: '呪文',
  slash: '斬撃',
  physical: '体技',
  dance: '踊り',
  breath: 'ブレス・ふえ',
  other: 'その他',
};
