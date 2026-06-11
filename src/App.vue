<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import SideNav from '@/components/SideNav.vue';
</script>

<template>
  <AppHeader />
  <main class="max-w-screen-xl mx-auto px-3">
    <div class="lg:grid lg:grid-cols-12 lg:gap-6">
      <aside class="order-2 lg:order-1 lg:col-span-3">
        <SideNav />
      </aside>
      <div class="order-1 lg:order-2 lg:col-span-9">
        <router-view v-slot="{ Component, route }">
          <transition name="route-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </div>
  </main>
  <AppFooter />
</template>
