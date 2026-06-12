<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAttributes } from '@/composables/useAttributes';
import { ATTRIBUTE_CATEGORY_BY_SLUG } from '@/constants/categories';
import DataState from '@/components/DataState.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';

const route = useRoute();
const { attributes, isLoading, errorMessage } = useAttributes();

const categoryName = computed(() =>
  typeof route.query.cat === 'string' ? (ATTRIBUTE_CATEGORY_BY_SLUG[route.query.cat] ?? null) : null,
);

const keyword = ref('');

const visibleAttributes = computed(() => {
  let list = [...(attributes.value ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  if (categoryName.value) list = list.filter((attribute) => attribute.category === categoryName.value);
  const query = keyword.value.trim();
  if (query) list = list.filter((attribute) => attribute.name.includes(query));
  return list;
});

const title = computed(() => (categoryName.value ? `${categoryName.value} の特性` : '特性一覧'));
</script>

<template>
  <div>
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特性' }]" />
    <h2 class="text-xl font-bold mb-3">{{ title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <input
        v-model="keyword"
        type="text"
        class="border rounded w-full px-3 py-2 mb-3"
        placeholder="特性名で絞り込み"
      />
      <p class="text-sm text-gray-500 mb-2">{{ visibleAttributes.length }} 件</p>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b text-left">
              <th class="px-2 py-2 border">No.</th>
              <th class="px-2 py-2 border">特性</th>
              <th class="px-2 py-2 border">カテゴリー</th>
              <th class="px-2 py-2 border">効果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="attribute in visibleAttributes" :key="attribute.id" class="border-b hover:bg-gray-50">
              <td class="px-2 py-1 border whitespace-nowrap">{{ attribute.id }}</td>
              <td class="px-2 py-1 border">
                <router-link :to="{ name: 'attribute-detail', params: { id: attribute.id } }" class="app-link">
                  {{ attribute.name }}
                </router-link>
              </td>
              <td class="px-2 py-1 border whitespace-nowrap">{{ attribute.category }}</td>
              <td class="px-2 py-1 border text-gray-600">{{ attribute.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataState>

    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: '特性' }]" class="mt-6" />
  </div>
</template>
