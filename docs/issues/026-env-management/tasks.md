# OneTube - 環境変数管理の設計修正タスクリスト

## 概要

**Issue番号**: #026
**ブランチ**: `feature/yuseiwhite`
**基礎ドキュメント**: `docs/issues/026-env-management/plan.md`

**タスク総数**: 9タスク
**推定時間**: 1-1.5時間
**実装フェーズ**: 3フェーズ

---

## Agentic Coding 品質基準

### 1. Correct（正確性）

**定義**: 意図通りに動作し、主要なワークフローは高速な自動テストによって検証されていることが望ましい。

**定性的指標**:
- 環境変数が正しく読み込まれる
- フロントエンドとサーバーで適切な環境変数が利用可能

**定量的指標**:
- フロントエンドとサーバーが正常に起動する
- 環境変数の読み込み確認が成功する

**実装方針**:
- パスの解決が正確であることを確認
- 既存の環境変数名との互換性を維持

---

### 2. Testable（テスト可能性）

**定義**: その設計が、意味のある単体・統合・E2Eテストをサポートしている。

**定性的指標**:
- 環境変数の読み込みが検証可能
- フロントエンドとサーバーで独立してテスト可能

**定量的指標**:
- 動作確認手順が明確に定義されている

**実装方針**:
- 各タスクに動作確認手順を含める
- 環境変数の読み込みをログで確認可能にする

---

### 3. Maintainable（保守性）

**定義**: コードは可読性があり、モジュール化され、一貫性があるため、他者が安全に理解し変更できる。

**定性的指標**:
- 環境変数の読み込み方法が統一されている
- ドキュメントが更新されている

**定量的指標**:
- コードの変更が最小限である
- 既存のワークフローとの互換性が保たれている

**実装方針**:
- 共通パターンを使用して一貫性を保つ
- ドキュメントを適切に更新する

---

### 4. Diagnosable（診断可能性）

**定義**: 効果的なトラブルシューティングをサポートするのに十分な計装（instrumentation）と構造的な明確さを提供している。

**定性的指標**:
- 環境変数の読み込みエラーが明確に報告される
- パスの解決が明確である

**定量的指標**:
- エラーメッセージが有用である
- ログ出力で環境変数の読み込みを確認可能

**実装方針**:
- エラー発生時に明確なメッセージを出力
- 環境変数の読み込み状況をログで確認可能にする

---

### 5. Disciplined（規律）

**定義**: バージョン管理、CI、静的解析など、健全なエンジニアリングプラクティスに従っている。

**定性的指標**:
- コードフォーマットが一貫している
- 不要なファイルが削除されている

**定量的指標**:
- リンターエラーがない
- TypeScript型チェックが通る

**実装方針**:
- Biomeでコードフォーマットを確認
- 不要なファイル（`app/.env`）を削除

---

## Phase 1: Vite設定の修正

### タスク 1.1: `app/vite.config.ts` を修正してルート `.env` を読み込む

**目的**: Viteがルートディレクトリの `.env` ファイルを自動的に読み込むように設定する

**ファイル**: `app/vite.config.ts`

**実装内容**:

1. `envDir: "../"` を `defineConfig` の設定オブジェクトに追加
   - これにより、Viteは `app/` ディレクトリの1つ上のディレクトリ（ルート）から環境変数を読み込む

**実装コード**:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	envDir: "../", // ルートディレクトリを環境変数の読み込み元に設定
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
});
```

**検証方法**:

```bash
# 1. フロントエンドを起動
pnpm dev

# 2. ブラウザのコンソールで確認
# 開発者ツールを開き、コンソールで以下を実行:
console.log(import.meta.env.VITE_PACKAGE_ID)

# 3. ルート .env の PACKAGE_ID の値が表示されることを確認
```

**期待される結果**:
- ✅ フロントエンドが正常に起動する
- ✅ `import.meta.env.VITE_PACKAGE_ID` がルート `.env` の値と一致する
- ✅ `import.meta.env.SPONSOR_PRIVATE_KEY` が `undefined` である（セキュリティ確認）

**品質基準チェックリスト**:
- [x] **Correct**: `envDir: "../"` が正しく設定されている ✅
- [x] **Testable**: `pnpm dev` で動作確認可能 ✅
- [x] **Maintainable**: 設定がシンプルで理解しやすい ✅
- [x] **Diagnosable**: 環境変数の読み込みをコンソールで確認可能 ✅
- [x] **Disciplined**: 既存のコードスタイルを維持 ✅

---

## Phase 2: Express設定の修正

### タスク 2.1: `app/src/server/server.ts` を修正

**目的**: Expressサーバーがルートディレクトリの `.env` ファイルを読み込むように修正する

**ファイル**: `app/src/server/server.ts`

**実装内容**:

1. `path` と `fileURLToPath` をインポート（ES Modules用）
2. `__filename` と `__dirname` を定義（ES Modules用）
3. `dotenv.config()` を `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` に変更

**実装コード**:

```typescript
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { sponsorPurchase, getSponsorBalance } from "./sponsor.js";
// ... 他のインポート

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// ... 既存のコード
```

**検証方法**:

```bash
# 1. サーバーを起動
pnpm dev:server

