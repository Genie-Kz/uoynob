/** モンスター検索フォームで使う選択肢（耐性閾値・ボディサイズ）の定義と変換ヘルパー。 */
import type { BodySize } from '@/types/monster';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';

/** 各耐性の閾値（「○○↑＝その段階以上」）の選択肢。 */
export const THRESHOLD_OPTIONS = [
  { label: '', level: null },
  { label: '普通↑', level: 1 },
  { label: '軽減↑', level: 2 },
  { label: '半減↑', level: 3 },
  { label: '激減↑', level: 4 },
  { label: '無効↑', level: 5 },
] as const;

/** ボディサイズの選択肢。空文字は「本来のサイズ（変換しない）」を表す。 */
export const BODY_SIZE_OPTIONS: { label: string; value: BodySize | '' }[] = [
  { label: 'デフォルトサイズ', value: '' },
  { label: 'スモールボディ', value: 'スモールボディ' },
  { label: 'スタンダードボディ', value: 'スタンダードボディ' },
  { label: 'メガボディ', value: 'メガボディ' },
  { label: 'ギガボディ', value: 'ギガボディ' },
  { label: '超ギガボディ', value: '超ギガボディ' },
];

/** IconSelect 用に value を string へ揃えたボディサイズ選択肢。 */
export const bodySizeSelectOptions = BODY_SIZE_OPTIONS.map((option) => ({
  value: option.value as string,
  label: option.label,
}));

/** IconSelect 用の耐性閾値選択肢（value は段階レベル、未指定は null）。 */
export const thresholdSelectOptions = THRESHOLD_OPTIONS.map((option) => ({
  value: option.level,
  label: option.label,
}));

/** IconSelect の選択値（string|number|null）を、BodySize 型に変換する。該当しなければ null。 */
export function bodySizeOptionValue(value: string | number | null): BodySize | null {
  return BODY_SIZES.find((size) => size === value) ?? null;
}
