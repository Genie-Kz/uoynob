/** 耐性に関する定数 */
import type { ResistanceValue } from '@/types/monster';

/** 耐性30種（表示順） */
export const RESISTANCE_ELEMENTS = [
  'メラ',
  'ギラ',
  'イオ',
  'バギ',
  'ヒャド',
  'ジバリア',
  'デイン',
  'ドルマ',
  'ベタン',
  '炎',
  '吹雪',
  'ザキ',
  'どく',
  '呪い',
  'マインド',
  'こんらん',
  'マヒ',
  'ねむり',
  'マヌーサ',
  'マホトラ',
  'ハック',
  '呪文封じ',
  '斬撃封じ',
  '体技封じ',
  '息封じ',
  '踊り封じ',
  'ダウン',
  'ルカニ',
  'ボミエ',
  'フール',
] as const;

/** 耐性要素名（RESISTANCE_ELEMENTS の要素のいずれか）。 */
export type ResistanceElement = (typeof RESISTANCE_ELEMENTS)[number];

/**
 * 属性耐性（スキル等による上昇で「回復」まで到達できる耐性）。
 * これ以外の耐性はスキル等での上昇上限が「無効」になる。
 */
export const ATTRIBUTE_RESISTANCE_ELEMENTS = [
  'メラ',
  'ギラ',
  'イオ',
  'バギ',
  'ヒャド',
  'ジバリア',
  'デイン',
  'ドルマ',
  'ベタン',
  '炎',
  '吹雪',
] as const;

/** 弱い順に並べた耐性段階（インデックス＝段階レベル 0〜7） */
export const RESISTANCE_VALUES_BY_LEVEL: ResistanceValue[] = [
  '弱点',
  '普通',
  '軽減',
  '半減',
  '激減',
  '無効',
  '回復',
  '反射',
];

/** 段階レベル（弱点=0 … 反射=7） */
export const RESISTANCE_LEVEL: Record<ResistanceValue, number> = {
  弱点: 0,
  普通: 1,
  軽減: 2,
  半減: 3,
  激減: 4,
  無効: 5,
  回復: 6,
  反射: 7,
};

/** 表示テキスト（普通は「-」、弱点はデータ名と同じ「弱点」として表記する） */
export const RESISTANCE_DISPLAY_TEXT: Record<ResistanceValue, string> = {
  普通: '-',
  弱点: '弱点',
  軽減: '軽減',
  半減: '半減',
  激減: '激減',
  無効: '無効',
  回復: '回復',
  反射: '反射',
};

/**
 * 段階ごとの背景色クラス（Tailwind）。
 * 文字列リテラルで持つことで Tailwind の content スキャン対象になる。
 */
export const RESISTANCE_COLOR_CLASS: Record<ResistanceValue, string> = {
  弱点: 'bg-resistance-weak',
  普通: '',
  軽減: 'bg-resistance-little',
  半減: 'bg-resistance-half',
  激減: 'bg-resistance-large',
  無効: 'bg-resistance-invalid',
  回復: 'bg-resistance-recover',
  反射: 'bg-resistance-reflect',
};

/* 上昇上限：属性耐性は「回復」、それ以外は「無効」。反射は元々持つ場合のみ。 */

/** 属性耐性の上昇上限レベル（「回復」）。 */
export const ATTRIBUTE_BOOST_CAP_LEVEL = RESISTANCE_LEVEL['回復'];
/** 非属性耐性の上昇上限レベル（「無効」）。 */
export const NON_ATTRIBUTE_BOOST_CAP_LEVEL = RESISTANCE_LEVEL['無効'];
/** 反射の段階レベル。 */
export const REFLECT_LEVEL = RESISTANCE_LEVEL['反射'];
/** 最弱（「弱点」）の段階レベル＝下限。 */
export const WEAKEST_LEVEL = RESISTANCE_LEVEL['弱点'];
