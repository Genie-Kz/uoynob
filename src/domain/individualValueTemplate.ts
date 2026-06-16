import { INDIVIDUAL_VALUE_RANGE, STAT_KEYS } from '@/constants/statsRules';
import type { StatKey, StatValues } from '@/types/stats';

export const INDIVIDUAL_VALUE_TEMPLATES = [
  'HMS',
  'HMW',
  'HMA',
  'HMD',
  'HAS',
  'HAD',
  'HDW',
  'MAD',
  'MAS',
  'MDW',
  'ASW',
  'HMas',
  'HMds',
  'HAds',
  'HMsw',
  'HAsw',
  'HDsw',
] as const;

const STAT_BY_CODE: Record<string, StatKey> = {
  h: 'HP',
  m: 'MP',
  a: '攻撃力',
  d: '守備力',
  s: '素早さ',
  w: '賢さ',
};

/**
 * 3文字の全大文字表記は指定能力を最大、未指定能力を最小にする。
 * 大小文字の混在表記は大文字を最大、小文字を最小、未指定能力を0にする。
 */
export function individualValuesFromTemplate(template: string): StatValues {
  const isThreeUppercaseCodes = template.length === 3 && template === template.toUpperCase();
  const values = Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, isThreeUppercaseCodes ? INDIVIDUAL_VALUE_RANGE[stat].min : 0]),
  ) as StatValues;
  for (const code of template) {
    const stat = STAT_BY_CODE[code.toLowerCase()];
    if (!stat) continue;
    const range = INDIVIDUAL_VALUE_RANGE[stat];
    values[stat] = code === code.toUpperCase() ? range.max : range.min;
  }
  return values;
}
