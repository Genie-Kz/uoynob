/** 耐性グリッド表示用のビューモデル生成 */
import type { Monster } from '@/types/monster';
import type { ResistanceOutcome } from '@/domain/buildSimulator';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { resistanceColorClass, resistanceDisplayText } from '@/domain/resistance';
import { resistanceValueOf } from '@/domain/monster';

export interface ResistanceCellView {
  element: string;
  /** 値の表示テキスト（普通→「-」など） */
  text: string;
  /** 背景色クラス */
  colorClass: string;
  /** 補足（元→現在の変化など）。無ければ undefined。 */
  note?: string;
}

/** 図鑑表示用：モンスターの素の耐性をセルにする */
export function buildBaseResistanceCells(monster: Monster): ResistanceCellView[] {
  return RESISTANCE_ELEMENTS.map((element) => {
    const value = resistanceValueOf(monster, element);
    return {
      element,
      text: resistanceDisplayText(value),
      colorClass: resistanceColorClass(value),
    };
  });
}

/** シミュレーター表示用：計算結果をセルにする（変化があれば「元→」を補足表示） */
export function buildOutcomeResistanceCells(outcomes: ResistanceOutcome[]): ResistanceCellView[] {
  return outcomes.map((outcome) => {
    const note = outcome.changed
      ? `${resistanceDisplayText(outcome.baseValue)}${outcome.raised ? '▲' : '▼'}`
      : undefined;
    return {
      element: outcome.element,
      text: resistanceDisplayText(outcome.finalValue),
      colorClass: resistanceColorClass(outcome.finalValue),
      note,
    };
  });
}
