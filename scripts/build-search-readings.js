// サイト内検索対象の名前をひらがなへ変換し、静的な読み索引を生成する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import KuroshiroPackage from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(scriptDir, '..', 'public', 'data');
const outputPath = path.join(dataDir, 'search-readings.json');
const Kuroshiro = KuroshiroPackage.default;

const READING_OVERRIDES = {
  '轟雷滅殺剣': 'ごうらいめっさつけん',
  '邪竜神のさけび': 'じゃりゅうしんのさけび',
  '神将ベニヒ': 'しんしょうベニヒ',
  '神将タイシャ': 'しんしょうタイシャ',
  '神将ゲッパク': 'しんしょうゲッパク',
  '神将シオン': 'しんしょうシオン',
  '神の息吹': 'かみのいぶき',
  '神将テツグロ': 'しんしょうテツグロ',
  '神将コガネ': 'しんしょうコガネ',
  '神将セイラン': 'しんしょうセイラン',
  '神将トキワ': 'しんしょうトキワ',
  '神将スオウ': 'しんしょうスオウ',
  '勇車スラリンガル': 'ゆうしゃスラリンガル',
  '邪眼皇帝アウルート': 'じゃがんこうていアウルート',
  '魔導鬼べドラー': 'まどうきベドラー',
  '邪竜軍王ガリンガ': 'じゃりゅうぐんおうガリンガ',
  '屍騎軍王ゾルデ': 'しきぐんおうゾルデ',
  '鉄鬼軍王キラゴルド': 'てっきぐんおうキラゴルド',
  '砂塵の幻馬': 'さじんのげんま',
  '絶望と憎悪の魔宮': 'ぜつぼうとぞうおのまきゅう',
  '女帝フレイシャ': 'じょていフレイシャ',
  '戦帝アックル': 'せんていアックル',
  '義帝ガオガイヤ': 'ぎていガオガイヤ',
  '神鳥レティス': 'しんちょうレティス',
  '聖竜ミラクレア': 'せいりゅうミラクレア',
  '禍乱の竜アンテロ': 'からんのりゅうアンテロ',
  '邪竜神ナドラガ': 'じゃりゅうしんナドラガ',
  '怪蟲アラグネ': 'かいちゅうアラグネ',
  '一発逆転': 'いっぱつぎゃくてん',
  '斬撃封じガード+': 'ざんげきふうじガード+',
  '神の踊り手': 'かみのおどりて',
  '大賢者': 'だいけんじゃ',
  '闘神レオソード': 'とうしんレオソード',
  '邪獣ヒヒュルデ': 'じゃじゅうヒヒュルデ',
  '九神将': 'きゅうしんしょう',
  '禁断の魔導書': 'きんだんのまどうしょ',
  'ねぶた魂': 'ねぶただましい',
  '金山の恵み': 'きんざんのめぐみ',
  '百万石のほこり': 'ひゃくまんごくのほこり',
  '御柱のとどろき': 'みはしらのとどろき',
  '神々のいたずら': 'かみがみのいたずら',
  'VS斬撃': 'VSざんげき',
  '空裂斬': 'くうれつざん',
  '海破斬': 'かいはざん',
  '大地斬': 'だいちざん',
  'メタル斬り': 'メタルぎり',
  'スライム斬り': 'スライムぎり',
  'ドラゴン斬り': 'ドラゴンぎり',
  'しぜん斬り': 'しぜんぎり',
  'まじゅう斬り': 'まじゅうぎり',
  'ぶっしつ斬り': 'ぶっしつぎり',
  'あくま斬り': 'あくまぎり',
  'ゾンビ斬り': 'ゾンビぎり',
  '聖魔斬': 'せいまざん',
  'さみだれ斬り': 'さみだれぎり',
  'てんいむほう斬': 'てんいむほうざん',
  'しんらばんしょう斬': 'しんらばんしょうざん',
  '幻魔の獄': 'げんまのごく',
  'もうどく斬り': 'もうどくぎり',
  '斬撃よそく': 'ざんげきよそく',
  'ゆうきの斬舞': 'ゆうきのざんぶ',
  '斬撃封じの息': 'ざんげきふうじのきり',
  '強ガードブレイク': 'きょうガードブレイク',
  'ひとくい箱': 'ひとくいばこ',
  'れんごく天馬': 'れんごくてんま',
  'ロック鳥': 'ロックちょう',
  '黒竜丸': 'こくりゅうまる',
  'ウルベア魔神兵': 'ウルベアましんへい',
  '水竜ギルギッシュ': 'すいりゅうギルギッシュ',
  '妖剣士オーレン': 'ようけんしオーレン',
  '神竜': 'しんりゅう',
  '火炎斬り': 'かえんぎり',
  'れっぱ斬り': 'れっぱぎり',
  'ふうえんの剣技': 'ふうえんのけんぎ',
  'ふうらいの剣技': 'ふうらいのけんぎ',
  'ばくひょうの剣技': 'ばくひょうのけんぎ',
  'びゃくやの剣技': 'びゃくやのけんぎ',
  'メダパニ斬り': 'メダパニぎり',
  'だつりょく斬り': 'だつりょくぎり',
  '魔神斬り': 'まじんぎり',
};

