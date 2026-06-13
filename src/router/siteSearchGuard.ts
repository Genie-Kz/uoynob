import type { NavigationGuard, RouteLocationRaw } from 'vue-router';
import { loadAbilities, loadAttributes, loadMonsters, loadSkills } from '@/api/datasets';
import { searchSite, type SiteSearchHit } from '@/domain/siteSearch';

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
  if (to.name !== 'site-search') return true;

  const keyword = typeof to.query.q === 'string' ? to.query.q.trim() : '';
  if (!keyword) return true;

  try {
    const [monsters, attributes, skills, abilities] = await Promise.all([
      loadMonsters(),
      loadAttributes(),
      loadSkills(),
      loadAbilities(),
    ]);
    const hits = searchSite({ monsters, attributes, skills, abilities }, keyword);
    return hits.length === 1 ? routeForSiteSearchHit(hits[0]) : true;
  } catch {
    // 読み込みエラーは検索結果画面のDataStateで表示する。
    return true;
  }
};
