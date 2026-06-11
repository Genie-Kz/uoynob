<script setup lang="ts">
import type { ResistanceCellView } from '@/presentation/resistanceCells';

defineProps<{ cells: ResistanceCellView[] }>();
</script>

<template>
  <!-- 3列。各セルは「耐性名（グレー背景）＝上 / 値（色付き）＝下」の縦積み（元サイト準拠） -->
  <div class="border rounded overflow-hidden">
    <div class="grid grid-cols-3">
      <div
        v-for="(cell, index) in cells"
        :key="cell.element"
        class="border-b"
        :class="{ 'border-l': index % 3 !== 0 }"
      >
        <div class="bg-gray-100 text-center text-xs py-1">{{ cell.element }}</div>
        <div class="text-center py-1" :class="cell.colorClass">
          <span>{{ cell.text }}</span>
          <span v-if="cell.note" class="block text-[11px] text-gray-600">{{ cell.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
