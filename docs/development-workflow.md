# OneTube - Issue駆動開発ワークフロー

## このドキュメントについて

このドキュメントは、OneTubeプロジェクトで**Claude Codeを使ったIssue駆動開発**を実践するための実践ガイドです。

### 対象読者
- OneTubeプロジェクトに初めて参加する開発者
- Claude Codeを初めて使う開発者
- Issue駆動開発の進め方を知りたい開発者

### 前提知識
- 基本的なGit操作
- TypeScript / Move言語の基礎
- Claude Codeの基本的な使い方（チャット操作）

---

## Claude Code 基本コマンド

OneTubeプロジェクトでは、Claude Codeの4つの主要コマンドを使って開発を進めます。

| コマンド | 役割 | ファイル出力 |
|---------|------|-------------|
| `/specify` | 機能仕様書の作成 | 任意（チャット履歴推奨） |
| `/plan` | 実装計画の生成 | 任意（チャット履歴推奨） |
| `/tasks` | タスクリストの生成 | 任意（TodoWrite推奨） |
| `/execute` | タスクの実行 | - |

**注**: ファイル保存は完全に任意です。MVP開発では、チャット履歴とClaude Code組み込みTodoリストで管理することを推奨します。

### コマンドの実行順序

```
/specify → /plan → /tasks → /execute（繰り返し）
```

### コマンド詳細

#### `/specify` - 機能仕様書の作成
- ユーザーの要求から機能仕様を作成
- OneTube技術スタック（Kiosk、Walrus、Seal）を考慮
- MVP設計方針に基づいたシンプルな仕様

**ファイル保存先（任意）**:
- `docs/specs/[機能名]/spec.md`
- または`docs/[機能名]-spec.md`

#### `/plan` - 実装計画の生成
- 仕様書から実装計画を作成
- TDD戦略（Contract → Integration → E2E）を明示
- 使用する技術とファイルパスを具体化

**ファイル保存先（任意）**:
- `docs/plans/[機能名]/plan.md`
- または`docs/[機能名]-plan.md`

#### `/tasks` - タスクリストの生成
- 実装計画から具体的なタスクに分解
- TDD順序（テスト → 実装）を維持
- [P]マークで並列実行可能タスクを明示

**推奨**: Claude Code組み込みTodoリスト（`TodoWrite`ツール）を使用
- リアルタイム更新
- チャット内で進捗確認
- ファイル保存不要

#### `/execute` - タスクの実行
- Todoリストまたはtasks.mdから次のタスクを実行
- TDDサイクル（RED → GREEN → Refactor）を遵守
- `package.json`スクリプトと連携（`pnpm move:test`等）

---

## 開発コマンドリファレンス

OneTubeプロジェクトでは、`package.json`に定義された便利なスクリプトを使って開発を進めます。

### 実装・テストコマンド

#### Move契約テスト
```bash
pnpm move:test
# または: cd contracts && sui move test
```
**用途**: Move契約の単体テスト実行

#### フロントエンド開発サーバー
```bash
pnpm dev
# → http://localhost:5173
```
**用途**: Vite + Express開発サーバー起動

#### プロダクションビルド
```bash
pnpm build
```
**用途**: TypeScriptコンパイル、フロントエンドビルド

### デプロイ・シードコマンド

#### Devnetデプロイ
```bash
pnpm deploy:devnet
```
**実行内容**:
- Sui Move契約をdevnetにデプロイ
- Package IDを`.env`に自動保存
- Kioskの初期化

#### シードデータ投入
```bash
pnpm seed:devnet
```
**実行内容**:
- `mint_batch`でNFT一括発行
- Kioskにデポジット・価格設定
- Walrus BLOB保存、Seal暗号化

### デモ実行コマンド

#### NFT購入デモ
```bash
pnpm demo:purchase
```
**実行内容**:
- Sponsored TransactionでNFT購入
- Transfer Policy収益分配実行

#### 動画視聴デモ
```bash
pnpm demo:view
```
**実行内容**:
- NFT所有権確認
- Sealセッションキー発行（30秒）
- 動画URL取得

