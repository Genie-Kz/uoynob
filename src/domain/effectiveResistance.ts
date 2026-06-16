/**
 * モンスターの「実効耐性」を求める。
 *
 * 元データの耐性は「スタンダードボディ・特性なし」の素の値。
 * 実際のモンスターは、本来のボディサイズと既定の特性を持つため、
 * それらを加味した値が本来の（図鑑に載るべき）耐性になる。
 */
import type { Monster, ResistanceValue } from '@/types/monster';
import { computeBuildResistances, defaultBuildConfiguration } from './buildSimulator';

// モンスターは読み込み後に共有される不変オブジェクトなので、結果をキャッシュする
const cache = new WeakMap<Monster, Record<string, ResistanceValue>>();

/** モンスターの実効耐性（要素 → 段階値）を返す */
export function effectiveResistances(monster: Monster): Record<string, ResistanceValue> {
  const cached = cache.get(monster);
  if (cached) return cached;

  const outcomes = computeBuildResistances(defaultBuildConfiguration(monster));
  const byElement: Record<string, ResistanceValue> = {};
  for (const outcome of outcomes) byElement[outcome.element] = outcome.finalValue;

  cache.set(monster, byElement);
  return byElement;
}

/** モンスターの指定要素の実効耐性値を返す */
export function effectiveResistanceValue(monster: Monster, element: string): ResistanceValue {
  return effectiveResistances(monster)[element]!;
}
