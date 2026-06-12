# 凡庸な イルルカSP（クライアントサイド再現版）

サービス終了した攻略サイト「**凡庸な イルルカSP**」（`bonyou.info/dqm2sp`）を、
**Vue 3 + TypeScript + Vite + Tailwind CSS** のSPAとして再現したプロジェクトです。
元サイトがサーバーサイドで処理していた機能（検索・ビルドシミュレーターなど）は、すべてブラウザ内（クライアントサイド）で動作します。

対象ゲーム：**ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP**

---

## 技術スタック

| 種類 | 採用 |
|---|---|
| フレームワーク | Vue 3（`<script setup>` + Composition API） |
| 言語 | TypeScript（strict） |
| ビルド | Vite 5 |
| ルーティング | Vue Router（ハッシュ方式。GitHub Pages のサブパス配信でも動作） |
| CSS | Tailwind CSS 3 |
| テスト | Vitest（+ jsdom） |
| リンター | ESLint 9（Flat Config・eslint-plugin-vue / typescript-eslint） |
| CI/CD | GitHub Actions → GitHub Pages |

---

## セットアップ＆コマンド

```bash
npm install          # 依存インストール
npm run dev          # 開発サーバー（HMR）
npm run lint         # ESLint（--fix で自動修正: npm run lint:fix）
npm run typecheck    # 型チェック（vue-tsc）
npm run test         # ユニットテスト（Vitest）
npm run build        # 型チェック＋本番ビルド（dist/）
npm run preview      # ビルド結果のプレビュー
```

データ再生成（任意）：

```bash
npm run data:monsters -- "path/to/MonsterData.json"   # public/data/monsters.json を生成
npm run data:skills                                    # Web Archive から skills.json を生成
npm run data:traits-abilities                          # Web Archive から attributes.json / abilities.json を生成
npm run data:pickups                                   # Web Archive から pickups.json を生成
```

---

## ディレクトリ構成

責務ごとにレイヤを分け、ロジックを UI から切り離してテスト可能にしています。

```
src/
├─ types/          型定義（Monster, Skill, PickerItem ...）
├─ constants/      定数（耐性・系統サイズ分類・ビルド計算ルール・ナビ構成）
├─ domain/         純粋ロジック（耐性計算・ビルド計算・検索・スキル解析）＋テスト(.test.ts)
├─ api/            データ取得層（静的JSONの読み込み＋キャッシュ）
├─ composables/    Vue の状態ロジック（useMonsters / useSkills / useBuildSimulator ...）
├─ presentation/   表示用ビューモデル生成（耐性セル）
├─ components/     再利用 UI（ResistanceGrid, MonsterTable, PickerModal, SideNav ...）
├─ views/          画面（Home / MonsterList / MonsterDetail / Search / Skill... / Simulator...）
├─ router/         ルート定義
└─ test/           テスト用フィクスチャ
```

設計方針：ロジックは `domain/` に集約して UI から独立させ、Vitest で単体テストします。
変数名・関数名は意図が読み取れる名前（例: `computeBuildResistances`, `clampFinalLevel`, `selectedLevelByElement`）に統一しています。

---

## 主な機能

- **トップ（ポータル）**：検索フォームとカテゴリのアコーディオン。項目を押す／検索すると、対応する各ページへ遷移します。
- **モンスター図鑑**：一覧（既定で全件・No.昇順）／ランク・系統・サイズ・名前で絞り込み／詳細（特性・耐性・ステータス・装備・スキル）
- **モンスター検索**：耐性30種の閾値（○○↑）＋特性で絞り込み
- **特性**：一覧（294件・特性効果系／パラメータ系／耐性系）／詳細（効果・ＳＰ効果・この特性を持つモンスター／スキル）
- **特技**：一覧（303件・呪文／斬撃／体技／踊り／ブレス・ふえ／その他）／詳細（効果・この特技を覚えるスキル）
- **スキル**：一覧（425件・特技系／パラメータ系）／詳細（スキル構成・このスキルを持つモンスター）
- **ピックアップ**：転生モンスター・ご当地スキル・キラー系スキル・各種耐性スキル・パラメータ上昇スキル・れんぞく回数
- **ビルドシミュレーター**：検索 → 選択 → ビルド画面。特性・スキル・武器鍛冶を編集モーダルで入れ替え、最終耐性をリアルタイムに計算。各セクションごとにリセット可能。入力状態は URL クエリに保存され、その URL を共有すればビルドをそのまま復元できる

### 表示する耐性について（実効耐性）

元データの耐性値は「スタンダードボディ・特性なし」の素の値です。
図鑑・検索・ビルドシミュレーターの初期表示では、これに**本来のボディサイズ補正と既定の特性を加味した「実効耐性」**を表示します
（`src/domain/effectiveResistance.ts`）。ビルドシミュレーターの耐性表記は図鑑と同じ（値のみ）です。

---

## ビルドシミュレーターの計算仕様（`src/domain/buildSimulator.ts`）

耐性段階：弱点／普通／軽減／半減／激減／無効／回復（反射）。内部では 弱点=0 … 反射=7 の数値で計算します。

- **ボディサイズ**：メガ +2／ギガ +3／超ギガ +4（状態異常系）。素データは「スタンダードボディ・特性なし」基準のため、**選択サイズの補正をそのまま加算**します（スタンダード／スモールは 0）。枠数も連動（特性 6/6/7/8/9・スキル 3/3/4/5/6）。
- **特性**：全ガード＋（全耐性 +1）／メタル系（毒・呪い・混乱・マヒ・眠り +1、各1つまで）／こうどう（おそい +2・はやい -2・超はやい -4）。
- **スキル**：「○○ガード＋」1つにつき該当耐性 +2（重複可）。スキルはすべて習得済みの前提で計算します。
- **武器鍛冶**：別々の耐性を3つまで、各 +1。
- **上限・下限**：
  - スキル等による上昇の上限は、**属性耐性（メラ〜吹雪の11種）は「回復」**、**それ以外は「無効」**です。
  - **反射は元々持つモンスターのみ**で、反射耐性は下がらず常に反射のままです。
  - 弱点を下回った分は内部的に蓄積され、それを上回るまで弱点のままになります。

これらのルールは `src/domain/buildSimulator.test.ts` で網羅的にテストしています。

---

## GitHub Actions による CI/CD

`.github/workflows/ci.yml` が、push / PR で **Lint → 型チェック → テスト → ビルド** を実行します。
`main` への push では **GitHub Pages へ自動デプロイ**します。

公開手順：
1. リポジトリに push する
2. **Settings → Pages → Source** を「**GitHub Actions**」に設定する
3. `main` への push で `https://<ユーザー名>.github.io/<リポジトリ名>/` に公開されます

`vite.config.ts` の `base: './'` とハッシュルーティングにより、リポジトリ名に依存せず動作します。

---

## 画像の扱い

モンスター画像はスクウェア・エニックスの著作物のため、本再現版では系統色＋No. のプレースホルダーで表示しています。

---

> © ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.
