<script setup lang="ts">
import { useMonsterList } from '@/composables/useMonsterList';
import DataState from '@/shared/ui/DataState.vue';
import MonsterTable from '@/features/monster-search/components/MonsterTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const { monsters, isLoading, errorMessage } = useMonsterList();
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'ビルドシミュレーター' }]"
    />
    <h2 class="text-xl font-bold mb-1">ビルドシミュレーター</h2>
    <p class="text-sm text-gray-500 mb-4">
      モンスターを検索して一覧から選ぶと、ビルドシミュレーター画面（特性・スキル・武器鍛冶を入れ替えて最終耐性を計算）に移動します。
    </p>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <MonsterTable :monsters="monsters ?? []" link-route-name="simulator-build" />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'ビルドシミュレーター' }]"
      class="mt-6"
    />
  </div>
</template>
