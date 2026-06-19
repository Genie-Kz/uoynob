/** 特技（とくぎ）の型定義 */

/** 特技のカテゴリー（系統）。 */
export type AbilityCategory = '呪文' | '斬撃' | '体技' | '踊り' | 'ブレス・ふえ' | 'その他';

/** 特技から参照するスキル（id と表示名のみの軽量参照）。 */
export interface AbilitySkillRef {
  id: string;
  name: string;
}

export interface Ability {
  id: string;
  name: string;
  category: AbilityCategory;
  /** 効果の説明 */
  description: string;
  /** この特技を覚えるスキル */
  skills: AbilitySkillRef[];
}
