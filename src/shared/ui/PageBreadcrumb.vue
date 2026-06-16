<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;
}

defineProps<{ items: BreadcrumbItem[] }>();
</script>

<template>
  <nav aria-label="breadcrumb" class="text-sm text-gray-500 my-3">
    <ol class="flex flex-wrap items-center gap-1">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1">
        <span v-if="index > 0" class="text-gray-300">/</span>
        <router-link v-if="item.to" :to="item.to" class="app-link">{{ item.label }}</router-link>
        <span v-else class="text-gray-700">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
