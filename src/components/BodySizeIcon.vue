<script setup lang="ts">
import { computed } from 'vue';
import type { BodySize } from '@/types/monster';
import { BODY_SIZE_ICON } from '@/constants/bodySizeIcons';

const props = defineProps<{
  size: BodySize;
}>();

const bodySizeLabel = computed(() => {
  if (props.size === 'スタンダードボディ') return 'S';
  if (props.size === 'スモールボディ') return 's';
  return null;
});

const bodySizeBadgeClass = computed(() => {
  if (props.size === 'スタンダードボディ') {
    return 'body-size-badge-standard';
  }
  if (props.size === 'スモールボディ') {
    return 'body-size-badge-small';
  }
  return '';
});
</script>

<template>
  <span
    v-if="bodySizeLabel"
    :title="size"
    :aria-label="size"
    class="body-size-badge"
    :class="bodySizeBadgeClass"
  >
    {{ bodySizeLabel }}
  </span>
  <img
    v-else
    :src="BODY_SIZE_ICON[size]"
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
  border: 1px solid #1f1f1f;
  font-size: 22px;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 1000;
  line-height: 0.9;
  vertical-align: middle;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 0.22), transparent 42%),
    radial-gradient(circle at 68% 70%, rgb(255 255 255 / 0.18), transparent 34%),
    linear-gradient(180deg, #2a2a2a 0%, #0d0d0d 100%);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.18),
    inset 0 -2px 2px rgb(0 0 0 / 0.65),
    0 0 0 1px rgb(0 0 0 / 0.25);
  -webkit-text-stroke: 0.6px #ffffff;
  text-rendering: geometricPrecision;
}

.body-size-badge-standard {
  color: #e3c03b;
  text-shadow:
    0 0 1px #4f3600,
    0 0 3px #f6d94b,
    1px 1px 0 #4f3600;
}

.body-size-badge-small {
  color: #80c846;
  text-shadow:
    0 0 1px #1e3900,
    0 0 3px #aef15c,
    1px 1px 0 #1e3900;
}
</style>
