<script setup lang="ts">
// 特性の一覧ページ。カテゴリー絞り込み（クエリ）と名前での絞り込みに対応する。
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAttributes } from '@/composables/useAttributes';
import { ATTRIBUTE_CATEGORY_BY_SLUG } from '@/constants/categories';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import TableSkeleton from '@/shared/ui/TableSkeleton.vue';

const route = useRoute();
const { attributes, isLoading, errorMessage } = useAttributes();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

// クエリ ?cat=... のスラッグからカテゴリー名を引く。未指定なら null（全件）。
const categoryName = computed(() =>
  typeof route.query.cat === 'string'
    ? (ATTRIBUTE_CATEGORY_BY_SLUG[route.query.cat] ?? null)
    : null,
);

// 名前での絞り込みキーワード。
const keyword = ref('');
// 読みがな検索用のデータ。
const { data: searchReadings } = useAsyncData(loadSearchReadings);

// 表示する特性一覧。id 昇順に並べ、カテゴリーと名前で順に絞り込む。
const visibleAttributes = computed(() => {
  let list = [...(attributes.value ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  // カテゴリー指定があれば、そのカテゴリーだけに絞る
  if (categoryName.value)
    list = list.filter((attribute) => attribute.category === categoryName.value);
  const query = keyword.value.trim();
  // 名前キーワードがあれば、読みがなも考慮して部分一致で絞る
  if (query) {
    list = list.filter((attribute) =>
      includesKeywordWithReading(attribute.name, query, searchReadings.value?.labels),
    );
  }
  return list;
});

// 見出し。カテゴリー指定時は「○○ の特性」、未指定なら「特性一覧」。
const title = computed(() => (categoryName.value ? `${categoryName.value} の特性` : '特性一覧'));
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特性' }]" />
    <h2 class="text-xl font-bold mb-3">{{ title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <TableSkeleton />
      </template>
      <input
        v-model="keyword"
        type="text"
        class="border rounded w-full px-3 py-2 mb-3"
        placeholder="特性名で絞り込み"
      />
      <p class="text-sm text-gray-500 mb-2">{{ visibleAttributes.length }} 件</p>

      <div class="overflow-x-auto rounded-lg border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="table-header-row">
              <th class="px-3 py-2 font-semibold">No.</th>
              <th class="px-3 py-2 font-semibold">特性</th>
              <th class="px-3 py-2 font-semibold">効果</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="attribute in visibleAttributes"
              :key="attribute.id"
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="px-3 py-2 whitespace-nowrap">{{ attribute.id }}</td>
              <td class="px-3 py-2">
                <router-link
                  :to="{ name: 'attribute-detail', params: { id: attribute.id } }"
                  class="app-link"
                >
                  {{ attribute.name }}
                </router-link>
              </td>
              <td class="px-3 py-2 text-gray-600">{{ attribute.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特性' }]"
      class="mt-6"
    />
  </div>
</template>
