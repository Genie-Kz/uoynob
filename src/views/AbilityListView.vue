<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAbilities } from '@/composables/useAbilities';
import { ABILITY_CATEGORY_BY_SLUG } from '@/constants/categories';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const route = useRoute();
const { abilities, isLoading, errorMessage } = useAbilities();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

const categoryName = computed(() =>
  typeof route.query.cat === 'string' ? (ABILITY_CATEGORY_BY_SLUG[route.query.cat] ?? null) : null,
);

const keyword = ref('');
const { data: searchReadings } = useAsyncData(loadSearchReadings);

const visibleAbilities = computed(() => {
  let list = [...(abilities.value ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  if (categoryName.value) list = list.filter((ability) => ability.category === categoryName.value);
  const query = keyword.value.trim();
  if (query) {
    list = list.filter((ability) =>
      includesKeywordWithReading(ability.name, query, searchReadings.value?.labels),
    );
  }
  return list;
});

const title = computed(() => (categoryName.value ? `${categoryName.value} の特技` : '特技一覧'));
const showsCategory = computed(() => categoryName.value === null);
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特技' }]" />
    <h2 class="text-xl font-bold mb-3">{{ title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <input
        v-model="keyword"
        type="text"
        class="border rounded w-full px-3 py-2 mb-3"
        placeholder="特技名で絞り込み"
      />
      <p class="text-sm text-gray-500 mb-2">{{ visibleAbilities.length }} 件</p>

      <div class="overflow-x-auto rounded-lg border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="table-header-row">
              <th class="px-3 py-2 font-semibold">No.</th>
              <th class="px-3 py-2 font-semibold">特技</th>
              <th v-if="showsCategory" class="px-3 py-2 font-semibold">カテゴリー</th>
              <th class="px-3 py-2 font-semibold">効果</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ability in visibleAbilities"
              :key="ability.id"
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="px-3 py-2 whitespace-nowrap">{{ ability.id }}</td>
              <td class="px-3 py-2">
                <router-link
                  :to="{ name: 'ability-detail', params: { id: ability.id } }"
                  class="app-link"
                >
                  {{ ability.name }}
                </router-link>
              </td>
              <td v-if="showsCategory" class="px-3 py-2 whitespace-nowrap">
                {{ ability.category }}
              </td>
              <td class="px-3 py-2 text-gray-600 whitespace-pre-wrap">
                {{ ability.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特技' }]"
      class="mt-6"
    />
  </div>
</template>
