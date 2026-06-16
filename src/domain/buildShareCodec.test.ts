import { describe, expect, it } from 'vitest';
import { createMonster } from '@/test/fixtures';
import type { Attribute } from '@/types/attribute';
import type { Skill } from '@/types/skill';
import type { Weapon } from '@/types/stats';
import { encodeBuildShareQuery, hasBuildShareParams, restoreBuildShareState } from './buildShareCodec';

function createAttribute(id: string, name: string): Attribute {
  return {
    id,
    name,
    category: '特性効果系',
    description: '',
    descriptionSp: '',
    monsters: [],
    skills: [],
  };
}

function createSkill(id: string, name: string): Skill {
  return { id, name, category: '特技系', monsters: [], composition: [] };
}

function createWeapon(no: number, name: string): Weapon {
  return { no, name, type: '剣', 攻撃力: 10, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

const defaultFamilyTree = (lineage: string): (string | null)[] => Array(14).fill(lineage);

describe('buildShareCodec', () => {
  it('共有URLの有無を判定する', () => {
    expect(hasBuildShareParams({})).toBe(false);
    expect(hasBuildShareParams({ x: '' })).toBe(true);
  });

  it('状態を共有URLクエリへエンコードする', () => {
    const skill = createSkill('123', 'テストスキル');
    const weapon = createWeapon(7, 'テストの剣');
    const query = encodeBuildShareQuery(
      {
        bodySize: 'メガボディ',
        traitSlots: ['こうどうはやい', ''],
        skillSlots: [skill, null, null],
        forgeSlots: ['メラ', '攻撃力+30'],
        individualValues: { HP: 100, MP: -100, 攻撃力: 0, 守備力: 0, 素早さ: 100, 賢さ: -100 },
        familyTree: ['スライム', null, 'ドラゴン'],
        parentLevelTotal: 200,
        weapon,
        monshouNames: ['赤の紋晶'],
        spTraitNames: ['ＨＰバブル', 'つねにアタックカンタ'],
      },
      {
        traitMaster: ['こうどうはやい'],
        attributeIdByName: new Map([
          ['ＨＰバブル', '109'],
          ['つねにアタックカンタ', '079'],
        ]),
      },
    );

    expect(query).toMatchObject({
      s: '2',
      t: '0-',
      k: '123--',
      f: '0-33',
      i: '100_-100_0_0_100_-100',
      p: '200',
      w: '7',
      m: '0',
      x: '109-079',
    });
  });

  it('特性ID形式と旧日本語形式のSP化状態を復元する', () => {
    const target = createMonster();
    const attributes = [
      createAttribute('079', 'つねにアタックカンタ'),
      createAttribute('109', 'ＨＰバブル'),
    ];
    const context = {
      traitMaster: [],
      skillById: new Map<string, Skill>(),
      weaponByNo: new Map<string, Weapon>(),
      attributeById: new Map(attributes.map((attribute) => [attribute.id, attribute])),
      attributeIdByName: new Map(attributes.map((attribute) => [attribute.name, attribute.id])),
      defaultFamilyTree,
    };

    expect(restoreBuildShareState({ x: '109-079' }, target, context).spTraitNames)
      .toEqual(['ＨＰバブル', 'つねにアタックカンタ']);
    expect(restoreBuildShareState({ x: 'ＨＰバブル,つねにアタックカンタ' }, target, context).spTraitNames)
      .toEqual(['ＨＰバブル', 'つねにアタックカンタ']);
  });
});
