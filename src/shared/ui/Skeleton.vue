<script setup lang="ts">
/**
 * 読み込み中のプレースホルダ（スケルトン）の基本部品。
 * 大きさは利用側から class（h-4 / w-1/2 など）で指定する。ダークモードは bg-gray-200 の
 * ダーク上書きでそのまま追従する。
 */
defineOptions({ name: 'UiSkeleton' });
</script>

<template>
  <div class="animate-pulse rounded bg-gray-200" aria-hidden="true"></div>
</template>
