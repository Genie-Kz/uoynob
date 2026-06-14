<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BodySize } from '@/types/monster';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useAsyncData } from '@/composables/useAsyncData';
import { useBuildSimulator } from '@/composables/useBuildSimulator';
import { usePageSeo } from '@/composables/usePageSeo';
import { loadAttributes, loadWeapons } from '@/api/datasets';
import { BODY_SIZES, WEAPONS, lineageInfoOf } from '@/constants/monsterTaxonomy';
import { SKILL_SLOT_COUNT_BY_SIZE } from '@/constants/buildRules';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { FORGE_STAT_UP_OPTIONS, MONSHOU_LIST } from '@/constants/statsRules';
import { canBeSp } from '@/constants/spRules';
import { summarizeGuardEffects } from '@/domain/skillAnalysis';
import { disadvantageTraits, totalDisadvantageCost } from '@/domain/traitDisadvantage';
import { buildResistanceCells } from '@/presentation/resistanceCells';
import DataState from '@/components/DataState.vue';
import MonsterIcon from '@/components/MonsterIcon.vue';
import ResistanceGrid from '@/components/ResistanceGrid.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';
import PickerModal from '@/components/PickerModal.vue';
import StatsBar from '@/components/StatsBar.vue';
import FamilyTreeIv from '@/components/FamilyTreeIv.vue';
import DisadvantageTraits from '@/components/DisadvantageTraits.vue';
import type { PickerItem } from '@/types/picker';
import type { Skill } from '@/types/skill';

const props = defineProps<{ id: string }>();

const route = useRoute();
const router = useRouter();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();
const { data: weapons } = useAsyncData(loadWeapons);
const { data: attributes } = useAsyncData(loadAttributes);

const monster = computed(() => monsters.value?.find((candidate) => candidate.id === props.id) ?? null);

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
  return disadvantageTraits(
    target.ランク,
    totalDisadvantageCost(traitSlots.value, target.名前),
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
const hasAllWeaponTrait = computed(
  () => traitSlots.value.includes('すべての武器装備') || skillAddedTraits.value.includes('すべての武器装備'),
);
const equippableTypes = computed<string[]>(() => {
  if (hasAllWeaponTrait.value) return [...WEAPONS];
  if (!monster.value) return [];
  return WEAPONS.filter((type) => monster.value?.[type] === '〇');
});
const equippableWeapons = computed(() =>
  (weapons.value ?? []).filter((w) => equippableTypes.value.includes(w.type)),
);

function skillGuardSummary(skill: Skill): string {
  return [...summarizeGuardEffects(skill)].map(([element, count]) => `${element}+${count * 2}`).join(' ');
}
function isResistanceForge(value: string): boolean {
  return (RESISTANCE_ELEMENTS as readonly string[]).includes(value);
}

/* ---- 入れ替えモーダル ---- */
type PickerMode = 'size' | 'trait' | 'skill' | 'forge' | 'weapon';

const picker = ref<{ open: boolean; mode: PickerMode; index: number; title: string; items: PickerItem[]; current: string }>({
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
    items: BODY_SIZES.map((size) => ({ label: size, value: size })),
    current: bodySize.value,
  };
}
function openTraitPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'trait',
    index,
    title: '特性を選択',
    items: [{ label: '（空きにする）', value: '' }, ...traitMaster.value.map((name) => ({ label: name, value: name }))],
    current: traitSlots.value[index] ?? '',
  };
}
function openSkillPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'skill',
    index,
    title: 'スキルを選択',
    items: [
      { label: '（空きにする）', value: '' },
      ...(skills.value ?? []).map((skill) => ({ label: skill.name, value: skill.id })),
    ],
    current: skillSlots.value[index]?.id ?? '',
  };
}
function openForgePicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'forge',
    index,
    title: '武器鍛冶を選択',
    items: [
      { label: '（なし）', value: '' },
      ...RESISTANCE_ELEMENTS.map((element) => ({ label: `${element}（耐性+1）`, value: element })),
      ...FORGE_STAT_UP_OPTIONS.map((option) => ({ label: option.label, value: option.label })),
    ],
    current: forgeSlots.value[index] ?? '',
  };
}
function openWeaponPicker(): void {
  picker.value = {
    open: true,
    mode: 'weapon',
    index: 0,
    title: '武器を選択',
    items: [
      { label: '（未装備）', value: '' },
      ...equippableWeapons.value.map((w) => ({ label: `${w.name}〔${w.type}〕 攻+${w.攻撃力}`, value: String(w.no) })),
    ],
    current: weapon.value ? String(weapon.value.no) : '',
  };
}