### 品質管理コマンド

#### Linter/Formatter
```bash
pnpm biome:check  # チェックのみ
pnpm biome:fix    # 自動修正
pnpm format       # フォーマットのみ
```

### ワークフロー管理コマンド（Claude Code統合）

#### 品質ゲート（コミット前推奨）
```bash
pnpm check:packages
```
**実行内容**:
- ✅ Move契約ビルド＆テスト
- ✅ TypeScript型チェック
- ✅ Linter実行
- ✅ ビルドチェック
- ✅ タイムアウト保護（各120秒）

**推奨使用タイミング**: `git commit` の直前

#### 機能ディレクトリパス表示
```bash
pnpm workflow:paths
```
**実行内容**:
- ✅ 現在のブランチに対応する機能ディレクトリパスを環境変数形式で出力

---

## 推奨開発フロー

新規開発者向けの、実践的なステップバイステップガイドです。

### パターンA: 新機能開発（チャット履歴ベース・推奨）

**最もシンプルなMVPアプローチ**

#### Step 1: 環境セットアップ
```bash
# 1. 依存関係インストール
pnpm install

# 2. 環境変数設定
cp .env.example .env
# .envを編集してSUI_PRIVATE_KEYを設定

# 3. Devnetデプロイ
pnpm deploy:devnet

# 4. シードデータ投入
pnpm seed:devnet
```

#### Step 2: 機能開発（Claude Code使用）
```bash
# 1. 仕様書作成
/specify "NFT購入フロー: Kiosk統合とSponsored Transaction"

# 2. 実装計画作成
/plan

# 3. タスク作成（TodoWriteツール推奨）
/tasks

# 4. 実装（1タスクずつ）
/execute
```

#### Step 3: 品質チェックとコミット
```bash
# 1. 品質ゲート実行
pnpm check:packages

# 2. コミット
git add .
git commit -m "feat: implement NFT purchase flow"
```

#### Step 4: デモ実行
```bash
# 1. 購入フローデモ
pnpm demo:purchase

# 2. 視聴フローデモ
pnpm demo:view

# 3. フロントエンド確認
pnpm dev
# → http://localhost:5173 で動作確認
```

---

### コミット前チェックリスト

#### 必須チェック
```bash
# 全チェック一括実行（推奨）
pnpm check:packages
```

#### 個別チェック（トラブルシューティング用）
```bash
# 1. Move契約テスト
pnpm move:test

# 2. Linter/Format
pnpm biome:check

# 3. ビルドチェック
pnpm build
```

---

## Issue作成の判断基準

新しい機能を実装する前に、「Issueを作るべきか」を判断します。

### ✅ Issueを作るべき機能

以下のいずれかに該当する場合、Issueを作成します：

- **複雑な実装が必要**（目安: 3日以上かかる）
- **複数ファイルにまたがる変更**
- **明確に切り離せる機能単位**
- **他の開発者と協力する可能性がある**

**具体例**:
```
✅ 001-smart-contract-deployment
   - NFT構造定義
   - mint_batch実装
   - Transfer Policy設定
   → 複数ファイル、複雑な実装

✅ 002-kiosk-integration
   - Kiosk購入処理
   - 在庫管理
   → 3日以上、明確な機能単位

✅ 003-sponsored-transaction
   - Backend署名サービス
   - ガス代負担処理
   → 新しいサービスレイヤー、複数ファイル
```

---

### ❌ Issueを作らない機能

以下の場合、Issueを作らず直接実装します：

- **小さなバグ修正**
- **UI調整**（色、フォント、レイアウト微調整）
- **環境変数追加**
- **簡単なリファクタリング**
- **ドキュメント更新**

**具体例**:
```
❌ "購入ボタンの色を青から緑に変更"
   → 1ファイル、5分で完了

❌ "エラーメッセージの文言修正"
   → 軽微な変更

❌ ".env.exampleにWALRUS_URLを追加"
   → 設定追加のみ

→ これらはClaude Codeに直接依頼
```

---

## Issue駆動開発のワークフロー

### パターン1: 大きな機能（Issue作成）

