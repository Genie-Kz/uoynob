/**
 * ビルドシミュレーターの耐性計算エンジン。
 *
 * 前提: 元データ(monster[element])は「スタンダードボディ・特性なし」の素の値。
 * よってボディサイズ補正も特性効果も、この素の値に対して加算していく。
 *
 * 計算の流れ:
 *   1. 各耐性要素ごとに「増減段階(delta)」を積み上げる
 *      - ボディサイズ補正（選択サイズの補正をそのまま加算。スタンダード/スモールは0）
 *      - 特性（全ガード＋／メタル系／こうどう系）
 *      - スキルの「〇〇ガード＋」（1つにつき +2、重複可）
 *      - 武器鍛冶（別々の耐性に各 +1）
 *   2. 元の段階 + delta を、上限・下限ルールでクランプして最終段階を決める
 *
 * 上限・下限ルール（仕様）:
 *   - 反射表記は元々持つモンスターのみ。下降補正を受けると反射から下がる。
 *   - スキル等による上昇上限は、属性耐性なら「回復」、それ以外は「無効」。
 *   - ただし元の耐性が上限より高い場合（例: 非属性で元々回復）はその段階を維持する。
 *   - 下限は「弱点」。弱点を下回る分は内部的に蓄積され、それを上回るまで弱点のまま。
 */
import type { BodySize, Monster, ResistanceValue } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';
import { ATTRIBUTE_BOOST_CAP_LEVEL, WEAKEST_LEVEL } from '@/constants/resistances';
import {
  ALL_GUARD_TRAIT,
  GUARD_ABILITY_BOOST_STEP,
  KOUDOU_AILMENT_ELEMENTS,
  KOUDOU_TRAIT_DELTA,
  METAL_BODY_AILMENT_ELEMENTS,
  METAL_BODY_TRAITS,
  SIZE_AILMENT_ELEMENTS,
  SIZE_RESISTANCE_BONUS,
  WEAPON_FORGE_BOOST_STEP,
} from '@/constants/buildRules';
import { isAttributeResistance, resistanceLevelOf, resistanceValueOfLevel } from './resistance';
import { defaultEditableTraits, resistanceValueOf } from './monster';
import { guardAbilityToElement } from './skillAnalysis';

/** ビルド構成（シミュレーターの入力） */
export interface BuildConfiguration {
  monster: Monster;
  bodySize: BodySize;
  /** 装備中の編集可能特性（空文字は空き枠） */
  traits: string[];
  /** 装備中のスキル */
  skills: Skill[];
  /** 武器鍛冶で +1 する耐性要素（空文字は未設定。重複は無視される） */
  forgeElements: string[];
}

/** 1耐性要素ごとの計算結果 */
export interface ResistanceOutcome {
  element: ResistanceElement;
  baseValue: ResistanceValue;
  finalValue: ResistanceValue;
  /** 最終段階レベル（非属性は「無効」を超えて 6,7,8... と上がりうる） */
  finalLevel: number;
  /** 元から変化したか */
  changed: boolean;
  /** 上昇したか（false なら下降） */
  raised: boolean;
}

type DeltaMap = Record<string, number>;

function createZeroDeltaMap(): DeltaMap {
  const delta: DeltaMap = {};
  for (const element of RESISTANCE_ELEMENTS) delta[element] = 0;
  return delta;
}

function addToElements(delta: DeltaMap, elements: readonly string[], step: number): void {
  for (const element of elements) delta[element] = (delta[element] ?? 0) + step;
}

/** ボディサイズ補正（素の値＝スタンダード基準に、選択サイズの補正をそのまま加算） */
function applyBodySizeBonus(delta: DeltaMap, selectedSize: BodySize): void {
  const bonus = SIZE_RESISTANCE_BONUS[selectedSize];
  if (bonus !== 0) addToElements(delta, SIZE_AILMENT_ELEMENTS, bonus);
}

