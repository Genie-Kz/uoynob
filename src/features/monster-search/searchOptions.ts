import type { BodySize } from '@/types/monster';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';

// 各耐性の閾値（「○○↑＝その段階以上」）の選択肢
export const THRESHOLD_OPTIONS = [
  { label: '', level: null },
  { label: '普通↑', level: 1 },
  { label: '軽減↑', level: 2 },
  { label: '半減↑', level: 3 },
  { label: '激減↑', level: 4 },
  { label: '無効↑', level: 5 },
] as const;

export const BODY_SIZE_OPTIONS: { label: string; value: BodySize | '' }[] = [
  { label: 'デフォルトサイズ', value: '' },
  { label: 'スモールボディ', value: 'スモールボディ' },
  { label: 'スタンダードボディ', value: 'スタンダードボディ' },
  { label: 'メガボディ', value: 'メガボディ' },
  { label: 'ギガボディ', value: 'ギガボディ' },
  { label: '超ギガボディ', value: '超ギガボディ' },
];

export const bodySizeSelectOptions = BODY_SIZE_OPTIONS.map((option) => ({
  value: option.value as string,
  label: option.label,
}));

export const thresholdSelectOptions = THRESHOLD_OPTIONS.map((option) => ({
  value: option.level,
  label: option.label,
}));

export function bodySizeOptionValue(value: string | number | null): BodySize | null {
  return BODY_SIZES.find((size) => size === value) ?? null;
}
