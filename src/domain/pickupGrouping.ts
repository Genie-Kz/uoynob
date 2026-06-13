/** ピックアップのスキルを目的別に分類する純粋関数 */
import type { PickupRef } from '@/types/pickup';
import type { Skill } from '@/types/skill';
import type { StatKey } from '@/types/stats';
import { STAT_KEYS } from '@/constants/statsRules';
import {
  GUARDS_BY_RESISTANCE_PICKUP,
  KILLER_ATTRIBUTES,
  SHINSHO_BY_LOCAL_SKILL,
  LOCAL_SKILLS_BY_SHINSHO,
} from '@/constants/pickupGroups';
import { skillStatBonus } from './statBonus';

export interface PickupSkillGroup {
  label: string;
  items: PickupRef[];
}

/** 分類対象のピックアップキーかどうか */
export function isGroupedSkillPickup(key: string): boolean {
  return (
    key === 'skill-local' ||
    key === 'skill-killer' ||
    key === 'skill-parameter-up' ||
    key === 'skill-resistance-spell' ||
    key === 'skill-resistance-breath' ||
    key === 'skill-resistance-condition' ||
    key === 'skill-resistance-seal' ||
    key === 'skill-resistance-weaken'
  );
}

/** ご当地スキルを入手元の神将ごとに分類 */
function groupByShinsho(items: PickupRef[]): PickupSkillGroup[] {
  const order = LOCAL_SKILLS_BY_SHINSHO.map((group) => group.shinsho);
  const buckets = new Map<string, PickupRef[]>(order.map((shinsho) => [shinsho, []]));
  const others: PickupRef[] = [];
  for (const item of items) {
    const shinsho = SHINSHO_BY_LOCAL_SKILL[item.name];
    if (shinsho) buckets.get(shinsho)!.push(item);
    else others.push(item);
  }
  const groups = order
    .map((shinsho) => ({ label: shinsho, items: buckets.get(shinsho)! }))
    .filter((group) => group.items.length > 0);
  if (others.length) groups.push({ label: 'その他', items: others });
  return groups;
}

/** スキル名末尾の「 [+200]」のような上昇量表記を取り除く */
function stripAmountSuffix(name: string): string {
  return name.replace(/\s*\[[+＋]?-?\d+\]\s*$/, '').trim();
}

/** パラメータ上昇スキルをステータスごと（上昇量の大きい順）に分類 */
function groupByStat(items: PickupRef[], skillById: Map<string, Skill>): PickupSkillGroup[] {
  return STAT_KEYS.map((stat: StatKey) => {
    const ranked = items
      .map((item) => {
        const skill = skillById.get(item.id);
        const amount = skill ? skillStatBonus(skill)[stat] : 0;
        return { item, amount };
      })
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return {
      label: stat,
      items: ranked.map(({ item, amount }) => ({
        id: item.id,
        name: `${stripAmountSuffix(item.name)}[+${amount}]`,
      })),
    };
  }).filter((group) => group.items.length > 0);
}

/** 指定された特性だけを、指定順で分類 */
function groupByAttribute(
  items: PickupRef[],
  skillById: Map<string, Skill>,
  attributeNames: readonly string[],
): PickupSkillGroup[] {
  const buckets = new Map<string, PickupRef[]>(attributeNames.map((attributeName) => [attributeName, []]));
  for (const item of items) {
    const skill = skillById.get(item.id);
    for (const part of skill?.composition ?? []) {
      if (part.type !== 'attribute') continue;
      const bucket = buckets.get(part.name);
      if (bucket && !bucket.some((candidate) => candidate.id === item.id)) bucket.push(item);
    }
  }
  return attributeNames
    .map((attributeName) => ({ label: attributeName, items: buckets.get(attributeName)! }))
    .filter((group) => group.items.length > 0);
}

/**
 * ピックアップキーに応じてスキルを分類する。
 * 対象外のキーは null を返す（呼び出し側で既定表示にフォールバック）。
 */
export function groupPickupSkills(
  key: string,
  items: PickupRef[],
  skills: Skill[],
): PickupSkillGroup[] | null {
  if (key === 'skill-local') return groupByShinsho(items);
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  if (key === 'skill-killer') return groupByAttribute(items, skillById, KILLER_ATTRIBUTES);
  if (key === 'skill-parameter-up') return groupByStat(items, skillById);
  const guardNames = GUARDS_BY_RESISTANCE_PICKUP[key];
  if (guardNames) return groupByAttribute(items, skillById, guardNames);
  return null;
}
