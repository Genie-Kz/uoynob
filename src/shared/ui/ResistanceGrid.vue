<script setup lang="ts">
/** 耐性を3列グリッドで表示するコンポーネント。図鑑とビルド結果で同じ見た目を共有する。 */
import { computed } from 'vue';
import type { ResistanceCellView } from '@/presentation/resistanceCells';

const props = defineProps<{
  /** 表示する耐性セルの配列（3列ずつの行に分割される）。 */
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
  <!-- グレーの見出しバー＋3列。耐性名は横に連続したグレー帯、値はテキストの周りだけ色付き（ピル）。
       縦線・横線は隙間を空けて互いに繋げず、全体に余白を持たせる。 -->
  <div class="border rounded overflow-hidden">
    <div v-if="title" class="bg-gray-100 font-bold px-3 py-2 border-b">{{ title }}</div>
    <div class="p-3">
      <template v-for="(row, rowIndex) in rows" :key="rowIndex">
        <!-- 耐性名：横に連続したグレー帯（間は短い縦線で区切る） -->
        <div class="flex bg-gray-100">
          <div
            v-for="(cell, colIndex) in row"
            :key="cell.element"
            class="flex-1 text-center text-xs py-1.5"
            :class="{ 'border-l border-gray-200': colIndex > 0 }"
          >
            {{ cell.element }}
          </div>
        </div>
        <!-- 値：白地にピル（グレー帯とは間隔をあける＝縦線が繋がらない） -->
        <div class="flex mt-2">
          <div
            v-for="(cell, colIndex) in row"
            :key="cell.element"
            class="flex-1 text-center py-1"
            :class="{ 'border-l border-gray-200': colIndex > 0 }"
          >
            <span class="inline-block rounded px-4 py-0.5" :class="cell.colorClass">{{
              cell.text
            }}</span>
          </div>
        </div>
        <!-- 行間の横線（上下に余白をとり、縦線とは繋げない） -->
        <hr v-if="rowIndex < rows.length - 1" class="my-3 border-gray-200" />
      </template>
    </div>
  </div>
</template>
