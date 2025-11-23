# 実装計画: Seal統合実装（Phase 1 + Phase 3）

**ブランチ**: `feature/yuseiwhite` 
 **日付**: 2025-11-21
**OneTubeプロジェクト**: NFT-Gated Video Streaming Platform (MVP)

---

## 概要

Seal SDKを使用した暗号化・復号・アクセス制御の実装計画。Phase 1（動画暗号化とseal_approve_nft関数設定）とPhase 3（セッション管理と視聴）を実装する。

**目的**: NFT所有者のみが復号できる動画配信システムを構築する
**技術選択**: Seal SDK（@mysten/seal）、Move言語、Walrus HTTP API
**実装範囲**: MVPとして必要最小限の機能（Phase 1 + Phase 3）

## 技術コンテキスト

### OneTubeスタック
- **Smart Contract**: Move言語、Sui devnet
- **NFT標準**: Kiosk標準API
- **Storage**: Walrus分散ストレージ（BLOB ID管理）
- **Encryption**: Seal SDK（暗号化・復号・アクセス制御をSealに委譲）
- **Frontend**: React + Vite + Sui Wallet Adapter
- **Backend**: Express + TypeScript
- **Session Storage**: JSONファイルベース永続化（ローカル開発専用）

### この機能で使用する技術

- [x] **Move契約**: `seal_approve_nft`関数の実装（NFT所有確認）
- [ ] **Walrus**: HTTP API（Publisher API + Aggregator API）
- [x] **Seal SDK**: SealClient.encrypt() / decrypt()を使用
- [ ] **Backend (Express)**: `/api/watch`と`/api/video`エンドポイントの拡張
- [x] **Sui SDK**: PTB構築、SessionKey作成

## MVP設計チェック

### シンプルさ
- [x] 必要最小限のファイル数か？ → 既存ファイルに追加する形で実装
- [x] 複雑なデザインパターンを避けているか？ → Seal SDKに委譲し、アプリロジックは最小限
- [x] App.tsxにUIを集約できるか？ → フロントエンド変更は最小限（既存UIを活用）

### TDD原則
- [x] Contract Test → Integration Test → E2E Test の順序を守るか？ → はい
- [x] テストを先に書くか？（RED → GREEN → Refactor） → はい
- [x] 実依存を使用するか？（モックではなく実際のSui devnet） → はい

### OneTube固有の考慮
- [x] Kiosk標準に準拠しているか？ → 既存実装を維持
- [x] Sealセッション管理を考慮しているか？ → SessionKeyとPTBを使用
- [x] Seal公式の推奨方法に準拠しているか？ → SealClient.encrypt() / decrypt()を使用

## プロジェクト構造

### この機能で変更/追加するファイル

**Contract層**:
- [x] `contracts/sources/contracts.move` - `seal_approve_nft`関数を追加
- [x] `contracts/tests/contracts_tests.move` - `seal_approve_nft`テストケースを追加

**Backend層**:
- [x] `app/src/server/seal.ts` - SealClient初期化、SessionKey管理、暗号化・復号関数を実装
- [x] `app/src/server/server.ts` - `/api/watch`と`/api/video`エンドポイントを拡張
- [x] `app/src/server/walrus.ts` - Walrus HTTP API統合モジュール（新規作成）
- [x] `app/src/lib/logger.ts` - 開発者モード対応ロガー（新規作成）
- [x] `app/src/shared/types.ts` - エラータイプとSession型を拡張
- [x] `app/data/sessions.json` - セッション永続化ファイル（自動生成）

**Scripts層**:
- [x] `scripts/encrypt-video.ts` - SealClientを使用した動画暗号化スクリプト（新規作成）

**Test層**:
- [x] `app/src/server/__tests__/seal.test.ts` - ユニットテスト（新規作成）
- [x] `app/src/server/__tests__/seal-integration.test.ts` - 統合テスト（新規作成）

## 実装アプローチ

### 設計と技術調査

**調査が必要な項目**:
- [x] Seal SDKのAPI仕様確認 → Seal公式ドキュメントを参照
- [x] Walrus HTTP APIの仕様確認 → Walrus公式ドキュメントを参照
- [x] `seal_approve_nft`関数のMove実装パターン → Seal公式ドキュメントを参照

