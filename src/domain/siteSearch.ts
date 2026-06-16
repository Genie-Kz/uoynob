import type { Ability } from '@/types/ability';
import type { Attribute } from '@/types/attribute';
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { includesKeyword } from '@/shared/search/textSearch';

export type SiteSearchKind = 'monster' | 'attribute' | 'skill' | 'ability';

export interface SiteSearchHit {
  kind: SiteSearchKind;
  kindLabel: string;
  id: string;
  label: string;
}

export interface SiteSearchData {
  monsters: Monster[];
  attributes: Attribute[];
  skills: Skill[];
  abilities: Ability[];
}

export interface SiteSearchReadings {
  monster: Record<string, string>;
  attribute: Record<string, string>;
  skill: Record<string, string>;
  ability: Record<string, string>;
  labels: Record<string, string>;
}

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
  if (!query) return [];

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
