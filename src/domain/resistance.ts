/** 耐性段階の変換・表示に関する純粋関数 */
import type { ResistanceValue } from '@/types/monster';
import {
  ATTRIBUTE_RESISTANCE_ELEMENTS,
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
