# docs/scripts/ - ワークフロー管理スクリプト

## 概要

このディレクトリには、Claude Code統合用の品質管理スクリプトが含まれています。

**目的**:
- 開発ワークフローの品質チェック自動化
- 柔軟なディレクトリ構造のサポート
- Bash 3.x互換（macOSデフォルト環境対応）

**注**: 実際の開発ワークフローと使い方については、[docs/development-workflow.md](../development-workflow.md) を参照してください。

---

## スクリプト一覧

### 品質管理

#### check-packages.sh

**目的**: 全パッケージの品質チェック（lint, typecheck, build, test）

**特徴**:
- ✅ Bash 3.x互換（macOSデフォルト環境で動作）
- ✅ timeout コマンド自動検出（利用可能な場合のみ使用）
- ✅ contracts（Move）とapp（TypeScript）の両方に対応
- ✅ カラー出力でわかりやすい結果表示
- ✅ 失敗時は exit code 1 を返す（CI/CD統合可能）

**使い方**:
```bash
# すべてのチェックを実行（推奨）
pnpm check:packages

# 個別チェック
bash docs/scripts/check-packages.sh lint       # Linterのみ
bash docs/scripts/check-packages.sh typecheck  # 型チェックのみ
bash docs/scripts/check-packages.sh build      # ビルドのみ
bash docs/scripts/check-packages.sh test       # テストのみ
bash docs/scripts/check-packages.sh all        # すべて（デフォルト）
```

**チェック内容**:
- **contracts**: `sui move build`, `sui move test`
- **app**: `pnpm exec biome check .`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`（package.jsonに定義されている場合）

**統合先**: `.claude/commands/execute.md` - コミット前の品質ゲート

---

### ユーティリティ

#### common.sh

**目的**: 共通ユーティリティ関数ライブラリ

**提供関数**:
- `get_repo_root()` - リポジトリルートパスを取得
- `get_current_branch()` - 現在のブランチ名を取得
- `check_feature_branch()` - featureブランチかどうかを確認
- `get_feature_dir()` - ブランチ名から機能ディレクトリパスを解決

**使用箇所**: get-feature-paths.sh から source

---

#### get-feature-paths.sh

**目的**: 機能ディレクトリパスを環境変数形式で出力

**使い方**:
```bash
pnpm workflow:paths
# または
bash docs/scripts/get-feature-paths.sh
```

**出力例**:
```bash
FEATURE_DIR=docs/issues/feature-name
SPEC_FILE=docs/issues/feature-name/spec.md
PLAN_FILE=docs/issues/feature-name/plan.md
TASKS_FILE=docs/issues/feature-name/tasks.md
```

**統合先**: `.claude/commands/plan.md` - パス解決の参考情報

---

## package.json エイリアス

便利なエイリアスが package.json に定義されています：

```json
{
  "check:packages": "bash docs/scripts/check-packages.sh",
  "workflow:paths": "bash docs/scripts/get-feature-paths.sh"
}
```

**使用例**:
```bash
# コミット前の品質チェック
pnpm check:packages

# 機能ディレクトリパスの確認
pnpm workflow:paths
```

---

## Claude Code 統合

これらのスクリプトは `.claude/commands/` と統合されています：

| スクリプト | 統合先コマンド | 使用タイミング |
|-----------|--------------|--------------|
| check-packages.sh | `/execute` | コミット前の品質ゲート |
| get-feature-paths.sh | `/plan` | 実装計画作成時のパス参照 |

**詳細な使い方とワークフローについては**:
→ **[docs/development-workflow.md](../development-workflow.md)** を参照してください

---

## ファイル構成

```
docs/scripts/
├── check-packages.sh       # 品質ゲート（lint, typecheck, build, test）
│                           # - Bash 3.x互換
│                           # - timeout自動検出
│                           # - contracts + app 対応
├── common.sh               # 共通関数ライブラリ
│                           # - get_repo_root()
│                           # - get_current_branch()
│                           # - check_feature_branch()
│                           # - get_feature_dir()
├── get-feature-paths.sh    # パス解決
│                           # - 環境変数形式で出力
│                           # - 柔軟なブランチ命名対応
└── README.md               # このファイル
```

**総ファイル数**: 4ファイル（スクリプト3 + ドキュメント1）

---

## 技術的な詳細

### Bash 3.x互換性

OneTubeプロジェクトのスクリプトはmacOSデフォルト環境（Bash 3.2）で動作するように設計されています。

**対応内容**:
- ❌ 連想配列 (`declare -A`) は使用しない
- ✅ 通常配列とパイプライン処理を使用
- ✅ `timeout` コマンドは自動検出（なければスキップ）

**動作確認環境**:
- macOS Bash 3.2.57 ✅
- Linux Bash 4.x+ ✅
- Bash 5.x ✅

### check-packages.sh の実装詳細

**結果追跡方式**:
```bash
# 文字列ベースの結果管理（Bash 3.x互換）
LINT_RESULTS="contracts:SKIP|app:PASS"
BUILD_RESULTS="contracts:PASS|app:SKIP"
```

**timeout処理**:
```bash
# 各チェックは最大120秒でタイムアウト（timeout利用可能な場合）
if command -v timeout >/dev/null 2>&1; then
    timeout 120 $command
else
    $command  # macOSではタイムアウトなし
fi
```

---

## 参考ドキュメント

- **[development-workflow.md](../development-workflow.md)** - 開発ワークフロー全体（推奨）
- **[project-spec.md](../project-spec.md)** - プロジェクト仕様
- **[commit-strategy.md](../commit-strategy.md)** - コミット戦略
- **[CLAUDE.md](../../CLAUDE.md)** - Claude Code ガイド

---

## トラブルシューティング

### Q: check-packages.shが「declare: -A: invalid option」エラーを出す

**原因**: 古いBashバージョン（3.x）で連想配列を使用

**解決**: 現在のバージョンは修正済み（Bash 3.x互換）。最新版を使用してください。

### Q: timeout コマンドが見つからない

**解決**: 正常です。macOSにはデフォルトで`timeout`コマンドがないため、スクリプトは自動的にタイムアウトなしで実行します。

### Q: contracts や app のチェックがスキップされる

**原因**: 必要なファイル（Move.toml, package.json）やスクリプトが存在しない

**解決**: 実装がまだ完了していない場合は正常な動作です。実装完了後に再実行してください。