複雑な機能を実装する際の標準フローです。

#### ステップ1: 仕様書作成（`/specify`）

```bash
# Claude Codeで実行
/specify "NFT購入フロー: Kioskでの購入処理とSponsored Transaction統合"
```

**実行結果**:
- `docs/issues/001-nft-purchase-flow/spec.md` が生成される
- Claude Codeが要件を整理して仕様書にまとめる

**spec.mdの内容例**:
```markdown
# 001-nft-purchase-flow

## 概要
KioskでのNFT購入処理と、Sponsored Transactionによるガス代負担を統合実装する。

## 実装内容
### 1. Backend: Sponsored Transaction署名サービス
- エンドポイント: POST /api/purchase
- ガス代負担処理
- ユーザー署名とサーバー署名の統合

### 2. Frontend: 購入ボタン実装
- Sui Wallet連携
- トランザクション送信

### 3. Smart Contract連携
- Kiosk purchase関数の呼び出し
- Transfer Policy適用

## 成功基準
- ユーザーがガス代を支払わずにNFT購入できる
- 収益分配が自動実行される
```

**確認ポイント**:
- ✅ 実装内容が明確か
- ✅ 成功基準が定義されているか
- ✅ 依存関係が明記されているか

→ 問題なければ次へ

---

#### ステップ2: 実装計画生成（`/plan`）

```bash
# spec.mdを確認後、実行
/plan
```

**実行結果**:
- `docs/issues/001-nft-purchase-flow/plan.md` が生成される
- Claude Codeが実装ステップを自動提案

**plan.mdの内容例**:
```markdown
# 実装計画: 001-nft-purchase-flow

## Phase 1: Backend API実装
1. `app/src/server/sponsor.ts` 作成
2. Sponsored Transaction署名処理実装
3. エンドポイント `/api/purchase` 追加

## Phase 2: Frontend統合
1. `app/src/lib/api.ts` に購入API追加
2. `App.tsx` に購入ボタン実装
3. Sui Wallet連携

## Phase 3: テスト
1. ユニットテスト: sponsor.ts
2. 統合テスト: purchase API
3. E2Eテスト: 購入フロー全体

## 見積もり
- 実装: 2日
- テスト: 1日
- 合計: 3日
```

**確認ポイント**:
- ✅ 実装順序が適切か
- ✅ テストが含まれているか
- ✅ 見積もりが現実的か

→ 問題なければ次へ

---

#### ステップ3: タスク分解（`/tasks`）

```bash
# plan.mdを確認後、実行
/tasks
```

**実行結果**:
- `docs/issues/001-nft-purchase-flow/tasks.md` が生成される
- Claude Codeが具体的なタスクリストを作成

**tasks.mdの内容例**:
```markdown
# タスク: 001-nft-purchase-flow

## Backend API実装
- [ ] `app/src/server/sponsor.ts` ファイル作成
- [ ] `sponsorPurchase()` 関数実装
  - [ ] トランザクション構築
  - [ ] サーバー署名追加
  - [ ] エラーハンドリング
- [ ] Express ルート `/api/purchase` 追加
- [ ] 環境変数 `SPONSOR_PRIVATE_KEY` 追加

## Frontend統合
- [ ] `app/src/lib/api.ts` に `purchaseNFT()` 追加
- [ ] `App.tsx` に購入ボタン追加
- [ ] ローディング状態管理
- [ ] エラー表示UI

## テスト
- [ ] `sponsor.test.ts` 作成
- [ ] 統合テスト: purchase API
- [ ] E2Eテスト: 購入フロー

## ドキュメント
- [ ] README.md に購入フローの説明追加
- [ ] 環境変数ドキュメント更新
```

**確認ポイント**:
- ✅ タスクが具体的か（「何を」「どこに」が明確）
- ✅ テストタスクが含まれているか
- ✅ 実装可能な粒度に分解されているか

→ OK なら実装開始

---

#### ステップ4: 実装開始

Claude Codeに実装を依頼します。

```bash
# 例: 最初のタスクを実装
"tasks.mdの「Backend API実装」セクションを実装してください。
sponsor.tsファイルを作成し、sponsorPurchase関数を実装してください。"
```

