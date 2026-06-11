/** ビルドシミュレーターの状態管理コンポーザブル */
import { computed, ref, watch, type Ref } from 'vue';
import type { BodySize, Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import {
  SKILL_SLOT_COUNT_BY_SIZE,
  TRAIT_SLOT_COUNT_BY_SIZE,
  WEAPON_FORGE_SLOT_COUNT,
} from '@/constants/buildRules';
import { defaultEditableTraits } from '@/domain/monster';
import { computeBuildResistances } from '@/domain/buildSimulator';

export function useBuildSimulator(monster: Ref<Monster | null>) {
  const bodySize = ref<BodySize>('スタンダードボディ');
  /** 編集可能な特性枠（ボディサイズ枠を除く。空文字は空き枠） */
  const traitSlots = ref<string[]>([]);
  /** スキル枠（null は空き枠） */
  const skillSlots = ref<(Skill | null)[]>([]);
  /** 武器鍛冶枠（空文字は未設定） */
  const forgeSlots = ref<string[]>([]);

  function fillSkillSlots(size: BodySize): void {
    const targetCount = SKILL_SLOT_COUNT_BY_SIZE[size];
    const next = skillSlots.value.slice(0, targetCount);
    while (next.length < targetCount) next.push(null);
    skillSlots.value = next;
  }

  function initialize(target: Monster): void {
    bodySize.value = target.サイズ特性;
    traitSlots.value = defaultEditableTraits(target, bodySize.value);
    skillSlots.value = Array.from({ length: SKILL_SLOT_COUNT_BY_SIZE[bodySize.value] }, () => null);
    forgeSlots.value = Array.from({ length: WEAPON_FORGE_SLOT_COUNT }, () => '');
  }

  watch(
    monster,
    (target) => {
      if (target) initialize(target);
    },
    { immediate: true },
  );

  /** ボディサイズ変更：特性は既定値に戻し、スキル枠数を調整（既存は保持） */
  function changeBodySize(size: BodySize): void {
    bodySize.value = size;
    if (monster.value) traitSlots.value = defaultEditableTraits(monster.value, size);
    fillSkillSlots(size);
  }

  function setTrait(index: number, traitName: string): void {
    traitSlots.value[index] = traitName;
  }
  function setSkill(index: number, skill: Skill | null): void {
    skillSlots.value[index] = skill;
  }
  function setForgeElement(index: number, element: string): void {
    forgeSlots.value[index] = element;
  }

  const traitSlotCount = computed(() => TRAIT_SLOT_COUNT_BY_SIZE[bodySize.value]);
  const skillSlotCount = computed(() => SKILL_SLOT_COUNT_BY_SIZE[bodySize.value]);

  const resistanceOutcomes = computed(() => {
    if (!monster.value) return [];
    return computeBuildResistances({
      monster: monster.value,
      bodySize: bodySize.value,
      traits: traitSlots.value,
      skills: skillSlots.value.filter((skill): skill is Skill => skill !== null),
      forgeElements: forgeSlots.value,
    });
  });

  return {
    bodySize,
    traitSlots,
    skillSlots,
    forgeSlots,
    traitSlotCount,
    skillSlotCount,
    resistanceOutcomes,
    changeBodySize,
    setTrait,
    setSkill,
    setForgeElement,
  };
}
