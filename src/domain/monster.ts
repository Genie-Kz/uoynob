/** モンスターデータを読み解くためのヘルパー */
import type { BodySize, Monster, ResistanceValue } from '@/types/monster';
import { TRAIT_FIELDS, WEAPONS } from '@/constants/monsterTaxonomy';

/** 指定耐性要素の値を取得 */
export function resistanceValueOf(monster: Monster, element: string): ResistanceValue {
  return monster[element] as ResistanceValue;
}

/** モンスターが持つ特性の一覧（重複・空を除く） */
export function traitsOf(monster: Monster): string[] {
  const unique = new Set<string>();
  for (const field of TRAIT_FIELDS) {
    const trait = monster[field] as string;
    if (trait) unique.add(trait);
  }
  return [...unique];
}

/** 装備可能な武器の一覧（"〇" のもの） */
export function equippableWeaponsOf(monster: Monster): string[] {
  return WEAPONS.filter((weapon) => monster[weapon] === '〇');
}

/**
 * ビルドシミュレーターでの既定の編集可能特性（ボディサイズ枠を除く）。
 * サイズが大きいほど、メガ／ギガ／超ギガ特性が順に解放される。
 */
export function defaultEditableTraits(monster: Monster, bodySize: BodySize): string[] {
  const traits = [
    monster.新生前特性1,
    monster.新生前特性2,
    monster.特性25,
    monster.特性50,
    monster.特性100,
  ];
  const isMegaOrLarger = bodySize === 'メガボディ' || bodySize === 'ギガボディ' || bodySize === '超ギガボディ';
  const isGigaOrLarger = bodySize === 'ギガボディ' || bodySize === '超ギガボディ';
  if (isMegaOrLarger) traits.push(monster.メガ特性);
  if (isGigaOrLarger) traits.push(monster.ギガ特性);
  if (bodySize === '超ギガボディ') traits.push(monster.超ギガ特性);
  return traits.map((trait) => trait ?? '');
}

/** 全モンスターから重複なく特性名を収集（特性入れ替えモーダルの候補に使う） */
export function collectAllTraitNames(monsters: Monster[]): string[] {
  const unique = new Set<string>();
  for (const monster of monsters) {
    for (const field of TRAIT_FIELDS) {
      const trait = monster[field] as string;
      if (trait) unique.add(trait);
    }
  }
  return [...unique].sort((a, b) => a.localeCompare(b, 'ja'));
}
