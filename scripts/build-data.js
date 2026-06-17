// 凡庸なイルルカSP 再現サイト用 データ整形スクリプト
// 元データ(MonsterData.json) → public/data/monsters.json へ id 等を付与して書き出す
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toMonsterListItem } from './monster-list-fields.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || 'D:/Downloads/MonsterData.json';
const OUT = path.join(scriptDir, '..', 'public', 'data', 'monsters.json');
const LIST_OUT = path.join(scriptDir, '..', 'public', 'data', 'monsters-list.json');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// 名前から本体名と性格を分離（例: モントナー(ふつう) → base:モントナー, personality:ふつう）
function splitName(name) {
  const m = name.match(/^(.*?)[（(]([^（）()]*)[）)]\s*$/);
  if (m) return { base: m[1].trim(), personality: m[2].trim() };
  return { base: name.trim(), personality: '' };
}

// 位階ごとに連番(variant)を振って id を生成: 位階3桁-連番
const counters = {};
const out = raw.map((m) => {
  const rank = m['位階'];
  counters[rank] = (counters[rank] || 0) + 1;
  const variant = counters[rank];
  const id = String(rank).padStart(3, '0') + '-' + variant;
  const { base, personality } = splitName(m['名前']);
  return { id, no: String(rank).padStart(3, '0'), variant, base, personality, ...m };
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), 'utf8');
fs.writeFileSync(LIST_OUT, JSON.stringify(out.map(toMonsterListItem)), 'utf8');

console.log('monsters:', out.length);
console.log('monsters-list:', out.length);
console.log('sample:', JSON.stringify(out[0]).slice(0, 200));
console.log('last:', out[out.length - 1].id, out[out.length - 1].base);
console.log('max variant per 位階 (001):', counters[1]);
