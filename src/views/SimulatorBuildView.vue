<script setup lang="ts">
// ビルドシミュレーターの本体。特性・スキル・武器鍛冶・装備・系図などを入れ替えて、
// 最終耐性とステータスを計算・表示し、構成を共有URLとして保存できる。
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BodySize } from '@/types/monster';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useAsyncData } from '@/composables/useAsyncData';
import { useBuildSimulator } from '@/features/simulator/useBuildSimulator';
import { useTraitLink } from '@/composables/useTraitLink';
import { usePageSeo } from '@/composables/usePageSeo';
import { loadAttributes, loadWeapons } from '@/shared/data/datasets';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';
import { SKILL_SLOT_COUNT_BY_SIZE } from '@/constants/buildRules';
import { MONSHOU_LIST } from '@/constants/statsRules';
import { canBeSpFromAttributes } from '@/constants/spRules';
import { disadvantageTraits, totalDisadvantageCost } from '@/domain/traitDisadvantage';
import { buildResistanceCells } from '@/presentation/resistanceCells';
import {
  bodySizePickerItems,
  equippableWeaponItems,
  equippableWeaponTypes,
  forgePickerItems,
  isResistanceForge,
  skillGuardSummary,
  skillPickerItems,
  traitPickerItems,
  weaponPickerItems,
} from '@/features/simulator/simulatorViewModel';
import DataState from '@/shared/ui/DataState.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';
import ResistanceGrid from '@/shared/ui/ResistanceGrid.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import PickerModal from '@/shared/ui/PickerModal.vue';
import StatsBar from '@/shared/ui/StatsBar.vue';
import FamilyTreeIv from '@/features/simulator/components/FamilyTreeIv.vue';
import DisadvantageTraits from '@/features/simulator/components/DisadvantageTraits.vue';
import type { PickerItem } from '@/types/picker';

const props = defineProps<{ id: string }>();

const route = useRoute();
const router = useRouter();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();
const { data: weapons } = useAsyncData(loadWeapons);
const { traitRoute } = useTraitLink();
const { data: attributes } = useAsyncData(loadAttributes);

const monster = computed(
  () => monsters.value?.find((candidate) => candidate.id === props.id) ?? null,
);

const seoDescription = computed(() => {
  const target = monster.value;
  if (!target) return null;
  return `イルルカSPの${target.名前}について、スキル、特性、耐性、ステータスを調整してビルドを作成・共有できるシミュレーター。`;
});

usePageSeo(
  () => (monster.value ? `${monster.value.名前} ビルドシミュレーター` : null),
  seoDescription,
);

const breadcrumbItems = computed(() => [
  { label: 'ホーム', to: { name: 'home' } },
  { label: 'ビルドシミュレーター', to: { name: 'simulator-select' } },
  { label: monster.value?.名前 ?? '詳細' },
]);

const initialQuery = { ...route.query };

const sim = useBuildSimulator(monster, monsters, skills, weapons, attributes, initialQuery);
const {
  bodySize,
  traitSlots,
  skillSlots,
  forgeSlots,
  traitMaster,
  skillById,
  skillAddedTraits,
  resistanceOutcomes,
  stats,
  shareQuery,
  individualValues,
  familyTree,
  parentLevelTotal,
  weapon,
  monshouNames,
  spTraitNames,
  changeBodySize,
  setTrait,
  setSkill,
  setForgeElement,
  setIndividualValue,
  setFamilyLineage,
  fillFamilyTree,
  setParentLevelTotal,
  setWeapon,
  toggleMonshou,
  toggleSp,
  isSp,
  resetTraits,
  resetSkills,
  resetForge,
} = sim;

const lineage = computed(() => (monster.value ? lineageInfoOf(monster.value.系統) : null));
const resistanceCells = computed(() => buildResistanceCells(resistanceOutcomes.value));
const unfavorableTraits = computed(() => {
  const target = monster.value;
  if (!target) return [];
  return disadvantageTraits(target.ランク, totalDisadvantageCost(traitSlots.value, target.名前));
});
const spAvailableTraits = computed(() => {
  const attributeList = attributes.value ?? [];
  return [...traitSlots.value, ...skillAddedTraits.value, ...unfavorableTraits.value].filter(
    (trait) => trait && canBeSpFromAttributes(trait, attributeList),
  );
});