**技術的な決定**:
- **Seal SDKを使用**: SealClient.encrypt() / decrypt()を使用し、マスター鍵はSeal key serverが保持
- **seal_approve_nft関数**: Moveモジュールで実装し、`tx_context::sender(ctx)`でトランザクションのsenderを取得
- **セッション管理**: JSONファイルベース（ローカル開発専用、本番ではin-memoryまたはclient-side保存）
- **Walrus統合**: HTTP APIを使用（Publisher API + Aggregator API）

### データモデル

**Session型（拡張）**:
```typescript
{
  sessionId: string;           // SHA-256ハッシュ
  userAddress: string;         // ユーザーウォレットアドレス
  nftId: string;              // NFTオブジェクトID
  blobId: string;             // Walrus BLOB ID（内部解決用）
  sessionKey: SessionKey;     // Seal SessionKeyオブジェクト（ユーザー署名済み）
  txBytes: string;            // seal_approve_nftを呼び出すPTBのバイト列
  createdAt: number;         // 作成タイムスタンプ（Unix timestamp ms）
  expiresAt: number;         // 有効期限（Unix timestamp ms、Seal key server側のTTL以下）
  // 注意: decryptionKeyフィールドは存在しない（復号鍵はSeal key serverが管理）
}
```

**エラータイプ（新規追加）**:
- `RPCConnectionError`: Sui RPC接続エラー
- `SessionNotFoundError`: セッションが見つからない
- `SessionStorageError`: セッションファイル読み込みエラー
- `WalrusConnectionError`: Walrus API接続エラー
- `BlobNotFoundError`: BLOB IDが存在しない
- `SealDecryptionError`: Seal復号失敗
- `SealEncryptionError`: Seal暗号化失敗
- `SealKeyServerError`: Seal key server接続エラー

### API設計

**既存エンドポイントの拡張**:

- **POST /api/watch**: セッション作成（拡張）
  - リクエスト: `{ nftId, userAddress }`（blobIdは不要、内部で解決）
  - レスポンス: `{ success, session: SessionMetadata }`
  - 内部処理:
    1. NFTメタデータからblobIdを内部で解決
    2. SessionKey作成 → ユーザー署名 → PTB構築（`seal_approve_nft`を含む）
    3. セッション作成 → JSONファイル保存

- **GET /api/video?session=<session-id>**: 動画取得（拡張）
  - リクエスト: `session`のみ（blobIdはセッション情報から内部で取得）
  - 内部処理:
    1. セッション検証 → セッション情報からblobIdを取得
    2. encryptedObjectをWalrusから取得
    3. SealClient.decrypt()で復号 → 一時URL返却

### テスト戦略

**Contract Test** (優先度: 最高):
- [x] `seal_approve_nft`関数のテスト（NFT所有確認）
  - NFTを所有している場合のみアクセス可能
  - NFTを所有していない場合はアクセス不可

**Integration Test** (優先度: 高):
- [x] NFT所有確認 + セッション作成フロー
  - NFT所有確認 → セッション作成 → セッション検証
  - セッション検証時のNFT所有確認

**Unit Test** (優先度: 中):
- [x] `seal.ts`の各関数
  - `verifyNFTOwnership()`
  - `createSession()`
  - `validateSession()`
  - `sealEncrypt()`（新規、SealClient.encrypt()の薄いラッパー）
  - `sealDecrypt()`（新規、SealClient.decrypt()の薄いラッパー）

**手動テスト**:
- [x] curlでバックエンドAPIを叩いて動画視聴まで完了

## タスク分解の方針

**`/tasks`コマンドで生成するタスクの概要**:

### Phase 1: 動画暗号化とseal_approve_nft関数設定

1. **環境設定**: Seal SDK依存関係追加、環境変数設定
2. **seal_approve_nft のテスト追加（RED）**: `seal_approve_nft`関数のテストを先に書く
3. **テストを通すための seal_approve_nft 実装（GREEN）**: `seal_approve_nft`関数をMoveコントラクトに実装
4. **SealClient初期化**: `seal.ts`にSealClient初期化ロジックを追加
5. **動画暗号化スクリプト**: `scripts/encrypt-video.ts`を作成
6. **Walrus統合**: `app/src/server/walrus.ts`を作成（Publisher API + Aggregator API）

