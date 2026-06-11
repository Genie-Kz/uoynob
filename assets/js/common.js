/* 凡庸なイルルカSP（再現・クライアントサイド版） 共通スクリプト
 * 元サイトはサーバーサイドAPIでモンスター検索等を行っていたが、
 * ここでは data/monsters.json を読み込み、すべてブラウザ内(クライアントサイド)で処理する。 */
(function (global) {
  'use strict';

  // 各ページが <script>window.SITE_ROOT="../"</script> でサイトルートへの相対パスを指定する
  var ROOT = global.SITE_ROOT || './';

  /* ---- 定数 ---- */
  // 耐性30種（表示順）
  var RES_ELEMENTS = [
    'メラ', 'ギラ', 'イオ', 'バギ', 'ヒャド', 'ジバリア', 'デイン', 'ドルマ', 'ベタン', '炎',
    '吹雪', 'ザキ', 'どく', '呪い', 'マインド', 'こんらん', 'マヒ', 'ねむり', 'マヌーサ', 'マホトラ',
    'ハック', '呪文封じ', '斬撃封じ', '体技封じ', '息封じ', '踊り封じ', 'ダウン', 'ルカニ', 'ボミエ', 'フール'
  ];

  // 耐性の強さ順位（小さいほど弱い）
  var RES_RANK = { '弱点': -1, '普通': 0, '軽減': 1, '半減': 2, '激減': 3, '無効': 4, '回復': 5, '反射': 6 };

  // 耐性の段階（ビルドシミュレーター用 0始まり）: 弱点0 / 普通1 / 軽減2 / 半減3 / 激減4 / 無効5 / 回復6 / 反射7
  var RES_LEVEL_NAMES = ['弱点', '普通', '軽減', '半減', '激減', '無効', '回復', '反射'];
  var RES_LEVEL = {}; RES_LEVEL_NAMES.forEach(function (n, i) { RES_LEVEL[n] = i; });
  function levelOf(name) { return RES_LEVEL[name] != null ? RES_LEVEL[name] : 1; }
  function nameOfLevel(i) { return RES_LEVEL_NAMES[Math.max(0, Math.min(RES_LEVEL_NAMES.length - 1, i))]; }
  // 表示テキスト（普通は「-」、弱点は「弱い」）
  var RES_DISPLAY = { '普通': '-', '弱点': '弱い', '軽減': '軽減', '半減': '半減', '激減': '激減', '無効': '無効', '回復': '回復', '反射': '反射' };
  // 色分けクラス
  var RES_CLASS = { '弱点': 'weak', '軽減': 'reduce-little', '半減': 'reduce-half', '激減': 'reduce-large', '無効': 'invalid', '回復': 'recover', '反射': 'reflect' };

  // 特性フィールド（モンスターが持つ特性の一覧を取り出す対象）
  var TRAIT_FIELDS = ['新生前特性1', '新生前特性2', '特性25', '特性50', '特性100', 'メガ特性', 'ギガ特性', '超ギガ特性'];

  // 武器
  var WEAPONS = ['剣', 'ヤリ', 'オノ', 'ハンマー', 'ムチ', 'ツメ', '杖'];

  // 系統 日本語 → slug / クラス
  var LINEAGE = {
    'スライム': { slug: 'slime', cls: 'lineage-slime', label: 'スライム系' },
    'ドラゴン': { slug: 'dragon', cls: 'lineage-dragon', label: 'ドラゴン系' },
    '魔獣': { slug: 'beast', cls: 'lineage-beast', label: '魔獣系' },
    '自然': { slug: 'nature', cls: 'lineage-nature', label: '自然系' },
    '悪魔': { slug: 'devil', cls: 'lineage-devil', label: '悪魔系' },
    'ゾンビ': { slug: 'zombie', cls: 'lineage-zombie', label: 'ゾンビ系' },
    '物質': { slug: 'material', cls: 'lineage-material', label: '物質系' },
    '???': { slug: 'special', cls: 'lineage-special', label: '？？？系' }
  };
  var LINEAGE_BY_SLUG = {};
  Object.keys(LINEAGE).forEach(function (k) { LINEAGE_BY_SLUG[LINEAGE[k].slug] = k; });

  // サイズ 日本語 → slug
  var SIZE = {
    'スモールボディ': 'small', 'スタンダードボディ': 'standard', 'メガボディ': 'mega',
    'ギガボディ': 'giga', '超ギガボディ': 'super-giga'
  };
  var SIZE_BY_SLUG = {};
  Object.keys(SIZE).forEach(function (k) { SIZE_BY_SLUG[SIZE[k]] = k; });

  // ランク 日本語表記（全角）
  var RANKS = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
  var RANK_FULL = { 'SS': 'ＳＳ', 'S': 'Ｓ', 'A': 'Ａ', 'B': 'Ｂ', 'C': 'Ｃ', 'D': 'Ｄ', 'E': 'Ｅ', 'F': 'Ｆ' };

  // 「〇〇ガード＋」特性 → 耐性要素 への対応
  function guardElement(guardName) {
    var b = guardName.replace(/ガード＋$/, '');
    if (b === '炎ブレス') return '炎';
    if (b === '吹雪ブレス') return '吹雪';
    if (b === 'マホトーン') return '呪文封じ';
    return b;
  }

  // ボディサイズごとの特性枠数
  var SIZE_SLOTS = { 'スモールボディ': 6, 'スタンダードボディ': 6, 'メガボディ': 7, 'ギガボディ': 8, '超ギガボディ': 9 };
  // ボディサイズごとのスキル枠数
  var SKILL_SLOTS = { 'スモールボディ': 3, 'スタンダードボディ': 3, 'メガボディ': 4, 'ギガボディ': 5, '超ギガボディ': 6 };

  /* ---- データ読み込み（キャッシュ付き） ---- */
  var _cache = null;
  function loadMonsters() {
    if (_cache) return Promise.resolve(_cache);
    return fetch(ROOT + 'data/monsters.json')
      .then(function (r) { if (!r.ok) throw new Error('データ取得失敗: ' + r.status); return r.json(); })
      .then(function (data) { _cache = data; return data; });
  }
  var _skills = null;
  function loadSkills() {
    if (_skills) return Promise.resolve(_skills);
    return fetch(ROOT + 'data/skills.json')
      .then(function (r) { if (!r.ok) throw new Error('スキルデータ取得失敗: ' + r.status); return r.json(); })
      .then(function (data) { _skills = data; return data; });
  }

  /* ---- ヘルパー ---- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function lineageInfo(jp) { return LINEAGE[jp] || { slug: 'special', cls: 'lineage-special', label: jp }; }
  function resClass(v) { return RES_CLASS[v] || ''; }
  function resDisplay(v) { return RES_DISPLAY[v] != null ? RES_DISPLAY[v] : (v || '-'); }
  function resRank(v) { return RES_RANK[v] != null ? RES_RANK[v] : 0; }

  // モンスターの持つ特性一覧（重複・空を除く）
  function traitsOf(m) {
    var seen = {}, out = [];
    TRAIT_FIELDS.forEach(function (f) {
      var v = m[f];
      if (v && !seen[v]) { seen[v] = 1; out.push(v); }
    });
    return out;
  }
  // 装備可能な武器のリスト（〇のもの）
  function weaponsOf(m) { return WEAPONS.filter(function (w) { return m[w] === '〇'; }); }

  // アイコン代替（著作権配慮のプレースホルダー：系統色＋No.）
  function iconHtml(m) {
    var info = lineageInfo(m['系統']);
    return '<span class="mon-icon ' + info.cls + '" title="' + esc(info.label) + '">' + esc(m.no) + '</span>';
  }

  function detailUrl(m) { return ROOT + 'monster/detail/?id=' + encodeURIComponent(m.id); }
  function buildUrl(m) { return ROOT + 'simulator-monster-build/build/?id=' + encodeURIComponent(typeof m === 'string' ? m : m.id); }

  // 耐性グリッド（元サイト準拠：3列、耐性名＝グレー背景で上、値＝色付きで下）
  // getCell(el) は {cls, html} を返す
  function buildResGrid(getCell) {
    var html = '<div class="card"><div class="col card-body py-2">';
    for (var i = 0; i < RES_ELEMENTS.length; i += 3) {
      html += '<div class="row">';
      for (var j = 0; j < 3 && (i + j) < RES_ELEMENTS.length; j++) {
        var el = RES_ELEMENTS[i + j];
        var c = getCell(el) || { cls: '', html: '' };
        html += '<div class="col-4' + (j > 0 ? ' border-left' : '') + '">' +
          '<div class="row bg-light"><span class="mx-auto"><small>' + esc(el) + '</small></span></div>' +
          '<hr class="my-1">' +
          '<div class="row"><span class="mx-auto ' + c.cls + '">' + c.html + '</span></div>' +
          '</div>';
      }
      html += '</div>';
      if (i + 3 < RES_ELEMENTS.length) html += '<hr class="my-2">';
    }
    html += '</div></div>';
    return html;
  }

  /* ---- 共通レイアウト描画 ---- */
  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML =
      '<header><div class="text-center m-4"><h5>' +
      '<a href="' + ROOT + '" style="font-weight:bold;">凡庸な イルルカSP</a>' +
      '</h5></header>';
  }

  // カテゴリナビ（折りたたみカード）。アコーディオンを開くと各項目が縦1行ずつ表示される（元サイト準拠）。
  function navCard(id, title, sections) {
    var flat = [].concat.apply([], sections);
    var items = flat.map(function (it) {
      var inner = it.href
        ? '<a class="stretched-link" href="' + it.href + '">' + esc(it.label) + '</a>'
        : '<span class="text-muted" title="このデータは未提供です（本サイトはモンスターデータを収録）">' + esc(it.label) + '</span>';
      return '<li class="list-group-item"><div class="row mr-2 px-2"><div class="col-lg">' + inner + '</div></div></li>';
    }).join('');
    return '' +
      '<div class="card my-2">' +
      '<div class="card-header p-0" id="h-' + id + '">' +
      '<h6 class="mb-0"><a href="#c-' + id + '" class="text-body d-block p-2" data-toggle="collapse" role="button" aria-expanded="false">' + esc(title) + '</a></h6>' +
      '</div>' +
      '<div id="c-' + id + '" class="collapse"><ul class="list-group list-group-flush">' + items + '</ul></div>' +
      '</div>';
  }

  function buildNavLinks() {
    var mon = ROOT + 'monster/';
    var rankItems = RANKS.map(function (r) { return { label: RANK_FULL[r], href: mon + '?rank=' + r.toLowerCase() }; });
    var lineageItems = ['スライム', 'ドラゴン', '魔獣', '自然', '悪魔', 'ゾンビ', '物質', '???'].map(function (jp) {
      return { label: LINEAGE[jp].label, href: mon + '?lineage=' + LINEAGE[jp].slug };
    });
    var sizeItems = Object.keys(SIZE).map(function (jp) { return { label: jp, href: mon + '?size=' + SIZE[jp] }; });

    return [
      navCard('monster', 'モンスター', [
        [{ label: 'すべて', href: mon }],
        rankItems,
        lineageItems,
        sizeItems
      ]),
      navCard('attribute', '特性', [[
        { label: 'すべて' }, { label: '特性効果系' }, { label: 'パラメータ系' }, { label: '耐性系' }
      ]]),
      navCard('ability', '特技', [[
        { label: 'すべて' }, { label: '呪文' }, { label: '斬撃' }, { label: '体技' }, { label: '踊り' }, { label: 'ブレス・ふえ' }, { label: 'その他' }
      ]]),
      navCard('skill', 'スキル', [[
        { label: 'すべて', href: ROOT + 'skill/' },
        { label: '特技系', href: ROOT + 'skill/?cat=ability' },
        { label: 'パラメータ系', href: ROOT + 'skill/?cat=parameter' }
      ]]),
      navCard('pickup', 'ピックアップ', [[
        { label: '転生モンスター' }, { label: 'ご当地スキル' }, { label: 'キラー系スキル' },
        { label: '呪文耐性スキル' }, { label: 'ブレス耐性スキル' }, { label: '状態耐性スキル' },
        { label: '封じ耐性スキル' }, { label: '弱体耐性スキル' }, { label: 'パラメータ上昇スキル' }, { label: 'れんぞく回数' }
      ]]),
      navCard('tool', 'ツール', [[
        { label: 'ビルドシミュレーター', href: ROOT + 'simulator-monster-build/' },
        { label: 'モンスター検索', href: ROOT + 'search-monster/' }
      ]])
    ].join('');
  }

  function renderNav() {
    var el = document.getElementById('site-nav');
    if (!el) return;
    var search =
      '<form class="form-inline input-group mb-2" action="' + ROOT + 'monster/">' +
      '<input class="form-control" type="text" name="q" placeholder="モンスター名で検索" aria-label="Search" required>' +
      '<div class="input-group-append"><button class="btn btn-outline-secondary" type="submit">検索</button></div>' +
      '</form>';
    el.innerHTML = search + buildNavLinks();
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML =
      '<footer class="container-fluid mt-4 pt-3 border-top text-center">' +
      '<p class="mb-1"><a href="' + ROOT + '">home</a></p>' +
      '<p class="mb-1"><small>このサイトは「凡庸な イルルカSP」(bonyou.info/dqm2sp) のクライアントサイド再現版です。' +
      'サーバーサイド処理はすべてブラウザ内で動作します。</small></p>' +
      '<p class="mb-1"><small>このページで利用しているデータに関する画像等の著作権は株式会社スクウェア・エニックスを代表とする共同著作者に帰属します。</small></p>' +
      '<p class="mb-0"><small>&copy; ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.</small></p>' +
      '</footer>';
  }

  function renderPageTop() {
    if (document.getElementById('page_top')) return;
    var d = document.createElement('div');
    d.id = 'page_top';
    d.innerHTML = '<a href="#" aria-label="ページ上部へ">▲</a>';
    d.querySelector('a').addEventListener('click', function (e) {
      e.preventDefault(); global.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(d);
  }

  // タイトル・ナビ・フッターを差し込む
  function layout() {
    renderHeader();
    renderNav();
    renderFooter();
    renderPageTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', layout);
  } else {
    layout();
  }

  /* ---- 公開API ---- */
  global.Bonyou = {
    ROOT: ROOT,
    RES_ELEMENTS: RES_ELEMENTS, RES_RANK: RES_RANK, RES_DISPLAY: RES_DISPLAY, RES_CLASS: RES_CLASS,
    TRAIT_FIELDS: TRAIT_FIELDS, WEAPONS: WEAPONS,
    LINEAGE: LINEAGE, LINEAGE_BY_SLUG: LINEAGE_BY_SLUG,
    SIZE: SIZE, SIZE_BY_SLUG: SIZE_BY_SLUG, RANKS: RANKS, RANK_FULL: RANK_FULL,
    RES_LEVEL_NAMES: RES_LEVEL_NAMES, RES_LEVEL: RES_LEVEL, levelOf: levelOf, nameOfLevel: nameOfLevel,
    SIZE_SLOTS: SIZE_SLOTS, SKILL_SLOTS: SKILL_SLOTS, guardElement: guardElement,
    loadMonsters: loadMonsters, loadSkills: loadSkills,
    esc: esc, lineageInfo: lineageInfo, resClass: resClass, resDisplay: resDisplay, resRank: resRank,
    traitsOf: traitsOf, weaponsOf: weaponsOf, iconHtml: iconHtml, detailUrl: detailUrl,
    buildUrl: buildUrl, buildResGrid: buildResGrid
  };
})(window);
