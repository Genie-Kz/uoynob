/** ビルドシミュレーターの状態管理コンポーザブル */
import { computed, ref, watch, type Ref } from 'vue';
import type { Attribute } from '@/types/attribute';
import type { BodySize, Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { ForgeStatUp, Monshou, StatValues, Weapon } from '@/types/stats';
import {
  SKILL_SLOT_COUNT_BY_SIZE,
  TRAIT_SLOT_COUNT_BY_SIZE,
  WEAPON_FORGE_SLOT_COUNT,
} from '@/constants/buildRules';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS, MONSHOU_LIST } from '@/constants/statsRules';
import { LINEAGE_DEFAULT_OPPOSITE } from '@/shared/icons/lineageIcons';
import { collectAllTraitNames, defaultEditableTraits } from '@/domain/monster';
import { computeBuildResistances } from '@/domain/buildSimulator';
import { computeStats } from '@/domain/statsCalculator';
import { parseStatAttribute } from '@/domain/statBonus';
import { guardAbilityToElement } from '@/domain/skillAnalysis';
import {
  encodeBuildShareQuery,
  hasBuildShareParams,
  restoreBuildShareState,
  type BuildShareQuery,
  type BuildShareQueryInput,
} from '@/domain/buildShareCodec';

const FAMILY_TREE_SIZE = 14;
/** 家系図のインデックス（重み順 [4,4,2,2,2,2,1,1,1,1,1,1,1,1] に対応） */
const LEFT_PARENT_INDEX = 0;
const LEFT_GRANDPARENT_INDEX = 2;
const LEFTMOST_GREAT_GRANDPARENT_INDEX = 6;
const SECOND_GREAT_GRANDPARENT_INDEX = 7;
/** モンスター系統に対応する系統を初期表示するセル（曽祖父母の左から2番目） */
const OPPOSITE_LINEAGE_INDEX = SECOND_GREAT_GRANDPARENT_INDEX;
const DEFAULT_PARENT_LEVEL_TOTAL = 200;
const FORGE_STAT_UP_BY_LABEL = new Map(
  FORGE_STAT_UP_OPTIONS.map((option) => [option.label, option]),
);
const RESISTANCE_ELEMENT_SET = new Set<string>(RESISTANCE_ELEMENTS);

/** 系図の初期値：基本は自身の系統、対応系統セルだけ対応系統にする */
function defaultFamilyTree(own: string): (string | null)[] {
  const tree = Array<string | null>(FAMILY_TREE_SIZE).fill(own);
  tree[OPPOSITE_LINEAGE_INDEX] = LINEAGE_DEFAULT_OPPOSITE[own] ?? own;
  return tree;
}

