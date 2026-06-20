/** スキルとモンスターの相互参照ロジック */
import type { Monster, MonsterListItem } from '@/types/monster';
import type { Skill } from '@/types/skill';

/** あるモンスター（種族）が習得するスキルを逆引きする */
export function skillsForMonster(skills: Skill[], monster: Monster): Skill[] {
  return skills.filter((skill) =>
    skill.monsters.some((ref) => ref.id === monster.no || ref.id === monster.id),
  );
}

/**
 * スキル・特性データが参照するモンスターid（位階No. もしくは "001-1" 形式）を、
 * 図鑑のモンスター情報そのものへ解決する関数を作る。
 * 完全id（"001-1"）はそのモンスターを、位階No.（"001"）は同位階の最初の個体を返す。
 * 解決できない場合は null。
 *
 * id だけでなくアイコン（系統・no）等にも使えるよう、渡された要素型 T のまま返す。
 */
export function createMonsterResolver<T extends Pick<MonsterListItem, 'id' | 'no'>>(
  monsters: T[],
): (refMonsterId: string) => T | null {
  const byId = new Map<string, T>();
  const firstVariantByNo = new Map<string, T>();
  for (const monster of monsters) {
    byId.set(monster.id, monster);
    // 位階No. からは最初に現れた個体（＝代表）を引けるようにする。
    if (!firstVariantByNo.has(monster.no)) firstVariantByNo.set(monster.no, monster);
  }
  // 完全id を優先し、無ければ位階No. として代表個体を返す。
  return (refMonsterId: string) =>
    byId.get(refMonsterId) ?? firstVariantByNo.get(refMonsterId) ?? null;
}

/**
 * スキルが参照するモンスターid（位階No. もしくは "001-1" 形式）を、
 * 図鑑の完全idへ解決する関数を作る。解決できない場合は null。
 * 解決ロジックは createMonsterResolver と共有し、id だけを取り出す。
 */
export function createMonsterIdResolver(
  monsters: Pick<MonsterListItem, 'id' | 'no'>[],
): (skillMonsterId: string) => string | null {
  const resolve = createMonsterResolver(monsters);
  return (skillMonsterId: string) => resolve(skillMonsterId)?.id ?? null;
}