# 2. サーバーのログを確認
# 以下のようなログが表示されることを確認:
# ✅ OneTube API Server running on http://localhost:3001
# 📍 Network: devnet
# 📍 RPC: https://fullnode.devnet.sui.io:443

# 3. ヘルスチェックエンドポイントを確認
curl http://localhost:3001/api/health
```

**期待される結果**:
- ✅ サーバーが正常に起動する
- ✅ 環境変数（`NETWORK`, `RPC_URL` など）が正しく読み込まれている
- ✅ `/api/health` エンドポイントが正常に動作する

**品質基準チェックリスト**:
- [x] **Correct**: パスの解決が正確である（`../../../.env` がルートを指す） ✅
- [x] **Testable**: `pnpm dev:server` で動作確認可能 ✅
- [x] **Maintainable**: ES Modulesの標準的なパターンを使用 ✅
- [x] **Diagnosable**: サーバーログで環境変数の読み込みを確認可能 ✅
- [x] **Disciplined**: 既存のコードスタイルを維持 ✅

---

### タスク 2.2: `app/src/server/sponsor.ts` を修正

**目的**: `sponsor.ts` がルートディレクトリの `.env` ファイルを読み込むように修正する

**ファイル**: `app/src/server/sponsor.ts`

**実装内容**:

1. `path` と `fileURLToPath` をインポート
2. `__filename` と `__dirname` を定義
3. `dotenv.config()` を `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` に変更

**実装コード**:

```typescript
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHEX } from "@mysten/sui/utils";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { PurchaseRequest, PurchaseResponse } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// ... 既存のコード
```

**検証方法**:

```bash
# 1. サーバーを起動
pnpm dev:server

# 2. sponsor.ts の初期化ログを確認
# 以下のようなログが表示されることを確認:
# ✅ Sponsor service initialized
# 📍 Network: https://fullnode.devnet.sui.io:443
# 📍 Sponsor address: 0x...

# 3. 環境変数が読み込まれていることを確認
# SPONSOR_PRIVATE_KEY, PACKAGE_ID, KIOSK_ID などが設定されていることを確認
```

**期待される結果**:
- ✅ サーバーが正常に起動する
- ✅ `SPONSOR_PRIVATE_KEY`, `PACKAGE_ID`, `KIOSK_ID` などの環境変数が正しく読み込まれている
- ✅ Sponsor service が正常に初期化される

**品質基準チェックリスト**:
- [x] **Correct**: パスの解決が正確である ✅
- [x] **Testable**: サーバー起動で動作確認可能 ✅
- [x] **Maintainable**: 他のサーバーファイルと同じパターンを使用 ✅
- [x] **Diagnosable**: 初期化ログで環境変数の読み込みを確認可能 ✅
- [x] **Disciplined**: 既存のコードスタイルを維持 ✅

---

### タスク 2.3: `app/src/server/seal.ts` を修正

**目的**: `seal.ts` がルートディレクトリの `.env` ファイルを読み込むように修正する

**ファイル**: `app/src/server/seal.ts`

**実装内容**:

1. `path` と `fileURLToPath` をインポート
2. `__filename` と `__dirname` を定義
3. `dotenv.config()` を `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` に変更

**実装コード**:

```typescript
import { SuiClient } from "@mysten/sui/client";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Session } from "../shared/types.js";
import { NFTNotOwnedError, SessionExpiredError } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// ... 既存のコード
```

**検証方法**:

```bash
# 1. サーバーを起動
pnpm dev:server

# 2. seal.ts が使用する環境変数が読み込まれていることを確認
# PACKAGE_ID, SEAL_SESSION_DURATION, SEAL_DECRYPTION_KEY などが設定されていることを確認

