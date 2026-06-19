<script setup lang="ts">
// 非同期データの読み込み状態（読み込み中 / エラー / 成功）を出し分ける薄いラッパー。
// 各画面はこのコンポーネントで本文を包むだけで、状態ごとの表示を共通化できる。
defineProps<{
  // 読み込み中かどうか。true の間はローディング表示を出す。
  isLoading: boolean;
  // エラーメッセージ。null 以外なら成功表示の代わりにエラーを出す。
  errorMessage: string | null;
}>();
</script>

<template>
  <!-- 読み込み中 -->
  <p v-if="isLoading" class="text-gray-500 py-4">読み込み中…</p>
  <!-- エラー時 -->
  <div v-else-if="errorMessage" class="border border-red-300 bg-red-50 text-red-700 rounded p-3">
    {{ errorMessage }}
  </div>
  <!-- 成功時はデフォルトスロット（本文）を表示する -->
  <slot v-else />
</template>
