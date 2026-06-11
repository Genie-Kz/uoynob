<script setup lang="ts">
import { computed } from 'vue';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';

const props = withDefaults(
  defineProps<{
    lineage: string;
    no: string;
    size?: 'sm' | 'lg';
  }>(),
  { size: 'sm' },
);

const lineage = computed(() => lineageInfoOf(props.lineage));
const sizeClass = computed(() =>
  props.size === 'lg' ? 'w-12 h-12 text-base' : 'w-6 h-6 text-[11px]',
);
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle leading-none"
    :class="[lineage.colorClass, sizeClass]"
    :title="lineage.label"
  >
    {{ no }}
  </span>
</template>
