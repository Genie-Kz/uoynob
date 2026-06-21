<script setup lang="ts">
/** 「見出し＋ラベル/値」の2列を中央寄せで並べる汎用テーブル。基本情報の表示などに使う。 */
/** 1行ぶんのデータ（左にラベル、右に値）。 */
interface StatusRow {
  label: string;
  value: string | number;
}

defineProps<{
  /** 上部のグレー見出しバーに出すタイトル。 */
  title: string;
  /** 表示する行の配列。 */
  rows: StatusRow[];
}>();
</script>

<template>
  <!-- グレーの見出しバー＋ラベル/値を中央寄せ。中央に短い縦線、行間に余白のある横線。 -->
  <div class="border rounded overflow-hidden">
    <div class="bg-gray-100 font-bold px-3 py-2 border-b">{{ title }}</div>
    <div class="px-2 py-2">
      <template v-for="(row, index) in rows" :key="row.label">
        <div class="flex items-center">
          <div class="flex-1 text-center py-2">{{ row.label }}</div>
          <div class="h-5 w-px bg-gray-200"></div>
          <div class="flex-1 text-center py-2">{{ row.value }}</div>
        </div>
        <hr v-if="index < rows.length - 1" class="my-1 border-gray-200" />
      </template>
    </div>
  </div>
</template>