async function readingOf(name) {
  const normalizedName = name.normalize('NFKC');
  return READING_OVERRIDES[normalizedName] ?? kuroshiro.convert(name, {
    to: 'hiragana',
    mode: 'normal',
  });
}

const sources = {
  monster: { file: 'monsters.json', nameKey: '名前' },
  attribute: { file: 'attributes.json', nameKey: 'name' },
  skill: { file: 'skills.json', nameKey: 'name' },
  ability: { file: 'abilities.json', nameKey: 'name' },
};

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

const readings = {};
const labels = new Set([
  'スライム系', 'ドラゴン系', '魔獣系', '自然系', '悪魔系', 'ゾンビ系', '物質系', '？？？系',
  'スモールボディ', 'スタンダードボディ', 'メガボディ', 'ギガボディ', '超ギガボディ',
  'メラ', 'ギラ', 'イオ', 'バギ', 'ヒャド', 'ジバリア', 'デイン', 'ドルマ', 'ベタン',
  '炎', '吹雪', 'ザキ', 'どく', '呪い', 'マインド', 'こんらん', 'マヒ', 'ねむり',
  'マヌーサ', 'マホトラ', 'ハック', '呪文封じ', '斬撃封じ', '体技封じ', '息封じ',
  '踊り封じ', 'ダウン', 'ルカニ', 'ボミエ', 'フール',
  '剣', 'ヤリ', 'オノ', 'ハンマー', 'ムチ', 'ツメ', '杖',
  '攻撃力', '守備力', '素早さ', '賢さ',
]);
for (const [kind, source] of Object.entries(sources)) {
  const entries = JSON.parse(fs.readFileSync(path.join(dataDir, source.file), 'utf8'));
  readings[kind] = {};
  for (const entry of entries) {
    const name = entry[source.nameKey];
    labels.add(name);
    readings[kind][entry.id] = await readingOf(name);
    if (kind === 'monster') {
      for (const key of [
        '新生前特性1', '新生前特性2', '特性25', '特性50', '特性100', 'メガ特性', 'ギガ特性', '超ギガ特性',
      ]) {
        if (entry[key]) labels.add(entry[key]);
      }
    }
    if (kind === 'skill') {
      for (const item of entry.composition) labels.add(item.name);
    }
  }
}

readings.labels = {};
for (const label of labels) {
  readings.labels[label.normalize('NFKC')] = await readingOf(label);
}

fs.writeFileSync(outputPath, JSON.stringify(readings), 'utf8');
console.log(`search readings: ${outputPath}`);
