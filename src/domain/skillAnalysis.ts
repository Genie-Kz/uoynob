/** スキルの「〇〇ガード＋」を解析するロジック */
import type { Skill } from '@/types/skill';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';

const GUARD_SUFFIX = 'ガード＋';

/** ガード特性名の語幹 → 耐性要素 の特殊対応（語幹がそのまま要素名にならないもの） */
const GUARD_STEM_TO_ELEMENT: Record<string, ResistanceElement> = {
  炎ブレス: '炎',
  吹雪ブレス: '吹雪',
  マホトーン: '呪文封じ',
};

const RESISTANCE_ELEMENT_SET: ReadonlySet<string> = new Set(RESISTANCE_ELEMENTS);

/**
 * 「〇〇ガード＋」という特性名を、対応する耐性要素に変換する。
 * ガード特性でない、または対応要素が無い場合は null。
 */
export function guardAbilityToElement(abilityName: string): ResistanceElement | null {
  if (!abilityName.endsWith(GUARD_SUFFIX)) return null;
  const stem = abilityName.slice(0, -GUARD_SUFFIX.length);
  const element = GUARD_STEM_TO_ELEMENT[stem] ?? stem;
  return RESISTANCE_ELEMENT_SET.has(element) ? (element as ResistanceElement) : null;
}

/**
 * スキルが持つガード特性を集計し、耐性要素 → 個数 のマップにする。
 * （重複するガード特性はそのまま個数として数える）
 */
export function summarizeGuardEffects(skill: Skill): Map<ResistanceElement, number> {
  const counts = new Map<ResistanceElement, number>();
  for (const item of skill.composition) {
    const element = guardAbilityToElement(item.name);
    if (element) counts.set(element, (counts.get(element) ?? 0) + 1);
  }
  return counts;
}

/** スキルが1つ以上のガード特性（耐性アップ）を持つか */
export function hasGuardEffect(skill: Skill): boolean {
  return skill.composition.some((item) => guardAbilityToElement(item.name) !== null);
}
