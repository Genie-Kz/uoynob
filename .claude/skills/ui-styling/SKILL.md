---
name: ui-styling
description: claude-code-demo（Vue3 + Tailwind CSS v4）でUI・スタイル・見た目を作る／直すときの規約。スタイル調整、配色、ダークモード、レスポンシブ／モバイル対応、アイコン表示、共通UIコンポーネント、モーダルやドロップダウンを触るときは参照する。デザイントークンは @theme、共通の見た目は @layer components のセマンティッククラス（btn-primary 等）、ダークモードは main.css の「レイヤー外オーバーライド」で一括、タッチ端末はホバー非対応なので active: も付ける、テーブル/flex内の画像は max-w-none object-contain で潰れ防止、select は IconSelect、主観の入る見た目変更はコミット前にスクショで確認、を含む。
---

# UI・スタイルの規約

Tailwind CSS v4 を使う。スタイルは `src/assets/main.css` に集約し、共通 UI は `src/shared/ui/` のコンポーネントを再利用する。配置やコメントの規約は `code-conventions`、検証は `verifying-changes`。

## デザイントークンと共通クラス（main.css）

- 色は `@theme` のトークンで一元管理する（耐性段階色・系統色・`--color-brand` / `--color-brand-hover`）。色を変えるならまずここ1箇所。
- 共通の見た目は `@layer components` の**セマンティッククラス**を使う: `.btn-primary`（控えめなブランド色のアウトライン）、`.btn-outline-primary`、`.btn-neutral`、`.app-link`、`.tag-link`。各コンポーネントに長いユーティリティ列をベタ書きしない。

## ダークモード（dark: を撒かない）

各要素に `dark:` を付けて回らない。`main.css` 末尾の **レイヤー外（@layer 外）の素のCSS** で、`html.dark` 配下の主要な面色・文字色・アクセントを一括上書きする。Tailwind の utilities はレイヤー内なので、レイヤー外の素のCSSがカスケード順で勝つ性質を使う。

- `.dark .bg-white { … }` のように既存ユーティリティを後追いで塗り替える。
- `@apply` で色がベイクされるコンポーネントクラス（`.btn-primary` / `.app-link` 等）は `.dark .btn-primary { … }` で個別に上書きする。
- 配色はサイト全体で1つのトーンに馴染ませる。ネオン・原色を避け彩度を抑える。耐性ピルのように常に淡色の要素はダークで文字を濃色に固定するなど、可読性を都度確保する。
- 初期テーマの適用は `index.html` のインラインスクリプトで描画前に当て、チラつきを防ぐ。状態管理は `@/shared/.../useTheme`（localStorage 保持）。

## レスポンシブ・タッチ対応

- リンクの下線アフォーダンスはホバーだけだとタッチ端末で出ない。`hover:underline` には **`active:underline` を併記**する。常時リンクと示したいバッジ等は点線下線（`underline decoration-dotted`）＋ホバー/タップで実線、が定番。
- スマホ幅（preview の mobile プリセット＝375px 付近）と狭幅での折り返し・潰れを**実機サイズで確認**する。固定幅は内容が省略（`…`）されない程度に確保する。

## 画像が潰れる罠

Tailwind preflight が画像に `max-width:100%` を当てるため、テーブルや flex が詰まると画像が縮む／歪む。固定サイズのアイコンは **`size-N max-w-none object-contain`** を付けて潰れを防ぐ（`size-N` は width/height 同時指定）。

## ネイティブ要素の置き換え

- `<select>` は `<option>` に画像を入れられず、スマホで全画面の選択UIになって煩わしい。アイコン付き／統一感のあるドロップダウンは共通の **`IconSelect`**（`src/shared/ui/IconSelect.vue`、ジェネリックで `string | number | null` 値に対応、`defineModel` で v-model）を使う。
- モーダルは**開いた時点の高さで固定**し、検索で候補数が変わっても高さをガタつかせない。候補0件時は「該当なし」を明示して真っ白にしない（`PickerModal` 参照）。

## 既存パターンに合わせる

新しい UI は、既存コンポーネント（`StatusTable` / `ResistanceGrid` / `PickerModal` / `IconSelect` など `src/shared/ui/`）のパディング・区切り線・トーンを踏襲する。ゼロから別の見た目を作らない。

## 見た目はコミット前に確認をとる

色・余白・レイアウトなど**主観が入る見た目の変更**は、preview でスクリーンショットを撮り、**ユーザーの了承を得てからコミットする**。ライト／ダーク両テーマで確認する。微調整の往復はこの段階で済ませ、確定してから `commit-and-push` に進む。