**Claude Codeの動作**:
- tasks.mdを参照しながら実装
- ファイル作成、コード生成
- テストコード作成

**実装中のポイント**:
1. **1タスクずつ実装**（一度に全部やらない）
2. **各タスク完了後にテスト実行**
3. **問題があれば即座にClaude Codeに報告**

**進捗管理**:
```markdown
# tasks.md の更新
- [x] `app/src/server/sponsor.ts` ファイル作成 ✅
- [x] `sponsorPurchase()` 関数実装 ✅
- [ ] Express ルート `/api/purchase` 追加 ← 次のタスク
```

---

### パターン2: 小さな機能（Issueなし）

簡単な修正や追加は、Issueを作らず直接実装します。

#### 実装例1: UI調整

```bash
# Claude Codeに直接依頼
"購入ボタンの色を青から緑に変更してください。"
```

**Claude Codeの動作**:
- App.tsxを直接編集
- Issue作成なし
- 即座に完了

---

#### 実装例2: バグ修正

```bash
# バグ報告と修正依頼
"NFT所有確認のAPIが404エラーを返します。
app/src/server/index.tsのルート定義を確認してください。"
```

**Claude Codeの動作**:
- エラー箇所を特定
- 修正コード提案
- Issue作成なし

---

#### 実装例3: 環境変数追加

```bash
# 設定追加依頼
"SEAL_SESSION_DURATIONを.env.exampleに追加してください。
デフォルト値は30秒です。"
```

**Claude Codeの動作**:
- .env.example更新
- README.mdの環境変数セクション更新（必要に応じて）
- Issue作成なし

---

## OneTubeプロジェクトのIssue例

MVP実装で作成すべきIssueの全体像です。

### Issue一覧

| Issue番号 | 機能名 | 実装内容 | 優先度 |
|----------|--------|---------|--------|
| 001 | smart-contract-deployment | NFT構造定義、mint_batch、Transfer Policy | 🔴 必須 |
| 002 | kiosk-integration | Kiosk購入処理、在庫管理 | 🔴 必須 |
| 003 | sponsored-transaction | Backend署名サービス、ガス代負担 | 🔴 必須 |
| 004 | walrus-seal-integration | Walrus BLOB保存、Seal暗号化/復号 | 🔴 必須 |
| 005 | frontend-ui | 試合一覧、購入ボタン、動画プレーヤー | 🔴 必須 |

### 実装順序

```
Phase 1: Smart Contract基盤
001-smart-contract-deployment

Phase 2: Backend統合
003-sponsored-transaction
004-walrus-seal-integration

Phase 3: Kiosk統合
002-kiosk-integration

Phase 4: Frontend
005-frontend-ui
```

**重要**: すべてのIssueを一度に作る必要はありません。実装する直前に `/specify` で作成してください。

---

## ディレクトリ構造

Issue駆動開発で生成されるファイル構造：

```
docs/
├── requirements.md              # プロジェクト全体の要件定義
├── design.md                    # システム設計書
├── development-workflow.md      # 本ドキュメント
└── issues/                      # Issue管理ディレクトリ
    ├── 001-smart-contract-deployment/
    │   ├── spec.md              # /specify で生成
    │   ├── plan.md              # /plan で生成
    │   └── tasks.md             # /tasks で生成
    ├── 002-kiosk-integration/
    │   ├── spec.md
    │   ├── plan.md
    │   └── tasks.md
    ├── 003-sponsored-transaction/
    │   ├── spec.md
    │   ├── plan.md
    │   └── tasks.md
    ├── 004-walrus-seal-integration/
    │   ├── spec.md
    │   ├── plan.md
    │   └── tasks.md
    └── 005-frontend-ui/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

### ブランチ命名戦略

OneTube MVPでは、柔軟なブランチ命名をサポートしています。

#### パターン1: ユーザー名ベース（推奨：MVP開発）
```bash
feature/yuseiwhite
feature/john-doe
```
- 個人開発に最適
- Issue番号管理不要
- チャット履歴で進捗管理

#### パターン2: 機能名ベース
```bash
feature/nft-purchase
feature/video-streaming
feature/wallet-integration
```
- 機能が明確
- ドキュメント任意
- シンプルで分かりやすい

#### パターン3: Issue番号付き（オプション）
```bash
feature/001-smart-contract-deployment
feature/002-kiosk-integration
feature/i96-nft-marketplace
```
- 従来のIssue管理と互換性
- 複数人での協業時に有用
- `docs/issues/###-feature-name/`でドキュメント管理