/** 特性による耐性変化（全ガード＋／メタル系／こうどう系）。メタル・こうどうは各1回のみ。 */
function applyTraitEffects(delta: DeltaMap, traits: string[]): void {
  let metalApplied = false;
  let koudouApplied = false;

  for (const trait of traits) {
    if (trait === ALL_GUARD_TRAIT) {
      addToElements(delta, RESISTANCE_ELEMENTS, 1);
    } else if (METAL_BODY_TRAITS.includes(trait)) {
      if (!metalApplied) {
        addToElements(delta, METAL_BODY_AILMENT_ELEMENTS, 1);
        metalApplied = true;
      }
    } else {
      const koudouDelta = KOUDOU_TRAIT_DELTA[trait];
      if (koudouDelta !== undefined && !koudouApplied) {
        addToElements(delta, KOUDOU_AILMENT_ELEMENTS, koudouDelta);
        koudouApplied = true;
      }
    }
  }
}

/** スキルの「〇〇ガード＋」による耐性上昇（1つにつき +2、重複可） */
function applySkillGuards(delta: DeltaMap, skills: Skill[]): void {
  for (const skill of skills) {
    for (const item of skill.composition) {
      const element = guardAbilityToElement(item.name);
      if (element) delta[element] = (delta[element] ?? 0) + GUARD_ABILITY_BOOST_STEP;
    }
  }
}

/** その耐性要素の上昇上限レベル（属性は「回復」、非属性は上限なし）。元の段階が上ならそれを維持。 */
function upperCapLevelOf(element: string, baseLevel: number): number {
  const boostCap = isAttributeResistance(element)
    ? ATTRIBUTE_BOOST_CAP_LEVEL
    : Number.POSITIVE_INFINITY;
  return Math.max(boostCap, baseLevel);
}

/** 最終段階を上限・下限ルールでクランプして算出（武器鍛冶を除く増減を反映） */
function clampFinalLevel(element: string, baseLevel: number, delta: number): number {
  const rawLevel = baseLevel + delta;
  return Math.max(WEAKEST_LEVEL, Math.min(upperCapLevelOf(element, baseLevel), rawLevel));
}

/**
 * 武器鍛冶の +1 を適用する（耐性計算の最後）。
 * 弱点によるマイナス耐性の蓄積とは無関係に、確定後の段階から一段階引き上げる。
 */
function applyForgeStep(element: string, baseLevel: number, level: number): number {
  return Math.min(upperCapLevelOf(element, baseLevel), level + WEAPON_FORGE_BOOST_STEP);
}

/** ビルド構成から、全耐性要素の最終結果を計算する */
export function computeBuildResistances(config: BuildConfiguration): ResistanceOutcome[] {
  const { monster, bodySize, traits, skills, forgeElements } = config;

  const delta = createZeroDeltaMap();
  applyBodySizeBonus(delta, bodySize);
  applyTraitEffects(delta, traits);
  applySkillGuards(delta, skills);
  // 武器鍛冶は最後に適用するため、ここでは delta に含めない
  const forgeSet = new Set(forgeElements.filter(Boolean));

  return RESISTANCE_ELEMENTS.map((element) => {
    const baseValue = resistanceValueOf(monster, element);
    const baseLevel = resistanceLevelOf(baseValue);
    let finalLevel = clampFinalLevel(element, baseLevel, delta[element] ?? 0);
    if (forgeSet.has(element)) finalLevel = applyForgeStep(element, baseLevel, finalLevel);
    const finalValue = resistanceValueOfLevel(finalLevel);
    return {
      element,
      baseValue,
      finalValue,
      finalLevel,
      changed: finalLevel !== baseLevel,
      raised: finalLevel > baseLevel,
    };
  });
}

/**
 * モンスターの既定ビルド構成（本来の姿）。
 * 本来のボディサイズと、デフォルトで持つ特性を装備し、スキル・武器鍛冶なしの状態。
 * これを計算すると、素データに特性・サイズ補正を加味した「実効耐性」が得られる。
 */
export function defaultBuildConfiguration(monster: Monster): BuildConfiguration {
  return {
    monster,
    bodySize: monster.サイズ特性,
    traits: defaultEditableTraits(monster, monster.サイズ特性),
    skills: [],
    forgeElements: [],
  };
}
