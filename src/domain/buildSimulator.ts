/**
 * ビルドシミュレーターの耐性計算エンジン。
 *
 * 計算の流れ:
 *   1. 各耐性要素ごとに「増減段階(delta)」を積み上げる
 *      - ボディサイズ補正（元のサイズからの差分）
 *      - 特性（全ガード＋／メタル系／こうどう系）
 *      - スキルの「〇〇ガード＋」（1つにつき +2、重複可）
 *      - 武器鍛冶（別々の耐性に各 +1）
 *   2. 元の段階 + delta を、上限・下限ルールでクランプして最終段階を決める
 *
 * 上限・下限ルール（仕様）:
 *   - 反射は元々持つモンスターのみ。反射耐性は下がらない（常に反射のまま）。
 *   - スキル等による上昇上限は、属性耐性なら「回復」、それ以外は「無効」。
 *   - ただし元の耐性が上限より高い場合（例: 非属性で元々回復）はその段階を維持する。
 *   - 下限は「弱点」。弱点を下回る分は内部的に蓄積され、それを上回るまで弱点のまま。
 */
import type { BodySize, Monster, ResistanceValue } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';
import {
  ATTRIBUTE_BOOST_CAP_LEVEL,
  NON_ATTRIBUTE_BOOST_CAP_LEVEL,
  REFLECT_LEVEL,
  WEAKEST_LEVEL,
} from '@/constants/resistances';
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
import { resistanceValueOf } from './monster';
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
  for (const element of elements) delta[element] += step;
}

/** ボディサイズ補正（元のサイズからの差分で適用し、二重計上を防ぐ） */
function applyBodySizeBonus(delta: DeltaMap, naturalSize: BodySize, selectedSize: BodySize): void {
  const bonusDelta = SIZE_RESISTANCE_BONUS[selectedSize] - SIZE_RESISTANCE_BONUS[naturalSize];
  if (bonusDelta !== 0) addToElements(delta, SIZE_AILMENT_ELEMENTS, bonusDelta);
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
    } else if (trait in KOUDOU_TRAIT_DELTA) {
      if (!koudouApplied) {
        addToElements(delta, KOUDOU_AILMENT_ELEMENTS, KOUDOU_TRAIT_DELTA[trait]);
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
      if (element) delta[element] += GUARD_ABILITY_BOOST_STEP;
    }
  }
}

/** 武器鍛冶（別々の耐性に各 +1。重複は1回扱い） */
function applyWeaponForge(delta: DeltaMap, forgeElements: string[]): void {
  const distinctElements = new Set(forgeElements.filter(Boolean));
  for (const element of distinctElements) {
    if (element in delta) delta[element] += WEAPON_FORGE_BOOST_STEP;
  }
}

/** 最終段階を上限・下限ルールでクランプして算出 */
function clampFinalLevel(element: string, baseLevel: number, delta: number): number {
  // 反射は元々持つ場合のみ。下がらず常に反射のまま。
  if (baseLevel === REFLECT_LEVEL) return REFLECT_LEVEL;

  const boostCap = isAttributeResistance(element)
    ? ATTRIBUTE_BOOST_CAP_LEVEL
    : NON_ATTRIBUTE_BOOST_CAP_LEVEL;
  // 元の耐性が上限より高い場合はその段階を維持する
  const upperCap = Math.max(boostCap, baseLevel);
  const rawLevel = baseLevel + delta;
  return Math.max(WEAKEST_LEVEL, Math.min(upperCap, rawLevel));
}

/** ビルド構成から、全耐性要素の最終結果を計算する */
export function computeBuildResistances(config: BuildConfiguration): ResistanceOutcome[] {
  const { monster, bodySize, traits, skills, forgeElements } = config;

  const delta = createZeroDeltaMap();
  applyBodySizeBonus(delta, monster.サイズ特性, bodySize);
  applyTraitEffects(delta, traits);
  applySkillGuards(delta, skills);
  applyWeaponForge(delta, forgeElements);

  return RESISTANCE_ELEMENTS.map((element) => {
    const baseValue = resistanceValueOf(monster, element);
    const baseLevel = resistanceLevelOf(baseValue);
    const finalLevel = clampFinalLevel(element, baseLevel, delta[element]);
    const finalValue = resistanceValueOfLevel(finalLevel);
    return {
      element,
      baseValue,
      finalValue,
      changed: finalLevel !== baseLevel,
      raised: finalLevel > baseLevel,
    };
  });
}
