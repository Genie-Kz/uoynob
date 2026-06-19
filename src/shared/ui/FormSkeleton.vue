<script setup lang="ts">
// 検索条件や操作パネル向けの読み込み中スケルトン。
// 入力欄・カード・ボタン列の高さを固定して、読み込み後のフォーム出現で本文が押し下がらないようにする。
import Skeleton from '@/shared/ui/Skeleton.vue';

withDefaults(
  defineProps<{
    cards?: number;
    rows?: number;
  }>(),
  { cards: 2, rows: 0 },
);
</script>

<template>
  <div>
    <Skeleton class="mb-2 h-6 w-40" />
    <Skeleton class="mb-2 h-10 w-full sm:w-64" />
    <Skeleton class="mb-4 h-4 w-full max-w-xl" />

    <div class="mb-4 grid gap-3 sm:grid-cols-2">
      <div v-for="card in cards" :key="card" class="rounded border p-3">
        <div class="mb-2 flex items-center justify-between gap-3">
          <Skeleton class="h-5 w-16" />
          <Skeleton class="h-10 w-20" />
        </div>
        <Skeleton class="h-4 w-3/4" />
      </div>
    </div>

    <div v-if="rows" class="rounded border">
      <div v-for="row in rows" :key="row" class="border-b px-3 py-2 last:border-0">
        <Skeleton class="h-5 w-full" />
      </div>
    </div>
  </div>
</template>
