/** 検索のテキスト正規化（全角・半角・かな種別の違いを吸収する） */

/**
 * カタカナをひらがなに畳む。
 * NFKC 後のカタカナ（U+30A1〜U+30F6）をひらがな（U+3041〜U+3096）へ変換する。
 * 長音記号「ー」(U+30FC) などはそのまま残す。
 */
function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

/**
 * 検索用に正規化する。
 * NFKC により全角英数記号→半角、半角カタカナ→全角カタカナ などが統一される。
 * さらにカタカナをひらがなに畳み、大文字小文字も無視する。
 */
export function normalizeForSearch(text: string): string {
  return katakanaToHiragana(text.normalize('NFKC')).toLowerCase();
}

/** target が keyword を（全角・半角・大文字小文字を問わず）含むか */
export function includesKeyword(target: string, keyword: string): boolean {
  return normalizeForSearch(target).includes(normalizeForSearch(keyword));
}

export function readingForText(text: string, readings?: Record<string, string>): string {
  if (!readings) return '';
  const direct = readings[text.normalize('NFKC')];
  if (direct) return direct;
  return text
    .split(/\s+/)
    .map((part) => readings[part.normalize('NFKC')] ?? '')
    .filter(Boolean)
    .join(' ');
}

/** 表記そのもの、または静的に生成した読みのどちらかに検索語が含まれるか。 */
export function includesKeywordWithReading(
  target: string,
  keyword: string,
  readings?: Record<string, string>,
): boolean {
  return includesKeyword(target, keyword) || includesKeyword(readingForText(target, readings), keyword);
}
