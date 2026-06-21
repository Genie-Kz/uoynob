<script setup lang="ts">
/** パンくずリスト。各画面の上部・下部に「ホーム / … / 現在地」の階層を表示する。 */
import type { RouteLocationRaw } from 'vue-router';

/** パンくず1項目。to があればリンク、無ければ現在地（末尾）として文字表示する。 */
interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;
}

defineProps<{
  /** 先頭から現在地までの階層項目。 */
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav aria-label="breadcrumb" class="text-sm text-gray-500 my-3">
    <ol class="flex flex-wrap items-center gap-1">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1">
        <!-- 2項目目以降は区切りのスラッシュを前に置く -->
        <span v-if="index > 0" class="text-gray-300">/</span>
        <!-- to があればリンク、無ければ現在地としてただの文字で表示 -->
        <router-link v-if="item.to" :to="item.to" class="app-link">{{ item.label }}</router-link>
        <span v-else class="text-gray-700">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
