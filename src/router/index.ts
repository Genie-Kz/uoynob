import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

/**
 * ルート定義。各ビューは遅延読み込み。
 * GitHub Pages のサブパス配信でも確実に動くようハッシュ方式を採用。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/monsters',
    name: 'monster-list',
    component: () => import('@/views/MonsterListView.vue'),
  },
  {
    path: '/monsters/:id',
    name: 'monster-detail',
    component: () => import('@/views/MonsterDetailView.vue'),
    props: true,
  },
  {
    path: '/search',
    name: 'search-monster',
    component: () => import('@/views/SearchMonsterView.vue'),
  },
  {
    path: '/skills',
    name: 'skill-list',
    component: () => import('@/views/SkillListView.vue'),
  },
  {
    path: '/skills/:id',
    name: 'skill-detail',
    component: () => import('@/views/SkillDetailView.vue'),
    props: true,
  },
  {
    path: '/simulator',
    name: 'simulator-select',
    component: () => import('@/views/SimulatorSelectView.vue'),
  },
  {
    path: '/simulator/:id',
    name: 'simulator-build',
    component: () => import('@/views/SimulatorBuildView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
