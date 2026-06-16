import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { Weapon } from '@/types/stats';
import type { PickerItem } from '@/types/picker';
import { BODY_SIZES, WEAPONS } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS } from '@/constants/statsRules';
import { summarizeGuardEffects } from '@/domain/skillAnalysis';

export function equippableWeaponTypes(
  monster: Monster | null,
  traits: string[],
  skillAddedTraits: string[],
): string[] {
  if (traits.includes('すべての武器装備') || skillAddedTraits.includes('すべての武器装備'))
    return [...WEAPONS];
  if (!monster) return [];
  return WEAPONS.filter((type) => monster[type] === '〇');
}

export function equippableWeaponItems(weapons: Weapon[], types: string[]): Weapon[] {
  return weapons.filter((weapon) => types.includes(weapon.type));
}

export function bodySizePickerItems(): PickerItem[] {
  return BODY_SIZES.map((size) => ({ label: size, value: size }));
}

export function traitPickerItems(traitMaster: string[]): PickerItem[] {
  return [
    { label: '（空きにする）', value: '' },
    ...traitMaster.map((name) => ({ label: name, value: name })),
  ];
}

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

export function forgePickerItems(): PickerItem[] {
  return [
    { label: '（なし）', value: '' },
    ...RESISTANCE_ELEMENTS.map((element) => ({ label: `${element}（耐性+1）`, value: element })),
    ...FORGE_STAT_UP_OPTIONS.map((option) => ({ label: option.label, value: option.label })),
  ];
}

export function weaponPickerItems(weapons: Weapon[]): PickerItem[] {
  return [
    { label: '（未装備）', value: '' },
    ...weapons.map((weapon) => ({
      label: `${weapon.name}〔${weapon.type}〕 攻+${weapon.攻撃力}`,
      value: String(weapon.no),
    })),
  ];
}

export function skillGuardSummary(skill: Skill): string {
  return [...summarizeGuardEffects(skill)]
    .map(([element, count]) => `${element}+${count * 2}`)
    .join(' ');
}

export function isResistanceForge(value: string): boolean {
  return (RESISTANCE_ELEMENTS as readonly string[]).includes(value);
}
