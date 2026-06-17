/** 耐性・特性によるモンスター検索ロジック */
import type { BodySize, Monster } from '@/types/monster';
import { resistanceLevelOf } from './resistance';
import { defaultEditableTraits } from './monster';
import { effectiveResistanceValue } from './effectiveResistance';
import { computeBuildResistances } from './buildSimulator';

/** 「この耐性をこの段階以上で持つ」という条件 */
export interface ResistanceThreshold {
  element: string;
  /** この段階レベル以上であること（弱点=0 … 反射=7） */
  minLevel: number;
}

export interface MonsterSearchCriteria {
  thresholds: ResistanceThreshold[];
  requiredTraits: string[];
  /** 未指定ならモンスター本来のサイズ、指定時はそのサイズに変更した状態で検索する */
  bodySize?: BodySize | null;
  /**
   * モンスター本来のサイズ特性での絞り込み条件。
   * bodySize（変換）とは別物で、こちらは元々のサイズ特性が一致するモンスターだけに絞る。
   */
  originalBodySize?: BodySize | null;
}

/** 検索条件が空かどうか（空のときは全件表示を避けるために使う） */
export function isEmptyCriteria(criteria: MonsterSearchCriteria): boolean {
  return (
    criteria.thresholds.length === 0 &&
    criteria.requiredTraits.length === 0 &&
    !criteria.originalBodySize
  );
}

/** 条件に合致するモンスターを返す（AND条件） */
export function searchMonsters(monsters: Monster[], criteria: MonsterSearchCriteria): Monster[] {
  const { thresholds, requiredTraits, bodySize = null, originalBodySize = null } = criteria;
  return monsters.filter((monster) => {
    // 本来のサイズ特性での絞り込み（指定時のみ）。変換用の bodySize とは独立して効く。
    if (originalBodySize !== null && monster.サイズ特性 !== originalBodySize) return false;

    const searchSize = bodySize ?? monster.サイズ特性;
    const traits = defaultEditableTraits(monster, searchSize).filter(Boolean);
    const resistanceByElement =
      bodySize === null
        ? null
        : Object.fromEntries(
            computeBuildResistances({
              monster,
              bodySize: searchSize,
              traits,
              skills: [],
              forgeElements: [],
            }).map((outcome) => [outcome.element, outcome.finalValue]),
          );

    const meetsResistances = thresholds.every((threshold) => {
      const resistance =
        resistanceByElement?.[threshold.element] ??
        effectiveResistanceValue(monster, threshold.element);
      return resistanceLevelOf(resistance) >= threshold.minLevel;
    });
    if (!meetsResistances) return false;

    return requiredTraits.every((trait) => traits.includes(trait));
  });
}
