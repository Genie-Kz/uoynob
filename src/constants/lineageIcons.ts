/** 系統名 → アイコン画像URL（家系図UIなどで使用） */
import material from '@/assets/images/icons/linage/lineage_icon_material.webp';
import demon from '@/assets/images/icons/linage/lineage_icon_demon.webp';
import dragon from '@/assets/images/icons/linage/lineage_icon_dragon.webp';
import crown from '@/assets/images/icons/linage/lineage_icon_crown.webp';
import natural from '@/assets/images/icons/linage/lineage_icon_natural.webp';
import slime from '@/assets/images/icons/linage/lineage_icon_slime.webp';
import beast from '@/assets/images/icons/linage/lineage_icon_beast.webp';
import zombie from '@/assets/images/icons/linage/lineage_icon_zombie.webp';

/** ステータス計算に使う8系統 */
export const STAT_LINEAGES = ['物質', '悪魔', 'ドラゴン', '???', '自然', 'スライム', '魔獣', 'ゾンビ'] as const;

export const LINEAGE_ICON: Record<string, string> = {
  物質: material,
  悪魔: demon,
  ドラゴン: dragon,
  '???': crown,
  自然: natural,
  スライム: slime,
  魔獣: beast,
  ゾンビ: zombie,
};

/** 表示用ラベル（???は ？？？系 と表示） */
export const LINEAGE_LABEL: Record<string, string> = {
  物質: '物質系',
  悪魔: '悪魔系',
  ドラゴン: 'ドラゴン系',
  '???': '？？？系',
  自然: '自然系',
  スライム: 'スライム系',
  魔獣: '魔獣系',
  ゾンビ: 'ゾンビ系',
};
