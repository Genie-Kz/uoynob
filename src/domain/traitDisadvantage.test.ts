import { describe, expect, it } from 'vitest';
import {
  disadvantageCostOfTrait,
  disadvantageTraits,
  totalDisadvantageCost,
} from './traitDisadvantage';

describe('traitDisadvantage', () => {
  it('固定値と汎用パターンの指数を判定する', () => {
    expect(disadvantageCostOfTrait('こうどうはやい')).toBe(2);
    expect(disadvantageCostOfTrait('自動MP回復')).toBe(-3);
    expect(disadvantageCostOfTrait('アイテム%アップ')).toBe(-8);
    expect(disadvantageCostOfTrait('AI3～4回行動')).toBe(-3);
    expect(disadvantageCostOfTrait('こんらん攻撃')).toBe(-2);
    expect(disadvantageCostOfTrait('どく攻撃')).toBe(-4);
    expect(disadvantageCostOfTrait('メラ系のコツ')).toBe(3);
    expect(disadvantageCostOfTrait('メラブレイク')).toBe(-2);
    expect(disadvantageCostOfTrait('全ガードブレイク')).toBe(2);
  });

  it('モントナー(ゆうかん)は特例の2を両方ある時だけ加算する', () => {
    expect(totalDisadvantageCost(['ゆうかん', 'さいごのきぼう'], 'モントナー(ゆうかん)')).toBe(2);
    expect(totalDisadvantageCost(['ゆうかん'], 'モントナー(ゆうかん)')).toBe(0);
    expect(totalDisadvantageCost(['さいごのきぼう'], 'モントナー(ゆうかん)')).toBe(0);
  });

  it('名もなき闇の王のスモール構成は指数6になる', () => {
    expect(
      totalDisadvantageCost([
        'AI2～3回行動',
        '超ガードブレイク',
        'つねにアタックカンタ',
        '超こうどうはやい',
        '秘めたるチカラ',
      ]),
    ).toBe(6);
  });

  it('ランクと指数に応じた不利な特性を返す', () => {
    expect(disadvantageTraits('F', 5)).toEqual(['ちょうはつ', 'オロオロ']);
    expect(disadvantageTraits('C', 4)).toEqual(['自動ＭＰダウン', 'ヘロヘロ']);
    expect(disadvantageTraits('A', 1)).toEqual(['しょうひＭＰ✕２']);
    expect(disadvantageTraits('SS', 2)).toEqual(['アンラッキー']);
    expect(disadvantageTraits('S', 6)).toEqual(['ヘロヘロ', '強者のよゆう']);
    expect(disadvantageTraits('S', 0)).toEqual([]);
  });
});
