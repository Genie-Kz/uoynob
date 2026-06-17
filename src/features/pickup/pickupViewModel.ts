import type { MonsterListItem } from '@/types/monster';
import type { PickupRef } from '@/types/pickup';
import type { PickupSkillGroup } from '@/domain/pickupGrouping';

export interface PickupSkillGroupView extends PickupSkillGroup {
  iconMonster: MonsterListItem | null;
}

export function pickupMonsterByRef(
  ref: PickupRef,
  resolveMonsterId: (id: string) => string | null,
  monsterById: ReadonlyMap<string, MonsterListItem>,
): MonsterListItem | null {
  const resolved = resolveMonsterId(ref.id);
  return resolved ? (monsterById.get(resolved) ?? null) : null;
}

export function pickupMonsterRoute(
  ref: PickupRef,
  resolveMonsterId: (id: string) => string | null,
) {
  const resolved = resolveMonsterId(ref.id);
  return resolved ? { name: 'monster-detail', params: { id: resolved } } : null;
}

export function createPickupSkillGroupViews(
  pickupKey: string,
  groups: PickupSkillGroup[] | null,
  monsters: MonsterListItem[],
): PickupSkillGroupView[] | null {
  if (!groups) return null;
  return groups.map((group) => ({
    ...group,
    iconMonster:
      pickupKey === 'skill-local'
        ? (monsters.find((monster) => monster.名前 === group.label) ?? null)
        : null,
  }));
}
