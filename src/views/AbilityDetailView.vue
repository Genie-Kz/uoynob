<script setup lang="ts">
import { computed } from 'vue';
import { useAbilities } from '@/composables/useAbilities';
import { usePageSeo } from '@/composables/usePageSeo';
import DataState from '@/components/DataState.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';

const props = defineProps<{ id: string }>();

const { abilities, isLoading, errorMessage } = useAbilities();
const ability = computed(() => abilities.value?.find((candidate) => candidate.id === props.id) ?? null);

const seoDescription = computed(() => {
  const target = ability.value;
  if (!target) return null;
  const description = target.description.replace(/\s+/g, ' ').trim();
  return `イルルカSPの特技「${target.name}」の効果と、この特技を覚えるスキル。${description}`;
});

usePageSeo(() => ability.value?.name, seoDescription);
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: '特技', to: { name: 'ability-list' } },
        { label: ability?.name ?? '詳細' },
      ]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <div v-if="!ability" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        特技が見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'ability-list' }" class="app-link">一覧へ戻る</router-link>
      </div>

      <div v-else>
        <div class="border rounded p-4 mb-4">
          <h2 class="text-xl font-bold">{{ ability.name }}</h2>
          <div class="mt-1 flex gap-1 text-xs">
            <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ ability.id }}</span>
            <span class="bg-sky-200 rounded px-2 py-0.5">{{ ability.category }}</span>
          </div>
        </div>

        <h3 class="text-lg font-bold mb-2">説明</h3>
        <p class="whitespace-pre-wrap mb-4">{{ ability.description }}</p>

        <h3 class="text-lg font-bold mb-2">
          この特技を覚えるスキル
          <span class="text-sm text-gray-500 font-normal">{{ ability.skills.length }} 件</span>
        </h3>
        <div class="flex flex-wrap gap-1">
          <router-link
            v-for="skillRef in ability.skills"
            :key="skillRef.id"
            :to="{ name: 'skill-detail', params: { id: skillRef.id } }"
            class="tag-link app-link"
          >
            {{ skillRef.name }}
          </router-link>
          <span v-if="!ability.skills.length" class="text-gray-500">なし</span>
        </div>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: '特技', to: { name: 'ability-list' } },
        { label: ability?.name ?? '詳細' },
      ]"
      class="mt-6"
    />
  </div>
</template>
