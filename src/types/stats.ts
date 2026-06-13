/** ステータス計算に関する型定義 */

/** ステータスの種類（モンスターデータのキーと一致させる） */
export type StatKey = 'HP' | 'MP' | '攻撃力' | '守備力' | '素早さ' | '賢さ';

/** ステータス6種の数値の組 */
export type StatValues = Record<StatKey, number>;

/** 武器 */
export interface Weapon {
  no: number;
  name: string;
  /** 武器種（剣・ヤリ・オノ・ハンマー・ムチ・ツメ・杖） */
  type: string;
  攻撃力: number;
  守備力: number;
  素早さ: number;
  賢さ: number;
}

/** 紋晶 */
export interface Monshou {
  name: string;
  HP: number;
  MP: number;
  攻撃力: number;
  守備力: number;
  素早さ: number;
  賢さ: number;
}

/** 武器鍛冶のステータスアップ1種 */
export interface ForgeStatUp {
  /** 表示名（例: 攻撃力+20） */
  label: string;
  stat: StatKey;
  value: number;
}