function zeroIndividualValues(): StatValues {
  return { HP: 0, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

export function useBuildSimulator(
  monster: Ref<Monster | null>,
  allMonsters: Ref<Monster[] | null>,
  skills: Ref<Skill[] | null>,
  weapons: Ref<Weapon[] | null>,
  attributes: Ref<Attribute[] | null>,
  initialQuery: BuildShareQueryInput,
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
  const attributeById = computed(
    () => new Map((attributes.value ?? []).map((attribute) => [attribute.id, attribute])),
  );
  const attributeIdByName = computed(
    () => new Map((attributes.value ?? []).map((attribute) => [attribute.name, attribute.id])),
  );
  const equippedSkills = computed(() =>
    skillSlots.value.filter((skill): skill is Skill => skill !== null),
  );

  /**
   * スキルによって追加される特性（構成内の特性タイプを重複なく）。
   * 「〇〇ガード＋」やステータス上昇系（最大ＨＰ＋N など）は特性ではないため除外する。
   */
  const skillAddedTraits = computed(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const skill of equippedSkills.value) {
      for (const item of skill.composition) {
        if (item.type !== 'attribute' || seen.has(item.name)) continue;
        if (guardAbilityToElement(item.name) || parseStatAttribute(item.name)) continue;
        seen.add(item.name);
        result.push(item.name);
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
    familyTree.value = defaultFamilyTree(target.系統);
    parentLevelTotal.value = DEFAULT_PARENT_LEVEL_TOTAL;
    weapon.value = null;
    monshouNames.value = [];
    spTraitNames.value = [];
  }

  /** URLクエリからビルド・系図個体値の全状態を復元 */
  function restoreFromQuery(query: BuildShareQueryInput, target: Monster): void {
    const restored = restoreBuildShareState(query, target, {
      traitMaster: traitMaster.value,
      skillById: skillById.value,
      weaponByNo: new Map((weapons.value ?? []).map((entry) => [String(entry.no), entry])),
      attributeById: attributeById.value,
      attributeIdByName: attributeIdByName.value,
      defaultFamilyTree,
    });
    bodySize.value = restored.bodySize;
    traitSlots.value = restored.traitSlots;
    skillSlots.value = restored.skillSlots;
    forgeSlots.value = restored.forgeSlots;
    individualValues.value = restored.individualValues;
    familyTree.value = restored.familyTree;
    parentLevelTotal.value = restored.parentLevelTotal;
    weapon.value = restored.weapon;
    monshouNames.value = restored.monshouNames;
    spTraitNames.value = restored.spTraitNames;
  }

  const hasInitialized = ref(false);
  watch(
    [monster, skills, weapons, attributes],
    () => {
      if (
        hasInitialized.value ||
        !monster.value ||
        !skills.value ||
        !weapons.value ||
        !attributes.value
      )
        return;
      hasInitialized.value = true;
      if (hasBuildShareParams(initialQuery)) restoreFromQuery(initialQuery, monster.value);
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
  /**
   * 家系図を特定系統で一括設定する。
   * ただし 左の親・左の祖父母・曽祖父母の一番左はモンスター自身の系統、
   * 曽祖父母の左から2番目は対応系統とする。
   */
  function fillFamilyTree(lineage: string): void {
    if (!monster.value) return;
    const own = monster.value.系統;
    const tree = Array<string | null>(FAMILY_TREE_SIZE).fill(lineage);
    tree[LEFT_PARENT_INDEX] = own;
    tree[LEFT_GRANDPARENT_INDEX] = own;
    tree[LEFTMOST_GREAT_GRANDPARENT_INDEX] = own;
    tree[OPPOSITE_LINEAGE_INDEX] = LINEAGE_DEFAULT_OPPOSITE[own] ?? own;
    familyTree.value = tree;
  }
  function setParentLevelTotal(value: number): void {
    parentLevelTotal.value = value;
  }
  function setWeapon(value: Weapon | null): void {
    weapon.value = value;
  }
  /** 紋晶は1つのみ装備可能。選択中を再度押すと解除、別を押すと差し替え。 */
  function toggleMonshou(name: string): void {
    monshouNames.value = monshouNames.value.includes(name) ? [] : [name];
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
    spTraitNames.value = [];
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
    forgeSlots.value
      .map((value) => FORGE_STAT_UP_BY_LABEL.get(value))
      .filter((v): v is ForgeStatUp => !!v),
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

  const shareQuery = computed<BuildShareQuery>(() =>
    encodeBuildShareQuery(
      {
        bodySize: bodySize.value,
        traitSlots: traitSlots.value,
        skillSlots: skillSlots.value,
        forgeSlots: forgeSlots.value,
        individualValues: individualValues.value,
        familyTree: familyTree.value,
        parentLevelTotal: parentLevelTotal.value,
        weapon: weapon.value,
        monshouNames: monshouNames.value,
        spTraitNames: spTraitNames.value,
      },
      {
        traitMaster: traitMaster.value,
        attributeIdByName: attributeIdByName.value,
      },
    ),
  );

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
    fillFamilyTree,
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
