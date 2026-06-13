/** 耐性段階の変換・表示に関する純粋関数 */
import type { ResistanceValue } from '@/types/monster';
import {
  ATTRIBUTE_RESISTANCE_ELEMENTS,
  NON_ATTRIBUTE_BOOST_CAP_LEVEL,
  RESISTANCE_COLOR_CLASS,
  RESISTANCE_DISPLAY_TEXT,
  RESISTANCE_LEVEL,
  RESISTANCE_VALUES_BY_LEVEL,
} from '@/constants/resistances';

/** 耐性値 → 段階レベル（弱点=0 … 反射=7） */
export function resistanceLevelOf(value: ResistanceValue): number {
  return RESISTANCE_LEVEL[value];
}

/** 段階レベル → 耐性値（範囲外は端にクランプ） */
export function resistanceValueOfLevel(level: number): ResistanceValue {
  const clamped = Math.max(0, Math.min(RESISTANCE_VALUES_BY_LEVEL.length - 1, level));
  return RESISTANCE_VALUES_BY_LEVEL[clamped];
}

/** 表示テキスト（普通→「-」、弱点→「弱い」など） */
export function resistanceDisplayText(value: ResistanceValue): string {
  return RESISTANCE_DISPLAY_TEXT[value];
}

/** 背景色クラス（Tailwind） */
export function resistanceColorClass(value: ResistanceValue): string {
  return RESISTANCE_COLOR_CLASS[value];
}

/** 属性耐性（上昇上限が「回復」になる耐性）かどうか */
export function isAttributeResistance(element: string): boolean {
  return (ATTRIBUTE_RESISTANCE_ELEMENTS as readonly string[]).includes(element);
}

/** 非属性で「無効」を超えた段階か（無効+N 表記の対象か） */
function isOverInvalid(element: string, level: number): boolean {
  return !isAttributeResistance(element) && level > NON_ATTRIBUTE_BOOST_CAP_LEVEL;
}

/**
 * 段階レベルと耐性要素から表示テキストを返す。
 * 非属性で「無効」を超えた場合は「無効+1」「無効+2」… と数値表記する。
 */
export function resistanceDisplayForElement(element: string, level: number, isOriginallyReflect = false): string {
  if (isOriginallyReflect) {
    return resistanceDisplayText('反射');
  }
  if (isOverInvalid(element, level)) {
    return `無効+${level - NON_ATTRIBUTE_BOOST_CAP_LEVEL}`;
  }
  return resistanceDisplayText(resistanceValueOfLevel(level));
}

/** 段階レベルと耐性要素から背景色クラスを返す（無効+N は「無効」と同色） */
export function resistanceColorForElement(element: string, level: number, isOriginallyReflect = false): string {
  if (isOriginallyReflect) {
    return resistanceColorClass('反射');
  }
  if (isOverInvalid(element, level)) {
    return resistanceColorClass('無効');
  }
  return resistanceColorClass(resistanceValueOfLevel(level));
}
