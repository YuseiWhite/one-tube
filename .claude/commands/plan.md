# /plan - 実装計画の作成

承認された仕様書（spec.md）から実装計画を作成します。

## 実行内容

### 1. 仕様書の理解

ユーザーから提供された機能要件、または仕様書ファイルを読み込みます。
ブランチ名から機能の文脈を理解することもできます（例: `feature/yuseiwhite` → ユーザー名ベースの開発）。

### 2. OneTube開発ガイドラインの確認

以下のドキュメントを参照して、実装方針を理解します：
- **CLAUDE.md** - MVP設計方針、TDD原則
- **docs/project-spec.md** - 技術スタック、アーキテクチャ
- **docs/development-workflow.md** - 開発フロー

### 3. 実装計画テンプレートの適用

`docs/templates/plan-template.md` に従って実装計画を作成します。

OneTube MVPでは以下を重視：
- **シンプルさ**: 最小限のファイル数、最小限のボイラープレート
- **TDD**: Contract Test → Integration Test → E2E Test → Unit Test
- **実用性**: 動作することが最優先

### 4. 技術的な調査と設計

必要に応じて以下を調査・設計：
- **Move契約**: Kiosk標準、Transfer Policy、NFT構造
- **Sui連携**: Sui TypeScript SDK、Wallet Adapter
- **Walrus/Seal**: BLOB storage、暗号化API
- **テスト戦略**: 各レイヤーでのテスト方法

### 5. 実装計画の保存（任意）

実装計画をファイルに保存する場合は、以下のような場所が推奨されます：
```
docs/plans/[機能名]/plan.md
# または
docs/[機能名]-plan.md
```

**注**:
- ファイル保存は完全に任意です
- チャット履歴で管理してもOK
- MVP開発では、ドキュメント作成より実装を優先します

## OneTube固有の設計原則

### MVP優先順位
1. **動作する** → テストが通る
2. **わかりやすい** → コードが読みやすい
3. **速く書ける** → ボイラープレート最小
4. 拡張性は無視

### SOLID原則の適用（MVPバージョン）
- **Single Responsibility**: ⚠️ 最小限（App.tsxは多目的OK）
- **Open/Closed**: ❌ 拡張性は無視
- **Liskov Substitution**: ❌ 継承なし
- **Interface Segregation**: ⚠️ 最小限のインターフェース
- **Dependency Inversion**: ✅ DI パターン部分適用

### テスト戦略
- **実依存を使用**: モックではなく実際のDB、実際のSui devnet
- **Contract Test**: Move契約の単体テスト
- **Integration Test**: Backend ↔ Smart Contract統合
- **E2E Test**: ユーザーフロー全体

## 次のステップ

実装計画が承認されたら、`/tasks` コマンドでタスクリストを作成します。
