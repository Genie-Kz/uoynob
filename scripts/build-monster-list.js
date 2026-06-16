// public/data/monsters.json（全フィールド）から、一覧画面用の軽量
// public/data/monsters-list.json を生成する。
// monsters.json を更新したら本スクリプトも再実行すること。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(scriptDir, '..', 'public', 'data');

// MonsterListItem（src/types/monster.ts）に対応するフィールドだけ抜き出す
const LIST_FIELDS = ['id', 'no', 'variant', '名前', '位階', 'ランク', '系統', 'サイズ特性'];

const monsters = JSON.parse(fs.readFileSync(path.join(dataDir, 'monsters.json'), 'utf8'));
const list = monsters.map((monster) =>
  Object.fromEntries(LIST_FIELDS.map((field) => [field, monster[field]])),
);

fs.writeFileSync(path.join(dataDir, 'monsters-list.json'), JSON.stringify(list), 'utf8');
console.error(`monsters-list: ${list.length}`);
