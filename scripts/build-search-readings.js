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
    readings[kind][entry.id] = await kuroshiro.convert(name, {
      to: 'hiragana',
      mode: 'normal',
    });
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
  readings.labels[label.normalize('NFKC')] = await kuroshiro.convert(label, {
    to: 'hiragana',
    mode: 'normal',
  });
}

fs.writeFileSync(outputPath, JSON.stringify(readings), 'utf8');
console.log(`search readings: ${outputPath}`);
