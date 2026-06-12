import { describe, expect, it } from 'vitest';
import { includesKeyword, normalizeForSearch } from './textSearch';

describe('normalizeForSearch', () => {
  it('全角英数を半角に揃える', () => {
    expect(normalizeForSearch('ＡＢ１２')).toBe('ab12');
  });

  it('半角カタカナを全角カタカナに揃える', () => {
    expect(normalizeForSearch('ﾓﾝｽﾀｰ')).toBe('モンスター');
  });

  it('大文字小文字を無視する', () => {
    expect(normalizeForSearch('Slime')).toBe('slime');
  });
});

describe('includesKeyword', () => {
  it('半角カタカナの語で全角カタカナ名にヒットする', () => {
    expect(includesKeyword('モントナー', 'ﾓﾝﾄﾅｰ')).toBe(true);
  });

  it('全角英数の語で半角英数にヒットする', () => {
    expect(includesKeyword('JOKER', 'ＪＯＫＥＲ')).toBe(true);
  });

  it('部分一致でヒットする', () => {
    expect(includesKeyword('スライムベス', 'ｽﾗｲﾑ')).toBe(true);
  });

  it('含まれない場合は false', () => {
    expect(includesKeyword('スライム', 'ドラゴン')).toBe(false);
  });
});
