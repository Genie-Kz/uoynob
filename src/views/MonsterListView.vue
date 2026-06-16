<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMonsterList } from '@/composables/useMonsterList';
import { filterMonsterList } from '@/domain/monsterFilter';
import DataState from '@/shared/ui/DataState.vue';
import MonsterTable from '@/features/monster-search/components/MonsterTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const route = useRoute();
const { monsters, isLoading, errorMessage } = useMonsterList();

function queryString(key: string): string | undefined {
  const value = route.query[key];
  return typeof value === 'string' ? value : undefined;
}

const result = computed(() =>
  filterMonsterList(monsters.value ?? [], {
    rankSlug: queryString('rank'),
    lineageSlug: queryString('lineage'),
    sizeSlug: queryString('size'),
    nameQuery: queryString('q'),
  }),
);
</script>

<template>
  <div>
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター' }]" />
    <h2 class="text-xl font-bold mb-3">{{ result.title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <MonsterTable :monsters="result.monsters" link-route-name="monster-detail" />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター' }]"
      class="mt-6"
    />
  </div>
</template>