watch(shareQuery, (query) => {
  router.replace({ name: 'simulator-build', params: { id: props.id }, query });
});

const copied = ref(false);
async function copyShareUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(location.href);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* クリップボード不可の環境では何もしない */
  }
}

/* ---- タブ ---- */
const activeTab = ref<'build' | 'family'>('build');

/* ---- 武器 ---- */
const weaponByNo = computed(() => new Map((weapons.value ?? []).map((w) => [w.no, w])));
const equippableTypes = computed<string[]>(() =>
  equippableWeaponTypes(monster.value, traitSlots.value, skillAddedTraits.value),
);
const equippableWeapons = computed(() =>
  equippableWeaponItems(weapons.value ?? [], equippableTypes.value),
);

/* ---- 入れ替えモーダル ---- */
type PickerMode = 'size' | 'trait' | 'skill' | 'forge' | 'weapon';

const picker = ref<{
  open: boolean;
  mode: PickerMode;
  index: number;
  title: string;
  items: PickerItem[];
  current: string;
}>({
  open: false,
  mode: 'trait',
  index: 0,
  title: '',
  items: [],
  current: '',
});

function openBodySizePicker(): void {
  picker.value = {
    open: true,
    mode: 'size',
    index: 0,
    title: 'ボディサイズを選択',
    items: bodySizePickerItems(),
    current: bodySize.value,
  };
}
function openTraitPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'trait',
    index,
    title: '特性を選択',
    items: traitPickerItems(traitMaster.value),
    current: traitSlots.value[index] ?? '',
  };
}
function openSkillPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'skill',
    index,
    title: 'スキルを選択',
    items: skillPickerItems(skills.value ?? []),
    current: skillSlots.value[index]?.id ?? '',
  };
}
function openForgePicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'forge',
    index,
    title: '武器鍛冶を選択',
    items: forgePickerItems(),
    current: forgeSlots.value[index] ?? '',
  };
}
function openWeaponPicker(): void {
  picker.value = {
    open: true,
    mode: 'weapon',
    index: 0,
    title: '武器を選択',
    items: weaponPickerItems(equippableWeapons.value),
    current: weapon.value ? String(weapon.value.no) : '',
  };
}

function handlePick(value: string): void {
  const { mode, index } = picker.value;
  if (mode === 'size') changeBodySize(value as BodySize);
  else if (mode === 'trait') setTrait(index, value);
  else if (mode === 'skill') setSkill(index, value ? (skillById.value.get(value) ?? null) : null);
  else if (mode === 'forge') setForgeElement(index, value);
  else if (mode === 'weapon')
    setWeapon(value ? (weaponByNo.value.get(Number(value)) ?? null) : null);
  picker.value.open = false;
}

function onParentLevelInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value);
  setParentLevelTotal(Math.max(0, Math.min(200, Number.isFinite(raw) ? raw : 0)));
}

const monshouOptions = MONSHOU_LIST;
</script>

