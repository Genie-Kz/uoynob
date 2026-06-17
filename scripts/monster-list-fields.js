export const MONSTER_LIST_FIELDS = [
  'id',
  'no',
  'variant',
  '名前',
  '位階',
  'ランク',
  '系統',
  'サイズ特性',
];

export function toMonsterListItem(monster) {
  return Object.fromEntries(MONSTER_LIST_FIELDS.map((field) => [field, monster[field]]));
}
