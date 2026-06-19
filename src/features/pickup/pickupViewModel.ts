// ピックアップ画面の表示用ロジック（ビューモデル）。データと画面表示の橋渡しをする純粋関数を集める。
import type { MonsterListItem } from '@/types/monster';
import type { PickupRef } from '@/types/pickup';
import type { PickupSkillGroup } from '@/domain/pickupGrouping';

// スキルグループに、見出し横へ出すアイコン用モンスターを付与したビュー型。
export interface PickupSkillGroupView extends PickupSkillGroup {
  iconMonster: MonsterListItem | null;
}

// ピックアップ参照（id）から、対応するモンスターを解決して返す。見つからなければ null。
export function pickupMonsterByRef(
  ref: PickupRef,
  resolveMonsterId: (id: string) => string | null,
  monsterById: ReadonlyMap<string, MonsterListItem>,
): MonsterListItem | null {
  const resolved = resolveMonsterId(ref.id);
  return resolved ? (monsterById.get(resolved) ?? null) : null;
}

// ピックアップ参照から、モンスター詳細へのルートオブジェクトを作る。解決できなければ null。
export function pickupMonsterRoute(
  ref: PickupRef,
  resolveMonsterId: (id: string) => string | null,
) {
  const resolved = resolveMonsterId(ref.id);
  return resolved ? { name: 'monster-detail', params: { id: resolved } } : null;
}

// スキルグループ一覧に、表示用のアイコンモンスターを付けて返す。
export function createPickupSkillGroupViews(
  pickupKey: string,
  groups: PickupSkillGroup[] | null,
  monsters: MonsterListItem[],
): PickupSkillGroupView[] | null {
  // 未読み込み（null）はそのまま返す
  if (!groups) return null;
  return groups.map((group) => ({
    ...group,
    // ご当地スキルのときだけ、グループ名と同名のモンスターをアイコンに使う
    iconMonster:
      pickupKey === 'skill-local'
        ? (monsters.find((monster) => monster.名前 === group.label) ?? null)
        : null,
  }));
}
