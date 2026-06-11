/**
 * 静的JSONデータの取得層。
 * 元サイトはサーバーAPIで配信していたデータを、ここでは public/data の
 * 静的JSONとして読み込み、Promiseをキャッシュして二重取得を防ぐ。
 */
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';

const baseUrl = import.meta.env.BASE_URL;

let monstersPromise: Promise<Monster[]> | null = null;
let skillsPromise: Promise<Skill[]> | null = null;

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
