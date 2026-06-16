// Web Archive から DQM2SP の特性(294件)・特技(303件)データを取得し、
// public/data/attributes.json / abilities.json を生成する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SNAP = '20240919003208';
const BASE = 'https://web.archive.org/web/';
const CONCURRENCY = 8;

function pad3(n) {
  return String(n).padStart(3, '0');
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** タグを除去し空白を1つに（改行も詰める） */
function clean(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** 改行を保持してタグ除去（説明文用） */
function cleanMultiline(s) {
  return decodeEntities(s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 指定見出しのカード本文（次のカード見出しまで）を取り出す */
function sectionAfter(html, headerLabel) {
  const marker = `card-header bg-light">${headerLabel}</h6>`;
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const from = start + marker.length;
  const next = html.indexOf('<h6 class="card-header', from);
  return next < 0 ? html.slice(from) : html.slice(from, next);
}

/** pre-wrap span の説明文を改行付きで取り出す */
function extractDescription(html, headerLabel) {
  const segment = sectionAfter(html, headerLabel);
  const spans = [...segment.matchAll(/<span[^>]*white-space:\s*pre-wrap[^>]*>([\s\S]*?)<\/span>/g)];
  if (spans.length)
    return spans
      .map((m) => cleanMultiline(m[1]))
      .join('\n')
      .trim();
  return cleanMultiline(segment);
}

/** セクション内の monster / skill 詳細リンクを取り出す */
function extractLinks(html, headerLabel, kind) {
  const segment = sectionAfter(html, headerLabel);
  const re = new RegExp(
    `<a href="[^"]*\\/${kind}\\/detail\\/\\?id=([0-9-]+)"[^>]*>([\\s\\S]*?)<\\/a>`,
    'g',
  );
  const out = [];
  let m;
  while ((m = re.exec(segment)) !== null) {
    out.push({ id: m[1], name: clean(m[2]) });
  }
  return out;
}

function extractName(html, kindLabel) {
  const m = html.match(
    new RegExp(`<meta property="og:title" content="([^"]*?)\\s*-\\s*${kindLabel}`),
  );
  return m ? clean(m[1]) : '';
}

async function fetchPage(kind, id) {
  const idp = pad3(id);
  const urls = [
    `${BASE}${SNAP}/https://bonyou.info/dqm2sp/${kind}/detail/?id=${idp}`,
    `${BASE}2024/https://bonyou.info/dqm2sp/${kind}/detail/?id=${idp}`,
  ];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (response.ok) {
        const html = await response.text();
        if (html.includes('card-header bg-light">カテゴリー</h6>')) return html;
      }
    } catch {
      /* 次のURLを試す */
    }
  }
  return null;
}

function parseAttribute(html, id) {
  return {
    id: pad3(id),
    name: extractName(html, '特性'),
    category: clean(sectionAfter(html, 'カテゴリー')),
    description: extractDescription(html, '説明'),
    descriptionSp: extractDescription(html, '説明（ＳＰ）'),
    monsters: extractLinks(html, 'この特性を持つモンスター', 'monster'),
    skills: extractLinks(html, 'この特性を持つスキル', 'skill'),
  };
}

function parseAbility(html, id) {
  return {
    id: pad3(id),
    name: extractName(html, '特技'),
    category: clean(sectionAfter(html, 'カテゴリー')),
    description: extractDescription(html, '説明'),
    skills: extractLinks(html, 'この特技を覚えるスキル', 'skill'),
  };
}

async function scrape(kind, total, parser, outFile) {
  const results = new Array(total).fill(null);
  const failed = [];
  let next = 1;

  async function worker() {
    while (next <= total) {
      const id = next++;
      const html = await fetchPage(kind, id);
      if (!html) {
        failed.push(id);
        process.stderr.write('!');
        continue;
      }
      results[id - 1] = parser(html, id);
      process.stderr.write(id % 25 === 0 ? ` ${id} ` : '.');
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const ok = results.filter(Boolean);
  fs.writeFileSync(
    path.join(scriptDir, '..', 'public', 'data', outFile),
    JSON.stringify(ok),
    'utf8',
  );
  console.error(
    `\n[${kind}] ok=${ok.length} failed=${failed.length}${failed.length ? ` [${failed.join(',')}]` : ''}`,
  );
}

await scrape('attribute', 294, parseAttribute, 'attributes.json');
await scrape('ability', 303, parseAbility, 'abilities.json');
