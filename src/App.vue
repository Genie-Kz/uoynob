<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { DEFAULT_DESCRIPTION, usePageSeo } from '@/composables/usePageSeo';

const route = useRoute();
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : null));
const pageDescription = computed(() =>
  typeof route.meta.description === 'string' ? route.meta.description : DEFAULT_DESCRIPTION,
);

usePageSeo(pageTitle, pageDescription);
</script>

<template>
  <AppHeader />
  <main class="max-w-5xl mx-auto px-3">
    <router-view v-slot="{ Component, route }">
      <transition name="route-fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </main>
  <AppFooter />
</template>
