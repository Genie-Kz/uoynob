# 凡庸な イルルカSP（クライアントサイド再現版）

閉鎖した攻略サイト「**凡庸な イルルカSP**」（`bonyou.info/dqm2sp`）を、
**Vue 3 + TypeScript + Vite + Tailwind CSS** のSPAとして再現したプロジェクトです。
元サイトがサーバーサイドで処理していた機能（検索・ビルドシミュレーターなど）は、すべてブラウザ内（クライアントサイド）で動作します。

対象ゲーム：**ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP**

公開URL：<https://genie-kz.github.io/uoynob/>

---

## 技術スタック

| 種類           | 採用                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| フレームワーク | Vue 3（`<script setup>` + Composition API）                               |
| 言語           | TypeScript（strict / `noUncheckedIndexedAccess`）                         |
| ビルド         | Vite 8                                                                    |
| ルーティング   | Vue Router 5（ハッシュ方式。GitHub Pages のサブパス配信でも動作）         |
| CSS            | Tailwind CSS 4（`@tailwindcss/vite`・`@theme` でカスタムカラー定義）      |
| ユニットテスト | Vitest 4（+ jsdom・`@vitest/coverage-v8` でカバレッジ）                   |
| E2E テスト     | Playwright                                                                |
| リンター       | ESLint 10（Flat Config・eslint-plugin-vue / typescript-eslint）           |
| 整形           | Prettier 3（`eslint-config-prettier` で ESLint と非競合）                 |
| 型チェック     | vue-tsc 3                                                                 |
| コミット品質   | commitlint（規約コミット）＋ simple-git-hooks / lint-staged（pre-commit） |
| 依存更新       | Dependabot（npm / GitHub Actions を毎週チェック）                         |
| Node.js        | 24.16.0（`.nvmrc`）                                                       |
| CI/CD          | GitHub Actions → GitHub Pages                                             |

---

## セットアップ＆コマンド

```bash
npm install          # 依存インストール（git フックも自動セットアップ: prepare → simple-git-hooks）
npm run dev          # 開発サーバー（HMR）
npm run lint         # ESLint（--fix で自動修正: npm run lint:fix）
npm run format       # Prettier 整形（チェックのみ: npm run format:check）
npm run typecheck    # 型チェック（vue-tsc）
npm run test         # ユニットテスト（Vitest／カバレッジ: npm run test:coverage）
npm run test:e2e     # E2E テスト（Playwright／ユニット＋E2E: npm run test:all）
npm run build        # 型チェック＋本番ビルド（dist/）
npm run preview      # ビルド結果のプレビュー
```

コミット時は `pre-commit` フックで変更ファイルに `eslint --fix` + `prettier` がかかり、`commit-msg` フックで規約コミット（Conventional Commits）を検証します。

### データ再生成（任意）

表示データは `public/data/` 以下の静的JSON、モンスターアイコンは `public/data/monster-icons/` に置いています。
再取得が必要なときだけ以下を実行します。

```bash
npm run data:monsters -- "path/to/MonsterData.json"   # monsters.json を生成
npm run data:skills                                    # Web Archive から skills.json を生成
npm run data:traits-abilities                          # Web Archive から attributes.json / abilities.json を生成
npm run data:pickups                                   # Web Archive から pickups.json を生成
npm run data:icons                                     # monster-icons/<図鑑No>.png を取得（既存はスキップ）
npm run data:readings                                  # 検索用の読みがな辞書 search-readings.json を生成
```

> 武器データ（`weapons.json`）は `node scripts/build-weapons.js` で生成します。

収録件数の目安：モンスター 908 / 特性 294 / 特技 303 / スキル 425 / 武器 106 / モンスターアイコン 902。

---

## ディレクトリ構成

責務ごとにレイヤを分け、ロジックを UI から切り離してテスト可能にしています。

