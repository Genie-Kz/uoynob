<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMonsterList } from '@/composables/useMonsterList';
import { filterMonsterList } from '@/domain/monsterFilter';
import {
  BODY_SIZE_NAME_BY_SLUG,
  LINEAGE_NAME_BY_SLUG,
  MONSTER_RANKS,
} from '@/constants/monsterTaxonomy';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import MonsterTable from '@/features/monster-search/components/MonsterTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const route = useRoute();
const { monsters, isLoading, errorMessage } = useMonsterList();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

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

const hiddenColumns = computed(() => {
  const columns: Array<'rank' | 'lineage' | 'bodySize'> = [];
  const rankSlug = queryString('rank')?.toUpperCase();
  const lineageSlug = queryString('lineage');
  const sizeSlug = queryString('size');

  if (rankSlug && MONSTER_RANKS.some((rank) => rank === rankSlug)) columns.push('rank');
  if (lineageSlug && LINEAGE_NAME_BY_SLUG[lineageSlug]) columns.push('lineage');
  if (sizeSlug && BODY_SIZE_NAME_BY_SLUG[sizeSlug]) columns.push('bodySize');

  return columns;
});
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター' }]" />
    <h2 class="text-xl font-bold mb-3">{{ result.title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <MonsterTable
        :monsters="result.monsters"
        link-route-name="monster-detail"
        :hidden-columns="hiddenColumns"
      />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター' }]"
      class="mt-6"
    />
  </div>
</template>
