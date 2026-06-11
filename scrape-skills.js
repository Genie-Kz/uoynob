// Web Archive から DQM2SP のスキルデータ(425件)を取得して data/skills.json を生成する
const fs = require('fs');
const path = require('path');

const SNAP = '20240919003208';
const BASE = 'https://web.archive.org/web/';
const OUT = path.join(__dirname, 'data', 'skills.json');
const TOTAL = 425;
const CONCURRENCY = 8;

function pad3(n) { return String(n).padStart(3, '0'); }

async function fetchPage(id) {
  const idp = pad3(id);
  const urls = [
    BASE + SNAP + '/https://bonyou.info/dqm2sp/skill/detail/?id=' + idp,
    BASE + '2024/https://bonyou.info/dqm2sp/skill/detail/?id=' + idp
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (r.ok) {
        const html = await r.text();
        if (html.indexOf('スキル構成') >= 0) return html;
      }
    } catch (e) { /* retry next */ }
  }
  return null;
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}
function clean(s) { return decodeEntities(s).replace(/\s+/g, ' ').trim(); }

function parse(html, id) {
  // 名前
  let name = '';
  let m = html.match(/<meta property="og:title" content="([^"]*?)\s*-\s*スキル/);
  if (m) name = clean(m[1]);

  // カテゴリー
  let category = '';
  m = html.match(/カテゴリー<\/h6>([\s\S]*?)<\/div>\s*<\/div>/);
  if (m) category = clean(m[1].replace(/<[^>]*>/g, ' '));

  // スキル構成（このスキルを持つモンスター の手前まで）※カード見出しを正確に狙う
  const start = html.indexOf('card-header bg-light">スキル構成</h6>');
  const endMon = html.indexOf('card-header bg-light">このスキルを持つモンスター</h6>');
  let composition = [];
  if (start >= 0) {
    const seg = html.slice(start, endMon > start ? endMon : start + 8000);
    const re = /<a href="[^"]*\/(ability|attribute)\/detail\/\?id=(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
    let a;
    while ((a = re.exec(seg)) !== null) {
      composition.push({ type: a[1], aid: a[2], name: clean(a[3].replace(/<[^>]*>/g, '')) });
    }
  }

  // このスキルを持つモンスター
  let monsters = [];
  if (endMon >= 0) {
    const seg = html.slice(endMon, endMon + 12000);
    const re = /<a href="[^"]*\/monster\/detail\/\?id=([0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let a;
    while ((a = re.exec(seg)) !== null) {
      monsters.push({ id: a[1], name: clean(a[2].replace(/<[^>]*>/g, '')) });
    }
  }

  return { id: pad3(id), name, category, composition, monsters };
}

async function main() {
  const results = new Array(TOTAL).fill(null);
  const failed = [];
  let next = 1;
  async function worker() {
    while (next <= TOTAL) {
      const id = next++;
      const html = await fetchPage(id);
      if (!html) { failed.push(id); process.stderr.write('!'); continue; }
      results[id - 1] = parse(html, id);
      if (id % 25 === 0) process.stderr.write(' ' + id + ' ');
      else process.stderr.write('.');
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const ok = results.filter(Boolean);
  fs.writeFileSync(OUT, JSON.stringify(ok), 'utf8');
  console.error('\n--- done. ok=' + ok.length + ' failed=' + failed.length + (failed.length ? ' [' + failed.join(',') + ']' : ''));
}
main();