# 3. セッション作成エンドポイントをテスト
# POST /api/watch が正常に動作することを確認
```

**期待される結果**:
- ✅ サーバーが正常に起動する
- ✅ `PACKAGE_ID`, `SEAL_SESSION_DURATION`, `SEAL_DECRYPTION_KEY` などの環境変数が正しく読み込まれている
- ✅ セッション作成機能が正常に動作する

**品質基準チェックリスト**:
- [x] **Correct**: パスの解決が正確である ✅
- [x] **Testable**: サーバー起動とセッション作成で動作確認可能 ✅
- [x] **Maintainable**: 他のサーバーファイルと同じパターンを使用 ✅
- [x] **Diagnosable**: セッション作成ログで環境変数の読み込みを確認可能 ✅
- [x] **Disciplined**: 既存のコードスタイルを維持 ✅

---

### タスク 2.4: `app/src/server/kiosk.ts` を修正

**目的**: `kiosk.ts` がルートディレクトリの `.env` ファイルを読み込むように修正する

**ファイル**: `app/src/server/kiosk.ts`

**実装内容**:

1. `path` と `fileURLToPath` をインポート
2. `__filename` と `__dirname` を定義
3. `dotenv.config()` を `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` に変更

**実装コード**:

```typescript
import { KioskClient, Network } from "@mysten/kiosk";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Video } from "../shared/types.js";
import { getVideoByBlobId } from "./videos.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// ... 既存のコード
```

**検証方法**:

```bash
# 1. サーバーを起動
pnpm dev:server

# 2. kiosk.ts が使用する環境変数が読み込まれていることを確認
# RPC_URL, KIOSK_ID, PACKAGE_ID などが設定されていることを確認

# 3. Kiosk listings エンドポイントをテスト
curl http://localhost:3001/api/listings
```

**期待される結果**:
- ✅ サーバーが正常に起動する
- ✅ `RPC_URL`, `KIOSK_ID`, `PACKAGE_ID` などの環境変数が正しく読み込まれている
- ✅ `/api/listings` エンドポイントが正常に動作する

**品質基準チェックリスト**:
- [x] **Correct**: パスの解決が正確である ✅
- [x] **Testable**: サーバー起動と listings エンドポイントで動作確認可能 ✅
- [x] **Maintainable**: 他のサーバーファイルと同じパターンを使用 ✅
- [x] **Diagnosable**: listings 取得ログで環境変数の読み込みを確認可能 ✅
- [x] **Disciplined**: 既存のコードスタイルを維持 ✅

---

## Phase 3: 環境変数とドキュメントの更新

### タスク 3.1: ルート `.env` に `VITE_PACKAGE_ID` を追加

**目的**: フロントエンドが `VITE_PACKAGE_ID` を読み込めるように、ルート `.env` に追加する

**ファイル**: ルート `.env`

**実装内容**:

1. ルート `.env` ファイルを開く
2. 既存の `PACKAGE_ID` の値を確認
3. `VITE_PACKAGE_ID` を追加（`PACKAGE_ID` と同じ値を使用）

**追加する行**:

```bash
# フロントエンド用（Viteが読み込む）
VITE_PACKAGE_ID=0x...  # PACKAGE_ID と同じ値
```

**注意事項**:
- `${PACKAGE_ID}` という変数展開形式は `.env` ファイルでは動作しないため、実際の値を記述する
- 既存の `PACKAGE_ID` はそのまま残す（サーバー側で使用）

**検証方法**:

```bash
# 1. ルート .env ファイルを確認
cat .env | grep VITE_PACKAGE_ID

# 2. VITE_PACKAGE_ID が追加されていることを確認
# 出力例: VITE_PACKAGE_ID=0x1234...

# 3. PACKAGE_ID も残っていることを確認
cat .env | grep PACKAGE_ID
# 出力例:
# PACKAGE_ID=0x1234...
# VITE_PACKAGE_ID=0x1234...
```

**期待される結果**:
- ✅ `VITE_PACKAGE_ID` がルート `.env` に追加されている
- ✅ `PACKAGE_ID` も残っている（サーバー側で使用）
- ✅ 両方の値が一致している

**品質基準チェックリスト**:
- [x] **Correct**: `VITE_PACKAGE_ID` の値が `PACKAGE_ID` と一致している ✅
- [x] **Testable**: `cat .env | grep` で確認可能 ✅
- [x] **Maintainable**: コメントで目的が明確である ✅
- [x] **Diagnosable**: ファイル内容で確認可能 ✅
- [x] **Disciplined**: `.env` ファイルのフォーマットを維持 ✅

---

### タスク 3.2: `app/.env` を削除

**目的**: 重複管理を排除し、ルート `.env` のみを使用するようにする

**ファイル**: `app/.env`（存在する場合）

**実装内容**:

1. `app/.env` ファイルが存在するか確認
2. 存在する場合は削除

**検証方法**:

```bash
# 1. app/.env が存在するか確認
ls -la app/.env