### ディレクトリ構造（完全任意）

ドキュメントをファイルに保存する場合の推奨構造：

```
# オプション1: シンプル構造（MVP推奨）
docs/
├── nft-purchase-spec.md
├── nft-purchase-plan.md
└── nft-purchase-tasks.md

# オプション2: 機能ディレクトリ
docs/specs/nft-purchase/
├── spec.md
├── plan.md
└── tasks.md

# オプション3: Issue番号付き（従来方式）
docs/issues/001-nft-purchase/
├── spec.md
├── plan.md
└── tasks.md
```

**MVP開発での推奨**:
- ✅ チャット履歴で管理（ファイル作成不要）
- ✅ Claude Code組み込みTodoリスト使用
- ❌ 過度なドキュメント管理は避ける

---

## ベストプラクティス

### 1. spec.mdの書き方

**良いspec.md**:
```markdown
# 003-sponsored-transaction

## 概要
ユーザーのガス代をプラットフォームが負担する仕組みを実装する。

## 実装内容
### Backend署名サービス
- ファイル: `app/src/server/sponsor.ts`
- 関数: `sponsorPurchase(userAddress, listingId)`
- 処理:
  1. トランザクション構築
  2. サーバー署名追加
  3. ユーザー署名とマージ
  4. トランザクション送信

### API設計
- エンドポイント: `POST /api/purchase`
- リクエスト: `{ userAddress: string, listingId: string }`
- レスポンス: `{ success: boolean, txId: string }`

## 依存関係
- Sui SDK: `@mysten/sui.js`
- 環境変数: `SPONSOR_PRIVATE_KEY`

## 成功基準
- ユーザーがガス代を支払わずにNFT購入できる
- トランザクションが正常に実行される
- エラーハンドリングが適切に動作する

## テスト
- ユニットテスト: sponsor.ts
- 統合テスト: purchase API
- E2Eテスト: 購入フロー全体
```

**ポイント**:
- ✅ 実装内容が具体的（ファイル名、関数名を明記）
- ✅ API設計が明確
- ✅ 依存関係が記載されている
- ✅ 成功基準が定義されている
- ✅ テストが含まれている

---

### 2. Claude Codeとのコミュニケーション

#### 効果的な依頼方法

**❌ 悪い例**:
```
"購入機能を実装してください"
→ 抽象的すぎる
```

**✅ 良い例**:
```
"docs/issues/003-sponsored-transaction/tasks.md の
「Backend署名サービス」セクションを実装してください。

具体的には:
1. app/src/server/sponsor.ts ファイルを作成
2. sponsorPurchase関数を実装
3. Sui SDKを使ってトランザクション構築
4. SPONSOR_PRIVATE_KEY で署名

参考: docs/issues/003-sponsored-transaction/spec.md"
```

**ポイント**:
- ✅ 具体的なファイル名
- ✅ 実装すべき関数名
- ✅ 使用する技術スタック
- ✅ 参照ドキュメント

---

#### 問題が起きた時の報告方法

**❌ 悪い例**:
```
"エラーが出ました"
→ 情報が不足
```

**✅ 良い例**:
```
"app/src/server/sponsor.ts の sponsorPurchase関数でエラーが発生しました。

エラーメッセージ:
```
Error: Invalid private key format
  at KeyPair.fromSecretKey (sui.js:123)
  at sponsorPurchase (sponsor.ts:45)
```

実行コマンド:
```
pnpm test:api
```

環境:
- Node.js: v20.10.0
- @mysten/sui.js: 0.50.0
- SPONSOR_PRIVATE_KEY は .env に設定済み

期待動作:
トランザクションが正常に構築され、署名が追加される
```

