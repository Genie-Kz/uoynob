# 凡庸な イルルカSP

**凡庸な イルルカSP** は、閉鎖された攻略サイト `bonyou.info/dqm2sp` の体験を、ブラウザだけで動くSPAとして再構成したプロジェクトです。
対象ゲームは **ドラゴンクエストモンスターズ2 イルとルカの不思議な鍵SP** です。

元サイトがサーバー側で処理していた検索、詳細表示、ビルドシミュレーターの計算は、すべてクライアント側で実行します。
GitHub Pages で静的配信できるように、表示データは `public/data/` のJSONと画像として同梱しています。

公開URL：<https://genie-kz.github.io/uoynob/>

## このリポジトリで扱うもの

このリポジトリは、攻略データを閲覧するサイトと、耐性やステータスを試算するビルドシミュレーターを含みます。
実装は Vue 3、TypeScript、Vite、Tailwind CSS を中心に構成しています。

主な画面は次のとおりです。

- **トップ**：横断検索と主要カテゴリへの導線を表示します。
- **モンスター図鑑**：モンスターの一覧、詳細、特性、耐性、ステータス、装備、スキルを表示します。
- **モンスター検索**：耐性の閾値と特性からモンスターを絞り込みます。
- **サイト内検索**：モンスター、特性、特技、スキルをまとめて検索します。
- **特性一覧、特技一覧、スキル一覧**：各データの一覧と詳細を表示します。
- **ピックアップ**：転生モンスター、ご当地スキル、キラー系スキル、耐性スキル、パラメータ上昇スキルなどを用途別に表示します。
- **ビルドシミュレーター**：モンスター、サイズ、特性、スキル、武器鍛冶、系図、個体値、装備、紋晶を組み替えて、最終耐性とステータスを計算します。

検索では、全角と半角、ひらがなとカタカナの違いを吸収します。
たとえば表記ゆれがあっても、同じ名前として見つけやすいように正規化しています。

## セットアップ

Node.js は `.nvmrc` のバージョンを使います。
`package.json` の `engines` では Node.js 20.19.0 以上を要求しています。

```bash
npm install
npm run dev
```

開発サーバーを起動すると、Vite のローカルURLからサイトを確認できます。

### actionlint（GitHub Actions の検証）

