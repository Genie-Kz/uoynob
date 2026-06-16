<script setup lang="ts">
defineProps<{
  traits: string[];
  showSp?: boolean;
  spTraits?: string[];
  spAvailableTraits?: string[];
}>();

defineEmits<{
  toggleSp: [trait: string];
}>();
</script>

<template>
  <div v-if="traits.length" class="mb-5">
    <h3 class="text-lg font-bold mb-2">不利な特性</h3>
    <ul class="border rounded divide-y">
      <li
        v-for="trait in traits"
        :key="trait"
        class="flex items-center justify-between gap-2 px-3 py-2"
      >
        <span>{{ trait }}</span>
        <span v-if="showSp" class="flex items-center gap-2">
          <button
            v-if="spAvailableTraits?.includes(trait)"
            type="button"
            class="rounded border px-3 py-1 text-sm font-semibold"
            :class="
              spTraits?.includes(trait)
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-300 text-gray-500'
            "
            @click="$emit('toggleSp', trait)"
          >
            SP
          </button>
          <span v-else class="w-[42px]" aria-hidden="true"></span>
          <span class="btn-outline-primary invisible" aria-hidden="true">選択</span>
        </span>
      </li>
    </ul>
  </div>
</template>
