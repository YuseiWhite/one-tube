# /specify - 機能仕様書の作成

新しい機能の仕様書を作成します。

## 実行内容

### 1. ユーザー要求の理解

ユーザーから提供された機能要求を分析し、以下を明確にします：
- 機能の目的
- 対象ユーザー
- 成功基準
- 制約条件

### 2. OneTubeプロジェクトのコンテキスト確認

以下のドキュメントを参照して、OneTubeの全体像を理解します：
- **docs/project-spec.md** - MVP仕様とビジネス要件
- **CLAUDE.md** - 開発ガイドラインとベストプラクティス
- **docs/development-workflow.md** - 開発ワークフロー

### 3. 既存コードの確認

新機能に関連する既存コードを調査：
- **Smart Contract**: `contracts/sources/` - Move契約（NFT、Kiosk、Transfer Policy）
- **Frontend**: `app/src/` - React UI、Sui Wallet連携
- **Backend API**: `app/src/server/` - Express API、Sponsored Transaction
- **Scripts**: `scripts/` - デプロイ・シードツール

### 4. 仕様書テンプレートの適用

`docs/templates/spec-template.md` のフォーマットに従って仕様書を作成します。

### 5. 仕様書の保存（任意）

仕様書をファイルに保存する場合は、以下のような場所が推奨されます：
```
docs/specs/[機能名]/spec.md
# または
docs/[機能名]-spec.md
```

**注**:
- ファイル保存は完全に任意です
- 必要に応じて、チャット履歴やメモとして管理してもOK
- MVP開発では、過度なドキュメント管理は避けます

## OneTube固有の考慮事項

新機能を設計する際は、以下を考慮してください：

### 技術スタック
- **Blockchain**: Sui devnet、Move言語
- **NFT標準**: Kiosk標準（必須）
- **Storage**: Walrus分散ストレージ
- **Encryption**: Seal（セッション管理）
- **Sponsored Transaction**: ガスレス購入（モック実装）

### MVP設計方針
1. **動作する** → テストが通る
2. **わかりやすい** → コードが読みやすい
3. **速く書ける** → ボイラープレート最小
4. 拡張性は無視（MVP完成が最優先）

### テスト優先順位
1. Contract Test → Move契約のテスト
2. Integration Test → Backend ↔ Smart Contract
3. E2E Test → 購入・視聴フロー全体
4. Unit Test → 個別関数

## 次のステップ

仕様書が承認されたら、`/plan` コマンドで実装計画を作成します。
