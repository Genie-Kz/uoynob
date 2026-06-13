<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <header class="relative text-center my-6">
    <h1 class="text-lg font-bold">
      <router-link :to="{ name: 'home' }" class="text-gray-800 hover:no-underline">Re:凡庸な イルルカSP</router-link>
    </h1>
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
