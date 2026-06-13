<script setup lang="ts">
import { computed } from 'vue';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { usePageSeo } from '@/composables/usePageSeo';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';
import { equippableWeaponsOf } from '@/domain/monster';
import { skillsForMonster } from '@/domain/skillLookup';
import { computeBuildResistances, defaultBuildConfiguration } from '@/domain/buildSimulator';
import { buildResistanceCells } from '@/presentation/resistanceCells';
import DataState from '@/components/DataState.vue';
import MonsterIcon from '@/components/MonsterIcon.vue';
import ResistanceGrid from '@/components/ResistanceGrid.vue';
import StatusTable from '@/components/StatusTable.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';
import icon25 from '@/assets/images/icons/trait/icon-25.jpg';
import icon50 from '@/assets/images/icons/trait/icon-50.jpg';
import icon100 from '@/assets/images/icons/trait/icon-100.jpg';
import iconMega from '@/assets/images/icons/trait/icon-m.jpg';
import iconGiga from '@/assets/images/icons/trait/icon-g.png';
import iconSuperGiga from '@/assets/images/icons/trait/icon-sg.png';

const props = defineProps<{ id: string }>();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();

const monster = computed(() => monsters.value?.find((candidate) => candidate.id === props.id) ?? null);
const breadcrumbItems = computed(() => [
  { label: 'ホーム', to: { name: 'home' } },
  { label: 'モンスター', to: { name: 'monster-list' } },
  { label: monster.value?.名前 ?? '詳細' },
]);
const lineage = computed(() => (monster.value ? lineageInfoOf(monster.value.系統) : null));
const resistanceCells = computed(() =>
  monster.value ? buildResistanceCells(computeBuildResistances(defaultBuildConfiguration(monster.value))) : [],
);
const equippableWeapons = computed(() => (monster.value ? equippableWeaponsOf(monster.value) : []));
const learnableSkills = computed(() =>
  monster.value && skills.value ? skillsForMonster(skills.value, monster.value) : [],
);

const seoDescription = computed(() => {
  const target = monster.value;
  if (!target) return null;
  return `イルルカSPの${target.名前}（ランク${target.ランク}・${lineage.value?.label ?? target.系統}）の特性、耐性、ステータス、スキル、装備情報。`;
});

usePageSeo(() => monster.value?.名前, seoDescription);

/** 「、」区切りの特性文字列を配列に分解する */
function splitTraits(value: string | undefined | null): string[] {
  return (value ?? '')
    .split('、')
    .map((name) => name.trim())
    .filter(Boolean);
}

interface TraitRow {
  /** ラベルをアイコン画像で表すか、テキストで表すか */
  icon?: string;
  label: string;
  values: string[];
}

const traitRows = computed<TraitRow[]>(() => {
  const target = monster.value;
  if (!target) return [];
  return [
    { label: 'サイズ特性', values: splitTraits(target.サイズ特性) },
    { label: '新生前特性', values: [target.新生前特性1, target.新生前特性2].flatMap(splitTraits) },
    { icon: icon25, label: 'Lv25', values: splitTraits(target.特性25) },
    { icon: icon50, label: 'Lv50', values: splitTraits(target.特性50) },
    { icon: icon100, label: 'Lv100', values: splitTraits(target.特性100) },
    { icon: iconMega, label: 'メガ特性', values: splitTraits(target.メガ特性) },
    { icon: iconGiga, label: 'ギガ特性', values: splitTraits(target.ギガ特性) },
    { icon: iconSuperGiga, label: '超ギガ特性', values: splitTraits(target.超ギガ特性) },
  ];
});

const statRows = computed(() => {
  const target = monster.value;
  if (!target) return [];
  return [
    { label: 'ＨＰ', value: target.HP },
    { label: 'ＭＰ', value: target.MP },
    { label: '攻撃力', value: target.攻撃力 },
    { label: '守備力', value: target.守備力 },
    { label: '素早さ', value: target.素早さ },
    { label: 'かしこさ', value: target.賢さ },
  ];
});
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="breadcrumbItems"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <div v-if="!monster" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        モンスターが見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'monster-list' }" class="app-link">一覧へ戻る</router-link>
      </div>

      <div v-else>
        <!-- ヘッダー -->
        <div class="border rounded p-4 mb-4 flex items-center">
          <MonsterIcon :lineage="monster.系統" :no="monster.no" size="lg" />
          <div class="ml-3">
            <h2 class="text-xl font-bold">
              <router-link
                :to="{ name: 'simulator-build', params: { id: monster.id } }"
                class="app-link"
                title="ビルドシミュレーターを開く"
              >
                {{ monster.名前 }}
              </router-link>
            </h2>
            <div class="mt-1 flex flex-wrap gap-1 text-xs">
              <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ monster.no }}</span>
              <span class="bg-sky-200 rounded px-2 py-0.5">ランク{{ monster.ランク }}</span>
              <span class="bg-gray-100 rounded px-2 py-0.5">{{ lineage?.label }}</span>
              <span class="bg-gray-100 rounded px-2 py-0.5">{{ monster.サイズ特性 }}</span>
            </div>
          </div>
        </div>

        <!-- スキル -->
        <h3 class="text-lg font-bold mb-2">スキル</h3>
        <div class="mb-4 flex flex-wrap gap-1">
          <template v-if="learnableSkills.length">
            <router-link
              v-for="skill in learnableSkills"
              :key="skill.id"
              :to="{ name: 'skill-detail', params: { id: skill.id } }"
              class="tag-link app-link"
            >
              {{ skill.name }}
            </router-link>
          </template>
          <span v-else class="text-gray-500">データなし</span>
        </div>

        <!-- 特性 -->
        <h3 class="text-lg font-bold mb-2">特性</h3>
        <table class="w-full text-sm border-collapse mb-4">
          <tbody>
            <tr v-for="row in traitRows" :key="row.label" class="border-b">
              <th class="text-left bg-gray-50 border px-2 py-1 w-1/4 align-top">
                <span class="inline-flex items-center gap-1">
                  <img v-if="row.icon" :src="row.icon" :alt="row.label" class="w-5 h-5" />
                  <span v-else>{{ row.label }}</span>
                </span>
              </th>
              <td class="border px-2 py-1 align-top">
                <template v-if="row.values.length">
                  <div v-for="name in row.values" :key="name">{{ name }}</div>
                </template>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 耐性 -->
        <ResistanceGrid title="耐性（新生配合時）" :cells="resistanceCells" class="mb-4" />

        <!-- ステータス -->
        <StatusTable title="ステータス" :rows="statRows" class="mb-4" />

        <!-- 装備 -->
        <h3 class="text-lg font-bold mb-2">装備</h3>
        <p class="mb-4">{{ equippableWeapons.length ? equippableWeapons.join('、') : 'なし' }}</p>

        <router-link :to="{ name: 'simulator-build', params: { id: monster.id } }" class="app-link">
          このモンスターのビルドシミュレーターを開く
        </router-link>
      </div>
    </DataState>

    <PageBreadcrumb :items="breadcrumbItems" class="mt-6" />
  </div>
</template>
