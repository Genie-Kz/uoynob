import {
  createRouter,
  createWebHashHistory,
  type RouteRecordName,
  type RouteRecordRaw,
} from 'vue-router';
import { ref } from 'vue';
import { redirectSingleSiteSearchResult } from './siteSearchGuard';
import { installChunkLoadRecovery } from './chunkLoadRecovery';

/** 直前に表示していたルート名。画面側で「どこから来たか」による分岐に使う。 */
export const previousRouteName = ref<RouteRecordName | null | undefined>(undefined);

/**
 * ルート定義。各ビューは遅延読み込み。
 * GitHub Pages のサブパス配信でも確実に動くようハッシュ方式を採用。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: null },
  },
  {
    path: '/monsters',
    name: 'monster-list',
    component: () => import('@/views/MonsterListView.vue'),
    meta: {
      title: 'モンスター図鑑',
      description:
        'イルルカSPのモンスターをランク・系統・サイズ・名前から検索できるモンスター図鑑。',
    },
  },
  {
    path: '/monsters/:id',
    name: 'monster-detail',
    component: () => import('@/views/MonsterDetailView.vue'),
    props: true,
    meta: { title: 'モンスター詳細' },
  },
  {
    path: '/search',
    name: 'search-monster',
    component: () => import('@/views/SearchMonsterView.vue'),
    meta: {
      title: '耐性・特性からモンスター検索',
      description: 'イルルカSPのモンスターを耐性の強さと所持特性から絞り込める検索ツール。',
    },
  },
  {
    path: '/site-search',
    name: 'site-search',
    component: () => import('@/views/SiteSearchView.vue'),
    meta: { title: 'サイト内検索' },
  },
  {
    path: '/attributes',
    name: 'attribute-list',
    component: () => import('@/views/AttributeListView.vue'),
    meta: {
      title: '特性一覧',
      description: 'イルルカSPに登場する特性の効果とSP効果を検索できる一覧。',
    },
  },
  {
    path: '/attributes/:id',
    name: 'attribute-detail',
    component: () => import('@/views/AttributeDetailView.vue'),
    props: true,
    meta: { title: '特性詳細' },
  },
  {
    path: '/abilities',
    name: 'ability-list',
    component: () => import('@/views/AbilityListView.vue'),
    meta: {
      title: '特技一覧',
      description: 'イルルカSPに登場する呪文・斬撃・体技・踊り・ブレスなどの特技一覧。',
    },
  },
  {
    path: '/abilities/:id',
    name: 'ability-detail',
    component: () => import('@/views/AbilityDetailView.vue'),
    props: true,
    meta: { title: '特技詳細' },
  },
  {
    path: '/skills',
    name: 'skill-list',
    component: () => import('@/views/SkillListView.vue'),
    meta: {
      title: 'スキル一覧',
      description: 'イルルカSPのスキル構成、習得特技・特性、所持モンスターを調べられる一覧。',
    },
  },
  {
    path: '/skills/:id',
    name: 'skill-detail',
    component: () => import('@/views/SkillDetailView.vue'),
    props: true,
    meta: { title: 'スキル詳細' },
  },
  {
    path: '/pickup/:pickupKey',
    name: 'pickup',
    component: () => import('@/views/PickupView.vue'),
    props: true,
    meta: { title: 'ピックアップ' },
  },
  {
    path: '/simulator',
    name: 'simulator-select',
    component: () => import('@/views/SimulatorSelectView.vue'),
    meta: {
      title: 'ビルドシミュレーター',
      description:
        'イルルカSPの特性・スキル・武器鍛冶を組み替え、最終耐性とステータスを計算できるシミュレーター。',
    },
  },
  {
    path: '/simulator/:id',
    name: 'simulator-build',
    component: () => import('@/views/SimulatorBuildView.vue'),
    props: true,
    meta: { title: 'モンスタービルド' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'ページが見つかりません' },
  },
];

/** アプリ全体のルーター（ハッシュ履歴・遅延読み込み・スクロール挙動を設定済み）。 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 戻る/進むでは元の位置へ
    if (savedPosition) return savedPosition;
    // クエリ（共有URL）だけの変化ではスクロールを動かさない（ビルド編集中のガタつき防止）
    if (to.path === from.path) return false;
    // ページ遷移時のみ先頭へ
    return { top: 0 };
  },
});

router.beforeEach(redirectSingleSiteSearchResult);

// 遷移のたびに直前のルート名を記録する（遷移先コンポーネントの setup より前に確定する）。
router.beforeEach((_to, from) => {
  previousRouteName.value = from.name;
});

installChunkLoadRecovery(router);
