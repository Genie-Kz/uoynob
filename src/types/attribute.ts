/** 特性（とくせい）の型定義 */

/** 特性のカテゴリー（系統）。 */
export type AttributeCategory = '特性効果系' | 'パラメータ系' | '耐性系';

/** 特性を持つモンスターへの軽量参照。 */
export interface AttributeMonsterRef {
  /** 元サイトのモンスターid（位階No. もしくは "001-1" 形式） */
  id: string;
  name: string;
}

/** 特性を覚えるスキルへの軽量参照。 */
export interface AttributeSkillRef {
  id: string;
  name: string;
}

export interface Attribute {
  id: string;
  name: string;
  category: AttributeCategory;
  /** 効果の説明 */
  description: string;
  /** ＳＰ版の効果説明（無い場合あり） */
  descriptionSp: string;
  monsters: AttributeMonsterRef[];
  skills: AttributeSkillRef[];
}