GitHub Actions のワークフローを検証する [actionlint](https://github.com/rhysd/actionlint) を別途インストールしておきます。
`npm run lint:actions` と push 前フックがこのコマンドを利用します（CI 側では reviewdog 経由で実行するため、未インストールでも CI は動きます）。

```bash
# いずれかの方法でインストールする
go install github.com/rhysd/actionlint/cmd/actionlint@latest   # Go
brew install actionlint                                        # macOS / Linux (Homebrew)
scoop install actionlint                                       # Windows (Scoop)
```

## よく使うコマンド

| コマンド                  | 用途                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`             | 開発サーバーを起動する                                                  |
| `npm run build`           | 型チェック後に本番ビルドを作る                                          |
| `npm run preview`         | `dist/` のビルド結果を確認する                                          |
| `npm run lint`            | ESLint を実行する                                                       |
| `npm run lint:fix`        | ESLint で自動修正できる箇所を直す                                       |
| `npm run lint:actions`    | actionlint でワークフローを検証する                                     |
| `npm run format`          | Prettier で整形する                                                     |
| `npm run format:check`    | Prettier の整形差分を検査する                                           |
| `npm run typecheck`       | `vue-tsc` で型チェックを実行する                                        |
| `npm run test`            | Vitest のユニットテストを実行する                                       |
| `npm run test:coverage`   | ユニットテストのカバレッジを出力する                                    |
| `npm run test:e2e`        | Playwright のE2Eテストを実行する                                        |
| `npm run test:all`        | ユニットテストとE2Eテストをまとめて実行する                             |
| `npm run check`           | push 前の総合チェック（lint・整形・actionlint・ユニットテスト・ビルド） |
| `npm run storybook`       | Storybook を起動する                                                    |
| `npm run build-storybook` | Storybook を静的ビルドする                                              |

コミット時には `simple-git-hooks` と `lint-staged` が動きます。
変更されたファイルに対して ESLint と Prettier を実行し、コミットメッセージは Conventional Commits として検証します。
push 前には `actionlint`（`npm run lint:actions`）でワークフローを検証します。
そのほかの検査（lint・整形・型・テスト・ビルド）は重いため push 前フックには含めず、必要なときに `npm run check` でまとめて実行します。

## データ生成

通常の開発では、同梱済みの `public/data/` をそのまま使います。
元データを取り込み直す必要がある場合だけ、次のスクリプトを実行します。

| コマンド                               | 生成するもの                                      |
| -------------------------------------- | ------------------------------------------------- |
| `npm run data:monsters -- <json path>` | `public/data/monsters.json`                       |
| `npm run data:monster-list`            | モンスター一覧用の派生データ                      |
| `npm run data:skills`                  | `public/data/skills.json`                         |
| `npm run data:traits-abilities`        | `public/data/attributes.json` と `abilities.json` |
| `npm run data:pickups`                 | `public/data/pickups.json`                        |
| `npm run data:icons`                   | `public/data/monster-icons/*.png`                 |
| `npm run data:icons-webp`              | `public/data/monster-icons/*.webp`                |
| `npm run data:readings`                | `public/data/search-readings.json`                |

武器データは `node scripts/build-weapons.js` で生成します。
Web Archive から取得するスクリプトは、取得元の状態に影響を受けます。

## 技術構成

| 分類           | 採用技術                             |
| -------------- | ------------------------------------ |
| フレームワーク | Vue 3                                |
| 言語           | TypeScript                           |
| ビルド         | Vite                                 |
| ルーティング   | Vue Router のハッシュ履歴            |
| CSS            | Tailwind CSS                         |
| PWA            | `vite-plugin-pwa`                    |
| ユニットテスト | Vitest、jsdom、`@vitest/coverage-v8` |
| E2Eテスト      | Playwright                           |
| UI確認         | Storybook                            |
| リンター       | ESLint Flat Config                   |
| 整形           | Prettier                             |
| CI/CD          | GitHub Actions、GitHub Pages         |

GitHub Pages のサブパス配信に対応するため、Vite の `base` は相対パスにしています。
ルーティングはハッシュ方式なので、リポジトリ名が変わっても直接アクセスと再読み込みで404になりにくい構成です。

## ディレクトリ構成

UIと計算ロジックを分け、テストしやすい単位に責務を寄せています。

```text
src/
├─ assets/          アプリ内で参照する静的アセット
├─ composables/     データ取得やテーマなどの横断的な状態ロジック
├─ constants/       耐性、サイズ、ナビゲーション、SP化などの定数
├─ domain/          耐性計算、ステータス計算、検索、共有URLなどの純粋ロジック
├─ features/        画面単位の状態管理、表示用VM、専用UI
├─ presentation/    表示用データを作る薄い変換層
├─ router/          ルート定義とガード
├─ shared/          共通UI、アイコン、検索補助、データ取得層
├─ test/            テスト用フィクスチャ
├─ types/           共有型定義
└─ views/           ルートから呼ばれるページコンポーネント

public/data/        表示用JSONとモンスターアイコン
scripts/            データ生成とスクレイピング用スクリプト
e2e/                Playwright のE2Eテスト
.github/workflows/  CI/CD定義
```

`domain/` には、画面に依存しない計算と検索を置きます。
`features/` には、画面固有の状態や表示用の組み立てを置きます。
`views/` はルートに対応する薄いページとして保ち、共通部品は `shared/` に集約します。

## ビルドシミュレーターの考え方

ビルドシミュレーターは、モンスターを選んでから各条件を編集する流れです。
画面は、耐性を扱うビルドタブと、ステータスや系図を扱うタブに分かれています。

ビルドタブでは、ボディサイズ、特性、スキル、武器鍛冶を入れ替えながら最終耐性を確認できます。
SP化できる特性は、SP化した場合の効果も計算に反映します。

ステータスと系図のタブでは、14体分の系統、個体値、親レベル合計、装備、紋晶を編集できます。
画面下部のステータスバーには、HP、MP、攻撃力、守備力、素早さ、賢さの計算結果を表示します。

入力状態はURLクエリに保存します。
そのURLを共有すると、同じビルド状態を復元できます。

## 耐性計算の仕様

耐性は、弱点、普通、軽減、半減、激減、無効、回復、反射の段階で扱います。
内部では、弱点を0、反射を7として計算します。

- **実効耐性**：元データの耐性値は、スタンダードボディで特性なしの値として扱います。
  図鑑などの初期表示では、本来のボディサイズ補正と既定特性を加えた実効耐性を表示します。
- **ボディサイズ**：メガボディ、ギガボディ、超ギガボディでは、状態異常系の耐性にサイズ補正を加えます。
  枠数もサイズに応じて変わります。
- **特性**：全ガード＋、メタル系、こうどう系など、耐性に影響する特性を計算します。
- **スキル**：「○○ガード＋」は、該当耐性を上げるものとして計算します。
  スキルはすべて習得済みとして扱います。
- **武器鍛冶**：3種類までの耐性補正を、耐性計算の最後に加えます。
- **上限と下限**：属性耐性は回復を上限とします。
  属性以外の耐性は無効を超えた分を `無効+1` のように表示します。
  反射は、元から反射を持つ耐性だけが反射として表示されます。
  弱点を下回る補正は内部で蓄積されます。

これらの仕様は `src/domain/buildSimulator.test.ts` で検証しています。

## CI/CD

`.github/workflows/ci.yml` は、push と pull request で検査を実行します。
実行内容は、Lint、整形チェック、型チェック、ユニットテスト、E2Eテスト、ビルドに加え、
reviewdog 経由の actionlint によるワークフロー検証です。

`main` ブランチへpushすると、ビルド成果物を GitHub Pages にデプロイします。
GitHub Pages の Source は GitHub Actions に設定します。

`.github/workflows/codeql.yml` では、CodeQL によるコード静的解析を push・pull request・週次で実行します。
ワークフローで使う各 GitHub Actions は、コミットSHAで固定しています。

## 著作権と素材

本プロジェクトは、個人が作成した非公式のファンサイト再現です。
ゲームに関する画像とデータの著作権は、株式会社スクウェア・エニックスを代表とする共同著作者に帰属します。

> © ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.
