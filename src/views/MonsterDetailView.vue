<script setup lang="ts">
import { computed } from 'vue';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { usePageSeo } from '@/composables/usePageSeo';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';
import { defaultEditableTraits, equippableWeaponsOf } from '@/domain/monster';
import { skillsForMonster } from '@/domain/skillLookup';
import { useTraitLink } from '@/composables/useTraitLink';
import { computeBuildResistances, defaultBuildConfiguration } from '@/domain/buildSimulator';
import { disadvantageTraits, totalDisadvantageCost } from '@/domain/traitDisadvantage';
import { buildResistanceCells } from '@/presentation/resistanceCells';
import DataState from '@/components/DataState.vue';
import MonsterIcon from '@/components/MonsterIcon.vue';
import ResistanceGrid from '@/components/ResistanceGrid.vue';
import StatusTable from '@/components/StatusTable.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';
import DisadvantageTraits from '@/components/DisadvantageTraits.vue';
import icon25 from '@/assets/images/icons/trait/icon-25.jpg';
import icon50 from '@/assets/images/icons/trait/icon-50.jpg';
import icon100 from '@/assets/images/icons/trait/icon-100.jpg';
import iconMega from '@/assets/images/icons/trait/icon-m.jpg';
import iconGiga from '@/assets/images/icons/trait/icon-g.png';
import iconSuperGiga from '@/assets/images/icons/trait/icon-sg.png';

const props = defineProps<{ id: string }>();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();
const { traitRoute } = useTraitLink();

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
const unfavorableTraits = computed(() => {
  const target = monster.value;
  if (!target) return [];
  const traits = defaultEditableTraits(target, target.サイズ特性);
  return disadvantageTraits(target.ランク, totalDisadvantageCost(traits, target.名前));
});

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

interface TraitItem {
  /** レベル帯・サイズ帯を表すアイコン（サイズ特性・新生前特性には付かない） */
  icon?: string;
  name: string;
}

const traitItems = computed<TraitItem[]>(() => {
  const target = monster.value;
  if (!target) return [];
  const items: TraitItem[] = [];
  const add = (icon: string | undefined, field: string | undefined | null): void => {
    for (const name of splitTraits(field)) items.push({ icon, name });
  };
  add(undefined, target.サイズ特性);
  add(undefined, target.新生前特性1);
  add(undefined, target.新生前特性2);
  add(icon25, target.特性25);
  add(icon50, target.特性50);
  add(icon100, target.特性100);
  add(iconMega, target.メガ特性);
  add(iconGiga, target.ギガ特性);
  add(iconSuperGiga, target.超ギガ特性);
  return items;
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
        <div class="border rounded overflow-hidden mb-4">
          <div class="bg-gray-50 font-bold px-3 py-2 border-b">特性</div>
          <div class="px-2 py-2">
            <template v-for="(item, index) in traitItems" :key="index">
              <div class="flex items-center gap-7 py-2">
                <span class="w-10 shrink-0 flex justify-center">
                  <img v-if="item.icon" :src="item.icon" alt="" class="size-5 max-w-none object-contain" />
                </span>
                <span class="text-sm">
                  <router-link v-if="traitRoute(item.name)" :to="traitRoute(item.name)!" class="app-link">{{ item.name }}</router-link>
                  <template v-else>{{ item.name }}</template>
                </span>
              </div>
              <hr v-if="index < traitItems.length - 1" class="my-1 border-gray-200" />
            </template>
            <p v-if="!traitItems.length" class="py-2 text-sm text-gray-400">-</p>
          </div>
        </div>

        <DisadvantageTraits :traits="unfavorableTraits" />

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
