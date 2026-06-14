<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
const iconUrl = computed(() => `${import.meta.env.BASE_URL}data/monster-icons/${props.no}.png`);

// 画像が無い／読み込めない場合は系統色のプレースホルダにフォールバックする
const failed = ref(false);
watch(
  () => props.no,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <img
    v-if="!failed"
    :src="iconUrl"
    :alt="lineage.label"
    :title="lineage.label"
    class="inline-block align-middle rounded object-contain"
    :class="sizeClass"
    @error="failed = true"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle leading-none"
    :class="[lineage.colorClass, sizeClass]"
    :title="lineage.label"
  >
    {{ no }}
  </span>
</template>
