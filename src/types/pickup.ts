/** ピックアップ（特集ページ）の型定義 */

export interface PickupRef {
  /** スキルid もしくはモンスターid（位階No. / "001-1" 形式） */
  id: string;
  name: string;
}

export interface PickupMonsterGroup {
  label: string;
  items: PickupRef[];
}

export interface PickupSkillsEntry {
  title: string;
  type: 'skills';
  items: PickupRef[];
}

export interface PickupMonstersEntry {
  title: string;
  type: 'monsters';
  items: PickupRef[];
}

export interface PickupMonsterGroupsEntry {
  title: string;
  type: 'monster-groups';
  groups: PickupMonsterGroup[];
}

export type PickupEntry = PickupSkillsEntry | PickupMonstersEntry | PickupMonsterGroupsEntry;

/** キー（例: "skill-killer"）→ エントリ */
export type PickupData = Record<string, PickupEntry>;