# 2. 存在する場合は削除
rm app/.env

# 3. 削除されたことを確認
ls -la app/.env
# 出力: ls: app/.env: No such file or directory

# 4. ルート .env が存在することを確認
ls -la .env
# 出力: .env ファイルが存在することを確認
```

**期待される結果**:
- ✅ `app/.env` ファイルが削除されている
- ✅ ルート `.env` ファイルが存在する
- ✅ 手動コピーが不要になる

**品質基準チェックリスト**:
- [x] **Correct**: `app/.env` が削除され、ルート `.env` のみが存在する ✅
- [x] **Testable**: `ls` コマンドで確認可能 ✅
- [x] **Maintainable**: ファイル管理が簡素化される ✅
- [x] **Diagnosable**: ファイルの存在確認が容易 ✅
- [x] **Disciplined**: 不要なファイルが削除されている ✅

---

### タスク 3.3: `app/src/server/README.md` を更新

**目的**: ドキュメントを更新し、ルート `.env` を直接使用することを明記する

**ファイル**: `app/src/server/README.md`

**実装内容**:

1. 「ルート `.env` を `app/.env` にコピーしてください」という指示を削除
2. ルート `.env` を直接使用することを明記
3. 環境変数の読み込み方法を更新

**変更内容の例**:

**削除する内容**:
```markdown
**重要**: `app/.env` にも同じ内容をコピーしてください：

```bash
cp .env app/.env
```
```

**追加する内容**:
```markdown
**重要**: ルートディレクトリの `.env` ファイルを直接使用します。
`app/.env` へのコピーは不要です。サーバーは自動的にルート `.env` を読み込みます。
```

**検証方法**:

```bash
# 1. README.md を確認
cat app/src/server/README.md | grep -A 5 "重要"

# 2. 「コピーしてください」という記述が削除されていることを確認
# 3. ルート .env を直接使用するという記述が追加されていることを確認
```

**期待される結果**:
- ✅ 「コピーしてください」という指示が削除されている
- ✅ ルート `.env` を直接使用するという記述が追加されている
- ✅ 環境変数の読み込み方法が正確に記載されている

**品質基準チェックリスト**:
- [x] **Correct**: ドキュメントが実装と一致している ✅
- [x] **Testable**: `grep` コマンドで確認可能 ✅
- [x] **Maintainable**: ドキュメントが最新の状態である ✅
- [x] **Diagnosable**: ドキュメントで環境変数の読み込み方法が明確 ✅
- [x] **Disciplined**: ドキュメントが適切に更新されている ✅

---

## Phase 4: 動作確認

### タスク 4.1: 総合動作確認

**目的**: すべての変更が正しく動作し、環境変数が適切に読み込まれていることを確認する

**実装内容**:

1. フロントエンドの動作確認
2. サーバーの動作確認
3. 環境変数の読み込み確認
4. セキュリティ確認（秘密情報がフロントエンドに公開されていないこと）

**検証手順**:

#### 1. フロントエンドの動作確認

```bash
# 1. フロントエンドを起動
pnpm dev

# 2. ブラウザで http://localhost:3000 を開く
# 3. 開発者ツールのコンソールを開く
# 4. 以下を実行して環境変数を確認:

console.log("VITE_PACKAGE_ID:", import.meta.env.VITE_PACKAGE_ID);
console.log("PACKAGE_ID (should be undefined):", import.meta.env.PACKAGE_ID);
console.log("SPONSOR_PRIVATE_KEY (should be undefined):", import.meta.env.SPONSOR_PRIVATE_KEY);
```

**期待される結果**:
- ✅ フロントエンドが正常に起動する
- ✅ `import.meta.env.VITE_PACKAGE_ID` がルート `.env` の値と一致する
- ✅ `import.meta.env.PACKAGE_ID` が `undefined` である
- ✅ `import.meta.env.SPONSOR_PRIVATE_KEY` が `undefined` である（セキュリティ確認）

#### 2. サーバーの動作確認

```bash
# 1. サーバーを起動
pnpm dev:server

# 2. サーバーのログを確認
# 以下のようなログが表示されることを確認:
# ✅ OneTube API Server running on http://localhost:3001
# 📍 Network: devnet
# 📍 RPC: https://fullnode.devnet.sui.io:443
# ✅ Sponsor service initialized
# 📍 Network: https://fullnode.devnet.sui.io:443
# 📍 Sponsor address: 0x...

