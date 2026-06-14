<script setup lang="ts">
defineProps<{
  traits: string[];
}>();
</script>

<template>
  <div v-if="traits.length" class="mb-5">
    <h3 class="text-lg font-bold mb-2">不利な特性</h3>
    <ul class="border rounded divide-y">
      <li v-for="trait in traits" :key="trait" class="px-3 py-2">
        {{ trait }}
      </li>
    </ul>
  </div>
</template>
