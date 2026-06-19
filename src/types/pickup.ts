/** ピックアップ（特集ページ）の型定義 */

export interface PickupRef {
  /** スキルid もしくはモンスターid（位階No. / "001-1" 形式） */
  id: string;
  name: string;
}

/** 見出しでまとめたモンスターのグループ（例: 系統ごとのまとまり）。 */
export interface PickupMonsterGroup {
  label: string;
  items: PickupRef[];
}

/** スキルを並べる特集エントリ。 */
export interface PickupSkillsEntry {
  title: string;
  type: 'skills';
  items: PickupRef[];
}

/** モンスターを並べる特集エントリ。 */
export interface PickupMonstersEntry {
  title: string;
  type: 'monsters';
  items: PickupRef[];
}

/** モンスターをグループ分けして並べる特集エントリ。 */
export interface PickupMonsterGroupsEntry {
  title: string;
  type: 'monster-groups';
  groups: PickupMonsterGroup[];
}

/** 特集エントリ（3種のいずれか）。type で内容を見分ける。 */
export type PickupEntry = PickupSkillsEntry | PickupMonstersEntry | PickupMonsterGroupsEntry;

/** キー（例: "skill-killer"）→ エントリ */
export type PickupData = Record<string, PickupEntry>;
