// 外部のモンスター一覧ページから各モンスターのアイコン画像を取得し、
// public/data/monster-icons/<図鑑No>.png として保存する。
// アイコンは base（性格違いを除いた素のモンスター名）単位なので、図鑑No 単位で1枚に集約する。
// 取得元ページのURLは環境変数 MONSTER_ICON_SOURCE_URL で指定する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const SOURCE_URL = process.env.MONSTER_ICON_SOURCE_URL;
const OUT_DIR = path.join(projectRoot, 'public', 'data', 'monster-icons');
const MONSTERS_JSON = path.join(projectRoot, 'public', 'data', 'monsters.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; iruluka-sp-icon-fetch/1.0)';
const CONCURRENCY = 8;

/** 取得元と当サイトで表記が異なるモンスターの対応（当サイト名 → 取得元の名前） */
const NAME_ALIASES = {
  キャラピラー: 'キャタピラー',
  どんぐりベビー: 'どんぐりヘビー',
  ミストウイング: 'ミストウィング',
};

/** 名前の表記揺れ（全角半角・中黒・空白）を吸収する */
function normalizeName(name) {
  return name.normalize('NFKC').replace(/[\s・･·]/g, '');
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`取得失敗 (${res.status}): ${url}`);
  return res.text();
}

/** HTMLから「正規化した名前 → アイコンURL」を作る（30pxのモンスターアイコンのみ対象） */
function parseIconMap(html) {
  const map = new Map();
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    const width = tag.match(/width="(\d+)"/)?.[1];
    if (width !== '30') continue;
    const name = tag.match(/alt="([^"]*?)画像"/)?.[1];
    const src = tag.match(/data-src="(https?:\/\/[^"]+)"/)?.[1];
    if (name && src) map.set(normalizeName(name), src);
  }
  return map;
}

async function downloadIcon(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`画像取得失敗 (${res.status}): ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

async function runPool(tasks, worker, concurrency) {
  let index = 0;
  async function next() {
    while (index < tasks.length) {
      const current = index++;
      await worker(tasks[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, next));
}

async function main() {
  if (!SOURCE_URL) {
    throw new Error('取得元ページのURLを環境変数 MONSTER_ICON_SOURCE_URL で指定してください。');
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('一覧ページを取得中…');
  const html = await fetchText(SOURCE_URL);
  const iconMap = parseIconMap(html);
  console.log(`アイコン候補: ${iconMap.size} 件`);

  const monsters = JSON.parse(fs.readFileSync(MONSTERS_JSON, 'utf8'));
  // 図鑑No 単位に集約（最初に現れた base 名を採用）
  const byNo = new Map();
  for (const m of monsters) {
    if (!byNo.has(m.no)) byNo.set(m.no, m.base);
  }

  const targets = [];
  const missing = [];
  for (const [no, base] of byNo) {
    const aliased = NAME_ALIASES[base] ?? base;
    const url = iconMap.get(normalizeName(aliased));
    if (url) targets.push({ no, url });
    else missing.push(base);
  }
  console.log(`対応付け: ${targets.length}/${byNo.size} 体（未マッチ: ${missing.length}）`);
  if (missing.length) console.log('未マッチ:', missing.join(', '));

  let done = 0;
  let skipped = 0;
  await runPool(
    targets,
    async ({ no, url }) => {
      const dest = path.join(OUT_DIR, `${no}.png`);
      if (fs.existsSync(dest)) {
        skipped++;
        return;
      }
      await downloadIcon(url, dest);
      done++;
      if (done % 50 === 0) console.log(`  ダウンロード ${done} 件…`);
    },
    CONCURRENCY,
  );

  console.log(`完了: 新規 ${done} 件 / スキップ(既存) ${skipped} 件 → ${path.relative(projectRoot, OUT_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
