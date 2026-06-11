/** スキル関連の型定義 */

export type SkillCategory = '特技系' | 'パラメータ系';

/** スキル構成の1項目（特技 or 特性） */
export interface SkillCompositionItem {
  /** ability=特技, attribute=特性（〇〇ガード＋など） */
  type: 'ability' | 'attribute';
  /** 元サイトでの特技/特性ページのid */
  aid: string;
  name: string;
}

/** スキルを習得できるモンスターへの参照 */
export interface SkillMonsterReference {
  /** 元サイトのモンスターid（位階No. もしくは "001-1" 形式） */
  id: string;
  name: string;
}

/** スキル1件分のデータ */
export interface Skill {
  /** 例: "001"（3桁ゼロ埋め） */
  id: string;
  name: string;
  category: SkillCategory;
  composition: SkillCompositionItem[];
  monsters: SkillMonsterReference[];
}
