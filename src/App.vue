<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/shared/ui/AppHeader.vue';
import AppFooter from '@/shared/ui/AppFooter.vue';
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import { DEFAULT_DESCRIPTION, usePageSeo } from '@/composables/usePageSeo';

const route = useRoute();
const isHome = computed(() => route.name === 'home');
const useComfortableContent = computed(() => route.name !== 'home' && route.name !== 'simulator-build');
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : null));
const pageDescription = computed(() =>
  typeof route.meta.description === 'string' ? route.meta.description : DEFAULT_DESCRIPTION,
);

usePageSeo(pageTitle, pageDescription);
</script>

<template>
  <AppHeader />
  <main class="max-w-[1536px] mx-auto px-3">
    <router-view v-slot="{ Component, route }">
      <div :class="{ 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] xl:gap-6': !isHome }">
        <aside v-if="!isHome" class="hidden xl:block">
          <div class="sticky top-3">
            <SiteNavigation />
          </div>
        </aside>

        <div
          class="min-w-0"
          :class="{ 'px-1 py-2 sm:px-3 lg:px-4': useComfortableContent }"
        >
          <transition name="route-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>

          <div v-if="!isHome" class="mt-6 xl:hidden">
            <SiteNavigation />
          </div>
        </div>
      </div>
    </router-view>
  </main>
  <AppFooter />
</template>