### Phase 3: セッション管理と視聴

7. **SessionKey作成**: Seal SDKでSessionKeyを作成し、PTB構築
8. **セッション永続化**: JSONファイルベースのセッション管理を実装
9. **Integration Test作成**: NFT所有確認 + セッション作成フローをテスト
10. **Backend実装**: `/api/watch`と`/api/video`エンドポイントを拡張
11. **エラーハンドリング**: 新規エラータイプを追加し、適切に処理
12. **ロガー実装**: 開発者モード対応ロガーを実装
13. **Unit Test**: `seal.ts`の各関数をテスト
14. **手動テスト**: curlでバックエンドAPIを叩いて動画視聴まで完了

**推定タスク数**: 14個

## 利用するスクリプト

この機能の実装で使用する`package.json`スクリプト:
- [x] `pnpm move:test` - Move契約テスト
- [x] `pnpm deploy:devnet` - Devnetデプロイ
- [x] `pnpm seed:devnet` - シード投入
- [x] `pnpm test` - ユニットテスト実行
- [x] `pnpm test:api` - API統合テスト実行
- [x] `pnpm biome:check` - Linter実行

## 実装の注意点

### MVP原則の遵守
- **最小限**: 必要最小限の機能のみ実装（Phase 1 + Phase 3）
- **シンプル**: Seal SDKに委譲し、アプリロジックは最小限
- **テストファースト**: テスト → 実装の順序を守る

### OneTube固有の注意
- **Seal SDK準拠**: SealClient.encrypt() / decrypt()を使用し、マスター鍵はSeal key serverが保持
- **seal_approve_nft関数**: 読み取り専用で実装（storageを書き換えない）
- **セッション管理**: JSONファイルベース（ローカル開発専用、本番ではin-memoryまたはclient-side保存）
- **Walrus統合**: HTTP APIを使用（Publisher API + Aggregator API）
- **blobIdの解決**: セッション情報から内部で取得し、ユーザーからは受け取らない

### セキュリティ上の注意
- **マスター鍵**: Seal key serverが保持（アプリ側は保持しない）
- **SessionKey**: 通常ログに出力しない（DEV_MODE=true時のみ詳細ログを出力、マスク済み）
- **セッション期限**: Seal key server側のTTL以下になるように計算し、バックエンド側で管理
- **NFT所有確認**: セッション作成時 + セッション検証時に実行

## 実装順序

### Step 1: Phase 1実装（動画暗号化とseal_approve_nft関数設定）

1. **環境設定**
   - Seal SDK依存関係追加（`@mysten/seal`）
   - 環境変数設定（`.env.example`に追加）
   - SealClient初期化ロジックを`seal.ts`に追加

2. **seal_approve_nft のテスト追加（RED）**
   - `contracts/tests/contracts_tests.move`に`seal_approve_nft`テストケースを追加
   - NFT所有確認のテストを実装

3. **テストを通すための seal_approve_nft 実装（GREEN）**
   - `contracts/sources/contracts.move`に`seal_approve_nft`関数を追加
   - `tx_context::sender(ctx)`でトランザクションのsenderを取得
   - NFT所有確認ロジックを実装（読み取り専用）

4. **Walrus統合**
   - `app/src/server/walrus.ts`を作成
   - Publisher API（BLOBアップロード）を実装
   - Aggregator API（BLOB IDからURL解決）を実装

5. **動画暗号化スクリプト**
   - `scripts/encrypt-video.ts`を作成
   - SealClient.encrypt()を使用して動画を暗号化
   - WalrusにアップロードしてBLOB IDを取得

### Step 2: Phase 3実装（セッション管理と視聴）

6. **SessionKey作成とPTB構築**
   - Seal SDKでSessionKeyを作成
   - PTBを構築し、`seal_approve_nft`を呼び出すトランザクションを含める
   - ユーザーがSessionKeyに署名する処理を実装

7. **セッション永続化**
   - JSONファイルベースのセッション管理を実装
   - `app/data/sessions.json`に保存（自動生成）
   - サーバー起動時に既存セッションを読み込み

