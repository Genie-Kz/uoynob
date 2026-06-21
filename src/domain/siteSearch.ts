/** サイト内横断検索のドメインロジック。モンスター・特性・スキル・特技を1つの結果配列にまとめる。 */
import type { Ability } from '@/types/ability';
import type { Attribute } from '@/types/attribute';
import type { MonsterListItem } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { includesKeyword } from '@/shared/search/textSearch';

/** 検索ヒットの種類。 */
export type SiteSearchKind = 'monster' | 'attribute' | 'skill' | 'ability';

/** 検索ヒット1件。どの種類のどのページかが分かる情報を持つ。 */
export interface SiteSearchHit {
  kind: SiteSearchKind;
  kindLabel: string;
  id: string;
  label: string;
}

/** 検索対象になる4種のデータ。 */
export interface SiteSearchData {
  monsters: MonsterListItem[];
  attributes: Attribute[];
  skills: Skill[];
  abilities: Ability[];
}

/** 読みがな検索用の対応表（種類ごとの id→読み、および汎用 labels）。 */
export interface SiteSearchReadings {
  monster: Record<string, string>;
  attribute: Record<string, string>;
  skill: Record<string, string>;
  ability: Record<string, string>;
  labels: Record<string, string>;
}

// 1件がキーワードに一致するか。表示名そのものか、対応する読みがなのどちらかに含まれれば一致。
function matches(
  kind: SiteSearchKind,
  id: string,
  label: string,
  query: string,
  readings?: SiteSearchReadings,
): boolean {
  return includesKeyword(label, query) || includesKeyword(readings?.[kind]?.[id] ?? '', query);
}

/** サイト内検索の候補を、ページ種類が分かる情報付きで返す。 */
export function searchSite(
  data: SiteSearchData,
  keyword: string,
  readings?: SiteSearchReadings,
): SiteSearchHit[] {
  const query = keyword.trim();
  // 空クエリでは全件が返らないよう、空配列で早期リターンする
  if (!query) return [];

  // 4種それぞれを絞り込み、種類ラベル付きのヒットへ整形して連結する（モンスター→特性→スキル→特技の順）
  return [
    ...data.monsters
      .filter((monster) => matches('monster', monster.id, monster.名前, query, readings))
      .map((monster) => ({
        kind: 'monster' as const,
        kindLabel: 'モンスター',
        id: monster.id,
        label: monster.名前,
      })),
    ...data.attributes
      .filter((attribute) => matches('attribute', attribute.id, attribute.name, query, readings))
      .map((attribute) => ({
        kind: 'attribute' as const,
        kindLabel: '特性',
        id: attribute.id,
        label: attribute.name,
      })),
    ...data.skills
      .filter((skill) => matches('skill', skill.id, skill.name, query, readings))
      .map((skill) => ({
        kind: 'skill' as const,
        kindLabel: 'スキル',
        id: skill.id,
        label: skill.name,
      })),
    ...data.abilities
      .filter((ability) => matches('ability', ability.id, ability.name, query, readings))
      .map((ability) => ({
        kind: 'ability' as const,
        kindLabel: '特技',
        id: ability.id,
        label: ability.name,
      })),
  ];
}
