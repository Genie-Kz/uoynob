/** テスト用のモンスター・スキル生成ヘルパー */
import type { BodySize, Monster, ResistanceValue } from '@/types/monster';
import type { Skill, SkillCompositionItem } from '@/types/skill';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { WEAPONS } from '@/constants/monsterTaxonomy';

/** すべての耐性を「普通」、武器を「×」にした素のモンスターを作る（overrides で上書き可能） */
export function createMonster(overrides: Partial<Monster> = {}): Monster {
  const monster: Monster = {
    id: '001-1',
    no: '001',
    variant: 1,
    base: 'テスト',
    personality: 'ふつう',
    名前: 'テスト(ふつう)',
    位階: 1,
    ランク: 'F',
    系統: 'スライム',
    HP: 100,
    MP: 100,
    攻撃力: 100,
    守備力: 100,
    素早さ: 100,
    賢さ: 100,
    サイズ特性: 'スタンダードボディ',
    新生前特性1: '',
    新生前特性2: '',
    特性25: '',
    特性50: '',
    特性100: '',
    メガ特性: '',
    ギガ特性: '',
    超ギガ特性: '',
  };
  for (const element of RESISTANCE_ELEMENTS) monster[element] = '普通';
  for (const weapon of WEAPONS) monster[weapon] = '×';
  return Object.assign(monster, overrides);
}

/** ボディサイズ付きでモンスターを作る簡易ヘルパー */
export function createMonsterWithSize(size: BodySize, overrides: Partial<Monster> = {}): Monster {
  return createMonster({ サイズ特性: size, ...overrides });
}

/** 特定耐性の値を上書きしたモンスターを作る */
export function createMonsterWithResistances(
  resistances: Record<string, ResistanceValue>,
  overrides: Partial<Monster> = {},
): Monster {
  return createMonster({ ...resistances, ...overrides });
}

/** ガード特性だけを構成に持つスキルを作る */
export function createGuardSkill(id: string, name: string, guardAbilityNames: string[]): Skill {
  const composition: SkillCompositionItem[] = guardAbilityNames.map((abilityName, index) => ({
    type: 'attribute',
    aid: String(index + 1),
    name: abilityName,
  }));
  return { id, name, category: '特技系', composition, monsters: [] };
}