```
src/
├─ types/          型定義（Monster, Skill, Attribute, Ability, Pickup, Stats, Picker ...）
├─ constants/      定数（耐性・系統/サイズ分類・ビルド計算ルール・ステータス計算ルール・ナビ構成・ピックアップ分類・SP化ルール）
├─ domain/         純粋ロジック＋テスト(.test.ts)
│                  （耐性計算 buildSimulator / 実効耐性 effectiveResistance / ステータス計算 statsCalculator
│                    / 横断検索 siteSearch / モンスター検索 monsterSearch / ピックアップ分類 pickupGrouping
│                    / 共有URL codec buildShareCodec ...）
├─ shared/         画面をまたいで使う共通部品
│   ├─ ui/         汎用UI（AppHeader, AppFooter, SiteNavigation, ResistanceGrid, StatsBar, PickerModal, IconSelect, DataState ...）
│   ├─ icons/      アイコン解決（MonsterIcon, BodySizeIcon, lineageIcons, bodySizeIcons, traitIcons）
│   ├─ search/     検索の正規化・キーワード判定（normalization / textSearch）
│   └─ data/       データ取得層（静的JSONの読み込み＋Promiseキャッシュ datasets）
├─ features/       画面単位の状態管理・表示用VM・専用UI
│   ├─ monster-search/  検索オプションと一覧テーブル（searchOptions / MonsterTable）
│   ├─ pickup/          ピックアップ分類の表示用VM（pickupViewModel）
│   └─ simulator/       ビルドシミュレーターの状態・VM（useBuildSimulator / simulatorViewModel / DisadvantageTraits, FamilyTreeIv）
├─ composables/    横断的な状態ロジック（useMonsters / useSkills / useAttributes / useAbilities / useTheme / usePageSeo / useTraitLink）
├─ presentation/   表示用ビューモデル生成（耐性セル resistanceCells）
├─ views/          ルートから呼ぶ薄い画面（Home / MonsterList / MonsterDetail / SiteSearch / Search / Skill... / Pickup / Simulator...）
├─ router/         ルート定義（ハッシュ方式）＋ガード
└─ test/           テスト用フィクスチャ
scripts/             データ生成・スクレイピングスクリプト
e2e/                 Playwright E2E テスト
public/data/         表示用の静的JSONとモンスターアイコン
```

設計方針：純粋ロジックは `domain/` に集約して UI から独立させ、Vitest で単体テストします。
画面をまたぐ共通部品は `shared/`（UI・アイコン・検索・データ取得）に、画面単位の状態と表示用VM・専用UIは `features/` に置き、`views/` はそれらを組み立てる薄いページに保ちます。
変数名・関数名は意図が読み取れる名前（例: `computeBuildResistances`, `computeStats`, `clampFinalLevel`）に統一しています。

---

## 主な機能

- **トップ（ポータル）**：横断検索フォームとカテゴリのアコーディオン。検索すると候補一覧（または1件なら詳細）へ遷移します。
- **横断検索**：モンスター・特性・特技・スキルの名前をまとめて検索し、結果から各詳細ページへ直接遷移できます（全角／半角、ひらがな／カタカナを区別せずヒット）。
- **モンスター図鑑**：一覧（既定で全件・No.昇順、系統／サイズはアイコン表示）／詳細（特性・耐性・ステータス・装備・スキル）。特性はレベル帯ごとのアイコンで表示します。
- **モンスター検索**：耐性30種の閾値（○○以上）＋特性で絞り込み。
- **特性 / 特技 / スキル**：それぞれ一覧（カテゴリ絞り込み）と詳細（効果・関連モンスター／スキルなど）。
- **ピックアップ**：転生モンスター・ご当地スキル（入手元の神将別）・キラー系スキル・各種耐性スキル（得られるガード＋別）・パラメータ上昇スキル（ステータス別・上昇量降順）・れんぞく回数など、用途別に分類して表示します。
- **ビルドシミュレーター**：耐性ビルドとステータスを同時に組めるツール（後述）。
- **ダーク／ライトモード**：ヘッダーのボタンで切り替え。設定は `localStorage` に保存され、次回訪問時に復元します。

### モンスターアイコン

