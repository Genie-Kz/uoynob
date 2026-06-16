import type { Attribute } from '@/types/attribute';
import type { BodySize, Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { StatValues, Weapon } from '@/types/stats';
import {
  SKILL_SLOT_COUNT_BY_SIZE,
  TRAIT_SLOT_COUNT_BY_SIZE,
  WEAPON_FORGE_SLOT_COUNT,
} from '@/constants/buildRules';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS, MONSHOU_LIST, STAT_KEYS } from '@/constants/statsRules';
import { STAT_LINEAGES } from '@/shared/icons/lineageIcons';

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

export interface BuildShareState {
  bodySize: BodySize;
  traitSlots: string[];
  skillSlots: (Skill | null)[];
  forgeSlots: string[];
  individualValues: StatValues;
  familyTree: (string | null)[];
  parentLevelTotal: number;
  weapon: Weapon | null;
  monshouNames: string[];
  spTraitNames: string[];
}

export interface BuildShareCodecContext {
  traitMaster: string[];
  skillById: ReadonlyMap<string, Skill>;
  weaponByNo: ReadonlyMap<string, Weapon>;
  attributeById: ReadonlyMap<string, Attribute>;
  attributeIdByName: ReadonlyMap<string, string>;
  defaultFamilyTree: (ownLineage: string) => (string | null)[];
}

export type BuildShareQueryInput = Record<string, string | (string | null)[] | null | undefined>;

/** 復元判定に使う共有パラメータのキー */
export const SHARE_PARAM_KEYS = ['s', 't', 'k', 'f', 'i', 'g', 'p', 'w', 'm', 'x'] as const;

/** 武器鍛冶スロットのURLエンコード用：耐性要素＋ステータスアップを通し番号で表す */
const FORGE_OPTION_VALUES: string[] = [
  ...RESISTANCE_ELEMENTS,
  ...FORGE_STAT_UP_OPTIONS.map((option) => option.label),
];

/** 個体値の区切り（負数の「-」と衝突しないよう「_」を使う） */
const IV_SEPARATOR = '_';

function readQuery(query: BuildShareQueryInput, key: string): string | undefined {
  const value = query[key];
  return typeof value === 'string' ? value : undefined;
}

