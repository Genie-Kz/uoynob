import type { Attribute } from '@/types/attribute';
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { includesKeyword } from './textSearch';

export type SiteSearchKind = 'monster' | 'attribute' | 'skill';

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
}

/** サイト内検索の候補を、ページ種類が分かる情報付きで返す。 */
export function searchSite(data: SiteSearchData, keyword: string): SiteSearchHit[] {
  const query = keyword.trim();
  if (!query) return [];

  return [
    ...data.monsters
      .filter((monster) => includesKeyword(monster.名前, query))
      .map((monster) => ({
        kind: 'monster' as const,
        kindLabel: 'モンスター',
        id: monster.id,
        label: monster.名前,
      })),
    ...data.attributes
      .filter((attribute) => includesKeyword(attribute.name, query))
      .map((attribute) => ({
        kind: 'attribute' as const,
        kindLabel: '特性',
        id: attribute.id,
        label: attribute.name,
      })),
    ...data.skills
      .filter((skill) => includesKeyword(skill.name, query))
      .map((skill) => ({
        kind: 'skill' as const,
        kindLabel: 'スキル',
        id: skill.id,
        label: skill.name,
      })),
  ];
}
