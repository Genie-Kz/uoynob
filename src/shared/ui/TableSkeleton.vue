<script setup lang="ts">
// 一覧表ページの読み込み中スケルトン。絞り込み欄・件数・表（ヘッダー＋行）の
// 大まかな形を先に確保し、データ到着時のレイアウトのガタつき（CLS）を抑える。
import Skeleton from '@/shared/ui/Skeleton.vue';

withDefaults(
  defineProps<{
    // 表示する行数のプレースホルダ数。
    rows?: number;
    // 系統/ランク/サイズのような複数セレクトを持つ表（モンスター一覧）なら true。
    controls?: boolean;
  }>(),
  { rows: 12, controls: false },
);
</script>

<template>
  <div>
    <!-- 複数セレクトの絞り込み欄（モンスター一覧用） -->
    <div v-if="controls" class="mb-2 flex flex-nowrap justify-end gap-2">
      <Skeleton class="h-10 w-28" />
      <Skeleton class="h-10 w-24" />
      <Skeleton class="h-10 w-32" />
    </div>
    <!-- 名前での絞り込み入力 -->
    <Skeleton class="mb-3 h-10 w-full" />
    <!-- 件数表示 -->
    <Skeleton class="mb-2 h-4 w-16" />

    <!-- 表（角丸枠＋ヘッダー＋行） -->
    <div class="overflow-hidden rounded-lg border">
      <Skeleton class="h-10 w-full !rounded-none" />
      <div v-for="n in rows" :key="n" class="flex items-center gap-3 border-t px-3 py-2.5">
        <Skeleton class="h-5 w-10 shrink-0" />
        <Skeleton class="h-5 flex-1" />
      </div>
    </div>
  </div>
</template>
