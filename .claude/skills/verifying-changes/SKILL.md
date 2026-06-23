---
name: verifying-changes
description: claude-code-demo（Vue3+TS+Vite）で変更を検証する方法。「検証して」「動くか確認して」「プッシュ前チェック」などのとき、またコミット前には必ず参照する。総合チェックは npm run check（lint→format:check→lint:actions→test(ユニット)→build を順に実行、E2E は含まない）。ブラウザで観測できる UI 変更は preview ツールで実挙動を確認しユーザーに手動確認を丸投げしない。検証結果は誇張も省略もせず誠実に報告する。
---

# 変更の検証

コミット・プッシュの前に、変更に応じた検証を**実行してから**進める。

## 総合チェック: `npm run check`

`lint` → `format:check` → `lint:actions` → `test`(ユニット) → `build` を順に実行する（fail-fast）。

- `test` は **Vitest のユニットテストのみ**。E2E は含まれない（必要なら `npm run test:e2e`）。
- `lint:actions` は `actionlint`（ローカルにインストール前提）。GitHub Actions のワークフローを触ったら実行する。
- `build` に `vue-tsc` の型チェックが含まれる。
- 速いフィードバックが欲しいときは個別に `npm run lint` / `typecheck` / `test` を回してよい。

## UI 変更は preview で実挙動を確認

ブラウザで観測できる変更（描画・操作・スタイル）は、preview ツールで実際に動かして確認する。「ユーザーに手で見て」と丸投げしない。

- `preview_start` → `preview_eval`/`preview_snapshot`/`preview_inspect`/`preview_screenshot`。
- ルーティングはハッシュ方式。URL は `#/...` 形式（例: `#/simulator/001-1`）。
- コンソールエラーが無いことも確認する。
- 確認できたら、スクリーンショットやスナップショットなど**証跡を添えて**報告する。

## 報告は誠実に

検証結果はそのまま伝える。テストが落ちたら出力付きで「落ちた」と言う。スキップした手順は「スキップした」と言う。完了・検証済みのことは過度に濁さず明言し、あえて対象外にした点や簡素化の余地は「補足」として正直に添える。
