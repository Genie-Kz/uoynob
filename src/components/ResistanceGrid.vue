<script setup lang="ts">
import type { ResistanceCellView } from '@/presentation/resistanceCells';

defineProps<{
  cells: ResistanceCellView[];
  /** 表の上部に表示する見出し（グレーのヘッダーバー） */
  title?: string;
}>();
</script>

<template>
  <!-- グレーの見出しバー＋3列の表。各セルは「耐性名（グレー背景）＝上 / 値（色付き）＝下」の縦積み（元サイト準拠） -->
  <div class="border rounded overflow-hidden">
    <div v-if="title" class="bg-gray-100 font-bold px-3 py-2 border-b">{{ title }}</div>
    <div class="grid grid-cols-3">
      <div
        v-for="(cell, index) in cells"
        :key="cell.element"
        class="border-b"
        :class="{ 'border-l': index % 3 !== 0 }"
      >
        <div class="bg-gray-100 text-center text-xs py-1">{{ cell.element }}</div>
        <div class="text-center py-1" :class="cell.colorClass">{{ cell.text }}</div>
      </div>
    </div>
  </div>
</template>
