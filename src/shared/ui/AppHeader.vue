<script setup lang="ts">
// 全ページ共通のヘッダー。サイトタイトルと、ライト/ダークの切り替えボタンを表示する。
import { useTheme } from '@/composables/useTheme';

// 現在のテーマと、その切り替え関数を取得する。
const { theme, toggleTheme } = useTheme();
</script>

<template>
  <header class="relative text-center my-6">
    <!-- サイトタイトル（クリックでホームへ） -->
    <h1 class="text-lg font-bold">
      <router-link :to="{ name: 'home' }" class="app-link">Re:凡庸な イルルカSP</router-link>
    </h1>
    <!-- テーマ切り替えボタン。現在がダークなら太陽、ライトなら月を表示する -->
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
      :aria-label="theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
      :title="theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
      @click="toggleTheme"
    >
      {{ theme === 'dark' ? '☀️' : '🌙' }}
    </button>
  </header>
</template>
