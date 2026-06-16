import { describe, expect, it } from 'vitest';
import { parseStatAttribute } from './statBonus';

describe('parseStatAttribute normalization', () => {
  it('全角英数と全角プラスをNFKCで吸収する', () => {
    expect(parseStatAttribute('最大ＨＰ＋４')).toEqual({ stat: 'HP', value: 4 });
    expect(parseStatAttribute('最大ＭＰ＋８')).toEqual({ stat: 'MP', value: 8 });
  });

  it('未知の接頭辞や空白入りの表記はステータス上昇として扱わない', () => {
    expect(parseStatAttribute('ＨＰ＋４')).toBeNull();
    expect(parseStatAttribute('最大ＨＰ ＋４')).toBeNull();
  });
});
