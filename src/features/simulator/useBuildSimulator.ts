/** ビルドシミュレーターの状態管理コンポーザブル */
import { computed, ref, watch, type Ref } from 'vue';
import type { LocationQuery } from 'vue-router';
import type { Attribute } from '@/types/attribute';
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
import { FORGE_STAT_UP_OPTIONS, MONSHOU_LIST, STAT_KEYS } from '@/constants/statsRules';
import { LINEAGE_DEFAULT_OPPOSITE, STAT_LINEAGES } from '@/shared/icons/lineageIcons';
import { collectAllTraitNames, defaultEditableTraits } from '@/domain/monster';
import { computeBuildResistances } from '@/domain/buildSimulator';
import { computeStats } from '@/domain/statsCalculator';
import { parseStatAttribute } from '@/domain/statBonus';
import { guardAbilityToElement } from '@/domain/skillAnalysis';

/**
 * URL共有用のクエリ。ビルドタブ・系図個体値タブの全状態を復元できる。
 *   s = ボディサイズ / t = 特性 / k = スキル / f = 武器鍛冶
 *   i = 個体値 / g = 家系図 / p = 親レベル合計 / w = 武器No / m = 紋晶 / x = SP化特性ID
 */
export interface BuildShareQuery {
  [key: string]: string;
  s: string;
  t: string;
  k: string;
  f: string;
  i: string;
  g: string;
  p: string;
  w: string;
  m: string;
  x: string;
}

/** 復元判定に使う共有パラメータのキー */
const SHARE_PARAM_KEYS = ['s', 't', 'k', 'f', 'i', 'g', 'p', 'w', 'm', 'x'] as const;

const FAMILY_TREE_SIZE = 14;
/** 家系図のインデックス（重み順 [4,4,2,2,2,2,1,1,1,1,1,1,1,1] に対応） */
const LEFT_PARENT_INDEX = 0;
const LEFT_GRANDPARENT_INDEX = 2;
const LEFTMOST_GREAT_GRANDPARENT_INDEX = 6;
const SECOND_GREAT_GRANDPARENT_INDEX = 7;
/** モンスター系統に対応する系統を初期表示するセル（曽祖父母の左から2番目） */
const OPPOSITE_LINEAGE_INDEX = SECOND_GREAT_GRANDPARENT_INDEX;
const DEFAULT_PARENT_LEVEL_TOTAL = 200;
const FORGE_STAT_UP_BY_LABEL = new Map(FORGE_STAT_UP_OPTIONS.map((option) => [option.label, option]));
const RESISTANCE_ELEMENT_SET = new Set<string>(RESISTANCE_ELEMENTS);
/** 武器鍛冶スロットのURLエンコード用：耐性要素＋ステータスアップを通し番号で表す */
const FORGE_OPTION_VALUES: string[] = [
  ...RESISTANCE_ELEMENTS,
  ...FORGE_STAT_UP_OPTIONS.map((option) => option.label),
];
/** 個体値の区切り（負数の「-」と衝突しないよう「_」を使う） */
const IV_SEPARATOR = '_';

