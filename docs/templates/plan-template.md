# 実装計画: [機能名]

**ブランチ**: `feature/<user-name>` または `feature/<feature-name>` | **日付**: [日付]
**OneTubeプロジェクト**: NFT-Gated Video Streaming Platform (MVP)

**例**:
- `feature/yuseiwhite` - ユーザー名ベースの開発
- `feature/nft-purchase` - 機能名ベースの開発

---

## 概要
[機能仕様から抽出: 主要要件と技術的アプローチ]

**目的**: [この機能が解決する問題]
**技術選択**: [使用する主要技術（Move、Kiosk、Walrus、Seal等）]
**実装範囲**: [MVPとして実装する最小限の範囲]

## 技術コンテキスト

### OneTubeスタック
- **Smart Contract**: Move言語、Sui devnet
- **NFT標準**: Kiosk標準API
- **Storage**: Walrus分散ストレージ（BLOB ID管理）
- **Encryption**: Seal（セッション管理、暗号化解除）
- **Frontend**: React + Vite + Sui Wallet Adapter
- **Backend**: Express + TypeScript
- **Sponsored Transaction**: サーバー署名（モック実装）

### この機能で使用する技術
[該当する技術にチェック、必要に応じて詳細を追加]

- [ ] **Move契約**: [機能の説明]
- [ ] **Kiosk API**: [使用するKiosk操作]
- [ ] **Walrus**: [BLOB操作の詳細]
- [ ] **Seal**: [セッション管理の詳細]
- [ ] **Frontend (React)**: [UIコンポーネント]
- [ ] **Backend (Express)**: [API endpoints]
- [ ] **Sui SDK**: [使用する機能]

## MVP設計チェック

### シンプルさ
- [ ] 必要最小限のファイル数か？
- [ ] 複雑なデザインパターンを避けているか？
- [ ] App.tsxにUIを集約できるか？（フロントエンドの場合）

### TDD原則
- [ ] Contract Test → Integration Test → E2E Test の順序を守るか？
- [ ] テストを先に書くか？（RED → GREEN → Refactor）
- [ ] 実依存を使用するか？（モックではなく実際のSui devnet）

### OneTube固有の考慮
- [ ] Kiosk標準に準拠しているか？
- [ ] 収益分配（70%/25%/5%）が正しく実装されるか？
- [ ] Sponsored Transactionのモック実装を理解しているか？
- [ ] Sealセッション管理を考慮しているか？

## プロジェクト構造

### OneTube ディレクトリ構造
```
one-tube/
├── contracts/                      # Move smart contracts
│   ├── sources/
│   │   └── contracts.move          # NFT, Kiosk, Transfer Policy
│   └── tests/
│       └── contracts_tests.move    # Contract tests
│
├── app/                            # Frontend + Backend
│   ├── src/
│   │   ├── App.tsx                 # Single component UI
│   │   ├── lib/
│   │   │   ├── sui.ts              # Sui SDK integration
│   │   │   └── api.ts              # API client
│   │   └── server/
│   │       ├── server.ts           # Express API
│   │       ├── sponsor.ts          # Sponsored Transaction
│   │       ├── kiosk.ts            # Kiosk operations
│   │       └── seal-mock.ts        # Seal session management
│   └── tests/
│       └── e2e.spec.ts             # E2E tests
│
├── scripts/
│   ├── tool.ts                     # CLI tool (deploy/seed/demo)
│   └── update-package-id.ts        # .env updater
│
└── docs/
    ├── specs/[feature-name]/       # Optional: Feature specs
    ├── plans/[feature-name]/       # Optional: Implementation plans
    ├── tasks/[feature-name]/       # Optional: Task lists (組み込みTodo推奨)
    └── ...
```

### この機能で変更/追加するファイル
[実装で変更するファイルをリストアップ]

**Contract層**:
- [ ] `contracts/sources/contracts.move` - [変更内容]
- [ ] `contracts/tests/` - [追加するテスト]

**Backend層**:
- [ ] `app/src/server/[ファイル名].ts` - [変更内容]

**Frontend層**:
- [ ] `app/src/App.tsx` - [UI変更]
- [ ] `app/src/lib/[ファイル名].ts` - [SDK連携]

## 実装アプローチ

### 設計と技術調査
[必要に応じて技術的な調査結果を記載]

**調査が必要な項目**:
- [ ] [不明点1]: [調査内容]
- [ ] [不明点2]: [調査内容]

**技術的な決定**:
- **[決定1]**: [選択した技術/アプローチ] - [理由]
- **[決定2]**: [選択した技術/アプローチ] - [理由]

### データモデル（該当する場合）
[この機能で扱うデータ構造]

**OneTube固有のデータ例**:
- **VideoNFT**: `{ id: ObjectID, blob_id: String, price: u64, athlete_id: address }`
- **Session**: `{ session_id: String, nft_id: ObjectID, expires_at: u64 }`

### API設計（該当する場合）
[この機能で追加/変更するAPI]

**Endpoint例**:
- `POST /api/purchase` - NFT購入（Sponsored Transaction）
- `POST /api/watch` - 視聴セッション作成（Seal）
- `GET /api/videos` - 動画リスト取得

### テスト戦略

**Contract Test** (優先度: 最高):
- [ ] [テスト内容1]
- [ ] [テスト内容2]

**Integration Test** (優先度: 高):
- [ ] [テスト内容1]
- [ ] [テスト内容2]

**E2E Test** (優先度: 中):
- [ ] [テスト内容1]
- [ ] [テスト内容2]

## タスク分解の方針

**`/tasks`コマンドで生成するタスクの概要**:

1. **セットアップ**: 環境設定、依存関係追加
2. **Contract Test作成**: Move契約のテストを先に書く
3. **Contract実装**: Move契約の実装
4. **Integration Test作成**: Backend統合テストを先に書く
5. **Backend実装**: Express API実装
6. **Frontend実装**: React UI実装
7. **E2E Test**: 全体フロー確認
8. **Deploy & Demo**: devnetデプロイとデモ確認

**推定タスク数**: [10-20個程度]

## 利用するスクリプト

この機能の実装で使用する`package.json`スクリプト:
- [ ] `pnpm move:test` - Move契約テスト
- [ ] `pnpm deploy:devnet` - Devnetデプロイ
- [ ] `pnpm seed:devnet` - シード投入
- [ ] `pnpm demo:purchase` - 購入デモ
- [ ] `pnpm demo:view` - 視聴デモ
- [ ] `pnpm biome:check` - Linter実行

## 実装の注意点

### MVP原則の遵守
- **最小限**: 必要最小限の機能のみ実装
- **シンプル**: 複雑な設計パターンは使わない
- **テストファースト**: テスト → 実装の順序を守る

### OneTube固有の注意
- **Kiosk標準**: 必ずKiosk APIを使用
- **Transfer Policy**: 収益分配ロジックを正しく実装
- **Seal Session**: セッション期限（30秒/テスト用）を考慮
- **Sponsored Transaction**: モック実装であることを理解

---