# 3. ヘルスチェックエンドポイントを確認
curl http://localhost:3001/api/health

# 4. レスポンスを確認
# {
#   "status": "ok",
#   "network": "devnet",
#   "rpcConnected": true,
#   "sponsorBalance": "...",
#   "activeSessions": 0,
#   "timestamp": ...
# }
```

**期待される結果**:
- ✅ サーバーが正常に起動する
- ✅ 環境変数（`NETWORK`, `RPC_URL` など）が正しく読み込まれている
- ✅ `/api/health` エンドポイントが正常に動作する
- ✅ Sponsor service が正常に初期化される

#### 3. 環境変数の読み込み確認

```bash
# 1. サーバー側の環境変数を確認（デバッグ用）
# app/src/server/server.ts に一時的に以下を追加:
console.log("PACKAGE_ID:", process.env.PACKAGE_ID);
console.log("KIOSK_ID:", process.env.KIOSK_ID);
console.log("SPONSOR_PRIVATE_KEY:", process.env.SPONSOR_PRIVATE_KEY ? "***" : undefined);

# 2. サーバーを再起動してログを確認
pnpm dev:server

# 3. フロントエンド側の環境変数を確認（ブラウザコンソール）
console.log("VITE_PACKAGE_ID:", import.meta.env.VITE_PACKAGE_ID);
```

**期待される結果**:
- ✅ サーバー側: `process.env.PACKAGE_ID`, `process.env.KIOSK_ID`, `process.env.SPONSOR_PRIVATE_KEY` などが読み込まれている
- ✅ フロントエンド側: `import.meta.env.VITE_PACKAGE_ID` が読み込まれている
- ✅ フロントエンド側: `import.meta.env.SPONSOR_PRIVATE_KEY` が `undefined` である（セキュリティ確認）

#### 4. セキュリティ確認

```bash
# 1. フロントエンドのビルドファイルを確認（本番環境のシミュレーション）
pnpm build

# 2. ビルドされた JavaScript ファイルを確認
grep -r "SPONSOR_PRIVATE_KEY" app/dist/
# 出力: 何も見つからない（秘密情報が含まれていない）

# 3. VITE_PACKAGE_ID が含まれていることを確認
grep -r "VITE_PACKAGE_ID" app/dist/
# 出力: VITE_PACKAGE_ID が含まれている
```

**期待される結果**:
- ✅ ビルドファイルに `SPONSOR_PRIVATE_KEY` が含まれていない
- ✅ ビルドファイルに `SEAL_DECRYPTION_KEY` が含まれていない
- ✅ ビルドファイルに `VITE_PACKAGE_ID` が含まれている（公開情報のみ）

**品質基準チェックリスト**:
- [x] **Correct**: フロントエンドとサーバーが正常に動作する ✅
- [x] **Testable**: 各確認手順が明確に定義されている ✅
- [x] **Maintainable**: 動作確認手順がドキュメント化されている ✅
- [x] **Diagnosable**: ログとコンソールで環境変数の読み込みを確認可能 ✅
- [x] **Disciplined**: セキュリティ確認が含まれている ✅

---

## まとめ

### 実装完了チェックリスト

- [ ] **タスク 1.1**: `app/vite.config.ts` を修正 ✅
- [ ] **タスク 2.1**: `app/src/server/server.ts` を修正 ✅
- [ ] **タスク 2.2**: `app/src/server/sponsor.ts` を修正 ✅
- [ ] **タスク 2.3**: `app/src/server/seal.ts` を修正 ✅
- [ ] **タスク 2.4**: `app/src/server/kiosk.ts` を修正 ✅
- [ ] **タスク 3.1**: ルート `.env` に `VITE_PACKAGE_ID` を追加 ✅
- [ ] **タスク 3.2**: `app/.env` を削除 ✅
- [ ] **タスク 3.3**: `app/src/server/README.md` を更新 ✅
- [ ] **タスク 4.1**: 総合動作確認 ✅

### 次のステップ

1. すべてのタスクを順番に実装
2. 各タスクの動作確認を実施
3. 総合動作確認を実施
4. 変更をコミット

### 注意事項

1. **パスの解決**: `../../../.env` がルートディレクトリを指すことを確認
2. **環境変数の展開**: `.env` ファイルでは `${PACKAGE_ID}` のような変数展開は動作しないため、実際の値を記述する
3. **セキュリティ**: `VITE_` プレフィックスのみがフロントエンドに公開されることを確認
4. **既存のワークフロー**: 既存の環境変数名（`PACKAGE_ID` など）との互換性を維持

