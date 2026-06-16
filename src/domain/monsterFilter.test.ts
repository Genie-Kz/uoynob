import { describe, expect, it } from 'vitest';
import { createMonster } from '@/test/fixtures';
import { filterMonstersByControls, sortMonstersByDexOrder } from './monsterFilter';

describe('sortMonstersByDexOrder', () => {
  it('位階の昇順、同位階は variant の昇順で並べる', () => {
    const a = createMonster({ id: 'a', 位階: 2, variant: 1 });
    const b = createMonster({ id: 'b', 位階: 1, variant: 2 });
    const c = createMonster({ id: 'c', 位階: 1, variant: 1 });

    const sorted = sortMonstersByDexOrder([a, b, c]);

    expect(sorted.map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });

  it('元配列を破壊しない', () => {
    const input = [createMonster({ id: 'a', 位階: 2 }), createMonster({ id: 'b', 位階: 1 })];
    const before = input.map((m) => m.id);

    sortMonstersByDexOrder(input);

    expect(input.map((m) => m.id)).toEqual(before);
  });
});

describe('filterMonstersByControls', () => {
  const slime = createMonster({
    id: 'slime',
    名前: 'スライム',
    系統: 'スライム',
    ランク: 'F',
    サイズ特性: 'スタンダードボディ',
  });
  const dragon = createMonster({
    id: 'dragon',
    名前: 'ドラゴン',
    系統: 'ドラゴン',
    ランク: 'A',
    サイズ特性: 'ギガボディ',
  });
  const all = [slime, dragon];

  it('条件が空なら全件返す', () => {
    expect(filterMonstersByControls(all, {})).toHaveLength(2);
  });

  it('名前キーワードで部分一致する', () => {
    const result = filterMonstersByControls(all, { keyword: 'スライ' });
    expect(result.map((m) => m.id)).toEqual(['slime']);
  });

  it('読みがな辞書で全角/かなを区別せずヒットする', () => {
    const result = filterMonstersByControls(all, { keyword: 'どらごん' }, { ドラゴン: 'どらごん' });
    expect(result.map((m) => m.id)).toEqual(['dragon']);
  });

  it('系統・ランク・サイズで完全一致絞り込みする', () => {
    expect(filterMonstersByControls(all, { lineage: 'ドラゴン' }).map((m) => m.id)).toEqual([
      'dragon',
    ]);
    expect(filterMonstersByControls(all, { rank: 'F' }).map((m) => m.id)).toEqual(['slime']);
    expect(filterMonstersByControls(all, { bodySize: 'ギガボディ' }).map((m) => m.id)).toEqual([
      'dragon',
    ]);
  });

  it('複数条件は AND で評価する', () => {
    expect(filterMonstersByControls(all, { lineage: 'スライム', rank: 'A' })).toHaveLength(0);
    expect(filterMonstersByControls(all, { lineage: 'スライム', rank: 'F' })).toHaveLength(1);
  });
});
