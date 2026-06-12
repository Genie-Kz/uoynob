/** 耐性グリッド表示用のビューモデル生成 */
import type { ResistanceOutcome } from '@/domain/buildSimulator';
import { resistanceColorClass, resistanceDisplayText } from '@/domain/resistance';

export interface ResistanceCellView {
  element: string;
  /** 値の表示テキスト（普通→「-」など） */
  text: string;
  /** 背景色クラス */
  colorClass: string;
}

/**
 * 計算結果（実効耐性／ビルド結果）をセルにする。
 * 図鑑・ビルドシミュレーターで同じ見た目（値のみ）を使う。
 */
export function buildResistanceCells(outcomes: ResistanceOutcome[]): ResistanceCellView[] {
  return outcomes.map((outcome) => ({
    element: outcome.element,
    text: resistanceDisplayText(outcome.finalValue),
    colorClass: resistanceColorClass(outcome.finalValue),
  }));
}
