/**
 * ステータス計算エンジン。
 *
 * 仕様の計算式を厳密に再現する。Ceil（切り上げ）の順序が結果に影響するため、
 * 各ステップで個別に切り上げる。HP のみメタル補正・つねカンタ補正が入る。
 */
import type { BodySize, Monster } from '@/types/monster';
import type { ForgeStatUp, Monshou, StatKey, StatValues, Weapon } from '@/types/stats';
import type { Skill } from '@/types/skill';
import {
  AI_ACTION_MULTIPLIER,
  AI_ACTION_MULTIPLIER_METAL,
  ALWAYS_ATTACK_KANTA_HP_MULTIPLIER,
  ALWAYS_ATTACK_KANTA_TRAIT,
  ALWAYS_MAHO_KANTA_HP_MULTIPLIER,
  ALWAYS_MAHO_KANTA_TRAIT,
  BASE_STAT_MULTIPLIER,
  BODY_SIZE_MULTIPLIERS,
  BODY_SIZE_MULTIPLIERS_METAL,
  FAMILY_TREE_WEIGHTS,
  HP_BUBBLE_MULTIPLIERS,
  HP_BUBBLE_SP_MULTIPLIERS,
  HP_BUBBLE_TRAIT,
  LINEAGE_BONUS_STATS,
  METAL_BODY_HP_MULTIPLIER,
  METAL_FIXED_STATS,
  METAL_TABLE_OVERRIDE_TRAITS,
  MP_BUBBLE_MULTIPLIERS,
  MP_BUBBLE_SP_MULTIPLIERS,
  MP_BUBBLE_TRAIT,
  STAT_KEYS,
  parentLevelBonusPercent,
} from '@/constants/statsRules';
import { addStats, aggregateStatBonus, skillStatBonus, skillsGrantTrait, zeroStats } from './statBonus';

/** ステータス計算の入力 */
export interface StatsBuildConfig {
  monster: Monster;
  bodySize: BodySize;
  /** 装備中の編集可能特性（AI・メタル・カンタ・パラメータ系の判定に使う） */
  traits: string[];
  /** 装備中のスキル（パラメータ系の合算とバブル判定に使う） */
  skills: Skill[];
  individualValues: StatValues;
  /** 家系図14体の系統（null/空は未設定として無視。並びは仕様の重み順） */
  familyTree: (string | null)[];
  parentLevelTotal: number;
  weapon: Weapon | null;
  monshouList: Monshou[];
  forgeStatUps: ForgeStatUp[];
  /** SP化している特性名（HPバブル/MPバブル/つねアタ/つねマホ のみ計算に影響） */
  spTraits: Set<string>;
}

/** 浮動小数の誤差を吸収した切り上げ */
function ceilStat(value: number): number {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-9) return rounded;
  return Math.ceil(value);
}

function findTrait(traits: string[], table: Record<string, unknown>): string | undefined {
  return traits.find((trait) => trait in table);
}

/** 家系図から系統ボーナス％を算出（合計が奇数なら偶数へ+1） */
function computeLineageBonusPercent(familyTree: (string | null)[]): StatValues {
  const bonus = zeroStats();
  familyTree.forEach((lineage, index) => {
    if (!lineage) return;
    const stats = LINEAGE_BONUS_STATS[lineage];
    if (!stats) return;
    const weight = FAMILY_TREE_WEIGHTS[index] ?? 0;
    for (const stat of stats) bonus[stat] += weight;
  });
  for (const stat of STAT_KEYS) {
    if (bonus[stat] % 2 === 1) bonus[stat] += 1;
  }
  return bonus;
}

/** 装備・スキル・紋晶・鍛冶などによる加算（スキル紋晶武器鍛冶合計） */
function computeAdditions(config: StatsBuildConfig): StatValues {
  let additions = aggregateStatBonus(config.traits);
  for (const skill of config.skills) additions = addStats(additions, skillStatBonus(skill));

  for (const monshou of config.monshouList) {
    for (const stat of STAT_KEYS) additions[stat] += monshou[stat];
  }
  if (config.weapon) {
    additions.攻撃力 += config.weapon.攻撃力;
    additions.守備力 += config.weapon.守備力;
    additions.素早さ += config.weapon.素早さ;
    additions.賢さ += config.weapon.賢さ;
  }
  for (const forge of config.forgeStatUps) additions[forge.stat] += forge.value;
  return additions;
}

