# /execute - タスクの実行

タスクリスト（tasks.md）から次に実行すべきタスクを実行します。

## 実行内容

### 1. タスクリストの確認

**優先**: Claude Codeの組み込みTodoリストを確認
- 現在のタスク状況を自動取得
- リアルタイムで進捗管理

**代替**: ファイルからタスクリストを読み込む
- ユーザー指定のタスクファイル
- または口頭でのタスク指示

### 2. 次のタスクの特定

優先順位と依存関係を考慮して、実行すべきタスクを特定します：
- 未完了のタスクで、依存タスクが完了しているもの
- [P]マークのあるタスクは並列実行可能

### 3. タスクの実行

特定されたタスクを実装します。TDD原則に従って：
1. **テストタスク**: テストを書く → RED（失敗）確認
2. **実装タスク**: 実装を書く → GREEN（成功）確認
3. **リファクタリング**: 必要に応じてコードを改善

### 4. テストの実行

実装後、関連するテストを`package.json`のスクリプトで実行します：

**Move契約テスト**:
```bash
pnpm move:test
# または直接: cd contracts && sui move test
```

**TypeScript/Node.js テスト**:
```bash
pnpm test          # すべてのテスト
pnpm test:api      # APIテスト（存在する場合）
pnpm test:e2e      # E2Eテスト（存在する場合）
```

**コード品質チェック**:
```bash
pnpm biome:check   # Linter/Formatter実行
pnpm biome:fix     # 自動修正
```

### 5. 品質ゲート（コミット前チェック）

コミット前に、全パッケージの品質チェックを実行できます：

```bash
# 全パッケージのlint, typecheck, build, testを実行
bash docs/scripts/check-packages.sh

# 詳細出力
bash docs/scripts/check-packages.sh --verbose

# JSON形式で出力（CI/CD統合用）
bash docs/scripts/check-packages.sh --json
```

**スクリプトの機能**:
- ✅ Move契約ビルド（`sui move build`）
- ✅ Move契約テスト（`sui move test`）
- ✅ TypeScript型チェック（`pnpm typecheck`）
- ✅ Linter実行（`pnpm biome:check`）
- ✅ ビルド実行（`pnpm build`）
- ✅ タイムアウト保護（各チェック120秒）

**期待される出力例**:
```
=== Package: contracts ===
✓ sui move build (0.5s)
✓ sui move test (1.2s)

=== Package: app ===
✓ pnpm typecheck (2.3s)
✓ pnpm biome:check (0.8s)
✓ pnpm build (5.1s)

All checks passed!
```

**推奨**: コミット前に実行して、壊れたコードのコミットを防止します。

### 6. デプロイとシード（必要な場合）

Contract変更の場合、devnetにデプロイ：
```bash
pnpm deploy:devnet  # Move契約をdevnetにデプロイ
pnpm seed:devnet    # シードデータを投入
```

### 7. デモ実行（必要な場合）

実装したフローを確認：
```bash
pnpm demo:purchase  # NFT購入フローのデモ
pnpm demo:view      # 動画視聴フローのデモ
```

### 8. タスクの完了マーク

テストが通ったら、`tasks.md`のタスクを完了としてマークします：
- [ ] タスク名 → [x] タスク名

### 9. コミット

タスク完了後に小さなコミットを作成します：
```bash
git add [変更されたファイル]
git commit -m "feat: [実装内容]"
```

コミットメッセージは`docs/commit-strategy.md`に従います。

### 10. 進捗報告

ユーザーに進捗を日本語で報告します：
- 完了したタスク
- テスト結果
- 次のタスク

## OneTube固有のワークフロー

### Contract開発フロー
1. Move契約実装 → `contracts/sources/`
2. Move契約テスト → `pnpm move:test`
3. Devnetデプロイ → `pnpm deploy:devnet`
4. シード投入 → `pnpm seed:devnet`
5. E2Eテスト → `pnpm test:e2e`（存在する場合）

### Backend開発フロー
1. APIテスト実装 → `app/src/server/__tests__/`（存在する場合）
2. API実装 → `app/src/server/`
3. 統合テスト → `pnpm test:api`（存在する場合）
4. デモ実行 → `pnpm demo:purchase` または `pnpm demo:view`

### Frontend開発フロー
1. コンポーネント実装 → `app/src/`
2. 開発サーバー起動 → `pnpm dev`
3. 手動テスト → ブラウザで動作確認
4. E2Eテスト → `pnpm test:e2e`（存在する場合）

## 利用可能なスクリプト

`package.json`で定義されているスクリプト：

| スクリプト | 用途 |
|-----------|------|
| `pnpm move:test` | Move契約の単体テスト |
| `pnpm dev` | 開発サーバー起動（フロントエンド） |
| `pnpm build` | プロダクションビルド |
| `pnpm deploy:devnet` | Devnetにデプロイ |
| `pnpm seed:devnet` | シードデータ投入 |
| `pnpm demo:purchase` | NFT購入デモ実行 |
| `pnpm demo:view` | 動画視聴デモ実行 |
| `pnpm biome:check` | コード品質チェック |
| `pnpm biome:fix` | 自動修正 |

## 次のステップ

すべてのタスクが完了したら、Pull Requestを作成します。
