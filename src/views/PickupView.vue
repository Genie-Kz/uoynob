<script setup lang="ts">
import { computed } from 'vue';
import type { PickupRef } from '@/types/pickup';
import type { Monster } from '@/types/monster';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useAsyncData } from '@/composables/useAsyncData';
import { usePageSeo } from '@/composables/usePageSeo';
import { loadPickups } from '@/shared/data/datasets';
import { createMonsterIdResolver } from '@/domain/skillLookup';
import { groupPickupSkills } from '@/domain/pickupGrouping';
import {
  createPickupSkillGroupViews,
  pickupMonsterByRef,
  pickupMonsterRoute,
} from '@/features/pickup/pickupViewModel';
import DataState from '@/shared/ui/DataState.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

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
const skillGroupViews = computed(() =>
  createPickupSkillGroupViews(props.pickupKey, skillGroups.value, monsters.value ?? []),
);

function totalCount(): number {
  const target = entry.value;
  if (!target) return 0;
  if (target.type === 'monster-groups') return target.groups.reduce((sum, group) => sum + group.items.length, 0);
  return target.items.length;
}

const seoDescription = computed(() => {
  const target = entry.value;
  if (!target) return null;
  return `イルルカSPの${target.title}を分類別に探せるピックアップ一覧。全${totalCount()}件を収録。`;
});

usePageSeo(() => entry.value?.title, seoDescription);

const monsterById = computed(() => new Map((monsters.value ?? []).map((monster) => [monster.id, monster])));

function monsterOf(ref: PickupRef): Monster | null {
  return pickupMonsterByRef(ref, resolveMonsterId.value, monsterById.value);
}

function monsterRoute(ref: PickupRef) {
  return pickupMonsterRoute(ref, resolveMonsterId.value);
}

function groupId(index: number): string {
  return `pickup-group-${index}`;
}

function scrollToGroup(index: number): void {
  document.getElementById(groupId(index))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <p class="text-muted mb-3">{{ totalCount() }} 件</p>

        <!-- スキル一覧（目的別に分類） -->
        <div v-if="entry.type === 'skills' && skillGroupViews">
          <nav aria-label="分類へのリンク" class="surface-muted p-3 mb-5">
            <p class="text-sm font-bold mb-2">分類から探す</p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="(group, index) in skillGroupViews"
                :key="group.label"
                :href="`#${groupId(index)}`"
                class="tag-link app-link bg-white inline-flex items-center gap-1"
                @click.prevent="scrollToGroup(index)"
              >
                <MonsterIcon v-if="group.iconMonster" :lineage="group.iconMonster.系統" :no="group.iconMonster.no" />
                {{ group.label }}
              </a>
            </div>
          </nav>

          <section
            v-for="(group, index) in skillGroupViews"
            :id="groupId(index)"
            :key="group.label"
            class="mb-5 scroll-mt-3"
          >
            <h3 class="text-lg font-bold mb-2 inline-flex items-center gap-2">
              <MonsterIcon v-if="group.iconMonster" :lineage="group.iconMonster.系統" :no="group.iconMonster.no" size="lg" />
              {{ group.label }}
            </h3>
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
            <router-link
              v-if="monsterRoute(ref)"
              :to="monsterRoute(ref)!"
              class="tag-link app-link inline-flex items-center gap-1"
            >
              <MonsterIcon v-if="monsterOf(ref)" :lineage="monsterOf(ref)!.系統" :no="monsterOf(ref)!.no" />
              {{ ref.name }}
            </router-link>
            <span v-else class="tag-link text-gray-600">{{ ref.name }}</span>
          </template>
        </div>

        <!-- グループ分けされたモンスター一覧（れんぞく回数など） -->
        <div v-else>
          <nav aria-label="分類へのリンク" class="surface-muted p-3 mb-5">
            <p class="text-sm font-bold mb-2">分類から探す</p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="(group, index) in entry.groups"
                :key="group.label"
                :href="`#${groupId(index)}`"
                class="tag-link app-link bg-white"
                @click.prevent="scrollToGroup(index)"
              >
                {{ group.label }}
              </a>
            </div>
          </nav>

          <section
            v-for="(group, index) in entry.groups"
            :id="groupId(index)"
            :key="group.label"
            class="mb-5 scroll-mt-3"
          >
            <h3 class="text-lg font-bold mb-2">{{ group.label }}</h3>
            <div class="flex flex-wrap gap-1">
              <template v-for="ref in group.items" :key="ref.id">
                <router-link
                  v-if="monsterRoute(ref)"
                  :to="monsterRoute(ref)!"
                  class="tag-link app-link inline-flex items-center gap-1"
                >
                  <MonsterIcon v-if="monsterOf(ref)" :lineage="monsterOf(ref)!.系統" :no="monsterOf(ref)!.no" />
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
