/** モンスター一覧の絞り込みロジック（ランク／系統／サイズ／名前） */
import type { Monster } from '@/types/monster';
import {
  BODY_SIZE_NAME_BY_SLUG,
  LINEAGE_NAME_BY_SLUG,
  RANK_FULLWIDTH_LABEL,
  lineageInfoOf,
} from '@/constants/monsterTaxonomy';
import type { MonsterRank } from '@/types/monster';
import { includesKeyword } from '@/shared/search/textSearch';

export interface MonsterListFilter {
  rankSlug?: string;
  lineageSlug?: string;
  sizeSlug?: string;
  nameQuery?: string;
}

export interface FilteredMonsterList {
  title: string;
  monsters: Monster[];
}

/** 絞り込み条件を適用し、見出しと該当モンスターを返す */
export function filterMonsterList(all: Monster[], filter: MonsterListFilter): FilteredMonsterList {
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
