/** SP化できる特性かどうかの判定 */
import { BODY_SIZES } from './monsterTaxonomy';
import { ALL_GUARD_TRAIT } from './buildRules';
import { AI_ACTION_MULTIPLIER, METAL_BODY_HP_MULTIPLIER } from './statsRules';

/** SP化できない特性（これ以外はSP化トグル可能） */
export const CANNOT_BE_SP_TRAITS = new Set<string>([
  ...BODY_SIZES,
  ...Object.keys(AI_ACTION_MULTIPLIER),
  ...Object.keys(METAL_BODY_HP_MULTIPLIER),
  ALL_GUARD_TRAIT,
  'こうどうおそい',
  'こうどうはやい',
  '超こうどうはやい',
  'スイーツカーニバル',
  'いきなりテンション',
  'いきなりバイキルト',
  'いきなりスカラ',
  'いきなりピオラ',
  'いきなりインテ',
  'いきなり黒い霧',
  'いきなり赤い霧',
  'いきなり白い霧',
  'いきなり冥界の霧',
  'いきなりリバース',
  'いきなりシャッフル',
  'すべての武器装備',
  'れんぞく',
  '会心かんぜんガード',
  'メタルキラー',
  'にげあし',
  'しょうひＭＰせつやく',
  'しょうひＭＰ半分',
  'スカウト％アップ',
  'スカウト％アップＳ',
  'スカウト％アップ＋',
]);

export function canBeSp(traitName: string): boolean {
  return !!traitName && !CANNOT_BE_SP_TRAITS.has(traitName);
}
