/** モンスター一覧の絞り込みロジック（ランク／系統／サイズ／名前） */
import type { MonsterListItem } from '@/types/monster';
import {
  BODY_SIZE_NAME_BY_SLUG,
  LINEAGE_NAME_BY_SLUG,
  RANK_FULLWIDTH_LABEL,
  lineageInfoOf,
} from '@/constants/monsterTaxonomy';
import type { MonsterRank } from '@/types/monster';
import { includesKeyword, includesKeywordWithReading } from '@/shared/search/textSearch';

export interface MonsterListFilter {
  rankSlug?: string;
  lineageSlug?: string;
  sizeSlug?: string;
  nameQuery?: string;
}

export interface FilteredMonsterList<T extends MonsterListItem = MonsterListItem> {
  title: string;
  monsters: T[];
}

/** 絞り込み条件を適用し、見出しと該当モンスターを返す */
export function filterMonsterList<T extends MonsterListItem>(
  all: T[],
  filter: MonsterListFilter,
): FilteredMonsterList<T> {
  const { rankSlug, lineageSlug, sizeSlug, nameQuery } = filter;

  if (rankSlug) {
    const rank = rankSlug.toUpperCase() as MonsterRank;
    return {
      title: `ランク${RANK_FULLWIDTH_LABEL[rank] ?? rank} のモンスター`,
      monsters: all.filter((monster) => monster.ランク === rank),
    };
  }

  if (lineageSlug) {
    const lineageName = LINEAGE_NAME_BY_SLUG[lineageSlug] ?? '';
    return {
      title: `${lineageInfoOf(lineageName).label} のモンスター`,
      monsters: all.filter((monster) => monster.系統 === lineageName),
    };
  }

  if (sizeSlug) {
    const sizeName = BODY_SIZE_NAME_BY_SLUG[sizeSlug];
    return {
      title: `${sizeName} のモンスター`,
      monsters: all.filter((monster) => monster.サイズ特性 === sizeName),
    };
  }

  if (nameQuery) {
    return {
      title: `「${nameQuery}」の検索結果`,
      monsters: all.filter((monster) => includesKeyword(monster.名前, nameQuery)),
    };
  }

  return { title: 'モンスター一覧', monsters: all };
}

/** 一覧テーブルのコントロール（名前キーワード・系統・ランク・サイズ）による絞り込み条件 */
export interface MonsterListControls {
  keyword?: string;
  /** 系統名（完全一致） */
  lineage?: string;
  /** ランク（完全一致） */
  rank?: string;
  /** サイズ特性（完全一致） */
  bodySize?: string;
}

/** No.（位階）昇順、同位階は連番（variant）昇順で並べた配列を返す（非破壊） */
export function sortMonstersByDexOrder<T extends MonsterListItem>(monsters: T[]): T[] {
  return [...monsters].sort((a, b) => a.位階 - b.位階 || a.variant - b.variant);
}

/**
 * 一覧テーブルのコントロールでモンスターを絞り込む（AND条件）。
 * 名前は読みがな（readings）を加味して全角/半角・かなを区別せずにヒットさせる。
 */
export function filterMonstersByControls<T extends MonsterListItem>(
  monsters: T[],
  controls: MonsterListControls,
  readings?: Record<string, string>,
): T[] {
  const keyword = controls.keyword?.trim() ?? '';
  return monsters.filter((monster) => {
    if (keyword && !includesKeywordWithReading(monster.名前, keyword, readings)) return false;
    if (controls.lineage && monster.系統 !== controls.lineage) return false;
    if (controls.rank && monster.ランク !== controls.rank) return false;
    if (controls.bodySize && monster.サイズ特性 !== controls.bodySize) return false;
    return true;
  });
}
