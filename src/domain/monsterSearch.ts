/** 耐性・特性によるモンスター検索ロジック */
import type { Monster } from '@/types/monster';
import { resistanceLevelOf } from './resistance';
import { resistanceValueOf, traitsOf } from './monster';

/** 「この耐性をこの段階以上で持つ」という条件 */
export interface ResistanceThreshold {
  element: string;
  /** この段階レベル以上であること（弱点=0 … 反射=7） */
  minLevel: number;
}

export interface MonsterSearchCriteria {
  thresholds: ResistanceThreshold[];
  requiredTraits: string[];
}

/** 検索条件が空かどうか（空のときは全件表示を避けるために使う） */
export function isEmptyCriteria(criteria: MonsterSearchCriteria): boolean {
  return criteria.thresholds.length === 0 && criteria.requiredTraits.length === 0;
}

/** 条件に合致するモンスターを返す（AND条件） */
export function searchMonsters(monsters: Monster[], criteria: MonsterSearchCriteria): Monster[] {
  const { thresholds, requiredTraits } = criteria;
  return monsters.filter((monster) => {
    const meetsResistances = thresholds.every(
      (threshold) => resistanceLevelOf(resistanceValueOf(monster, threshold.element)) >= threshold.minLevel,
    );
    if (!meetsResistances) return false;

    const ownTraits = traitsOf(monster);
    return requiredTraits.every((trait) => ownTraits.includes(trait));
  });
}
