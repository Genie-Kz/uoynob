/** ステータス計算で使う倍率・ボーナス・各種データ */
import type { BodySize } from '@/types/monster';
import type { ForgeStatUp, Monshou, StatKey, StatValues } from '@/types/stats';

export const STAT_KEYS: StatKey[] = ['HP', 'MP', '攻撃力', '守備力', '素早さ', '賢さ'];

/** 基礎値に一律でかかる係数 */
export const BASE_STAT_MULTIPLIER = 1.2;

/** 個体値の範囲（HP・攻撃力・素早さは±100、MP・守備力・賢さは±200） */
export const INDIVIDUAL_VALUE_RANGE: Record<StatKey, { min: number; max: number }> = {
  HP: { min: -100, max: 100 },
  攻撃力: { min: -100, max: 100 },
  素早さ: { min: -100, max: 100 },
  MP: { min: -200, max: 200 },
  守備力: { min: -200, max: 200 },
  賢さ: { min: -200, max: 200 },
};

function uniform(value: number): StatValues {
  return { HP: value, MP: value, 攻撃力: value, 守備力: value, 素早さ: value, 賢さ: value };
}

/* ---- ボディサイズ倍率 ---- */
export const BODY_SIZE_MULTIPLIERS: Record<BodySize, StatValues> = {
  スモールボディ: { HP: 0.7, MP: 0.8, 攻撃力: 0.8, 守備力: 0.8, 素早さ: 0.8, 賢さ: 0.8 },
  スタンダードボディ: uniform(1),
  メガボディ: { HP: 1.5, MP: 1.5, 攻撃力: 1.05, 守備力: 1.05, 素早さ: 1.05, 賢さ: 1.05 },
  ギガボディ: { HP: 2, MP: 2, 攻撃力: 1.1, 守備力: 1.1, 素早さ: 1.1, 賢さ: 1.1 },
  超ギガボディ: { HP: 2.5, MP: 2.5, 攻撃力: 1.15, 守備力: 1.15, 素早さ: 1.15, 賢さ: 1.15 },
};

/** メタルボディ（メタル/ハード/超ハード）装備時：守備力・素早さの倍率を1にする */
export const BODY_SIZE_MULTIPLIERS_METAL: Record<BodySize, StatValues> = {
  スモールボディ: { HP: 0.7, MP: 0.8, 攻撃力: 0.8, 守備力: 1, 素早さ: 1, 賢さ: 0.8 },
  スタンダードボディ: uniform(1),
  メガボディ: { HP: 1.5, MP: 1.5, 攻撃力: 1.05, 守備力: 1, 素早さ: 1, 賢さ: 1.05 },
  ギガボディ: { HP: 2, MP: 2, 攻撃力: 1.1, 守備力: 1, 素早さ: 1, 賢さ: 1.1 },
  超ギガボディ: { HP: 2.5, MP: 2.5, 攻撃力: 1.15, 守備力: 1, 素早さ: 1, 賢さ: 1.15 },
};

/* ---- AI行動回数倍率（全ステータス共通の値） ---- */
export const AI_ACTION_MULTIPLIER: Record<string, number> = {
  'AI1～2回行動': 0.9,
  AI2回行動: 0.8,
  'AI1～3回行動': 0.8,
  'AI2～3回行動': 0.7,
  AI3回行動: 0.65,
  'AI3～4回行動': 0.62,
  AI4回行動: 0.6,
};

/** メタルボディ装備時のAI倍率（守備力・素早さは1、その他はこの値） */
export const AI_ACTION_MULTIPLIER_METAL: Record<string, number> = {
  'AI1～2回行動': 0.86,
  AI2回行動: 0.72,
  'AI1～3回行動': 0.72,
  'AI2～3回行動': 0.58,
  AI3回行動: 0.51,
  'AI3～4回行動': 0.468,
  AI4回行動: 0.44,
};

/** メタルボディ装備時に倍率を1に固定するステータス */
export const METAL_FIXED_STATS: StatKey[] = ['守備力', '素早さ'];

/* ---- メタルボディのHP倍率 ---- */
export const METAL_BODY_HP_MULTIPLIER: Record<string, number> = {
  ライトメタルボディ: 0.5,
  メタルボディ: 1 / 3,
  ハードメタルボディ: 0.25,
  超ハードメタルボディ: 0.2,
};

/** 補正テーブルの差し替え（守備力・素早さを1にしAI倍率を下げる）対象のメタル特性 */
export const METAL_TABLE_OVERRIDE_TRAITS = [
  'メタルボディ',
  'ハードメタルボディ',
  '超ハードメタルボディ',
];

