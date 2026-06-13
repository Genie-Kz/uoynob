<script setup lang="ts">
import { computed } from 'vue';
import type { PickupRef } from '@/types/pickup';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useAsyncData } from '@/composables/useAsyncData';
import { loadPickups } from '@/api/datasets';
import { createMonsterIdResolver } from '@/domain/skillLookup';
import { groupPickupSkills } from '@/domain/pickupGrouping';
import DataState from '@/components/DataState.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';

const props = defineProps<{ pickupKey: string }>();

const { data: pickups, isLoading, errorMessage } = useAsyncData(loadPickups);
const { monsters } = useMonsters();
const { skills } = useSkills();

const entry = computed(() => pickups.value?.[props.pickupKey] ?? null);
const resolveMonsterId = computed(() => createMonsterIdResolver(monsters.value ?? []));

/** スキル系ピックアップを目的別に分類したグループ（対象外は null） */
const skillGroups = computed(() => {
  const target = entry.value;
  if (!target || target.type !== 'skills' || !skills.value) return null;
  return groupPickupSkills(props.pickupKey, target.items, skills.value);
});

function totalCount(): number {
  const target = entry.value;
  if (!target) return 0;
  if (target.type === 'monster-groups') return target.groups.reduce((sum, group) => sum + group.items.length, 0);
  return target.items.length;
}

function monsterRoute(ref: PickupRef) {
  const resolved = resolveMonsterId.value(ref.id);
  return resolved ? { name: 'monster-detail', params: { id: resolved } } : null;
}
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: entry?.title ?? 'ピックアップ' }]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <div v-if="!entry" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        ピックアップが見つかりませんでした（{{ pickupKey }}）。
        <router-link :to="{ name: 'home' }" class="app-link">ホームへ戻る</router-link>
      </div>

      <div v-else>
        <h2 class="text-xl font-bold mb-1">{{ entry.title }}</h2>
        <p class="text-sm text-gray-500 mb-3">{{ totalCount() }} 件</p>

        <!-- スキル一覧（目的別に分類） -->
        <div v-if="entry.type === 'skills' && skillGroups">
          <section v-for="group in skillGroups" :key="group.label" class="mb-5">
            <h3 class="text-lg font-bold mb-2">{{ group.label }}</h3>
            <div class="flex flex-wrap gap-1">
              <router-link
                v-for="ref in group.items"
                :key="ref.id + ref.name"
                :to="{ name: 'skill-detail', params: { id: ref.id } }"
                class="tag-link app-link"
              >
                {{ ref.name }}
              </router-link>
              <span v-if="!group.items.length" class="text-gray-500">なし</span>
            </div>
          </section>
        </div>

        <!-- スキル一覧（分類なし） -->
        <div v-else-if="entry.type === 'skills'" class="flex flex-wrap gap-1">
          <router-link
            v-for="ref in entry.items"
            :key="ref.id"
            :to="{ name: 'skill-detail', params: { id: ref.id } }"
            class="tag-link app-link"
          >
            {{ ref.name }}
          </router-link>
        </div>

        <!-- モンスター一覧 -->
        <div v-else-if="entry.type === 'monsters'" class="flex flex-wrap gap-1">
          <template v-for="ref in entry.items" :key="ref.id">
            <router-link v-if="monsterRoute(ref)" :to="monsterRoute(ref)!" class="tag-link app-link">
              {{ ref.name }}
            </router-link>
            <span v-else class="tag-link text-gray-600">{{ ref.name }}</span>
          </template>
        </div>

        <!-- グループ分けされたモンスター一覧（れんぞく回数など） -->
        <div v-else>
          <section v-for="group in entry.groups" :key="group.label" class="mb-5">
            <h3 class="text-lg font-bold mb-2">{{ group.label }}</h3>
            <div class="flex flex-wrap gap-1">
              <template v-for="ref in group.items" :key="ref.id">
                <router-link v-if="monsterRoute(ref)" :to="monsterRoute(ref)!" class="tag-link app-link">
                  {{ ref.name }}
                </router-link>
                <span v-else class="tag-link text-gray-600">{{ ref.name }}</span>
              </template>
              <span v-if="!group.items.length" class="text-gray-500">なし</span>
            </div>
          </section>
        </div>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: entry?.title ?? 'ピックアップ' }]"
      class="mt-6"
    />
  </div>
</template>
