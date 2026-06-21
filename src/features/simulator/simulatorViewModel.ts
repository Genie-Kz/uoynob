/**
 * ビルドシミュレーター画面の表示用ロジック（ビューモデル）。
 * 各種ピッカーの選択肢生成や、装備可能武器の判定などの純粋関数を集める。
 */
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { Weapon } from '@/types/stats';
import type { PickerItem } from '@/types/picker';
import { BODY_SIZES, WEAPONS } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS } from '@/constants/statsRules';
import { summarizeGuardEffects } from '@/domain/skillAnalysis';

/** モンスターが装備できる武器種を返す。 */
export function equippableWeaponTypes(
  monster: Monster | null,
  traits: string[],
  skillAddedTraits: string[],
): string[] {
  // 「すべての武器装備」を持つなら全武器種を装備できる
  if (traits.includes('すべての武器装備') || skillAddedTraits.includes('すべての武器装備'))
    return [...WEAPONS];
  if (!monster) return [];
  // 各武器種の装備可否は、モンスターデータの該当キーが「〇」かどうかで決まる
  return WEAPONS.filter((type) => monster[type] === '〇');
}

/** 装備可能な武器種に合致する武器だけに絞り込む。 */
export function equippableWeaponItems(weapons: Weapon[], types: string[]): Weapon[] {
  return weapons.filter((weapon) => types.includes(weapon.type));
}

/** ボディサイズ選択ピッカーの選択肢を作る。 */
export function bodySizePickerItems(): PickerItem[] {
  return BODY_SIZES.map((size) => ({ label: size, value: size }));
}

/** 特性ピッカーの選択肢を作る。先頭に「空きにする」を入れる。 */
export function traitPickerItems(traitMaster: string[]): PickerItem[] {
  return [
    { label: '（空きにする）', value: '' },
    ...traitMaster.map((name) => ({ label: name, value: name })),
  ];
}

/** スキルピッカーの選択肢を作る。構成（覚える特技・特性）も検索対象テキストに含める。 */
export function skillPickerItems(skills: Skill[]): PickerItem[] {
  return [
    { label: '（空きにする）', value: '' },
    ...skills.map((skill) => ({
      label: skill.name,
      value: skill.id,
      searchText: skill.composition.map((part) => part.name).join(' '),
    })),
  ];
}

/** 武器鍛冶ピッカーの選択肢を作る。耐性+1の各属性と、ステータスアップの各項目を並べる。 */
export function forgePickerItems(): PickerItem[] {
  return [
    { label: '（なし）', value: '' },
    ...RESISTANCE_ELEMENTS.map((element) => ({ label: `${element}（耐性+1）`, value: element })),
    ...FORGE_STAT_UP_OPTIONS.map((option) => ({ label: option.label, value: option.label })),
  ];
}

/** 武器ピッカーの選択肢を作る。値は武器番号、ラベルに武器種と攻撃力を付ける。 */
export function weaponPickerItems(weapons: Weapon[]): PickerItem[] {
  return [
    { label: '（未装備）', value: '' },
    ...weapons.map((weapon) => ({
      label: `${weapon.name}〔${weapon.type}〕 攻+${weapon.攻撃力}`,
      value: String(weapon.no),
    })),
  ];
}

/** スキルの耐性アップ効果を「○○+2 △△+4」のような短い要約文字列にする（+2段階／回）。 */
export function skillGuardSummary(skill: Skill): string {
  return [...summarizeGuardEffects(skill)]
    .map(([element, count]) => `${element}+${count * 2}`)
    .join(' ');
}

/** 武器鍛冶の値が耐性アップ（属性名）かどうか。ステータスアップとの区別に使う。 */
export function isResistanceForge(value: string): boolean {
  return (RESISTANCE_ELEMENTS as readonly string[]).includes(value);
}
