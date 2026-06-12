// Web Archive から DQM2SP の「ピックアップ」各ページを取得し、public/data/pickups.json を生成する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://web.archive.org/web/2024/https://bonyou.info/dqm2sp/';

/** 取得対象。type で描画方法を切り替える。 */
const PICKUPS = [
  { key: 'monster-reincarnation', title: '転生モンスター', type: 'monsters' },
  { key: 'skill-local', title: 'ご当地スキル', type: 'skills' },
  { key: 'skill-killer', title: 'キラー系スキル', type: 'skills' },
  { key: 'skill-resistance-spell', title: '呪文耐性スキル', type: 'skills' },
  { key: 'skill-resistance-breath', title: 'ブレス耐性スキル', type: 'skills' },
  { key: 'skill-resistance-condition', title: '状態耐性スキル', type: 'skills' },
  { key: 'skill-resistance-seal', title: '封じ耐性スキル', type: 'skills' },
  { key: 'skill-resistance-weaken', title: '弱体耐性スキル', type: 'skills' },
  { key: 'skill-parameter-up', title: 'パラメータ上昇スキル', type: 'skills' },
  { key: 'number-of-consecutive-times', title: 'れんぞく回数', type: 'monster-groups' },
];

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
function clean(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function mainContent(html) {
  const m = html.match(/<main[^>]*>([\s\S]*)<\/main>/);
  return m ? m[1] : html;
}

/** 指定種別の詳細リンクを抽出。id ごとに「名前らしい（数字でない）テキスト」を採用してユニーク化。 */
function extractRefs(segment, kind) {
  const re = new RegExp(`<a[^>]*href="[^"]*\\/${kind}\\/detail\\/\\?id=([0-9-]+)"[^>]*>([\\s\\S]*?)<\\/a>`, 'g');
  const byId = new Map();
  let m;
  while ((m = re.exec(segment)) !== null) {
    const id = m[1];
    const text = clean(m[2]);
    if (!text) continue;
    const existing = byId.get(id);
    // 数字だけ（No.表記）よりも、名前テキストを優先
    if (!existing || (/^\d+$/.test(existing) && !/^\d+$/.test(text))) byId.set(id, text);
  }
  return [...byId.entries()].map(([id, name]) => ({ id, name }));
}

/** れんぞく回数ページ：見出しごとにモンスター表を分割して取り出す */
function extractMonsterGroups(html) {
  const content = mainContent(html);
  const headingRe = /<h[2-5][^>]*>\s*(れんぞく[\s\S]*?回[\s\S]*?)<\/h[2-5]>/g;
  const headings = [];
  let m;
  while ((m = headingRe.exec(content)) !== null) {
    headings.push({ label: clean(m[1]), index: m.index });
  }
  return headings.map((heading, i) => {
    const end = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const segment = content.slice(heading.index, end);
    return { label: heading.label, items: extractRefs(segment, 'monster') };
  });
}

async function fetchHtml(key) {
  const response = await fetch(`${BASE}${key}/`, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${key}`);
  return response.text();
}

async function main() {
  const result = {};
  for (const pickup of PICKUPS) {
    const html = await fetchHtml(pickup.key);
    const content = mainContent(html);
    if (pickup.type === 'skills') {
      result[pickup.key] = { title: pickup.title, type: 'skills', items: extractRefs(content, 'skill') };
    } else if (pickup.type === 'monsters') {
      result[pickup.key] = { title: pickup.title, type: 'monsters', items: extractRefs(content, 'monster') };
    } else {
      result[pickup.key] = { title: pickup.title, type: 'monster-groups', groups: extractMonsterGroups(html) };
    }
    const entry = result[pickup.key];
    const count = entry.items ? entry.items.length : entry.groups.reduce((sum, g) => sum + g.items.length, 0);
    console.error(`[${pickup.key}] ${pickup.title}: ${count} 件`);
  }
  fs.writeFileSync(path.join(scriptDir, '..', 'public', 'data', 'pickups.json'), JSON.stringify(result), 'utf8');
  console.error('done.');
}

await main();
