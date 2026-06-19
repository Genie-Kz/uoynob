<script setup lang="ts">
// ボディサイズを表すアイコン。スタンダード/スモールは文字バッジ、それ以外（メガ等）は画像で表示する。
import { computed } from 'vue';
import type { BodySize } from '@/types/monster';
import { BODY_SIZE_ICON } from '@/shared/icons/bodySizeIcons';

const props = defineProps<{
  size: BodySize;
}>();

// 文字バッジで表すサイズのラベル（スタンダード=S、スモール=s）。画像表示するサイズは null。
const bodySizeLabel = computed(() => {
  if (props.size === 'スタンダードボディ') return 'S';
  if (props.size === 'スモールボディ') return 's';
  return null;
});

// 文字バッジの配色クラス。スタンダードとスモールで色を変える。
const bodySizeBadgeClass = computed(() => {
  if (props.size === 'スタンダードボディ') {
    return 'body-size-badge-standard';
  }
  if (props.size === 'スモールボディ') {
    return 'body-size-badge-small';
  }
  return '';
});

// 画像で表すサイズ（メガ・ギガ・超ギガ）のアイコン画像。無ければ null。
const bodySizeImage = computed(() => BODY_SIZE_ICON[props.size] ?? null);
</script>

<template>
  <!-- 文字バッジで表すサイズ（スタンダード/スモール） -->
  <span
    v-if="bodySizeLabel"
    :title="size"
    :aria-label="size"
    class="body-size-badge"
    :class="bodySizeBadgeClass"
  >
    {{ bodySizeLabel }}
  </span>
  <!-- 画像で表すサイズ（メガ・ギガ・超ギガ） -->
  <img
    v-else-if="bodySizeImage"
    :src="bodySizeImage"
    :alt="size"
    :title="size"
    class="inline-block size-[22px] max-w-none object-cover align-middle"
  />
</template>

<style scoped>
.body-size-badge {
  display: inline-flex;
  width: 22px;
  height: 22px;
  max-width: none;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 800;
  line-height: 0.9;
  vertical-align: middle;
  text-rendering: geometricPrecision;
}

.body-size-badge-standard {
  background-color: #5a4300;
  color: #fff1a8;
}

.body-size-badge-small {
  background-color: #245c00;
  color: #d8ffb0;
}
</style>
