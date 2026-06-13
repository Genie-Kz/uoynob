/** パラメータ系特性（最大ＨＰ＋N・攻撃力＋N など）からステータス上昇値を読み取る */
import type { Skill } from '@/types/skill';
import type { StatKey, StatValues } from '@/types/stats';
import { STAT_KEYS } from '@/constants/statsRules';

/** 特性名の接頭辞 → ステータス種別 */
const STAT_BY_PREFIX: Record<string, StatKey> = {
  最大HP: 'HP',
  最大MP: 'MP',
  攻撃力: '攻撃力',
  守備力: '守備力',
  すばやさ: '素早さ',
  かしこさ: '賢さ',
};

export function zeroStats(): StatValues {
  return { HP: 0, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

/**
 * 「最大ＨＰ＋４」「攻撃力＋４０」などの名前を {stat, value} に変換する。
 * パラメータ系でなければ null。
 */
export function parseStatAttribute(name: string): { stat: StatKey; value: number } | null {
  const normalized = name.normalize('NFKC');
  const match = normalized.match(/^(.+?)\+(\d+)$/);
  if (!match) return null;
  const stat = STAT_BY_PREFIX[match[1]];
  if (!stat) return null;
  return { stat, value: Number(match[2]) };
}

/** 名前の列挙からステータス上昇を合算する */
export function aggregateStatBonus(names: Iterable<string>): StatValues {
  const total = zeroStats();
  for (const name of names) {
    const parsed = parseStatAttribute(name);
    if (parsed) total[parsed.stat] += parsed.value;
  }
  return total;
}

/** スキルが（フル習得時に）与えるステータス上昇を合算する */
export function skillStatBonus(skill: Skill): StatValues {
  return aggregateStatBonus(skill.composition.map((item) => item.name));
}

/** スキルのいずれかがガード以外の特定特性を構成に持つか（HPバブル等の判定に使う） */
export function skillsGrantTrait(skills: Skill[], traitName: string): boolean {
  return skills.some((skill) => skill.composition.some((item) => item.name === traitName));
}

export function addStats(a: StatValues, b: StatValues): StatValues {
  const result = zeroStats();
  for (const key of STAT_KEYS) result[key] = a[key] + b[key];
  return result;
}
