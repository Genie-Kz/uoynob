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
  <!-- グレーの見出しバー＋3列。耐性名はグレー帯、値はテキストの周りだけ色付き（ピル）。罫線は余白を持たせる。 -->
  <div class="border rounded overflow-hidden">
    <div v-if="title" class="bg-gray-100 font-bold px-3 py-2 border-b">{{ title }}</div>
    <div class="px-2 py-2">
      <template v-for="(row, rowIndex) in rows" :key="rowIndex">
        <div class="flex">
          <div
            v-for="(cell, colIndex) in row"
            :key="cell.element"
            class="flex-1 px-2"
            :class="{ 'border-l border-gray-200': colIndex > 0 }"
          >
            <div class="bg-gray-100 text-center text-xs py-1 rounded-sm">{{ cell.element }}</div>
            <hr class="my-1 border-gray-200" />
            <div class="text-center py-1">
              <span class="inline-block rounded px-4 py-0.5" :class="cell.colorClass">{{ cell.text }}</span>
            </div>
          </div>
        </div>
        <hr v-if="rowIndex < rows.length - 1" class="my-2 border-gray-200" />
      </template>
    </div>
  </div>
</template>
