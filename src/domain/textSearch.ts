/** 検索のテキスト正規化（全角・半角の違いを吸収する） */

/**
 * 検索用に正規化する。
 * NFKC により全角英数記号→半角、半角カタカナ→全角カタカナ などが統一される。
 * さらに大文字小文字も無視する。
 */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFKC').toLowerCase();
}

/** target が keyword を（全角・半角・大文字小文字を問わず）含むか */
export function includesKeyword(target: string, keyword: string): boolean {
  return normalizeForSearch(target).includes(normalizeForSearch(keyword));
}
