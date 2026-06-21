<script setup lang="ts">
/** アプリ全体のレイアウト（ヘッダー・サイドナビ・本文・フッター）を組み立てるルートコンポーネント。 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/shared/ui/AppHeader.vue';
import AppFooter from '@/shared/ui/AppFooter.vue';
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import { DEFAULT_DESCRIPTION, usePageSeo } from '@/composables/usePageSeo';

const route = useRoute();
/**
 * ホームかどうか。ホームではサイドナビを出さず、レイアウトを中央寄せに変える。
 * main.ts で router.isReady() を待ってからマウントするため、最初の描画から
 * route.name は確定しており、path を併用する必要はない。
 */
const isHome = computed(() => route.name === 'home');
/** 余白を広めにとる通常ページか。ホームとビルド画面は独自レイアウトなので対象外。 */
const useComfortableContent = computed(
  () => route.name !== 'home' && route.name !== 'simulator-build',
);
/** ルートの meta からページタイトル・説明を取り出す（無ければ既定値）。 */
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : null));
const pageDescription = computed(() =>
  typeof route.meta.description === 'string' ? route.meta.description : DEFAULT_DESCRIPTION,
);

// タイトル・説明を <title> や meta タグに反映する。
usePageSeo(pageTitle, pageDescription);
</script>

<template>
  <AppHeader />
  <main class="max-w-[1536px] mx-auto px-3">
    <router-view v-slot="{ Component, route }">
      <!-- ホーム以外は xl 以上で「サイドナビ＋本文」の2カラムにする -->
      <div :class="{ 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] xl:gap-6': !isHome }">
        <!-- 広い画面ではサイドナビを左に固定表示する -->
        <aside v-if="!isHome" class="hidden xl:block">
          <div class="sticky top-3">
            <SiteNavigation />
          </div>
        </aside>

        <div class="min-w-0" :class="{ 'px-1 py-2 sm:px-3 lg:px-4': useComfortableContent }">
          <!-- ページ遷移は新ページの入場フェードのみ。out-in だと前ページの退場を
               待つ間に新ページが opacity:0 のまま存在し「背景だけの空白」が見える。
               退場を即時にして無表示フレームを無くす。key はパス単位なのでクエリ変更では再生成しない -->
          <transition name="route-fade">
            <component :is="Component" :key="route.path" />
          </transition>

          <!-- 狭い画面ではサイドナビを本文の下に回す -->
          <div v-if="!isHome" class="mt-6 xl:hidden">
            <SiteNavigation />
          </div>
        </div>
      </div>
    </router-view>
  </main>
  <AppFooter />
</template>
