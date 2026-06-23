---
name: commit-and-push
description: claude-code-demo（リモート Genie-Kz/uoynob, 既定ブランチ main）でコミット・プッシュするときの規約。このリポジトリでコミットやプッシュを頼まれたら必ず参照する。Conventional Commits の type 件名＋日本語の詳細な複数行本文＋Co-Authored-By、1コミット1関心での分割、プッシュ後の比較レンジ付き報告、pre-commit/commit-msg/pre-push フックを尊重することを含む。
---

# コミット・プッシュの規約

`Genie-Kz/uoynob`（既定ブランチ `main`）でのコミットとプッシュの作法。コミットは1つの機能・修正の単位で行い、関心が複数にまたがるなら分割する。コミット前の検証は `verifying-changes` を参照。

## コミットメッセージ

commit-msg フックの commitlint が Conventional Commits を強制するので、件名は必ず `type: 概要` 形式にする。本文は日本語で、**1行で終わらせず**、後から見て変更内容と理由が分かるよう複数行で具体的に書く。

- **type**: `feat` / `fix` / `docs` / `refactor` / `chore` / `ci` / `test` など、変更の性質に合わせる。
- **本文**: 何を・なぜ変えたかを説明する。退けた代替案や、あえて対象外にした点も書くと後から効く。
- **末尾に必ず**: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

**コミットメッセージの例:**

```
feat: ビルドのスキル名を詳細ページへのリンクにする

スキル一覧で名前を表示するだけだったものを skill-detail への
router-link に変更した。すでにリンク化済みの特性と揃え、構成を
確認したいスキルへワンクリックで遷移できるようにする狙い。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

## プッシュと報告

- プッシュは**頼まれたときだけ**行う。`git push origin main`。
- 完了後は、コミットハッシュと比較レンジ（`旧..新`）をリポジトリ URL 付きの Markdown リンクで報告する。例: `[7c54c7e..a4af21d](https://github.com/Genie-Kz/uoynob)`。

## フックを尊重する

コミット時に pre-commit（lint-staged: eslint --fix + prettier）と commit-msg（commitlint）、プッシュ時に pre-push（actionlint）が走る。**原則バイパスしない**（`--no-verify` 等を使わない）。失敗したら原因を直す。
