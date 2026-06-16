/** モンスター関連の型定義 */

/** 耐性の段階を表す値 */
export type ResistanceValue = '弱点' | '普通' | '軽減' | '半減' | '激減' | '無効' | '回復' | '反射';

/** ボディサイズ（特性枠・スキル枠・耐性に影響） */
export type BodySize =
  | 'スモールボディ'
  | 'スタンダードボディ'
  | 'メガボディ'
  | 'ギガボディ'
  | '超ギガボディ';

/** ランク（強さの段階） */
export type MonsterRank = 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * 一覧表示に必要な最小限のモンスター情報。
 * monsters.json(全フィールド・約1.2MB)とは別に、一覧画面用の軽量
 * monsters-list.json をこの形で配信する。Monster はこれを満たす上位互換。
 */
export interface MonsterListItem {
  id: string;
  no: string;
  variant: number;
  名前: string;
  位階: number;
  ランク: MonsterRank;
  系統: string;
  サイズ特性: BodySize;
}

/**
 * モンスター1体分のデータ。
 * 元データ(MonsterData.json)の日本語キーをそのまま採用しつつ、
 * build-data.js で id 等の派生フィールドを付与している。
 * 30種の耐性キーと7種の武器キーは動的アクセスするためインデックスシグネチャで受ける。
 */
export interface Monster {
  /** 例: "001-1"（位階3桁 + 連番） */
  id: string;
  /** 例: "001"（位階3桁ゼロ埋め） */
  no: string;
  /** 同一位階内の連番（1始まり） */
  variant: number;
  /** 性格を除いた本体名（例: "モントナー"） */
  base: string;
  /** 性格（例: "ふつう"） */
  personality: string;

  名前: string;
  位階: number;
  ランク: MonsterRank;
  系統: string;

  HP: number;
  MP: number;
  攻撃力: number;
  守備力: number;
  素早さ: number;
  賢さ: number;

  サイズ特性: BodySize;
  新生前特性1: string;
  新生前特性2: string;
  特性25: string;
  特性50: string;
  特性100: string;
  メガ特性: string;
  ギガ特性: string;
  超ギガ特性: string;

  /** 耐性30種（値は ResistanceValue）・武器7種（"〇"/"×"）を動的に保持 */
  [dynamicKey: string]: string | number;
}
