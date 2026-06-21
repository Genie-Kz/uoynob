<script setup lang="ts">
/** スキルの一覧ページ。カテゴリー絞り込み（クエリ）と名前での絞り込みに対応し、耐性アップ効果をバッジ表示する。 */
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Skill, SkillCategory } from '@/types/skill';
import { useSkills } from '@/composables/useSkills';
import { summarizeGuardEffects } from '@/domain/skillAnalysis';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useScrollRestore } from '@/composables/useScrollRestore';
import DataState from '@/shared/ui/DataState.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import TableSkeleton from '@/shared/ui/TableSkeleton.vue';

const route = useRoute();
const { skills, isLoading, errorMessage } = useSkills();
// 詳細から戻ったときにスクロール位置を復元する。
const { restoring } = useScrollRestore();

// クエリのスラッグ（category）から実際のカテゴリー名へ変換する対応表。
const CATEGORY_BY_SLUG: Record<string, SkillCategory> = {
  ability: '特技系',
  parameter: 'パラメータ系',
};

// クエリ ?category=... のスラッグ。未指定なら空文字。
const categorySlug = computed(() =>
  typeof route.query.category === 'string' ? route.query.category : '',
);
// スラッグから引いたカテゴリー名。該当が無ければ null（全件）。
const categoryName = computed<SkillCategory | null>(
  () => CATEGORY_BY_SLUG[categorySlug.value] ?? null,
);

// 名前での絞り込みキーワード。
const keyword = ref('');
// 読みがな検索用のデータ。
const { data: searchReadings } = useAsyncData(loadSearchReadings);

// 表示するスキル一覧。id 昇順に並べ、カテゴリーと名前で順に絞り込む。
const visibleSkills = computed(() => {
  let list = [...(skills.value ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  // カテゴリー指定があれば、そのカテゴリーだけに絞る
  if (categoryName.value) list = list.filter((skill) => skill.category === categoryName.value);
  const query = keyword.value.trim();
  // 名前キーワードがあれば、読みがなも考慮して部分一致で絞る
  if (query) {
    list = list.filter((skill) =>
      includesKeywordWithReading(skill.name, query, searchReadings.value?.labels),
    );
  }
  return list;
});

// 見出し。カテゴリー指定時は「○○ のスキル」、未指定なら「スキル一覧」。
const title = computed(() =>
  categoryName.value ? `${categoryName.value} のスキル` : 'スキル一覧',
);

// スキルが持つ耐性アップ効果を、表示用のバッジ（属性名＋段階）に変換する。
// summarizeGuardEffects の回数は「+2段階／回」なので step は ×2 する。
function guardBadges(skill: Skill): { element: string; step: number }[] {
  return [...summarizeGuardEffects(skill)].map(([element, count]) => ({
    element,
    step: count * 2,
  }));
}
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'スキル' }]" />
    <h2 class="text-xl font-bold mb-3">{{ title }}</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <TableSkeleton />
      </template>
      <input
        v-model="keyword"
        type="text"
        class="border rounded w-full px-3 py-2 mb-3"
        placeholder="スキル名で絞り込み"
      />
      <p class="text-sm text-gray-500 mb-2">{{ visibleSkills.length }} 件</p>

      <div class="overflow-x-auto rounded-lg border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="table-header-row">
              <th class="px-3 py-2 font-semibold">No.</th>
              <th class="px-3 py-2 font-semibold">スキル</th>
              <th class="px-3 py-2 font-semibold">耐性アップ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="skill in visibleSkills"
              :key="skill.id"
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="px-3 py-2 whitespace-nowrap">{{ skill.id }}</td>
              <td class="px-3 py-2">
                <router-link
                  :to="{ name: 'skill-detail', params: { id: skill.id } }"
                  class="app-link"
                >
                  {{ skill.name }}
                </router-link>
              </td>
              <td class="px-3 py-2">
                <span
                  v-for="badge in guardBadges(skill)"
                  :key="badge.element"
                  class="inline-block bg-sky-200 rounded px-1.5 py-0.5 mr-1 mb-1 text-xs"
                >
                  {{ badge.element }}+{{ badge.step }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'スキル' }]"
      class="mt-6"
    />
  </div>
</template>
