<script setup lang="ts">
// ビルドシミュレーターの入口。モンスター一覧から1体選ぶとビルド画面へ遷移する。
import { useMonsterList } from '@/composables/useMonsterList';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import MonsterTable from '@/features/monster-search/components/MonsterTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import TableSkeleton from '@/shared/ui/TableSkeleton.vue';

const { monsters, isLoading, errorMessage } = useMonsterList();
// ビルドシミュレーター（詳細）から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'ビルドシミュレーター' }]"
    />
    <h2 class="text-xl font-bold mb-1">ビルドシミュレーター</h2>
    <p class="text-sm text-gray-500 mb-4">
      モンスターを検索して一覧から選ぶと、ビルドシミュレーター画面（特性・スキル・武器鍛冶を入れ替えて最終耐性を計算）に移動します。
    </p>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <TableSkeleton controls />
      </template>
      <MonsterTable :monsters="monsters ?? []" link-route-name="simulator-build" />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'ビルドシミュレーター' }]"
      class="mt-6"
    />
  </div>
</template>
