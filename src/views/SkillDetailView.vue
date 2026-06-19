<script setup lang="ts">
// スキルの詳細ページ。スキル構成（覚える特技・特性）と、そのスキルを持つモンスターを表示する。
import { computed } from 'vue';
import { useSkills } from '@/composables/useSkills';
import { useMonsterList } from '@/composables/useMonsterList';
import { usePageSeo } from '@/composables/usePageSeo';
import { guardAbilityToElement } from '@/domain/skillAnalysis';
import { createMonsterIdResolver } from '@/domain/skillLookup';
import DataState from '@/shared/ui/DataState.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import DetailSkeleton from '@/shared/ui/DetailSkeleton.vue';

// URL の :id を受け取る。
const props = defineProps<{ id: string }>();

const { skills, isLoading, errorMessage } = useSkills();
const { monsters } = useMonsterList();

// id に一致するスキルを探す。無ければ null。
const skill = computed(() => skills.value?.find((candidate) => candidate.id === props.id) ?? null);

// 検索エンジン向けの説明文。構成は先頭5件だけ抜き出して並べる。
const seoDescription = computed(() => {
  const target = skill.value;
  if (!target) return null;
  const composition = target.composition
    .slice(0, 5)
    .map((item) => item.name)
    .join('、');
  return `イルルカSPのスキル「${target.name}」の構成、習得特技・特性、所持モンスター。主な構成：${composition}`;
});

usePageSeo(() => skill.value?.name, seoDescription);

// スキルデータのモンスター参照IDを、実際のモンスターIDへ解決する関数。
const resolveMonsterId = computed(() => createMonsterIdResolver(monsters.value ?? []));

// 構成項目が「耐性アップ系の特技」かどうか。バッジ表示の出し分けに使う。
function isGuardAbility(name: string): boolean {
  return guardAbilityToElement(name) !== null;
}
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: 'スキル', to: { name: 'skill-list' } },
        { label: skill?.name ?? '詳細' },
      ]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <DetailSkeleton :sections="2" />
      </template>
      <!-- id に該当するスキルが無い場合の案内 -->
      <div v-if="!skill" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        スキルが見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'skill-list' }" class="app-link">一覧へ戻る</router-link>
      </div>

      <!-- スキルが見つかった場合の本体 -->
      <div v-else>
        <div class="border rounded p-4 mb-4">
          <h2 class="text-xl font-bold">{{ skill.name }}</h2>
          <div class="mt-1 flex gap-1 text-xs">
            <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ skill.id }}</span>
            <span class="bg-sky-200 rounded px-2 py-0.5">{{ skill.category }}</span>
          </div>
        </div>

        <h3 class="text-lg font-bold mb-2">スキル構成</h3>
        <ul class="border rounded divide-y mb-4">
          <li
            v-for="(item, index) in skill.composition"
            :key="index"
            class="px-3 py-2 flex items-center gap-2"
          >
            <span>{{ item.name }}</span>
            <!-- 耐性アップ系の特技には「耐性+2」、特性には「特性」のバッジを付ける -->
            <span v-if="isGuardAbility(item.name)" class="bg-sky-200 rounded px-1.5 py-0.5 text-xs"
              >耐性+2</span
            >
            <span
              v-else-if="item.type === 'attribute'"
              class="bg-gray-100 rounded px-1.5 py-0.5 text-xs"
              >特性</span
            >
          </li>
        </ul>

        <h3 class="text-lg font-bold mb-2">
          このスキルを持つモンスター
          <span class="text-sm text-gray-500 font-normal">{{ skill.monsters.length }} 体</span>
        </h3>
        <div class="flex flex-wrap gap-1">
          <!-- モンスターIDが解決できたものはリンク、できなければただのタグ表示にする -->
          <template v-for="monsterRef in skill.monsters" :key="monsterRef.id">
            <router-link
              v-if="resolveMonsterId(monsterRef.id)"
              :to="{ name: 'monster-detail', params: { id: resolveMonsterId(monsterRef.id) } }"
              class="tag-link app-link"
            >
              {{ monsterRef.name }}
            </router-link>
            <span v-else class="tag-link text-gray-600">{{ monsterRef.name }}</span>
          </template>
          <span v-if="!skill.monsters.length" class="text-gray-500">なし</span>
        </div>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: 'スキル', to: { name: 'skill-list' } },
        { label: skill?.name ?? '詳細' },
      ]"
      class="mt-6"
    />
  </div>
</template>
