/** スキルとモンスターの相互参照ロジック */
import type { Monster } from '@/types/monster';
import type { Skill } from '@/types/skill';

/** あるモンスター（種族）が習得するスキルを逆引きする */
export function skillsForMonster(skills: Skill[], monster: Monster): Skill[] {
  return skills.filter((skill) =>
    skill.monsters.some((ref) => ref.id === monster.no || ref.id === monster.id),
  );
}

/**
 * スキルが参照するモンスターid（位階No. もしくは "001-1" 形式）を、
 * 図鑑の完全idへ解決する関数を作る。解決できない場合は null。
 */
export function createMonsterIdResolver(
  monsters: Monster[],
): (skillMonsterId: string) => string | null {
  const fullIdSet = new Set(monsters.map((monster) => monster.id));
  const firstVariantIdByNo = new Map<string, string>();
  for (const monster of monsters) {
    if (!firstVariantIdByNo.has(monster.no)) firstVariantIdByNo.set(monster.no, monster.id);
  }
  return (skillMonsterId: string) =>
    fullIdSet.has(skillMonsterId)
      ? skillMonsterId
      : (firstVariantIdByNo.get(skillMonsterId) ?? null);
}
