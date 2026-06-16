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
/** CLS を防ぐための intrinsic サイズ（px） */
const dimension = computed(() => (props.size === 'lg' ? 48 : 24));
const iconBase = computed(() => `${import.meta.env.BASE_URL}data/monster-icons/${props.no}`);
const iconUrl = computed(() => `${iconBase.value}.png`);
const webpUrl = computed(() => `${iconBase.value}.webp`);

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
  <picture v-if="!failed">
    <source :srcset="webpUrl" type="image/webp" />
    <img
      :src="iconUrl"
      :alt="lineage.label"
      :title="lineage.label"
      :width="dimension"
      :height="dimension"
      loading="lazy"
      decoding="async"
      class="inline-block align-middle rounded object-contain"
      :class="sizeClass"
      @error="failed = true"
    />
  </picture>
  <span
    v-else
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle leading-none"
    :class="[lineage.colorClass, sizeClass]"
    :title="lineage.label"
  >
    {{ no }}
  </span>
</template>
