<script setup lang="ts">
defineProps<{
  isLoading: boolean;
  errorMessage: string | null;
}>();
</script>

<template>
  <p v-if="isLoading" class="text-gray-500 py-4">読み込み中…</p>
  <div v-else-if="errorMessage" class="border border-red-300 bg-red-50 text-red-700 rounded p-3">
    {{ errorMessage }}
  </div>
  <slot v-else />
</template>