function handlePick(value: string): void {
  const { mode, index } = picker.value;
  if (mode === 'size') changeBodySize(value as BodySize);
  else if (mode === 'trait') setTrait(index, value);
  else if (mode === 'skill') setSkill(index, value ? (skillById.value.get(value) ?? null) : null);
  else if (mode === 'forge') setForgeElement(index, value);
  else if (mode === 'weapon') setWeapon(value ? (weaponByNo.value.get(Number(value)) ?? null) : null);
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
              <router-link :to="{ name: 'monster-detail', params: { id: monster.id } }" class="app-link ml-1">
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
            :class="activeTab === 'build' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-gray-500'"
            @click="activeTab = 'build'"
          >
            ビルド
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm border-b-2 -mb-px"
            :class="activeTab === 'family' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-gray-500'"
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
              <button type="button" class="btn-outline-primary" @click="openBodySizePicker">選択</button>
            </li>
            <li v-for="(trait, index) in traitSlots" :key="index" class="flex items-center justify-between gap-2 px-3 py-2">
              <span :class="{ 'text-gray-400': !trait }">{{ trait || '（空き）' }}</span>
              <span class="flex items-center gap-2">
                <button
                  v-if="trait && canBeSp(trait)"
                  type="button"
                  class="rounded border px-3 py-1 text-sm font-semibold"
                  :class="isSp(trait) ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'"
                  @click="toggleSp(trait)"
                >
                  SP
                </button>
                <button type="button" class="btn-outline-primary" @click="openTraitPicker(index)">選択</button>
              </span>
            </li>
          </ul>

          <DisadvantageTraits
            :traits="unfavorableTraits"
            show-sp
            :sp-traits="spTraitNames"
            @toggle-sp="toggleSp"
          />

          <!-- スキルで追加される特性 -->
          <h3 class="text-lg font-bold mb-2">スキルで追加される特性</h3>
          <ul class="border rounded divide-y mb-5">
            <li v-for="trait in skillAddedTraits" :key="trait" class="flex items-center justify-between gap-2 px-3 py-2">
              <span>{{ trait }}</span>
              <button
                v-if="canBeSp(trait)"
                type="button"
                class="rounded border px-3 py-1 text-sm font-semibold"
                :class="isSp(trait) ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'"
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
              スキル <span class="text-sm text-gray-500 font-normal">{{ SKILL_SLOT_COUNT_BY_SIZE[bodySize] }}枠</span>
            </h3>
            <button type="button" class="btn-outline-primary" @click="resetSkills">リセット</button>
          </div>
          <ul class="border rounded divide-y mb-5">
            <li v-for="(skill, index) in skillSlots" :key="index" class="flex items-center justify-between px-3 py-2">
              <span v-if="skill">
                {{ skill.name }}
                <span v-if="skillGuardSummary(skill)" class="text-xs text-gray-600 ml-1">{{ skillGuardSummary(skill) }}</span>
              </span>
              <span v-else class="text-gray-400">（空き）</span>
              <button type="button" class="btn-outline-primary" @click="openSkillPicker(index)">選択</button>
            </li>
          </ul>

          <!-- 武器鍛冶 -->
          <div class="flex items-center justify-between mb-2 pr-2">
            <h3 class="text-lg font-bold">武器鍛冶</h3>
            <button type="button" class="btn-outline-primary" @click="resetForge">リセット</button>
          </div>
          <ul class="border rounded divide-y mb-5">
            <li v-for="(value, index) in forgeSlots" :key="index" class="flex items-center justify-between px-3 py-2">
              <span>
                鍛冶{{ index + 1 }}：
                <template v-if="value">
                  {{ value }}
                  <span class="bg-sky-200 rounded px-1.5 py-0.5 text-xs">{{ isResistanceForge(value) ? '耐性+1' : 'ステータス' }}</span>
                </template>
                <span v-else class="text-gray-400">（なし）</span>
              </span>
              <button type="button" class="btn-outline-primary" @click="openForgePicker(index)">選択</button>
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
            <button type="button" class="btn-outline-primary" @click="openWeaponPicker">選択</button>
          </div>

          <!-- 紋晶 -->
          <h3 class="text-lg font-bold mb-2">紋晶<span class="text-sm text-gray-500 font-normal ml-1">（1つのみ）</span></h3>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="m in monshouOptions"
              :key="m.name"
              type="button"
              class="rounded border px-3 py-2 text-sm"
              :class="monshouNames.includes(m.name) ? 'border-blue-500 bg-blue-600 text-white' : 'border-blue-500 bg-white text-blue-600 hover:bg-blue-50'"
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
            <span class="text-sm text-gray-500">（両親のレベル合計。最大200で全ステータス+5%）</span>
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
