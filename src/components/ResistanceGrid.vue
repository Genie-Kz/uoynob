<script setup lang="ts">
import { computed } from 'vue';
import type { ResistanceCellView } from '@/presentation/resistanceCells';

const props = defineProps<{
  cells: ResistanceCellView[];
  /** 表の上部に表示する見出し（グレーのヘッダーバー） */
  title?: string;
}>();

// 3列ずつの行に分割
const rows = computed<ResistanceCellView[][]>(() => {
  const grouped: ResistanceCellView[][] = [];
  for (let i = 0; i < props.cells.length; i += 3) grouped.push(props.cells.slice(i, i + 3));
  return grouped;
});
</script>

<template>
  <!-- グレーの見出しバー＋3列。耐性名は横に連続したグレー帯、値はテキストの周りだけ色付き（ピル）。 -->
  <div class="border rounded overflow-hidden">
    <div v-if="title" class="bg-gray-100 font-bold px-3 py-2 border-b">{{ title }}</div>
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      :class="{ 'border-b border-gray-200': rowIndex < rows.length - 1 }"
    >
      <!-- 耐性名：横に連続したグレー帯 -->
      <div class="flex bg-gray-100 border-b border-gray-200">
        <div
          v-for="(cell, colIndex) in row"
          :key="cell.element"
          class="flex-1 text-center text-xs py-1.5"
          :class="{ 'border-l border-gray-200': colIndex > 0 }"
        >
          {{ cell.element }}
        </div>
      </div>
      <!-- 値：白地にピル -->
      <div class="flex">
        <div
          v-for="(cell, colIndex) in row"
          :key="cell.element"
          class="flex-1 text-center py-2"
          :class="{ 'border-l border-gray-200': colIndex > 0 }"
        >
          <span class="inline-block rounded px-4 py-0.5" :class="cell.colorClass">{{ cell.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