/** 系図の初期値：基本は自身の系統、対応系統セルだけ対応系統にする */
function defaultFamilyTree(own: string): (string | null)[] {
  const tree = Array<string | null>(FAMILY_TREE_SIZE).fill(own);
  tree[OPPOSITE_LINEAGE_INDEX] = LINEAGE_DEFAULT_OPPOSITE[own] ?? own;
  return tree;
}

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
  weapons: Ref<Weapon[] | null>,
  attributes: Ref<Attribute[] | null>,
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
  const attributeById = computed(() => new Map((attributes.value ?? []).map((attribute) => [attribute.id, attribute])));
  const attributeIdByName = computed(
    () => new Map((attributes.value ?? []).map((attribute) => [attribute.name, attribute.id])),
  );
  const equippedSkills = computed(() => skillSlots.value.filter((skill): skill is Skill => skill !== null));

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
      return code !== '' && code !== undefined ? (FORGE_OPTION_VALUES[Number(code)] ?? '') : '';
    });

    // ---- 系図・個体値タブ ----
    const ivCodes = (readQuery(query, 'i') ?? '').split(IV_SEPARATOR);
    if (readQuery(query, 'i') !== undefined) {
      const next = zeroIndividualValues();
      STAT_KEYS.forEach((stat, index) => {
        const value = Number(ivCodes[index]);
        if (Number.isFinite(value)) next[stat] = value;
      });
      individualValues.value = next;
    }

    const familyCodes = readQuery(query, 'g');
    if (familyCodes !== undefined) {
      const codes = familyCodes.split('-');
      familyTree.value = Array.from({ length: FAMILY_TREE_SIZE }, (_unused, index) => {
        const code = codes[index];
        return code !== '' && code !== undefined ? (STAT_LINEAGES[Number(code)] ?? null) : null;
      });
    }

    const parentLevel = readQuery(query, 'p');
    if (parentLevel !== undefined && Number.isFinite(Number(parentLevel))) {
      parentLevelTotal.value = Number(parentLevel);
    }

    const weaponNo = readQuery(query, 'w');
    if (weaponNo) {
      weapon.value = (weapons.value ?? []).find((w) => String(w.no) === weaponNo) ?? null;
    }

    const monshouCode = readQuery(query, 'm');
    if (monshouCode) {
      const m = MONSHOU_LIST[Number(monshouCode)];
      monshouNames.value = m ? [m.name] : [];
    }

    const spCodes = readQuery(query, 'x');
    if (spCodes !== undefined) {
      if (!spCodes) {
        spTraitNames.value = [];
      } else if (/^\d+(?:-\d+)*$/.test(spCodes)) {
        spTraitNames.value = spCodes
          .split('-')
          .map((id) => attributeById.value.get(id)?.name)
          .filter((name): name is string => !!name);
      } else {
        // 旧形式（日本語名のカンマ区切り）も既存の共有URL用に読み込む。
        spTraitNames.value = spCodes.split(',');
      }
    }
  }

  const hasInitialized = ref(false);
  watch(
    [monster, skills, weapons, attributes],
    () => {
      if (hasInitialized.value || !monster.value || !skills.value || !weapons.value || !attributes.value) return;
      hasInitialized.value = true;
      const hasShareParams = SHARE_PARAM_KEYS.some((key) => readQuery(initialQuery, key) !== undefined);
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

  function encodeSpTraits(): string {
    const ids = spTraitNames.value.map((name) => attributeIdByName.value.get(name));
    return ids.every((id): id is string => !!id) ? ids.join('-') : spTraitNames.value.join(',');
  }

  const shareQuery = computed<BuildShareQuery>(() => ({
    s: String(BODY_SIZES.indexOf(bodySize.value)),
    t: traitSlots.value.map((name) => (name ? String(traitMaster.value.indexOf(name)) : '')).join('-'),
    k: skillSlots.value.map((skill) => (skill ? skill.id : '')).join('-'),
    f: forgeSlots.value
      .map((value) => {
        const index = FORGE_OPTION_VALUES.indexOf(value);
        return index >= 0 ? String(index) : '';
      })
      .join('-'),
    i: STAT_KEYS.map((stat) => String(individualValues.value[stat])).join(IV_SEPARATOR),
    g: familyTree.value
      .map((lineage) => (lineage ? String((STAT_LINEAGES as readonly string[]).indexOf(lineage)) : ''))
      .join('-'),
    p: String(parentLevelTotal.value),
    w: weapon.value ? String(weapon.value.no) : '',
    m: monshouNames.value.length ? String(MONSHOU_LIST.findIndex((entry) => entry.name === monshouNames.value[0])) : '',
    x: encodeSpTraits(),
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
