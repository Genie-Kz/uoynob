import { describe, expect, it } from 'vitest';
import { isEmptyCriteria, searchMonsters } from './monsterSearch';
import { createMonster } from '@/test/fixtures';

describe('searchMonsters', () => {
  const fireImmune = createMonster({ 名前: 'A', 炎: '無効', 新生前特性1: 'メタルボディ' });
  const fireHalf = createMonster({ 名前: 'B', 炎: '半減' });
  const fireWeak = createMonster({ 名前: 'C', 炎: '弱点', 新生前特性1: 'メタルボディ' });

  const all = [fireImmune, fireHalf, fireWeak];

  it('耐性の閾値以上のモンスターだけ返す（半減↑）', () => {
    const result = searchMonsters(all, {
      thresholds: [{ element: '炎', minLevel: 3 }], // 半減=3 以上
      requiredTraits: [],
    });
    expect(result.map((m) => m.名前)).toEqual(['A', 'B']);
  });

  it('特性条件でも絞り込む（AND条件）', () => {
    const result = searchMonsters(all, {
      thresholds: [{ element: '炎', minLevel: 3 }],
      requiredTraits: ['メタルボディ'],
    });
    expect(result.map((m) => m.名前)).toEqual(['A']);
  });

  it('デフォルトでは本来のサイズによる耐性と特性で検索する', () => {
    const mega = createMonster({
      名前: 'メガ',
      サイズ特性: 'メガボディ',
      メガ特性: 'メガ固有特性',
      ザキ: '普通',
    });

    expect(
      searchMonsters([mega], {
        thresholds: [{ element: 'ザキ', minLevel: 3 }],
        requiredTraits: ['メガ固有特性'],
      }),
    ).toEqual([mega]);
  });

  it('指定サイズへ変更したときの耐性と特性で検索する', () => {
    const mega = createMonster({
      名前: 'メガ',
      サイズ特性: 'メガボディ',
      メガ特性: 'メガ固有特性',
      ザキ: '普通',
    });

    expect(
      searchMonsters([mega], {
        thresholds: [{ element: 'ザキ', minLevel: 1 }],
        requiredTraits: [],
        bodySize: 'スタンダードボディ',
      }),
    ).toEqual([mega]);
    expect(
      searchMonsters([mega], {
        thresholds: [],
        requiredTraits: ['メガ固有特性'],
        bodySize: 'スタンダードボディ',
      }),
    ).toEqual([]);
  });

  it.each([
    ['AI4回行動', 'AI2～3回行動'],
    ['AI3～4回行動', 'AI2回行動'],
  ])('超ギガボディからサイズを小さくすると%sを%sとして検索する', (originalTrait, replacedTrait) => {
    const monster = createMonster({
      サイズ特性: '超ギガボディ',
      新生前特性1: originalTrait,
    });

    for (const bodySize of [
      'スモールボディ',
      'スタンダードボディ',
      'メガボディ',
      'ギガボディ',
    ] as const) {
      expect(
        searchMonsters([monster], {
          thresholds: [],
          requiredTraits: [replacedTrait],
          bodySize,
        }),
      ).toEqual([monster]);
      expect(
        searchMonsters([monster], {
          thresholds: [],
          requiredTraits: [originalTrait],
          bodySize,
        }),
      ).toEqual([]);
    }
  });

  it('デフォルトの超ギガボディでは行動回数特性を変換しない', () => {
    const monster = createMonster({
      サイズ特性: '超ギガボディ',
      新生前特性1: 'AI4回行動',
    });

    expect(
      searchMonsters([monster], {
        thresholds: [],
        requiredTraits: ['AI4回行動'],
      }),
    ).toEqual([monster]);
  });

  it('条件が空かどうかを判定できる', () => {
    expect(isEmptyCriteria({ thresholds: [], requiredTraits: [] })).toBe(true);
    expect(
      isEmptyCriteria({ thresholds: [{ element: '炎', minLevel: 3 }], requiredTraits: [] }),
    ).toBe(false);
  });
});
