/** ピックアップの分類用データ */

/** ご当地スキルの入手元（神将）ごとの分類。表示順は神将の並び順。 */
export const LOCAL_SKILLS_BY_SHINSHO: { shinsho: string; skills: string[] }[] = [
  {
    shinsho: '神将ベニヒ',
    skills: ['どさんこソウル', 'ねぶた魂', 'イーハトーブ', 'ダテ男', 'なまはげ', '花笠のうたげ', '白虎の進撃'],
  },
  {
    shinsho: '神将タイシャ',
    skills: ['いかりのご老公', 'ねむりネコの夢', 'からっ風', '勾玉の知恵', 'ピーナッツ革命', '霧将軍', 'ハマのプライド'],
  },
  {
    shinsho: '神将ゲッパク',
    skills: ['金山の恵み', 'クスリ売りの祈り', '百万石のほこり', 'カニのはどう', '風林火山', '御柱のとどろき'],
  },
  {
    shinsho: '神将テツグロ',
    skills: ['合掌の陣', '富士の雄姿', 'シャチホコの乱', 'しもふり乱舞'],
  },
  {
    shinsho: '神将コガネ',
    skills: ['みずうみ大王', 'みやび', 'くいだおれ', '知略ジェンヌ', '大仏のさばき', 'うめぼし女王'],
  },
  {
    shinsho: '神将セイラン',
    skills: ['白ウサギのみちびき', '神々のいたずら', '目覚めし桃太郎', '仁義', 'フグの逆襲'],
  },
  {
    shinsho: '神将トキワ',
    skills: ['至高の踊り', 'うどんスピリッツ', '甘夏のしらべ', 'いごっそう'],
  },
  {
    shinsho: '神将スオウ',
    skills: ['とんこつパワー', 'がばい', 'カステラ大名', 'もっこす', 'ぽかぽか桃源郷', 'フェニックス', 'ぼっけもん', 'うみんちゅハート'],
  },
];

/** スキル名 → 神将 の逆引き */
export const SHINSHO_BY_LOCAL_SKILL: Record<string, string> = Object.fromEntries(
  LOCAL_SKILLS_BY_SHINSHO.flatMap((group) => group.skills.map((name) => [name, group.shinsho])),
);

/** 耐性スキルのピックアップごとに表示するガード特性。配列順を表示順として扱う。 */
export const GUARDS_BY_RESISTANCE_PICKUP: Record<string, readonly string[]> = {
  'skill-resistance-spell': [
    'メラガード＋',
    'ギラガード＋',
    'イオガード＋',
    'バギガード＋',
    'ヒャドガード＋',
    'ジバリアガード＋',
    'デインガード＋',
    'ドルマガード＋',
    'ベタンガード＋',
  ],
  'skill-resistance-breath': ['炎ブレスガード＋', '吹雪ブレスガード＋'],
  'skill-resistance-condition': [
    'ザキガード＋',
    'どくガード＋',
    '呪いガード＋',
    'マインドガード＋',
    'こんらんガード＋',
    'マヒガード＋',
    'ねむりガード＋',
    'マヌーサガード＋',
    'マホトラガード＋',
    'ハックガード＋',
  ],
  'skill-resistance-seal': [
    'マホトーンガード＋',
    '斬撃封じガード＋',
    '体技封じガード＋',
    '息封じガード＋',
    '踊り封じガード＋',
  ],
  'skill-resistance-weaken': ['ダウンガード＋', 'ルカニガード＋', 'ボミエガード＋', 'フールガード＋'],
};
