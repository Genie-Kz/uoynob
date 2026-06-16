/**
 * 静的JSONデータの取得層。
 * 元サイトはサーバーAPIで配信していたデータを、ここでは public/data の
 * 静的JSONとして読み込み、Promiseをキャッシュして二重取得を防ぐ。
 */
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';
import type { Attribute } from '@/types/attribute';
import type { Ability } from '@/types/ability';
import type { PickupData } from '@/types/pickup';
import type { Weapon } from '@/types/stats';
import type { SiteSearchReadings } from '@/domain/siteSearch';

const baseUrl = import.meta.env.BASE_URL;

let monstersPromise: Promise<Monster[]> | null = null;
let skillsPromise: Promise<Skill[]> | null = null;
let attributesPromise: Promise<Attribute[]> | null = null;
let abilitiesPromise: Promise<Ability[]> | null = null;
let pickupsPromise: Promise<PickupData> | null = null;
let weaponsPromise: Promise<Weapon[]> | null = null;
let searchReadingsPromise: Promise<SiteSearchReadings> | null = null;

async function fetchJson<T>(relativePath: string): Promise<T> {
  const response = await fetch(baseUrl + relativePath);
  if (!response.ok) {
    throw new Error(`データ取得に失敗しました (${response.status}): ${relativePath}`);
  }
  return (await response.json()) as T;
}

export function loadMonsters(): Promise<Monster[]> {
  monstersPromise ??= fetchJson<Monster[]>('data/monsters.json');
  return monstersPromise;
}

export function loadSkills(): Promise<Skill[]> {
  skillsPromise ??= fetchJson<Skill[]>('data/skills.json');
  return skillsPromise;
}

export function loadAttributes(): Promise<Attribute[]> {
  attributesPromise ??= fetchJson<Attribute[]>('data/attributes.json');
  return attributesPromise;
}

export function loadAbilities(): Promise<Ability[]> {
  abilitiesPromise ??= fetchJson<Ability[]>('data/abilities.json');
  return abilitiesPromise;
}

export function loadPickups(): Promise<PickupData> {
  pickupsPromise ??= fetchJson<PickupData>('data/pickups.json');
  return pickupsPromise;
}

export function loadWeapons(): Promise<Weapon[]> {
  weaponsPromise ??= fetchJson<Weapon[]>('data/weapons.json');
  return weaponsPromise;
}

export function loadSearchReadings(): Promise<SiteSearchReadings> {
  searchReadingsPromise ??= fetchJson<SiteSearchReadings>('data/search-readings.json');
  return searchReadingsPromise;
}
