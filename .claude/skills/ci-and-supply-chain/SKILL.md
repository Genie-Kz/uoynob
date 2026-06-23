---
name: ci-and-supply-chain
description: 'claude-code-demo の GitHub Actions / CI / サプライチェーン規約。このリポジトリでワークフローや CI を追加・編集するとき、Actions を更新するときは参照する。Actions は全てコミット SHA で固定（vX.Y.Z をコメント併記、Dependabot が更新 PR を出す）、ワークフロー検証は actionlint（ローカルは npm run lint:actions、CI は reviewdog/action-actionlint）、CodeQL での静的解析、既定権限を contents: read に絞りジョブ単位で必要分のみ付与することを含む。'
---

# CI・サプライチェーンの規約

`.github/workflows/` を触るときの作法。編集後は `actionlint`（`npm run lint:actions`）で検証する。

## GitHub Actions は SHA 固定

すべての `uses:` を可変タグ（`@v4` など）ではなく**不変のコミット SHA** で固定し、`# vX.Y.Z` をコメントで併記する。タグは差し替え可能でサプライチェーン攻撃の余地があるため。

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
```

- SHA は `git ls-remote --tags <repo> <tag> <tag>^{}` で、注釈付きタグは `^{}` 行の実コミットを取る。
- Dependabot（`github-actions` を監視）が SHA 更新の PR を出すので、追従は自動化される。

## actionlint

ワークフロー定義の検証に actionlint を使う。

- **ローカル**: `actionlint` コマンドを直接呼ぶ（`npm run lint:actions`）。インストール前提（go/brew/scoop）。pre-push フックでも実行される。
- **CI**: 専用ジョブで `reviewdog/action-actionlint`（SHA 固定）を使い、`fail_on_error` で問題時は CI を失敗させる。
- 自前バイナリのダウンロード等は作らない（過度な作り込みを避ける）。

## CodeQL

`.github/workflows/codeql.yml` で push / PR / 週次にコード静的解析を回す（言語は `javascript-typescript`）。

## 最小権限

ワークフローの既定権限は `permissions: contents: read` に絞り、書き込み等の権限は**必要なジョブにだけ**付与する（Pages デプロイの `pages: write`、reviewdog の `checks: write` など）。