<template>
  <div class="pb-28">
    <PageBreadcrumb :items="breadcrumbItems" />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <div v-if="!monster" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        モンスターが見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'simulator-select' }" class="app-link">検索へ戻る</router-link>
      </div>

      <div v-else>
        <!-- ヘッダー -->
        <div class="border rounded p-4 mb-4 flex items-center">
          <MonsterIcon :lineage="monster.系統" :no="monster.no" size="lg" />
          <div class="ml-3">
            <h2 class="text-xl font-bold">{{ monster.名前 }}</h2>
            <div class="mt-1 flex flex-wrap gap-1 text-xs">
              <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ monster.no }}</span>
              <span class="bg-sky-200 rounded px-2 py-0.5">ランク{{ monster.ランク }}</span>
              <span class="bg-gray-100 rounded px-2 py-0.5">{{ lineage?.label }}</span>
              <router-link
                :to="{ name: 'monster-detail', params: { id: monster.id } }"
                class="app-link ml-1"
              >
                図鑑を見る
              </router-link>
            </div>
          </div>
        </div>

        <!-- タブ -->
        <div class="flex border-b mb-4">
          <button
            type="button"
            class="px-4 py-2 text-sm border-b-2 -mb-px"
            :class="
              activeTab === 'build'
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500'
            "
            @click="activeTab = 'build'"
          >
            ビルド
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm border-b-2 -mb-px"
            :class="
              activeTab === 'family'
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500'
            "
            @click="activeTab = 'family'"
          >
            ステータス・系図
          </button>
        </div>

        <!-- ビルドタブ -->
        <div v-show="activeTab === 'build'">
          <div class="mb-4">
            <button type="button" class="btn-neutral" @click="copyShareUrl">
              {{ copied ? 'コピーしました！' : 'この構成を共有（URLをコピー）' }}
            </button>
          </div>

          <ResistanceGrid title="最終耐性" :cells="resistanceCells" class="mb-5" />

          <!-- 特性 -->
          <div class="flex items-center justify-between mb-2 pr-2">
            <h3 class="text-lg font-bold">特性</h3>
            <button type="button" class="btn-outline-primary" @click="resetTraits">リセット</button>
          </div>
          <ul class="border rounded divide-y mb-5">
            <li class="flex items-center justify-between px-3 py-2">
              <span>ボディサイズ：{{ bodySize }}</span>
              <button type="button" class="btn-outline-primary" @click="openBodySizePicker">
                選択
              </button>
            </li>
            <li
              v-for="(trait, index) in traitSlots"
              :key="index"
              class="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span :class="{ 'text-gray-400': !trait }">
                <router-link
                  v-if="trait && traitRoute(trait)"
                  :to="traitRoute(trait)!"
                  class="app-link"
                  >{{ trait }}</router-link
                >
                <template v-else>{{ trait || '（空き）' }}</template>
              </span>
              <span class="flex items-center gap-2">
                <button
                  v-if="trait && spAvailableTraits.includes(trait)"
                  type="button"
                  class="rounded border px-3 py-1 text-sm font-semibold"
                  :class="
                    isSp(trait)
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  "
                  @click="toggleSp(trait)"
                >
                  SP
                </button>
                <button type="button" class="btn-outline-primary" @click="openTraitPicker(index)">
                  選択
                </button>
              </span>
            </li>
          </ul>

          <DisadvantageTraits
            :traits="unfavorableTraits"
            show-sp
            :sp-traits="spTraitNames"
            :sp-available-traits="spAvailableTraits"
            @toggle-sp="toggleSp"
          />

          <!-- スキルで追加される特性 -->
          <h3 class="text-lg font-bold mb-2">スキルで追加される特性</h3>
          <ul class="border rounded divide-y mb-5">
            <li
              v-for="trait in skillAddedTraits"
              :key="trait"
              class="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span>
                <router-link v-if="traitRoute(trait)" :to="traitRoute(trait)!" class="app-link">{{
                  trait
                }}</router-link>
                <template v-else>{{ trait }}</template>
              </span>
              <button
                v-if="spAvailableTraits.includes(trait)"
                type="button"
                class="rounded border px-3 py-1 text-sm font-semibold"
                :class="
                  isSp(trait)
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                "
                @click="toggleSp(trait)"
              >
                SP
              </button>
            </li>
            <li v-if="!skillAddedTraits.length" class="px-3 py-2 text-gray-400">スキル未選択</li>
          </ul>

          <!-- スキル -->
          <div class="flex items-center justify-between mb-2 pr-2">
            <h3 class="text-lg font-bold">
              スキル
              <span class="text-sm text-gray-500 font-normal"
                >{{ SKILL_SLOT_COUNT_BY_SIZE[bodySize] }}枠</span
              >
            </h3>
            <button type="button" class="btn-outline-primary" @click="resetSkills">リセット</button>
          </div>
          <ul class="border rounded divide-y mb-5">
            <li
              v-for="(skill, index) in skillSlots"
              :key="index"
              class="flex items-center justify-between px-3 py-2"
            >
              <span v-if="skill">
                {{ skill.name }}
                <span v-if="skillGuardSummary(skill)" class="text-xs text-gray-600 ml-1">{{
                  skillGuardSummary(skill)
                }}</span>
              </span>
              <span v-else class="text-gray-400">（空き）</span>
              <button type="button" class="btn-outline-primary" @click="openSkillPicker(index)">
                選択
              </button>
            </li>
          </ul>

          <!-- 武器鍛冶 -->
          <div class="flex items-center justify-between mb-2 pr-2">
            <h3 class="text-lg font-bold">武器鍛冶</h3>
            <button type="button" class="btn-outline-primary" @click="resetForge">リセット</button>
          </div>
          <ul class="border rounded divide-y mb-5">
            <li
              v-for="(value, index) in forgeSlots"
              :key="index"
              class="flex items-center justify-between px-3 py-2"
            >
              <span>
                鍛冶{{ index + 1 }}：
                <template v-if="value">
                  {{ value }}
                  <span class="bg-sky-200 rounded px-1.5 py-0.5 text-xs">{{
                    isResistanceForge(value) ? '耐性+1' : 'ステータス'
                  }}</span>
                </template>
                <span v-else class="text-gray-400">（なし）</span>
              </span>
              <button type="button" class="btn-outline-primary" @click="openForgePicker(index)">
                選択
              </button>
            </li>
          </ul>
        </div>

        <!-- ステータス・系図タブ -->
        <div v-show="activeTab === 'family'">
          <FamilyTreeIv
            class="mb-5"
            :family-tree="familyTree"
            :individual-values="individualValues"
            @set-lineage="setFamilyLineage"
            @fill="fillFamilyTree"
            @set-iv="setIndividualValue"
          />

          <!-- 装備（武器） -->
          <h3 class="text-lg font-bold mb-2">装備（武器）</h3>
          <div class="border rounded flex items-center justify-between px-3 py-2 mb-5">
            <span>
              <template v-if="weapon">
                {{ weapon.name }}
                <span class="text-xs text-gray-600 ml-1">攻+{{ weapon.攻撃力 }}</span>
              </template>
              <span v-else class="text-gray-400">未装備</span>
            </span>
            <button type="button" class="btn-outline-primary" @click="openWeaponPicker">
              選択
            </button>
          </div>

          <!-- 紋晶 -->
          <h3 class="text-lg font-bold mb-2">
            紋晶<span class="text-sm text-gray-500 font-normal ml-1">（1つのみ）</span>
          </h3>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="m in monshouOptions"
              :key="m.name"
              type="button"
              class="rounded border px-3 py-2 text-sm"
              :class="
                monshouNames.includes(m.name)
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-blue-500 bg-white text-blue-600 hover:bg-blue-50'
              "
              @click="toggleMonshou(m.name)"
            >
              {{ m.name }}
            </button>
          </div>

          <!-- 親レベル合計 -->
          <h3 class="text-lg font-bold mb-2">親レベル合計</h3>
          <div class="flex items-center gap-2 mb-2">
            <input
              type="number"
              class="border rounded px-3 py-2 w-28 text-sm"
              min="0"
              max="200"
              :value="parentLevelTotal"
              @input="onParentLevelInput"
            />
            <span class="text-sm text-gray-500"
              >（両親のレベル合計。最大200で全ステータス+5%）</span
            >
          </div>
        </div>
      </div>
    </DataState>

    <PageBreadcrumb :items="breadcrumbItems" class="mt-6" />

    <PickerModal
      :open="picker.open"
      :title="picker.title"
      :items="picker.items"
      :current="picker.current"
      @select="handlePick"
      @close="picker.open = false"
    />

    <!-- 下部固定ステータスバー -->
    <StatsBar :stats="stats" />
  </div>
</template>