/* ---- つねにアタックカンタ／マホカンタ（HPのみ。SP化で補正なし） ---- */
export const ALWAYS_ATTACK_KANTA_HP_MULTIPLIER = 0.75;
export const ALWAYS_MAHO_KANTA_HP_MULTIPLIER = 0.875;
export const ALWAYS_ATTACK_KANTA_TRAIT = 'つねにアタックカンタ';
export const ALWAYS_MAHO_KANTA_TRAIT = 'つねにマホカンタ';

/* ---- HPバブル／MPバブル ---- */
export const HP_BUBBLE_TRAIT = 'ＨＰバブル';
export const MP_BUBBLE_TRAIT = 'ＭＰバブル';
/** HPバブルが影響するステータスと倍率（通常 / SP） */
export const HP_BUBBLE_MULTIPLIERS: Partial<StatValues> = { HP: 1.5, 攻撃力: 0.5, 素早さ: 0.5 };
export const HP_BUBBLE_SP_MULTIPLIERS: Partial<StatValues> = {
  HP: 2,
  攻撃力: 1 / 3,
  素早さ: 1 / 3,
};
/** MPバブルが影響するステータスと倍率（通常 / SP） */
export const MP_BUBBLE_MULTIPLIERS: Partial<StatValues> = { MP: 2, 守備力: 0.5, 賢さ: 0.5 };
export const MP_BUBBLE_SP_MULTIPLIERS: Partial<StatValues> = { MP: 4, 守備力: 1 / 3, 賢さ: 1 / 3 };

/* ---- 系図（家系図）系統ボーナス ---- */
/** 系統 → ボーナスが乗るステータス3種 */
export const LINEAGE_BONUS_STATS: Record<string, StatKey[]> = {
  物質: ['攻撃力', '守備力', '賢さ'],
  悪魔: ['MP', '攻撃力', '守備力'],
  ドラゴン: ['HP', 'MP', '攻撃力'],
  '???': ['HP', '攻撃力', '賢さ'],
  自然: ['守備力', '素早さ', '賢さ'],
  スライム: ['HP', '素早さ', '賢さ'],
  魔獣: ['MP', '守備力', '素早さ'],
  ゾンビ: ['HP', 'MP', '素早さ'],
};

/**
 * 家系図14枠の重み（％）。
 * 両親×2＝各4%、祖父母×4＝各2%、曽祖父母×8＝各1%。
 */
export const FAMILY_TREE_WEIGHTS: number[] = [4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1];

/** 親レベル合計→全ステータスへのボーナス％ = (合計/200)*5 */
export function parentLevelBonusPercent(parentLevelTotal: number): number {
  return (parentLevelTotal / 200) * 5;
}

/* ---- 武器鍛冶のステータスアップ ---- */
export const FORGE_STAT_UP_OPTIONS: ForgeStatUp[] = [
  { label: '攻撃力+5', stat: '攻撃力', value: 5 },
  { label: '攻撃力+10', stat: '攻撃力', value: 10 },
  { label: '攻撃力+20', stat: '攻撃力', value: 20 },
  { label: '攻撃力+30', stat: '攻撃力', value: 30 },
  { label: '守備力+10', stat: '守備力', value: 10 },
  { label: '守備力+20', stat: '守備力', value: 20 },
  { label: '守備力+40', stat: '守備力', value: 40 },
  { label: '守備力+60', stat: '守備力', value: 60 },
  { label: '素早さ+5', stat: '素早さ', value: 5 },
  { label: '素早さ+10', stat: '素早さ', value: 10 },
  { label: '素早さ+20', stat: '素早さ', value: 20 },
  { label: '素早さ+30', stat: '素早さ', value: 30 },
  { label: '賢さ+10', stat: '賢さ', value: 10 },
  { label: '賢さ+20', stat: '賢さ', value: 20 },
  { label: '賢さ+30', stat: '賢さ', value: 30 },
  { label: '賢さ+60', stat: '賢さ', value: 60 },
];

/* ---- 紋晶 ---- */
export const MONSHOU_LIST: Monshou[] = [
  { name: '赤の紋晶', HP: 0, MP: 24, 攻撃力: 30, 守備力: 0, 素早さ: 0, 賢さ: 0 },
  { name: '青の紋晶', HP: 0, MP: 24, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 60 },
  { name: '黄の紋晶', HP: 12, MP: 0, 攻撃力: 0, 守備力: 60, 素早さ: 0, 賢さ: 0 },
  { name: '緑の紋晶', HP: 12, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 30, 賢さ: 0 },
];
