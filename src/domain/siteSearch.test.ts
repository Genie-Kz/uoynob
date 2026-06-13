import { describe, expect, it } from 'vitest';
import { createGuardSkill, createMonster } from '@/test/fixtures';
import type { Ability } from '@/types/ability';
import type { Attribute } from '@/types/attribute';
import { searchSite } from './siteSearch';

const attribute = {
  id: '001',
  name: 'スライムキラー',
  category: '特性効果系',
  description: '',
  descriptionSp: '',
  monsters: [],
  skills: [],
} satisfies Attribute;

const ability = {
  id: '001',
  name: 'スライム斬り',
  category: '斬撃',
  description: '',
  skills: [],
} satisfies Ability;

describe('searchSite', () => {
  const data = {
    monsters: [
      createMonster({ id: '001-1', 名前: 'スライム' }),
      createMonster({ id: '002-1', 名前: 'ドラゴン' }),
    ],
    attributes: [attribute],
    skills: [createGuardSkill('001', 'スライムソウル', [])],
    abilities: [ability],
  };

  it('種類を付けて全データを横断検索する', () => {
    expect(searchSite(data, 'スライム')).toEqual([
      { kind: 'monster', kindLabel: 'モンスター', id: '001-1', label: 'スライム' },
      { kind: 'attribute', kindLabel: '特性', id: '001', label: 'スライムキラー' },
      { kind: 'skill', kindLabel: 'スキル', id: '001', label: 'スライムソウル' },
      { kind: 'ability', kindLabel: '特技', id: '001', label: 'スライム斬り' },
    ]);
  });

  it('候補が1件だけの場合も判定できる配列を返す', () => {
    expect(searchSite(data, 'ドラゴン')).toEqual([
      { kind: 'monster', kindLabel: 'モンスター', id: '002-1', label: 'ドラゴン' },
    ]);
  });

  it('空白だけの検索語では候補を返さない', () => {
    expect(searchSite(data, '   ')).toEqual([]);
  });
});
