/** 耐性グリッド表示用のビューモデル生成 */
import type { ResistanceOutcome } from '@/domain/buildSimulator';
import { resistanceColorForElement, resistanceDisplayForElement } from '@/domain/resistance';

/** 耐性グリッドの1セル分の表示情報。 */
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
  return outcomes.map((outcome) => {
    const isOriginallyReflect = outcome.baseValue === '反射';
    return {
      element: outcome.element,
      text: resistanceDisplayForElement(outcome.element, outcome.finalLevel, isOriginallyReflect),
      colorClass: resistanceColorForElement(
        outcome.element,
        outcome.finalLevel,
        isOriginallyReflect,
      ),
    };
  });
}
