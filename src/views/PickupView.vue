<script setup lang="ts">
// ピックアップ（特集）ページ。スキル/モンスター/グループ分けの特集を、種類に応じて表示する。
import { computed } from 'vue';
import type { PickupRef } from '@/types/pickup';
import type { MonsterListItem } from '@/types/monster';
import { useMonsterList } from '@/composables/useMonsterList';
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
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import DetailSkeleton from '@/shared/ui/DetailSkeleton.vue';

const props = defineProps<{ pickupKey: string }>();

const { data: pickups, isLoading, errorMessage } = useAsyncData(loadPickups);
const { monsters } = useMonsterList();
const { skills } = useSkills();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

// URL のキー（例: skill-killer）に対応する特集エントリ。無ければ null。
const entry = computed(() => pickups.value?.[props.pickupKey] ?? null);
// 特集データのモンスター参照IDを、実際のモンスターIDへ解決する関数。
const resolveMonsterId = computed(() => createMonsterIdResolver(monsters.value ?? []));

/** スキル系ピックアップを目的別に分類したグループ（対象外は null） */
const skillGroups = computed(() => {
  const target = entry.value;
  if (!target || target.type !== 'skills' || !skills.value) return null;
  return groupPickupSkills(props.pickupKey, target.items, skills.value);
});
// スキルグループに表示用アイコンを付けたビュー。
const skillGroupViews = computed(() =>
  createPickupSkillGroupViews(props.pickupKey, skillGroups.value, monsters.value ?? []),
);

// 特集の総件数。グループ分け型は全グループの合計、それ以外は items の件数。
function totalCount(): number {
  const target = entry.value;
  if (!target) return 0;
  if (target.type === 'monster-groups')
    return target.groups.reduce((sum, group) => sum + group.items.length, 0);
  return target.items.length;
}

const seoDescription = computed(() => {
  const target = entry.value;
  if (!target) return null;
  return `イルルカSPの${target.title}を分類別に探せるピックアップ一覧。全${totalCount()}件を収録。`;
});

usePageSeo(() => entry.value?.title, seoDescription);

// id からモンスターを引くための索引（Map）。
const monsterById = computed(
  () => new Map((monsters.value ?? []).map((monster) => [monster.id, monster])),
);

// 特集の参照から、対応するモンスター（無ければ null）を返す。
function monsterOf(ref: PickupRef): MonsterListItem | null {
  return pickupMonsterByRef(ref, resolveMonsterId.value, monsterById.value);
}

// 特集の参照から、モンスター詳細へのルートを返す。
function monsterRoute(ref: PickupRef) {
  return pickupMonsterRoute(ref, resolveMonsterId.value);
}

// パラメータ上昇スキルの表示名から「[+N]」の上昇量表記を切り離して、スキル名だけを返す。
function paramSkillName(name: string): string {
  return name.replace(/\s*\[\+\d+\]$/, '');
}
// 表示名末尾の「[+N]」から上昇量（"+N"）を取り出す。テーブルの上昇量列に使う。
function paramSkillAmount(name: string): string {
  return name.match(/\[(\+\d+)\]$/)?.[1] ?? '';
}

// グループ見出しの要素ID（ページ内ジャンプの対象）。
function groupId(index: number): string {
  return `pickup-group-${index}`;
}

// 指定グループの見出しまでスムーズスクロールする（目次クリック時）。
function scrollToGroup(index: number): void {
  document.getElementById(groupId(index))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: entry?.title ?? 'ピックアップ' },
      ]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <DetailSkeleton :sections="3" />
      </template>
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
                <MonsterIcon
                  v-if="group.iconMonster"
                  :lineage="group.iconMonster.系統"
                  :no="group.iconMonster.no"
                />
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
              <MonsterIcon
                v-if="group.iconMonster"
                :lineage="group.iconMonster.系統"
                :no="group.iconMonster.no"
                size="lg"
              />
              {{ group.label }}
            </h3>
            <!-- パラメータ上昇スキルは、上昇量の高い順に1行ずつ並ぶテーブルで表示する
                 （横並びだと視線が左右に動き、高い順に上から下へ追えないため） -->
            <div
              v-if="pickupKey === 'skill-parameter-up'"
              class="overflow-hidden rounded-lg border"
            >
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="table-header-row">
                    <th scope="col" class="px-3 py-2 font-semibold text-left">スキル</th>
                    <th scope="col" class="px-3 py-2 font-semibold text-right whitespace-nowrap">
                      上昇量
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="ref in group.items"
                    :key="ref.id + ref.name"
                    class="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td class="px-3 py-2">
                      <router-link
                        :to="{ name: 'skill-detail', params: { id: ref.id } }"
                        class="app-link"
                      >
                        {{ paramSkillName(ref.name) }}
                      </router-link>
                    </td>
                    <td class="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {{ paramSkillAmount(ref.name) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- それ以外の分類は横並びのタグで表示する -->
            <div v-else class="flex flex-wrap gap-1">
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
              <MonsterIcon
                v-if="monsterOf(ref)"
                :lineage="monsterOf(ref)!.系統"
                :no="monsterOf(ref)!.no"
              />
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
                  <MonsterIcon
                    v-if="monsterOf(ref)"
                    :lineage="monsterOf(ref)!.系統"
                    :no="monsterOf(ref)!.no"
                  />
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
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: entry?.title ?? 'ピックアップ' },
      ]"
      class="mt-6"
    />
  </div>
</template>