**ポイント**:
- ✅ エラーメッセージ全文
- ✅ 実行コマンド
- ✅ 環境情報
- ✅ 期待動作

---

### 3. テスト駆動開発（TDD）

OneTubeプロジェクトでは、TDDを推奨します。

#### テストの優先順位

```
1. Contract Test（最優先）
   - Smart Contractの動作確認
   - Kiosk、Walrus、Sealの統合テスト

2. Integration Test
   - API統合テスト
   - Backend ↔ Smart Contract

3. E2E Test
   - 購入フロー全体
   - 視聴フロー全体

4. Unit Test
   - 個別関数のテスト
```

#### TDDのワークフロー

```bash
# 1. テストを先に書く
"sponsor.tsのテストを先に書いてください。
テストケース:
- 正常系: トランザクション構築成功
- 異常系: 無効な秘密鍵でエラー"

# 2. テスト実行（失敗することを確認）
pnpm test

# 3. 実装
"テストが通るようにsponsorPurchase関数を実装してください"

# 4. テスト実行（成功することを確認）
pnpm test

# 5. リファクタリング（必要に応じて）
"sponsorPurchase関数をリファクタリングしてください。
エラーハンドリングをより明確にしてください。"
```

---

## チェックリスト

### Issue作成前

- [ ] 実装内容が明確か
- [ ] 3日以上かかる見込みか（またはか複数ファイルにまたがるか）
- [ ] 既存Issueと重複していないか
- [ ] requirements.mdを読んで全体像を理解したか

### 実装開始前

- [ ] `/specify` で spec.md を作成したか
- [ ] spec.md の内容を確認したか（実装内容が具体的か）
- [ ] `/plan` で plan.md を生成したか
- [ ] plan.md の実装順序が適切か確認したか
- [ ] `/tasks` で tasks.md を生成したか
- [ ] tasks.md のタスクが具体的か確認したか
- [ ] 依存ライブラリがインストール済みか
- [ ] 環境変数が設定されているか

### 実装完了時

- [ ] すべてのタスクが完了したか（tasks.mdにチェック）
- [ ] テストが通るか
  - [ ] Contract Test
  - [ ] Integration Test
  - [ ] E2E Test
- [ ] ドキュメントを更新したか
  - [ ] README.md
  - [ ] 環境変数ドキュメント
- [ ] コードレビューを受けたか（必要に応じて）
- [ ] 本番デプロイ前の確認
  - [ ] devnet でテスト済みか
  - [ ] エラーハンドリングが適切か
  - [ ] セキュリティ上の問題がないか

---

## 参考ドキュメント

- [requirements.md](./requirements.md) - プロジェクト全体の要件定義
- [design.md](./design.md) - システム設計書
- [CLAUDE.md](../CLAUDE.md) - Claude Code設定
- [README.md](../README.md) - プロジェクト概要

---

## まとめ

### Issue駆動開発の流れ

```
1. 機能が複雑か判断
   ├─ YES → Issue作成（/specify → /plan → /tasks）
   └─ NO  → 直接実装

2. spec.md を確認
   - 実装内容が明確か
   - 成功基準が定義されているか

3. plan.md を確認
   - 実装順序が適切か
   - テストが含まれているか

4. tasks.md を見ながら実装
   - 1タスクずつ実装
   - 各タスク完了後にテスト

5. 実装完了
   - すべてのテストが通る
   - ドキュメント更新
```

### 成功のポイント

1. **具体的に依頼する**（ファイル名、関数名を明記）
2. **1タスクずつ実装する**（一度に全部やらない）
3. **テストを先に書く**（TDD）
4. **ドキュメントを最新に保つ**
5. **問題が起きたら即座に報告**（詳細な情報を添えて）

---

## 次のステップ

1. **requirements.mdを読む** - プロジェクト全体を理解
2. **design.mdを読む** - システム構成を理解
3. **最初のIssueを作成** - `/specify "001-smart-contract-deployment"`
4. **実装開始** - tasks.mdを見ながら1タスクずつ実装
