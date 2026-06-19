<script setup lang="ts">
// モンスターのアイコン画像。画像が無ければ系統色のプレースホルダ（No.表示）に切り替える。
import { computed, ref, watch } from 'vue';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';

const props = withDefaults(
  defineProps<{
    lineage: string;
    no: string;
    // 表示サイズ。一覧では sm、詳細ヘッダーなどで lg を使う。
    size?: 'sm' | 'lg';
  }>(),
  { size: 'sm' },
);

// 系統情報（ラベル・色クラス）を引く。フォールバック表示の配色に使う。
const lineage = computed(() => lineageInfoOf(props.lineage));
const sizeClass = computed(() =>
  props.size === 'lg' ? 'w-12 h-12 text-base' : 'w-6 h-6 text-[11px]',
);
/** CLS を防ぐための intrinsic サイズ（px） */
const dimension = computed(() => (props.size === 'lg' ? 48 : 24));
// アイコン画像のパス。No. ごとに png/webp を配信している。
const iconBase = computed(() => `${import.meta.env.BASE_URL}data/monster-icons/${props.no}`);
const iconUrl = computed(() => `${iconBase.value}.png`);
const webpUrl = computed(() => `${iconBase.value}.webp`);

// 画像が無い／読み込めない場合は系統色のプレースホルダにフォールバックする
const failed = ref(false);
// No. が変わったらフォールバック状態を解除して、新しい画像の読み込みを試す。
watch(
  () => props.no,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <!-- 通常は webp 優先＋png フォールバックで画像表示。読み込み失敗時は @error で下のプレースホルダへ -->
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
  <!-- 画像が使えないときのフォールバック。系統色の背景に No. を表示する -->
  <span
    v-else
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle leading-none"
    :class="[lineage.colorClass, sizeClass]"
    :title="lineage.label"
  >
    {{ no }}
  </span>
</template>