function zeroIndividualValues(): StatValues {
  return { HP: 0, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

export function hasBuildShareParams(query: BuildShareQueryInput): boolean {
  return SHARE_PARAM_KEYS.some((key) => readQuery(query, key) !== undefined);
}

/** URLクエリからビルド・系図個体値の全状態を復元する。 */
export function restoreBuildShareState(
  query: BuildShareQueryInput,
  target: Monster,
  context: BuildShareCodecContext,
): BuildShareState {
  const sizeIndex = Number(readQuery(query, 's'));
  const bodySize = BODY_SIZES[sizeIndex] ?? target.サイズ特性;

  const traitCodes = (readQuery(query, 't') ?? '').split('-');
  const traitSlots = Array.from(
    { length: TRAIT_SLOT_COUNT_BY_SIZE[bodySize] - 1 },
    (_unused, index) => {
      const code = traitCodes[index];
      return code ? (context.traitMaster[Number(code)] ?? '') : '';
    },
  );

  const skillIds = (readQuery(query, 'k') ?? '').split('-');
  const skillSlots = Array.from(
    { length: SKILL_SLOT_COUNT_BY_SIZE[bodySize] },
    (_unused, index) => {
      const id = skillIds[index];
      return id ? (context.skillById.get(id) ?? null) : null;
    },
  );

  const forgeCodes = (readQuery(query, 'f') ?? '').split('-');
  const forgeSlots = Array.from({ length: WEAPON_FORGE_SLOT_COUNT }, (_unused, index) => {
    const code = forgeCodes[index];
    return code !== '' && code !== undefined ? (FORGE_OPTION_VALUES[Number(code)] ?? '') : '';
  });

  const individualValues = zeroIndividualValues();
  const ivCodes = (readQuery(query, 'i') ?? '').split(IV_SEPARATOR);
  if (readQuery(query, 'i') !== undefined) {
    STAT_KEYS.forEach((stat, index) => {
      const value = Number(ivCodes[index]);
      if (Number.isFinite(value)) individualValues[stat] = value;
    });
  }

  let familyTree = context.defaultFamilyTree(target.系統);
  const familyCodes = readQuery(query, 'g');
  if (familyCodes !== undefined) {
    const codes = familyCodes.split('-');
    familyTree = Array.from({ length: familyTree.length }, (_unused, index) => {
      const code = codes[index];
      return code !== '' && code !== undefined ? (STAT_LINEAGES[Number(code)] ?? null) : null;
    });
  }

  let parentLevelTotal = 200;
  const parentLevel = readQuery(query, 'p');
  if (parentLevel !== undefined && Number.isFinite(Number(parentLevel))) {
    parentLevelTotal = Number(parentLevel);
  }

  let weapon: Weapon | null = null;
  const weaponNo = readQuery(query, 'w');
  if (weaponNo) {
    weapon = context.weaponByNo.get(weaponNo) ?? null;
  }

  let monshouNames: string[] = [];
  const monshouCode = readQuery(query, 'm');
  if (monshouCode) {
    const monshou = MONSHOU_LIST[Number(monshouCode)];
    monshouNames = monshou ? [monshou.name] : [];
  }

  let spTraitNames: string[] = [];
  const spCodes = readQuery(query, 'x');
  if (spCodes !== undefined) {
    if (!spCodes) {
      spTraitNames = [];
    } else if (/^\d+(?:-\d+)*$/.test(spCodes)) {
      spTraitNames = spCodes
        .split('-')
        .map((id) => context.attributeById.get(id)?.name)
        .filter((name): name is string => !!name);
    } else {
      // 旧形式（日本語名のカンマ区切り）も既存の共有URL用に読み込む。
      spTraitNames = spCodes.split(',');
    }
  }

  return {
    bodySize,
    traitSlots,
    skillSlots,
    forgeSlots,
    individualValues,
    familyTree,
    parentLevelTotal,
    weapon,
    monshouNames,
    spTraitNames,
  };
}

function encodeSpTraits(
  spTraitNames: string[],
  attributeIdByName: ReadonlyMap<string, string>,
): string {
  const ids = spTraitNames.map((name) => attributeIdByName.get(name));
  return ids.every((id): id is string => !!id) ? ids.join('-') : spTraitNames.join(',');
}

export function encodeBuildShareQuery(
  state: Omit<BuildShareState, 'weapon'> & { weapon: Weapon | null },
  context: Pick<BuildShareCodecContext, 'traitMaster' | 'attributeIdByName'>,
): BuildShareQuery {
  return {
    s: String(BODY_SIZES.indexOf(state.bodySize)),
    t: state.traitSlots
      .map((name) => (name ? String(context.traitMaster.indexOf(name)) : ''))
      .join('-'),
    k: state.skillSlots.map((skill) => (skill ? skill.id : '')).join('-'),
    f: state.forgeSlots
      .map((value) => {
        const index = FORGE_OPTION_VALUES.indexOf(value);
        return index >= 0 ? String(index) : '';
      })
      .join('-'),
    i: STAT_KEYS.map((stat) => String(state.individualValues[stat])).join(IV_SEPARATOR),
    g: state.familyTree
      .map((lineage) =>
        lineage ? String((STAT_LINEAGES as readonly string[]).indexOf(lineage)) : '',
      )
      .join('-'),
    p: String(state.parentLevelTotal),
    w: state.weapon ? String(state.weapon.no) : '',
    m: state.monshouNames.length
      ? String(MONSHOU_LIST.findIndex((entry) => entry.name === state.monshouNames[0]))
      : '',
    x: encodeSpTraits(state.spTraitNames, context.attributeIdByName),
  };
}
