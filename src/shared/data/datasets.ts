/**
 * 静的JSONデータの取得層。
 * 元サイトはサーバーAPIで配信していたデータを、ここでは public/data の
 * 静的JSONとして読み込み、Promiseをキャッシュして二重取得を防ぐ。
 */
import type { Monster, MonsterListItem } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { Attribute } from '@/types/attribute';
import type { Ability } from '@/types/ability';
import type { PickupData } from '@/types/pickup';
import type { Weapon } from '@/types/stats';
import type { SiteSearchReadings } from '@/domain/siteSearch';

const baseUrl = import.meta.env.BASE_URL;

type DatasetKey =
  | 'monsters'
  | 'monsterList'
  | 'skills'
  | 'attributes'
  | 'abilities'
  | 'pickups'
  | 'weapons'
  | 'searchReadings';

const datasetPromises: Partial<Record<DatasetKey, Promise<unknown>>> = {};

async function fetchJson<T>(relativePath: string): Promise<T> {
  const response = await fetch(baseUrl + relativePath);
  if (!response.ok) {
    throw new Error(`データ取得に失敗しました (${response.status}): ${relativePath}`);
  }
  return (await response.json()) as T;
}

function loadCachedJson<T>(key: DatasetKey, relativePath: string): Promise<T> {
  const cachedPromise = datasetPromises[key] as Promise<T> | undefined;
  if (cachedPromise) return cachedPromise;

  // 成功したデータだけをキャッシュし、通信失敗などの一時的な失敗は次回再試行できるようにする。
  const promise = fetchJson<T>(relativePath).catch((error: unknown) => {
    delete datasetPromises[key];
    throw error;
  });
  datasetPromises[key] = promise;
  return promise;
}

/** モンスター一覧（全フィールド）を読み込む。 */
export function loadMonsters(): Promise<Monster[]> {
  return loadCachedJson<Monster[]>('monsters', 'data/monsters.json');
}

/** 一覧画面用の軽量モンスターデータ（monsters-list.json）を読み込む */
export function loadMonsterList(): Promise<MonsterListItem[]> {
  return loadCachedJson<MonsterListItem[]>('monsterList', 'data/monsters-list.json');
}

/** スキル一覧を読み込む。 */
export function loadSkills(): Promise<Skill[]> {
  return loadCachedJson<Skill[]>('skills', 'data/skills.json');
}

/** 特性一覧を読み込む。 */
export function loadAttributes(): Promise<Attribute[]> {
  return loadCachedJson<Attribute[]>('attributes', 'data/attributes.json');
}

/** 特技一覧を読み込む。 */
export function loadAbilities(): Promise<Ability[]> {
  return loadCachedJson<Ability[]>('abilities', 'data/abilities.json');
}

/** ピックアップ（特集ページ）のデータを読み込む。 */
export function loadPickups(): Promise<PickupData> {
  return loadCachedJson<PickupData>('pickups', 'data/pickups.json');
}

/** 武器一覧を読み込む。 */
export function loadWeapons(): Promise<Weapon[]> {
  return loadCachedJson<Weapon[]>('weapons', 'data/weapons.json');
}

/** サイト内検索の読みがな対応表を読み込む。 */
export function loadSearchReadings(): Promise<SiteSearchReadings> {
  return loadCachedJson<SiteSearchReadings>('searchReadings', 'data/search-readings.json');
}