/** バブル補正（ステータスごとの倍率） */
function computeBubbleMultipliers(config: StatsBuildConfig): StatValues {
  const hpActive = config.traits.includes(HP_BUBBLE_TRAIT) || skillsGrantTrait(config.skills, HP_BUBBLE_TRAIT);
  const mpActive = config.traits.includes(MP_BUBBLE_TRAIT) || skillsGrantTrait(config.skills, MP_BUBBLE_TRAIT);
  const hpTable = config.spTraits.has(HP_BUBBLE_TRAIT) ? HP_BUBBLE_SP_MULTIPLIERS : HP_BUBBLE_MULTIPLIERS;
  const mpTable = config.spTraits.has(MP_BUBBLE_TRAIT) ? MP_BUBBLE_SP_MULTIPLIERS : MP_BUBBLE_MULTIPLIERS;

  const result: StatValues = { HP: 1, MP: 1, 攻撃力: 1, 守備力: 1, 素早さ: 1, 賢さ: 1 };
  for (const stat of STAT_KEYS) {
    if (hpActive && hpTable[stat] !== undefined) result[stat] = hpTable[stat] as number;
    else if (mpActive && mpTable[stat] !== undefined) result[stat] = mpTable[stat] as number;
  }
  return result;
}

/** ステータス6種を計算する */
export function computeStats(config: StatsBuildConfig): StatValues {
  const { traits, bodySize, monster, individualValues, spTraits } = config;

  // メタルボディ
  const metalTrait = findTrait(traits, METAL_BODY_HP_MULTIPLIER);
  const metalHpMultiplier = metalTrait ? METAL_BODY_HP_MULTIPLIER[metalTrait] : 1;
  const useMetalTables = metalTrait ? METAL_TABLE_OVERRIDE_TRAITS.includes(metalTrait) : false;

  // ボディサイズ倍率
  const bodyMul = useMetalTables ? BODY_SIZE_MULTIPLIERS_METAL[bodySize] : BODY_SIZE_MULTIPLIERS[bodySize];

  // AI行動回数倍率
  const aiTrait = findTrait(traits, AI_ACTION_MULTIPLIER);
  function aiMultiplier(stat: StatKey): number {
    if (!aiTrait) return 1;
    if (useMetalTables) return METAL_FIXED_STATS.includes(stat) ? 1 : AI_ACTION_MULTIPLIER_METAL[aiTrait];
    return AI_ACTION_MULTIPLIER[aiTrait];
  }

  // つねカンタ（HPのみ。SP化で無効）
  const tsuneAta =
    traits.includes(ALWAYS_ATTACK_KANTA_TRAIT) && !spTraits.has(ALWAYS_ATTACK_KANTA_TRAIT)
      ? ALWAYS_ATTACK_KANTA_HP_MULTIPLIER
      : 1;
  const tsuneMaho =
    traits.includes(ALWAYS_MAHO_KANTA_TRAIT) && !spTraits.has(ALWAYS_MAHO_KANTA_TRAIT)
      ? ALWAYS_MAHO_KANTA_HP_MULTIPLIER
      : 1;

  const bubbleMul = computeBubbleMultipliers(config);
  const levelBonus = parentLevelBonusPercent(config.parentLevelTotal);
  const lineageBonus = computeLineageBonusPercent(config.familyTree);
  const additions = computeAdditions(config);

  const result = zeroStats();
  for (const stat of STAT_KEYS) {
    const base = Number(monster[stat]);
    const iv = individualValues[stat];
    const a = ceilStat((base + iv) * BASE_STAT_MULTIPLIER * aiMultiplier(stat) * bodyMul[stat]);
    const bonusFactor = 1 + (levelBonus + lineageBonus[stat]) / 100;

    if (stat === 'HP') {
      const b = ceilStat(a * metalHpMultiplier);
      const c = ceilStat(b * bonusFactor);
      const d = ceilStat(c * tsuneMaho * tsuneAta + additions.HP);
      result.HP = ceilStat(d * bubbleMul.HP);
    } else {
      const c = ceilStat(a * bonusFactor);
      result[stat] = ceilStat((c + additions[stat]) * bubbleMul[stat]);
    }
  }
  return result;
}
