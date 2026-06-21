<script setup lang="ts">
/** サイト内検索の結果ページ。モンスター・特性・スキル・特技を横断検索して一覧表示する。 */
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { loadAttributes, loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useAbilities } from '@/composables/useAbilities';
import { useMonsterList } from '@/composables/useMonsterList';
import { useSkills } from '@/composables/useSkills';
import { searchSite, type SiteSearchHit } from '@/domain/siteSearch';
import { routeForSiteSearchHit } from '@/router/siteSearchGuard';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';

const route = useRoute();
const router = useRouter();
const { monsters, isLoading: monstersLoading, errorMessage: monstersError } = useMonsterList();
const { skills, isLoading: skillsLoading, errorMessage: skillsError } = useSkills();
const { abilities, isLoading: abilitiesLoading, errorMessage: abilitiesError } = useAbilities();
const {
  data: attributes,
  isLoading: attributesLoading,
  errorMessage: attributesError,
} = useAsyncData(loadAttributes);
const {
  data: searchReadings,
  isLoading: searchReadingsLoading,
  errorMessage: searchReadingsError,
} = useAsyncData(loadSearchReadings);

// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

/** 検索キーワード（URL の ?q）。実際の検索対象になる確定値。 */
const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));
/** 入力欄の値。送信するまでは URL に反映しない。 */
const inputKeyword = ref(keyword.value);
/** 4種のデータのどれかが読み込み中なら、全体として読み込み中とみなす。 */
const isLoading = computed(
  () =>
    monstersLoading.value ||
    skillsLoading.value ||
    abilitiesLoading.value ||
    attributesLoading.value ||
    searchReadingsLoading.value,
);
/** いずれかの読み込みでエラーがあれば、最初のエラーを表示する。 */
const errorMessage = computed(
  () =>
    monstersError.value ??
    skillsError.value ??
    abilitiesError.value ??
    attributesError.value ??
    searchReadingsError.value,
);
/** 全データを横断してキーワード検索した結果。 */
const results = computed(() =>
  searchSite(
    {
      monsters: monsters.value ?? [],
      attributes: attributes.value ?? [],
      skills: skills.value ?? [],
      abilities: abilities.value ?? [],
    },
    keyword.value,
    searchReadings.value ?? undefined,
  ),
);

/** 検索ヒット1件から、その詳細ページへのルートを求める。 */
function routeFor(hit: SiteSearchHit): RouteLocationRaw {
  return routeForSiteSearchHit(hit);
}

// URL のキーワードが変わったら、入力欄も追従させる（ブラウザの戻る/進む対策）。
watch(keyword, (value) => {
  inputKeyword.value = value;
});

/** 入力欄の値で再検索する。空入力なら何もしない。 */
function submitSearch(): void {
  const query = inputKeyword.value.trim();
  if (!query) return;
  void router.push({ name: 'site-search', query: { q: query } });
}
</script>

<template>
  <div class="max-w-2xl mx-auto" :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '検索結果' }]" />
    <h2 class="text-xl font-bold mb-3">検索結果</h2>

    <form class="flex gap-2 mb-4" @submit.prevent="submitSearch">
      <input
        v-model="inputKeyword"
        type="search"
        placeholder="モンスター・特性・スキル・特技名で検索"
        class="min-w-0 flex-1 border rounded px-3 py-2"
        aria-label="モンスター・特性・スキル・特技名で検索"
      />
      <button type="submit" class="btn-primary">検索</button>
    </form>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <div class="overflow-hidden rounded border">
          <div class="border-b bg-gray-50 px-3 py-2">
            <Skeleton class="h-5 w-40" />
          </div>
          <div
            v-for="row in 8"
            :key="row"
            class="flex items-center gap-3 border-b px-3 py-3 last:border-0"
          >
            <Skeleton class="h-7 w-14 shrink-0" />
            <Skeleton class="h-5 flex-1" />
          </div>
        </div>
      </template>
      <p v-if="!keyword" class="text-gray-500">検索語を入力してください。</p>
      <p v-else-if="results.length === 0" class="text-gray-500">
        「{{ keyword }}」に一致する候補は見つかりませんでした。
      </p>
      <div v-else class="border rounded overflow-hidden">
        <p class="bg-gray-50 border-b px-3 py-2 text-sm text-gray-600">
          「{{ keyword }}」の候補：{{ results.length }}件
        </p>
        <ul class="divide-y">
          <li v-for="hit in results" :key="`${hit.kind}-${hit.id}`">
            <router-link
              :to="routeFor(hit)"
              class="flex items-center gap-3 px-3 py-3 hover:bg-gray-50"
            >
              <span class="shrink-0 rounded bg-sky-200 px-2 py-1 text-xs font-bold">
                {{ hit.kindLabel }}
              </span>
              <span class="app-link">{{ hit.label }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '検索結果' }]"
      class="mt-6"
    />
  </div>
</template>
