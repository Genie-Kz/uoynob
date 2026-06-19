<script setup lang="ts">
// 非同期データの読み込み状態（読み込み中 / エラー / 成功）を出し分ける薄いラッパー。
// 各画面はこのコンポーネントで本文を包むだけで、状態ごとの表示を共通化できる。
// 読み込み中はスケルトンを表示し、実コンテンツに切り替わるときのガタつき（CLS）を抑える。
import Skeleton from '@/shared/ui/Skeleton.vue';

defineProps<{
  // 読み込み中かどうか。true の間はローディング表示を出す。
  isLoading: boolean;
  // エラーメッセージ。null 以外なら成功表示の代わりにエラーを出す。
  errorMessage: string | null;
}>();
</script>

<template>
  <!-- 読み込み中：スケルトン表示。role=status で読み上げにも対応する -->
  <div v-if="isLoading" role="status" aria-busy="true">
    <span class="sr-only">読み込み中…</span>
    <!-- ページ固有のスケルトンは #skeleton スロットで差し替える。
         未指定時は、見出し＋数ブロックの汎用スケルトンを表示する。 -->
    <slot name="skeleton">
      <div class="space-y-3 py-2">
        <Skeleton class="h-6 w-1/3" />
        <Skeleton class="h-28 w-full" />
        <Skeleton class="h-28 w-full" />
        <Skeleton class="h-28 w-full" />
      </div>
    </slot>
  </div>
  <!-- エラー時 -->
  <div v-else-if="errorMessage" class="border border-red-300 bg-red-50 text-red-700 rounded p-3">
    {{ errorMessage }}
  </div>
  <!-- 成功時はデフォルトスロット（本文）を表示する -->
  <slot v-else />
</template>
