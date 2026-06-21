<script setup lang="ts">
/** モンスターの詳細ページ（図鑑）。特性・耐性・ステータス・覚えるスキル・装備可能武器を表示する。 */
import { computed } from 'vue';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { usePageSeo } from '@/composables/usePageSeo';
import { BODY_SIZE_SLUG, lineageInfoOf } from '@/constants/monsterTaxonomy';
import { defaultEditableTraits, equippableWeaponsOf } from '@/domain/monster';
import { skillsForMonster } from '@/domain/skillLookup';
import { useTraitLink } from '@/composables/useTraitLink';
import { computeBuildResistances, defaultBuildConfiguration } from '@/domain/buildSimulator';
import { disadvantageTraits, totalDisadvantageCost } from '@/domain/traitDisadvantage';
import { buildResistanceCells } from '@/presentation/resistanceCells';
import DataState from '@/shared/ui/DataState.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';
import ResistanceGrid from '@/shared/ui/ResistanceGrid.vue';
import StatusTable from '@/shared/ui/StatusTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import DetailSkeleton from '@/shared/ui/DetailSkeleton.vue';
import DisadvantageTraits from '@/features/simulator/components/DisadvantageTraits.vue';
import { TRAIT_SLOT_ICONS } from '@/shared/icons/traitIcons';

const props = defineProps<{ id: string }>();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();
const { traitRoute } = useTraitLink();

/** id に一致するモンスター。無ければ null（見つからない表示）。 */
const monster = computed(
  () => monsters.value?.find((candidate) => candidate.id === props.id) ?? null,
);
const breadcrumbItems = computed(() => [
  { label: 'ホーム', to: { name: 'home' } },
  { label: 'モンスター', to: { name: 'monster-list' } },
  { label: monster.value?.名前 ?? '詳細' },
]);
/** 系統情報（ラベル・色）。 */
const lineage = computed(() => (monster.value ? lineageInfoOf(monster.value.系統) : null));
/** 既定構成（本来のサイズ・初期特性）での最終耐性を、グリッド表示用セルに変換する。 */
const resistanceCells = computed(() =>
  monster.value
    ? buildResistanceCells(computeBuildResistances(defaultBuildConfiguration(monster.value)))
    : [],
);
/** 装備できる武器の一覧。 */
const equippableWeapons = computed(() => (monster.value ? equippableWeaponsOf(monster.value) : []));
/** このモンスターが覚えられるスキルの一覧。 */
const learnableSkills = computed(() =>
  monster.value && skills.value ? skillsForMonster(skills.value, monster.value) : [],
);
/** 構成によって付く「不利な特性」。本来のサイズの初期特性からデメリット指数を求めて導く。 */
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

/** 表示用の特性一覧を、解放タイミング順（サイズ→新生前→Lv25/50/100→メガ→ギガ→超ギガ）に組み立てる。 */
const traitItems = computed<TraitItem[]>(() => {
  const target = monster.value;
  if (!target) return [];
  const items: TraitItem[] = [];
  // 1フィールド分の特性（「、」区切り）を、対応するアイコン付きで追加する小関数
  const add = (icon: string | undefined, field: string | undefined | null): void => {
    for (const name of splitTraits(field)) items.push({ icon, name });
  };
  // サイズ特性・新生前特性にはアイコンを付けない
  add(undefined, target.サイズ特性);
  add(undefined, target.新生前特性1);
  add(undefined, target.新生前特性2);
  // レベル帯・サイズ帯で解放される特性にはそれぞれのアイコンを付ける
  add(TRAIT_SLOT_ICONS.level25, target.特性25);
  add(TRAIT_SLOT_ICONS.level50, target.特性50);
  add(TRAIT_SLOT_ICONS.level100, target.特性100);
  add(TRAIT_SLOT_ICONS.mega, target.メガ特性);
  add(TRAIT_SLOT_ICONS.giga, target.ギガ特性);
  add(TRAIT_SLOT_ICONS.superGiga, target.超ギガ特性);
  return items;
});

/** ステータステーブル表示用の行データ（ラベルと値の組）。 */
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
    <PageBreadcrumb :items="breadcrumbItems" />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <DetailSkeleton icon :sections="4" />
      </template>
      <!-- id に該当するモンスターが無い場合の案内 -->
      <div v-if="!monster" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        モンスターが見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'monster-list' }" class="app-link">一覧へ戻る</router-link>
      </div>

      <!-- モンスターが見つかった場合の本体 -->
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
              <router-link
                :to="{ name: 'monster-list', query: { rank: monster.ランク.toLowerCase() } }"
                class="bg-sky-200 rounded px-2 py-0.5 underline decoration-dotted underline-offset-2 hover:decoration-solid active:decoration-solid"
              >
                ランク{{ monster.ランク }}
              </router-link>
              <router-link
                :to="{ name: 'monster-list', query: { lineage: lineage?.slug } }"
                class="bg-gray-100 rounded px-2 py-0.5 underline decoration-dotted underline-offset-2 hover:decoration-solid active:decoration-solid"
              >
                {{ lineage?.label }}
              </router-link>
              <router-link
                :to="{ name: 'monster-list', query: { size: BODY_SIZE_SLUG[monster.サイズ特性] } }"
                class="bg-gray-100 rounded px-2 py-0.5 underline decoration-dotted underline-offset-2 hover:decoration-solid active:decoration-solid"
              >
                {{ monster.サイズ特性 }}
              </router-link>
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
                  <img
                    v-if="item.icon"
                    :src="item.icon"
                    alt=""
                    class="size-5 max-w-none object-contain"
                  />
                </span>
                <span class="text-sm">
                  <router-link
                    v-if="traitRoute(item.name)"
                    :to="traitRoute(item.name)!"
                    class="app-link"
                    >{{ item.name }}</router-link
                  >
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
