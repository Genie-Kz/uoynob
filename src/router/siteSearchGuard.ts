// サイト内検索に関するルーターガードと、ヒット→詳細ページ変換。
import type { NavigationGuard, RouteLocationRaw } from 'vue-router';
import {
  loadAbilities,
  loadAttributes,
  loadMonsterList,
  loadSearchReadings,
  loadSkills,
} from '@/shared/data/datasets';
import { searchSite, type SiteSearchHit } from '@/domain/siteSearch';

// 検索ヒットの種類から、対応する詳細ページのルートを作る。
export function routeForSiteSearchHit(hit: SiteSearchHit): RouteLocationRaw {
  const routeName = {
    monster: 'monster-detail',
    attribute: 'attribute-detail',
    skill: 'skill-detail',
    ability: 'ability-detail',
  }[hit.kind];
  return { name: routeName, params: { id: hit.id } };
}

/** 候補が1件なら検索結果画面を描画せず、直接詳細ページへ遷移する。 */
export const redirectSingleSiteSearchResult: NavigationGuard = async (to) => {
  // サイト内検索ページ以外への遷移はそのまま通す
  if (to.name !== 'site-search') return true;

  // キーワードが空ならリダイレクト判定しない
  const keyword = typeof to.query.q === 'string' ? to.query.q.trim() : '';
  if (!keyword) return true;

  try {
    // 検索に必要な4種＋読みがなを並行読み込みする
    const [monsters, attributes, skills, abilities, readings] = await Promise.all([
      loadMonsterList(),
      loadAttributes(),
      loadSkills(),
      loadAbilities(),
      loadSearchReadings(),
    ]);
    const hits = searchSite({ monsters, attributes, skills, abilities }, keyword, readings);
    // ヒットが1件だけなら、その詳細ページへ直行する
    return hits.length === 1 ? routeForSiteSearchHit(hits[0]!) : true;
  } catch {
    // 読み込みエラーは検索結果画面のDataStateで表示する。
    return true;
  }
};
