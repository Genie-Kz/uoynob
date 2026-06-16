import { describe, expect, it } from 'vitest';
import { includesKeyword, includesKeywordWithReading, normalizeForSearch } from './textSearch';

describe('normalizeForSearch', () => {
  it('全角英数を半角に揃える', () => {
    expect(normalizeForSearch('ＡＢ１２')).toBe('ab12');
  });

  it('半角カタカナを全角カタカナを経てひらがなに揃える', () => {
    expect(normalizeForSearch('ﾓﾝｽﾀｰ')).toBe('もんすたー');
  });

  it('カタカナをひらがなに畳む', () => {
    expect(normalizeForSearch('スライム')).toBe('すらいむ');
  });

  it('長音記号はそのまま残す', () => {
    expect(normalizeForSearch('キラーマシン')).toBe('きらーましん');
  });

  it('大文字小文字を無視する', () => {
    expect(normalizeForSearch('Slime')).toBe('slime');
  });

  it('中黒を無視する', () => {
    expect(normalizeForSearch('マジェス・ドレアム')).toBe('まじぇすどれあむ');
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

  it('ひらがなの語でカタカナ名にヒットする', () => {
    expect(includesKeyword('スライム', 'すらいむ')).toBe(true);
  });

  it('カタカナの語でひらがな交じり名にヒットする', () => {
    expect(includesKeyword('はぐれメタル', 'メタル')).toBe(true);
  });

  it('含まれない場合は false', () => {
    expect(includesKeyword('スライム', 'ドラゴン')).toBe(false);
  });

  it('中黒を省略した検索語でもヒットする', () => {
    expect(includesKeyword('マジェス・ドレアム', 'マジェスドレアム')).toBe(true);
  });
});

describe('includesKeywordWithReading', () => {
  it('漢字の読みでヒットする', () => {
    expect(includesKeywordWithReading('超ギガボディ', 'ちょう', {
      超ギガボディ: 'ちょうギガボディ',
    })).toBe(true);
  });
});
