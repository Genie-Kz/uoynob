<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { loadAttributes, loadSearchReadings } from '@/api/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useAbilities } from '@/composables/useAbilities';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { searchSite, type SiteSearchHit } from '@/domain/siteSearch';
import { routeForSiteSearchHit } from '@/router/siteSearchGuard';
import DataState from '@/components/DataState.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';

const route = useRoute();
const router = useRouter();
const { monsters, isLoading: monstersLoading, errorMessage: monstersError } = useMonsters();
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

const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));
const inputKeyword = ref(keyword.value);
const isLoading = computed(
  () =>
    monstersLoading.value ||
    skillsLoading.value ||
    abilitiesLoading.value ||
    attributesLoading.value ||
    searchReadingsLoading.value,
);
const errorMessage = computed(
  () =>
    monstersError.value ??
    skillsError.value ??
    abilitiesError.value ??
    attributesError.value ??
    searchReadingsError.value,
);
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

function routeFor(hit: SiteSearchHit): RouteLocationRaw {
  return routeForSiteSearchHit(hit);
}

watch(keyword, (value) => {
  inputKeyword.value = value;
});

function submitSearch(): void {
  const query = inputKeyword.value.trim();
  if (!query) return;
  void router.push({ name: 'site-search', query: { q: query } });
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
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
