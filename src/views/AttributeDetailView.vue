<script setup lang="ts">
/** 特性の詳細ページ。効果説明（通常／SP）と、その特性を持つモンスター・スキルを表示する。 */
import { computed } from 'vue';
import { useAttributes } from '@/composables/useAttributes';
import { useMonsterList } from '@/composables/useMonsterList';
import { usePageSeo } from '@/composables/usePageSeo';
import DataState from '@/shared/ui/DataState.vue';
import MonsterRefTags from '@/shared/ui/MonsterRefTags.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import DetailSkeleton from '@/shared/ui/DetailSkeleton.vue';

/** URL の :id を受け取る。 */
const props = defineProps<{ id: string }>();

const { attributes, isLoading, errorMessage } = useAttributes();
const { monsters } = useMonsterList();

/** id に一致する特性を探す。無ければ null。 */
const attribute = computed(
  () => attributes.value?.find((candidate) => candidate.id === props.id) ?? null,
);

/** SP 説明を表示すべきか。SP 特性が無い旨のプレースホルダ文言なら表示しない。 */
const hasSpDescription = computed(
  () =>
    !!attribute.value?.descriptionSp &&
    !attribute.value.descriptionSp.includes('ＳＰ特性は　ありません'),
);

/** 検索エンジン向けの説明文を組み立てる。 */
const seoDescription = computed(() => {
  const target = attribute.value;
  if (!target) return null;
  const description = target.description.replace(/\s+/g, ' ').trim();
  return `イルルカSPの特性「${target.name}」の効果、SP効果、所持モンスターと習得スキル。${description}`;
});

usePageSeo(() => attribute.value?.name, seoDescription);
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: '特性', to: { name: 'attribute-list' } },
        { label: attribute?.name ?? '詳細' },
      ]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <DetailSkeleton :sections="2" />
      </template>
      <!-- id に該当する特性が無い場合の案内 -->
      <div v-if="!attribute" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        特性が見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'attribute-list' }" class="app-link">一覧へ戻る</router-link>
      </div>

      <!-- 特性が見つかった場合の本体 -->
      <div v-else>
        <div class="border rounded p-4 mb-4">
          <h2 class="text-xl font-bold">{{ attribute.name }}</h2>
          <div class="mt-1 flex gap-1 text-xs">
            <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ attribute.id }}</span>
            <span class="bg-sky-200 rounded px-2 py-0.5">{{ attribute.category }}</span>
          </div>
        </div>

        <h3 class="text-lg font-bold mb-2">説明</h3>
        <p class="whitespace-pre-wrap mb-4">{{ attribute.description }}</p>

        <!-- SP 効果がある特性のみ、SP 説明を追加表示する -->
        <template v-if="hasSpDescription">
          <h3 class="text-lg font-bold mb-2">説明（ＳＰ）</h3>
          <p class="whitespace-pre-wrap mb-4">{{ attribute.descriptionSp }}</p>
        </template>

        <h3 class="text-lg font-bold mb-2">
          この特性を持つモンスター
          <span class="text-sm text-gray-500 font-normal">{{ attribute.monsters.length }} 体</span>
        </h3>
        <MonsterRefTags
          :monster-refs="attribute.monsters"
          :monster-list="monsters ?? []"
          class="mb-4"
        />

        <h3 class="text-lg font-bold mb-2">
          この特性を持つスキル
          <span class="text-sm text-gray-500 font-normal">{{ attribute.skills.length }} 件</span>
        </h3>
        <div class="flex flex-wrap gap-1">
          <router-link
            v-for="skillRef in attribute.skills"
            :key="skillRef.id"
            :to="{ name: 'skill-detail', params: { id: skillRef.id } }"
            class="tag-link app-link"
          >
            {{ skillRef.name }}
          </router-link>
          <span v-if="!attribute.skills.length" class="text-gray-500">なし</span>
        </div>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: '特性', to: { name: 'attribute-list' } },
        { label: attribute?.name ?? '詳細' },
      ]"
      class="mt-6"
    />
  </div>
</template>
