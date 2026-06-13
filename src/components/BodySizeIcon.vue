<script setup lang="ts">
import type { BodySize } from '@/types/monster';
import { BODY_SIZE_ICON } from '@/constants/bodySizeIcons';

defineProps<{
  size: BodySize;
}>();
</script>

<template>
  <img
    :src="BODY_SIZE_ICON[size]"
    :alt="size"
    :title="size"
    class="inline-block size-[22px] max-w-none object-cover align-middle"
  />
</template>
