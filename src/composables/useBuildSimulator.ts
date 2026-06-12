/** ビルドシミュレーターの状態管理コンポーザブル */
import { computed, ref, watch, type Ref } from 'vue';
import type { LocationQuery } from 'vue-router';
import type { BodySize, Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import {
  SKILL_SLOT_COUNT_BY_SIZE,
  TRAIT_SLOT_COUNT_BY_SIZE,
  WEAPON_FORGE_SLOT_COUNT,
} from '@/constants/buildRules';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { collectAllTraitNames, defaultEditableTraits } from '@/domain/monster';
import { computeBuildResistances } from '@/domain/buildSimulator';

/**
 * URL共有用のクエリ。状態をできるだけ短く表す。
 *   s = ボディサイズの番号（BODY_SIZES のインデックス）
 *   t = 特性スロット（特性マスターのインデックスを "-" 区切り。空き枠は空）
 *   k = スキルスロット（スキルidを "-" 区切り。空き枠は空）
 *   f = 武器鍛冶スロット（耐性要素のインデックスを "-" 区切り。空き枠は空）
 */
export interface BuildShareQuery {
  [key: string]: string;
  s: string;
  t: string;
  k: string;
  f: string;
}

function readQuery(query: LocationQuery, key: string): string | undefined {
  const value = query[key];
  return typeof value === 'string' ? value : undefined;
}

export function useBuildSimulator(
  monster: Ref<Monster | null>,
  allMonsters: Ref<Monster[] | null>,
  skills: Ref<Skill[] | null>,
  initialQuery: LocationQuery,
) {
  const bodySize = ref<BodySize>('スタンダードボディ');
  /** 編集可能な特性枠（ボディサイズ枠を除く。空文字は空き枠） */
  const traitSlots = ref<string[]>([]);
  /** スキル枠（null は空き枠） */
  const skillSlots = ref<(Skill | null)[]>([]);
  /** 武器鍛冶枠（空文字は未設定） */
  const forgeSlots = ref<string[]>([]);

  /** 特性入れ替え候補（全モンスターの特性を重複なく収集） */
  const traitMaster = computed(() => collectAllTraitNames(allMonsters.value ?? []));
  /** スキルid → スキル */
  const skillById = computed(() => new Map((skills.value ?? []).map((skill) => [skill.id, skill])));

  function emptySkillSlots(size: BodySize): (Skill | null)[] {
    return Array.from({ length: SKILL_SLOT_COUNT_BY_SIZE[size] }, () => null);
  }
  function emptyForgeSlots(): string[] {
    return Array.from({ length: WEAPON_FORGE_SLOT_COUNT }, () => '');
  }
  function fillSkillSlots(size: BodySize): void {
    const targetCount = SKILL_SLOT_COUNT_BY_SIZE[size];
    const next = skillSlots.value.slice(0, targetCount);
    while (next.length < targetCount) next.push(null);
    skillSlots.value = next;
  }

  /** 既定状態（本来のサイズ・既定特性・スキル/鍛冶は空） */
  function initializeDefaults(target: Monster): void {
    bodySize.value = target.サイズ特性;
    traitSlots.value = defaultEditableTraits(target, bodySize.value);
    skillSlots.value = emptySkillSlots(bodySize.value);
    forgeSlots.value = emptyForgeSlots();
  }

  /** URLクエリから状態を復元 */
  function restoreFromQuery(query: LocationQuery): void {
    const sizeIndex = Number(readQuery(query, 's'));
    const size = BODY_SIZES[sizeIndex] ?? monster.value?.サイズ特性 ?? 'スタンダードボディ';
    bodySize.value = size;

    const traitCodes = (readQuery(query, 't') ?? '').split('-');
    traitSlots.value = Array.from({ length: TRAIT_SLOT_COUNT_BY_SIZE[size] - 1 }, (_unused, index) => {
      const code = traitCodes[index];
      if (!code) return '';
      return traitMaster.value[Number(code)] ?? '';
    });

    const skillIds = (readQuery(query, 'k') ?? '').split('-');
    skillSlots.value = Array.from({ length: SKILL_SLOT_COUNT_BY_SIZE[size] }, (_unused, index) => {
      const id = skillIds[index];
      return id ? (skillById.value.get(id) ?? null) : null;
    });

    const forgeCodes = (readQuery(query, 'f') ?? '').split('-');
    forgeSlots.value = Array.from({ length: WEAPON_FORGE_SLOT_COUNT }, (_unused, index) => {
      const code = forgeCodes[index];
      if (!code) return '';
      return RESISTANCE_ELEMENTS[Number(code)] ?? '';
    });
  }

  // モンスターとスキルの両方が揃ったら一度だけ初期化（URLパラメータがあれば復元）
  const hasInitialized = ref(false);
  watch(
    [monster, skills],
    () => {
      if (hasInitialized.value || !monster.value || !skills.value) return;
      hasInitialized.value = true;
      const hasShareParams = (['s', 't', 'k', 'f'] as const).some((key) => readQuery(initialQuery, key) !== undefined);
      if (hasShareParams) restoreFromQuery(initialQuery);
      else initializeDefaults(monster.value);
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

  /** 特性を初期状態（本来のサイズ・既定特性）に戻す */
  function resetTraits(): void {
    if (!monster.value) return;
    bodySize.value = monster.value.サイズ特性;
    traitSlots.value = defaultEditableTraits(monster.value, bodySize.value);
    fillSkillSlots(bodySize.value);
  }
  /** スキルを初期状態（すべて空き）に戻す */
  function resetSkills(): void {
    skillSlots.value = emptySkillSlots(bodySize.value);
  }
  /** 武器鍛冶を初期状態（すべて未設定）に戻す */
  function resetForge(): void {
    forgeSlots.value = emptyForgeSlots();
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

  /** 現在の状態を URL共有用クエリに直列化 */
  const shareQuery = computed<BuildShareQuery>(() => ({
    s: String(BODY_SIZES.indexOf(bodySize.value)),
    t: traitSlots.value.map((name) => (name ? String(traitMaster.value.indexOf(name)) : '')).join('-'),
    k: skillSlots.value.map((skill) => (skill ? skill.id : '')).join('-'),
    f: forgeSlots.value
      .map((element) => (element ? String((RESISTANCE_ELEMENTS as readonly string[]).indexOf(element)) : ''))
      .join('-'),
  }));

  return {
    bodySize,
    traitSlots,
    skillSlots,
    forgeSlots,
    traitMaster,
    skillById,
    traitSlotCount,
    skillSlotCount,
    resistanceOutcomes,
    shareQuery,
    changeBodySize,
    setTrait,
    setSkill,
    setForgeElement,
    resetTraits,
    resetSkills,
    resetForge,
  };
}
