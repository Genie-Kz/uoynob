/** ビルドシミュレーターの状態管理コンポーザブル */
import { computed, ref, watch, type Ref } from 'vue';
import type { LocationQuery } from 'vue-router';
import type { BodySize, Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { ForgeStatUp, Monshou, StatValues, Weapon } from '@/types/stats';
import {
  SKILL_SLOT_COUNT_BY_SIZE,
  TRAIT_SLOT_COUNT_BY_SIZE,
  WEAPON_FORGE_SLOT_COUNT,
} from '@/constants/buildRules';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS, MONSHOU_LIST } from '@/constants/statsRules';
import { collectAllTraitNames, defaultEditableTraits } from '@/domain/monster';
import { computeBuildResistances } from '@/domain/buildSimulator';
import { computeStats } from '@/domain/statsCalculator';

/**
 * URL共有用のクエリ（耐性ビルド部分のみ）。
 *   s = ボディサイズ番号 / t = 特性スロット / k = スキルスロット / f = 武器鍛冶スロット
 */
export interface BuildShareQuery {
  [key: string]: string;
  s: string;
  t: string;
  k: string;
  f: string;
}

const FAMILY_TREE_SIZE = 14;
const FORGE_STAT_UP_BY_LABEL = new Map(FORGE_STAT_UP_OPTIONS.map((option) => [option.label, option]));
const RESISTANCE_ELEMENT_SET = new Set<string>(RESISTANCE_ELEMENTS);

function readQuery(query: LocationQuery, key: string): string | undefined {
  const value = query[key];
  return typeof value === 'string' ? value : undefined;
}

