/** 文字列照合で使う正規化ユーティリティ。用途ごとに意味を分けて公開する。 */

export function normalizeNfkc(text: string): string {
  return text.normalize('NFKC');
}

export function normalizeNfkcCompact(text: string): string {
  return normalizeNfkc(text).replace(/\s+/g, '');
}

/**
 * カタカナをひらがなに畳む。
 * NFKC 後のカタカナ（U+30A1〜U+30F6）をひらがな（U+3041〜U+3096）へ変換する。
 * 長音記号「ー」(U+30FC) などはそのまま残す。
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

/**
 * サイト内検索・一覧検索用の正規化。
 * 全角/半角、ひらがな/カタカナ、「・」の差を吸収し、大文字小文字も無視する。
 */
export function normalizeSearchText(text: string): string {
  return katakanaToHiragana(normalizeNfkc(text))
    .replace(/・/g, '')
    .toLowerCase();
}

/**
 * デメリット指数の表記照合用。
 * 既存の挙動を保つためNFKCは使わず、必要な半角表記だけ全角へ寄せる。
 */
export function normalizeTraitCostKey(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/HP/g, 'ＨＰ')
    .replace(/MP/g, 'ＭＰ')
    .replace(/%/g, '％');
}