各モンスターのアイコンは `public/data/monster-icons/<図鑑No>.png` を表示します。画像が無い場合は系統色＋No.のプレースホルダーにフォールバックします。

---

## ビルドシミュレーター

検索 → モンスター選択 → ビルド画面、という流れで操作します。画面は2つのタブに分かれています。

- **ビルドタブ**：最終耐性をリアルタイム計算。ボディサイズ・特性・スキル・武器鍛冶を入れ替えモーダルで編集し、SP化のトグルも可能。スキルで追加される特性も表示します。
- **ステータス・系図タブ**：系図（14体の系統）・個体値・親レベル合計・装備（武器）・紋晶を編集します。

画面下部には常時表示のステータスバー（HP / MP / 攻撃力 / 守備力 / 素早さ / 賢さ）があり、折りたたみできます。
特性・スキル・武器鍛冶のステータス補正、系統ボーナス、個体値、親レベル、装備、紋晶、SP化を反映して各能力値を算出します。

ビルドタブ・ステータス系図タブの**全入力状態はURLクエリに保存**され、そのURLを共有すればビルドをそのまま復元できます。

---

## 耐性計算の仕様（`src/domain/buildSimulator.ts`）

耐性段階：弱点／普通／軽減／半減／激減／無効／回復／反射。内部では 弱点=0 … 反射=7 の数値で計算します。

- **実効耐性**：元データの耐性値は「スタンダードボディ・特性なし」の素の値です。図鑑などの初期表示では、本来のボディサイズ補正と既定特性を加味した実効耐性を表示します（`src/domain/effectiveResistance.ts`）。
- **ボディサイズ**：メガ +2／ギガ +3／超ギガ +4（状態異常系）。素データ基準に選択サイズの補正をそのまま加算します（スタンダード／スモールは 0）。枠数も連動（特性 6/6/7/8/9・スキル 3/3/4/5/6）。
- **特性**：全ガード＋（全耐性 +1）／メタル系（毒・呪い・混乱・マヒ・眠り +1、各1つまで）／こうどう（おそい +2・はやい -2・超はやい -4）。
- **スキル**：「○○ガード＋」1つにつき該当耐性 +2（重複可）。スキルはすべて習得済みの前提で計算します。
- **武器鍛冶**：別々の耐性を3つまで、各 +1。**この +1 は耐性計算の最後に適用**し、弱点による負の蓄積とは無関係に「弱点から一段階」引き上げます。
- **上限・下限**：
  - 属性耐性（メラ〜吹雪の11種）の上昇上限は「回復」です。
  - **属性以外の耐性は「無効」を超えても上昇でき**、超えた分は「無効+1」「無効+2」…と数値表記します（メタル等で元から「回復」のものも「無効+N」表記）。
  - **反射表記は元々持つモンスターのみ**で、下降補正を受けた場合は反射から下がります。上昇補正で反射段階まで戻った場合のみ、元々反射の耐性は「反射」と表示します。
  - 弱点を下回った分は内部的に蓄積され、それを上回るまで弱点のままになります。

これらのルールは `src/domain/buildSimulator.test.ts` で網羅的にテストしています。

---

## GitHub Actions による CI/CD

`.github/workflows/ci.yml` が、push / PR で **Lint → 整形チェック → 型チェック → ユニットテスト → E2E（Playwright）→ ビルド** を実行します。
`main` への push では **GitHub Pages へ自動デプロイ**します（Node のバージョンは `.nvmrc` を参照）。

公開手順：

1. リポジトリに push する
2. **Settings → Pages → Source** を「**GitHub Actions**」に設定する
3. `main` への push で `https://<ユーザー名>.github.io/<リポジトリ名>/` に公開されます

`vite.config.ts` の `base: './'` とハッシュルーティングにより、リポジトリ名に依存せず動作します。

---

## 著作権・素材について

本プロジェクトは個人が作成した非公式のファンサイト（攻略データベースの再現）です。
ゲームに関する画像・データの著作権は、株式会社スクウェア・エニックスを代表とする共同著作者に帰属します。

> © ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.