8. **Backend実装**
   - `/api/watch`エンドポイントを拡張（blobIdを内部で解決）
   - `/api/video`エンドポイントを拡張（SealClient.decrypt()を使用）
   - セッション検証時にNFT所有確認を実行

9. **エラーハンドリング**
   - 新規エラータイプを`shared/types.ts`に追加
   - エラー → HTTPステータスコード対応表に従って実装

10. **ロガー実装**
    - `app/src/lib/logger.ts`を作成
    - 開発者モード対応ロガーを実装（DEV_MODE=true時のみ詳細ログ）

11. **テスト実装**
    - Unit Test: `app/src/server/__tests__/seal.test.ts`
    - Integration Test: `app/src/server/__tests__/seal-integration.test.ts`

12. **手動テスト**
    - curlでバックエンドAPIを叩いて動画視聴まで完了

## 成功基準

### Phase 1成功基準
- [ ] SealClientを初期化できる
- [ ] SealClient.encrypt()を使用して動画を暗号化できる
- [ ] 暗号化オブジェクト（encryptedObject）をWalrusにアップロードし、BLOB IDを取得できる
- [ ] `seal_approve_nft`関数をMoveコントラクトでデプロイできる
- [ ] Seal identity IDを環境変数に保存できる

### Phase 3成功基準
- [ ] SessionKeyを作成し、ユーザーが署名できる
- [ ] PTBを構築し、`seal_approve_nft`を呼び出すトランザクションを含められる
- [ ] セッション情報をJSONファイルで永続化できる
- [ ] セッション検証時に期限切れセッションを自動削除できる
- [ ] Walrus APIからBLOB IDでencryptedObjectを動的に取得できる
- [ ] SealClient.decrypt()を使用して暗号化動画を復号できる
- [ ] `seal_approve_nft`関数が正しくNFT所有を確認できる
- [ ] 開発者モード時のみ詳細ログを出力できる
- [ ] すべてのエラーケースが適切に処理される

### テスト成功基準
- [ ] ユニットテストがすべて通過する
- [ ] 統合テストがすべて通過する
- [ ] curlでバックエンドAPIを叩いて動画視聴まで完了できる

## 依存関係

### 新規依存関係
- `@mysten/seal`: Seal SDK（暗号化・復号・アクセス制御）

### 環境変数（新規追加）
```bash
# Seal設定
SEAL_KEY_SERVER_OBJECT_IDS=0x...,0x...  # Seal key serverのobject ID（カンマ区切り）
SEAL_PACKAGE_ID=0x...                   # seal_approve_nft関数を含むMoveパッケージID
SEAL_IDENTITY_ID=0x...                  # Seal identity ID（hex形式、package IDのprefixなし）
SEAL_THRESHOLD=2                        # 復号に必要なkey serverの数（OneTubeは2-of-3相当）
SEAL_SESSION_DURATION=60                # SessionKeyの有効期限（秒単位、最小1分=60秒）

# SealClient設定
VERIFY_KEY_SERVERS=false                # ローカル開発ではfalse（パフォーマンス優先）

# Walrus設定
WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# 開発者モード
DEV_MODE=false                          # trueの場合のみ詳細ログを出力
```

## リスクと対策

### リスク1: Seal SDKのAPI仕様変更
- **対策**: Seal公式ドキュメントを参照し、最新のAPI仕様に準拠

### リスク2: Walrus HTTP APIの接続エラー
- **対策**: 適切なエラーハンドリングを実装（`WalrusConnectionError`）

### リスク3: セッション管理のパフォーマンス問題
- **対策**: MVPではJSONファイルベース（ローカル開発専用）、本番ではin-memoryまたはclient-side保存に寄せる

### リスク4: NFT所有確認のタイミング問題
- **対策**: セッション作成時 + セッション検証時に実行

## 参考資料

- [Seal公式ドキュメント - Encryption](https://seal-docs.wal.app/UsingSeal/#encryption)
- [Seal公式ドキュメント - Decryption](https://seal-docs.wal.app/UsingSeal/#decryption)
- [Seal公式ドキュメント - Access control management](https://seal-docs.wal.app/UsingSeal/#access-control-management)
- [OneTube Seal統合仕様書](./spec.md)
- [OneTube Seal統合アーキテクチャ](./seal-key-architecture.md)

