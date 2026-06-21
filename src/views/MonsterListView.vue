<script setup lang="ts">
/** モンスターの一覧ページ。ランク/系統/サイズ/名前（クエリ）で絞った結果を表で表示する。 */
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
import TableSkeleton from '@/shared/ui/TableSkeleton.vue';

const route = useRoute();
const { monsters, isLoading, errorMessage } = useMonsterList();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

/** クエリ文字列を安全に取り出す。配列など文字列でない場合は undefined にする。 */
function queryString(key: string): string | undefined {
  const value = route.query[key];
  return typeof value === 'string' ? value : undefined;
}

// クエリ（ランク/系統/サイズ/名前）で絞り込んだ結果と、その見出しタイトル。
const result = computed(() =>
  filterMonsterList(monsters.value ?? [], {
    rankSlug: queryString('rank'),
    lineageSlug: queryString('lineage'),
    sizeSlug: queryString('size'),
    nameQuery: queryString('q'),
  }),
);

// 表で隠す列。そのページの絞り込み条件と同じ列（例: ランク別ページのランク列）は冗長なので隠す。
const hiddenColumns = computed(() => {
  const columns: Array<'rank' | 'lineage' | 'bodySize'> = [];
  const rankSlug = queryString('rank')?.toUpperCase();
  const lineageSlug = queryString('lineage');
  const sizeSlug = queryString('size');

  // 有効な絞り込み条件があるときだけ、その列を隠す対象に加える
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
      <template #skeleton>
        <TableSkeleton controls />
      </template>
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