function zeroIndividualValues(): StatValues {
  return { HP: 0, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

export function useBuildSimulator(
  monster: Ref<Monster | null>,
  allMonsters: Ref<Monster[] | null>,
  skills: Ref<Skill[] | null>,
  initialQuery: LocationQuery,
) {
  const bodySize = ref<BodySize>('スタンダードボディ');
  const traitSlots = ref<string[]>([]);
  const skillSlots = ref<(Skill | null)[]>([]);
  /** 武器鍛冶枠（耐性要素名 もしくは ステータスアップ名。空文字は未設定） */
  const forgeSlots = ref<string[]>([]);

  // ---- ステータス用の状態 ----
  const individualValues = ref<StatValues>(zeroIndividualValues());
  /** 家系図14体の系統（曽祖父母→祖父母→両親 の重み順。仕様順に合わせる） */
  const familyTree = ref<(string | null)[]>(Array(FAMILY_TREE_SIZE).fill(null));
  const parentLevelTotal = ref(0);
  const weapon = ref<Weapon | null>(null);
  /** 装備中の紋晶名 */
  const monshouNames = ref<string[]>([]);
  /** SP化している特性名 */
  const spTraitNames = ref<string[]>([]);

  const traitMaster = computed(() => collectAllTraitNames(allMonsters.value ?? []));
  const skillById = computed(() => new Map((skills.value ?? []).map((skill) => [skill.id, skill])));
  const equippedSkills = computed(() => skillSlots.value.filter((skill): skill is Skill => skill !== null));

  /** スキルによって追加される特性（構成内の特性タイプを重複なく） */
  const skillAddedTraits = computed(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const skill of equippedSkills.value) {
      for (const item of skill.composition) {
        if (item.type === 'attribute' && !seen.has(item.name)) {
          seen.add(item.name);
          result.push(item.name);
        }
      }
    }
    return result;
  });

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

  /** 既定状態 */
  function initializeDefaults(target: Monster): void {
    bodySize.value = target.サイズ特性;
    traitSlots.value = defaultEditableTraits(target, bodySize.value);
    skillSlots.value = emptySkillSlots(bodySize.value);
    forgeSlots.value = emptyForgeSlots();
    individualValues.value = zeroIndividualValues();
    // 家系図の初期値はそのモンスター自身の系統（純血）
    familyTree.value = Array(FAMILY_TREE_SIZE).fill(target.系統);
    parentLevelTotal.value = 0;
    weapon.value = null;
    monshouNames.value = [];
    spTraitNames.value = [];
  }

  /** URLクエリから耐性ビルド部分を復元 */
  function restoreFromQuery(query: LocationQuery, target: Monster): void {
    initializeDefaults(target);
    const sizeIndex = Number(readQuery(query, 's'));
    const size = BODY_SIZES[sizeIndex] ?? target.サイズ特性;
    bodySize.value = size;

    const traitCodes = (readQuery(query, 't') ?? '').split('-');
    traitSlots.value = Array.from({ length: TRAIT_SLOT_COUNT_BY_SIZE[size] - 1 }, (_unused, index) => {
      const code = traitCodes[index];
      return code ? (traitMaster.value[Number(code)] ?? '') : '';
    });

    const skillIds = (readQuery(query, 'k') ?? '').split('-');
    skillSlots.value = Array.from({ length: SKILL_SLOT_COUNT_BY_SIZE[size] }, (_unused, index) => {
      const id = skillIds[index];
      return id ? (skillById.value.get(id) ?? null) : null;
    });

    const forgeCodes = (readQuery(query, 'f') ?? '').split('-');
    forgeSlots.value = Array.from({ length: WEAPON_FORGE_SLOT_COUNT }, (_unused, index) => {
      const code = forgeCodes[index];
      return code ? (RESISTANCE_ELEMENTS[Number(code)] ?? '') : '';
    });
  }

  const hasInitialized = ref(false);
  watch(
    [monster, skills],
    () => {
      if (hasInitialized.value || !monster.value || !skills.value) return;
      hasInitialized.value = true;
      const hasShareParams = (['s', 't', 'k', 'f'] as const).some((key) => readQuery(initialQuery, key) !== undefined);
      if (hasShareParams) restoreFromQuery(initialQuery, monster.value);
      else initializeDefaults(monster.value);
    },
    { immediate: true },
  );

  /** ボディサイズ変更 */
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
  function setForgeElement(index: number, value: string): void {
    forgeSlots.value[index] = value;
  }
  function setIndividualValue(stat: keyof StatValues, value: number): void {
    individualValues.value = { ...individualValues.value, [stat]: value };
  }
  function setFamilyLineage(index: number, lineage: string | null): void {
    familyTree.value[index] = lineage;
  }
  function setParentLevelTotal(value: number): void {
    parentLevelTotal.value = value;
  }
  function setWeapon(value: Weapon | null): void {
    weapon.value = value;
  }
  function toggleMonshou(name: string): void {
    monshouNames.value = monshouNames.value.includes(name)
      ? monshouNames.value.filter((n) => n !== name)
      : [...monshouNames.value, name];
  }
  function toggleSp(name: string): void {
    spTraitNames.value = spTraitNames.value.includes(name)
      ? spTraitNames.value.filter((n) => n !== name)
      : [...spTraitNames.value, name];
  }
  function isSp(name: string): boolean {
    return spTraitNames.value.includes(name);
  }

  function resetTraits(): void {
    if (!monster.value) return;
    bodySize.value = monster.value.サイズ特性;
    traitSlots.value = defaultEditableTraits(monster.value, bodySize.value);
    fillSkillSlots(bodySize.value);
  }
  function resetSkills(): void {
    skillSlots.value = emptySkillSlots(bodySize.value);
  }
  function resetForge(): void {
    forgeSlots.value = emptyForgeSlots();
  }

  const traitSlotCount = computed(() => TRAIT_SLOT_COUNT_BY_SIZE[bodySize.value]);
  const skillSlotCount = computed(() => SKILL_SLOT_COUNT_BY_SIZE[bodySize.value]);

  const monshouList = computed<Monshou[]>(() =>
    MONSHOU_LIST.filter((monshou) => monshouNames.value.includes(monshou.name)),
  );
  const forgeStatUps = computed<ForgeStatUp[]>(() =>
    forgeSlots.value.map((value) => FORGE_STAT_UP_BY_LABEL.get(value)).filter((v): v is ForgeStatUp => !!v),
  );
  const forgeResistanceElements = computed(() =>
    forgeSlots.value.filter((value) => RESISTANCE_ELEMENT_SET.has(value)),
  );

  const resistanceOutcomes = computed(() => {
    if (!monster.value) return [];
    return computeBuildResistances({
      monster: monster.value,
      bodySize: bodySize.value,
      traits: traitSlots.value,
      skills: equippedSkills.value,
      forgeElements: forgeResistanceElements.value,
    });
  });

  const stats = computed<StatValues | null>(() => {
    if (!monster.value) return null;
    return computeStats({
      monster: monster.value,
      bodySize: bodySize.value,
      traits: traitSlots.value,
      skills: equippedSkills.value,
      individualValues: individualValues.value,
      familyTree: familyTree.value,
      parentLevelTotal: parentLevelTotal.value,
      weapon: weapon.value,
      monshouList: monshouList.value,
      forgeStatUps: forgeStatUps.value,
      spTraits: new Set(spTraitNames.value),
    });
  });

  const shareQuery = computed<BuildShareQuery>(() => ({
    s: String(BODY_SIZES.indexOf(bodySize.value)),
    t: traitSlots.value.map((name) => (name ? String(traitMaster.value.indexOf(name)) : '')).join('-'),
    k: skillSlots.value.map((skill) => (skill ? skill.id : '')).join('-'),
    f: forgeSlots.value
      .map((value) => (RESISTANCE_ELEMENT_SET.has(value) ? String((RESISTANCE_ELEMENTS as readonly string[]).indexOf(value)) : ''))
      .join('-'),
  }));

  return {
    bodySize,
    traitSlots,
    skillSlots,
    forgeSlots,
    traitMaster,
    skillById,
    skillAddedTraits,
    traitSlotCount,
    skillSlotCount,
    resistanceOutcomes,
    stats,
    shareQuery,
    individualValues,
    familyTree,
    parentLevelTotal,
    weapon,
    monshouNames,
    spTraitNames,
    changeBodySize,
    setTrait,
    setSkill,
    setForgeElement,
    setIndividualValue,
    setFamilyLineage,
    setParentLevelTotal,
    setWeapon,
    toggleMonshou,
    toggleSp,
    isSp,
    resetTraits,
    resetSkills,
    resetForge,
  };
}
