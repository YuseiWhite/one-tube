# /tasks - タスクリストの作成

実装計画（plan.md）から具体的なタスクリストを作成します。

## 実行内容

### 1. 実装計画の理解

ユーザーから提供された実装計画、またはチャット履歴から要件を理解します。
ブランチ名から作業の文脈を理解することもできます。

### 2. タスクテンプレートの適用

`docs/templates/tasks-template.md` に従ってタスクリストを作成します。

### 3. OneTube TDD原則に基づくタスク分解

**テスト優先順位**に従ってタスクを分解：
1. **Contract Test**: Move契約の単体テスト
2. **Integration Test**: Backend ↔ Smart Contract統合テスト
3. **E2E Test**: 購入・視聴フロー全体
4. **Unit Test**: 個別関数テスト

**重要**: テストタスクを実装タスクの前に配置します。

### 4. タスクの特徴付け

各タスクに以下の属性を追加：
- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[B]**: ブロッカー（他のタスクの前提条件）
- **正確なファイルパス**: 各タスクに実装ファイルを明記

### 5. OneTube固有のタスク例

**Contract層**:
- `contracts/sources/contracts.move` に `mint_batch` 関数実装
- `contracts/tests/` にMove契約テスト

**Backend層**:
- `app/src/server/sponsor.ts` にSponsored Transaction実装
- `app/src/server/kiosk.ts` にKiosk操作実装
- `app/src/server/seal-mock.ts` にSealセッション管理

**Frontend層**:
- `app/src/App.tsx` にUI実装（シングルコンポーネント）
- `app/src/lib/sui.ts` にSui SDK連携
- `app/src/lib/api.ts` にAPI Client

### 6. タスクリストの管理

**推奨**: Claude Codeの組み込みTodoリスト機能を使用
- `TodoWrite`ツールで自動管理
- チャット内でリアルタイム更新
- ファイル保存不要

**代替**: ファイルに保存する場合
```
docs/tasks/[機能名]/tasks.md
# または
docs/[機能名]-tasks.md
```

**注**: MVP開発では、組み込みTodoリストの使用を強く推奨します

## タスク分解の原則

### MVPアプローチ
- **最小限のファイル**: 必要最小限のファイルのみ作成
- **シンプルな実装**: 複雑なパターンは避ける
- **小さなコミット**: 各タスク完了後にコミット

### 並列実行の判断
- **[P]をつける条件**: 異なるファイル && 依存関係なし
- **[P]をつけない条件**: 同じファイル || 依存関係あり

### テスト駆動の徹底
- すべてのテストタスクを実装タスクの前に配置
- テスト失敗確認 → 実装 → テスト成功確認のサイクル

## 次のステップ

タスクリストが作成されたら、`/execute` コマンドで実装を開始します。
