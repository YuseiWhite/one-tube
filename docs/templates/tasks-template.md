# タスク: [機能名]

**ブランチ**: `feature/<user-name>` または `feature/<feature-name>`
**OneTubeプロジェクト**: NFT-Gated Video Streaming Platform (MVP)

**推奨**: このファイルの代わりに、Claude Codeの組み込みTodoリスト(`TodoWrite`ツール)を使用してください。
- リアルタイム更新
- チャット内で進捗確認
- ファイル管理不要

---

## タスクフォーマット

### 表記法
```
- [ ] T001 [P] 説明 - ファイルパス
```

- **T001**: タスク番号（連番）
- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **説明**: 具体的な実装内容
- **ファイルパス**: 変更するファイルの正確なパス

### OneTubeファイルパス
- **Contract**: `contracts/sources/contracts.move`
- **Contract Test**: `contracts/tests/contracts_tests.move`
- **Backend**: `app/src/server/[ファイル名].ts`
- **Frontend**: `app/src/App.tsx`, `app/src/lib/[ファイル名].ts`
- **Scripts**: `scripts/tool.ts`
- **E2E Test**: `app/tests/e2e.spec.ts`

## フェーズ1: セットアップ
[環境設定、依存関係追加]

- [ ] T001 [P] 必要な依存関係を`package.json`に追加
- [ ] T002 [P] 環境変数を`.env`に追加

## フェーズ2: Contract Test作成（TDD: RED）⚠️ 実装前に必ずテスト作成
**重要: テストを先に書き、必ず失敗することを確認**

**OneTube例**:
- [ ] T003 [P] `contracts/tests/contracts_tests.move`に`mint_batch`のテスト - `pnpm move:test`で失敗確認
- [ ] T004 [P] `contracts/tests/contracts_tests.move`にTransfer Policyのテスト - `pnpm move:test`で失敗確認

## フェーズ3: Contract実装（TDD: GREEN）
**重要: テストが失敗してから実装**

**OneTube例**:
- [ ] T005 `contracts/sources/contracts.move`に`mint_batch`関数実装 - `pnpm move:test`で成功確認
- [ ] T006 `contracts/sources/contracts.move`にTransfer Policy実装 - `pnpm move:test`で成功確認

## フェーズ4: Integration Test作成（TDD: RED）
**重要: Backend統合テストを先に書く**

**OneTube例**:
- [ ] T007 [P] `app/src/server/__tests__/sponsor.test.ts`にSponsored Transactionのテスト
- [ ] T008 [P] `app/src/server/__tests__/kiosk.test.ts`にKiosk操作のテスト

## フェーズ5: Backend実装（TDD: GREEN）

**OneTube例**:
- [ ] T009 `app/src/server/sponsor.ts`にSponsored Transaction実装 - `pnpm test:api`で成功確認
- [ ] T010 `app/src/server/kiosk.ts`にKiosk操作実装 - `pnpm test:api`で成功確認
- [ ] T011 `app/src/server/seal-mock.ts`にSealセッション管理実装

## フェーズ6: Frontend実装

**OneTube例**:
- [ ] T012 `app/src/App.tsx`にUIコンポーネント追加（購入ボタン、動画リスト等）
- [ ] T013 `app/src/lib/sui.ts`にSui SDK連携実装
- [ ] T014 `app/src/lib/api.ts`にAPI Client実装

## フェーズ7: E2E Test

**OneTube例**:
- [ ] T015 `app/tests/e2e.spec.ts`に購入フローE2Eテスト - `pnpm test:e2e`で確認
- [ ] T016 `app/tests/e2e.spec.ts`に視聴フローE2Eテスト - `pnpm test:e2e`で確認

## フェーズ8: Deploy & Demo

**OneTube例**:
- [ ] T017 Devnetにデプロイ - `pnpm deploy:devnet`
- [ ] T018 シードデータ投入 - `pnpm seed:devnet`
- [ ] T019 購入デモ確認 - `pnpm demo:purchase`
- [ ] T020 視聴デモ確認 - `pnpm demo:view`

## フェーズ9: 最終確認

- [ ] T021 [P] コード品質チェック - `pnpm biome:check`
- [ ] T022 [P] ドキュメント更新（必要に応じて）
- [ ] T023 最終E2Eテスト - すべてのフローが動作するか確認

---

## 依存関係

**テストファーストの徹底**:
- Contract実装（フェーズ3）の前にContract Test（フェーズ2）
- Backend実装（フェーズ5）の前にIntegration Test（フェーズ4）

**実装の順序**:
- Contract → Backend → Frontend → E2E → Deploy

**並列実行可能**:
- [P]マークのあるタスクは並列実行可能（異なるファイル、依存なし）

---

## 実行時のTipsps

### TDDサイクル
1. **RED**: テストを書く → `pnpm move:test`または`pnpm test`で失敗確認
2. **GREEN**: 実装を書く → テストが成功するか確認
3. **Refactor**: コードを改善（必要に応じて）

### コミット戦略
- 各タスク完了後に小さなコミット
- コミットメッセージは`docs/commit-strategy.md`に従う

### 利用するスクリプト
- `pnpm move:test` - Move契約テスト
- `pnpm test` - すべてのテスト
- `pnpm test:api` - API統合テスト（存在する場合）
- `pnpm test:e2e` - E2Eテスト（存在する場合）
- `pnpm deploy:devnet` - Devnetデプロイ
- `pnpm seed:devnet` - シード投入
- `pnpm demo:purchase` / `pnpm demo:view` - デモ確認
- `pnpm biome:check` - コード品質

---