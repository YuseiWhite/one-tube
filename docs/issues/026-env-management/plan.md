# 環境変数管理の設計修正計画

## 問題の現状

### 現在の課題

1. **重複管理によるバージョン不整合**
   - `root/.env` と `app/.env` で同じ内容を手動で管理
   - `app/src/server/README.md` に「ルート `.env` を `app/.env` にコピーしてください」という指示がある
   - エンジニア間でバージョンレベルの違いが発生し、連携ミスが起きている

2. **現在の実装状況**
   - **Express側**: `app/src/server/*.ts` で `dotenv.config()` を使用（デフォルトで `app/.env` を読み込む）
   - **Vite側**: `vite.config.ts` に環境変数読み込み設定がない
   - **フロントエンド**: `VITE_PACKAGE_ID` を使用しているが、ルート `.env` を読み込む設定がない

3. **使用されている環境変数**

   **サーバー側（Express）で使用:**
   - `RPC_URL` - RPC接続URL
   - `SPONSOR_PRIVATE_KEY` - 秘密情報（サーバーのみ）
   - `PACKAGE_ID` - コントラクトパッケージID
   - `KIOSK_ID` - Kiosk ID
   - `TRANSFER_POLICY_ID` - Transfer Policy ID
   - `KIOSK_INITIAL_SHARED_VERSION` - Shared Object Version
   - `TRANSFER_POLICY_INITIAL_SHARED_VERSION` - Shared Object Version
   - `SEAL_SESSION_DURATION` - セッション有効期限
   - `SEAL_DECRYPTION_KEY` - 秘密情報（サーバーのみ）
   - `NETWORK` - ネットワーク名
   - `MOCK_VIDEO_URL` - モック動画URL（オプション）

   **フロントエンド側（Vite）で使用:**
   - `VITE_PACKAGE_ID` - コントラクトパッケージID（フロントエンドで使用可能）

## 設計方針

### 目標

1. **一元管理**: ルート `.env` で全環境変数を一元管理
2. **自動読み込み**: Vite/Express が自動的にルート `.env` を読み込む
3. **セキュリティ**: Viteは `VITE_` プレフィックスのみフロントエンドに公開（秘密情報は自動的に保護）

### 解決策: ルート `.env` への一元化

**概要:**
- ルート `.env` に全環境変数を一元管理
- Vite側は `vite.config.ts` の `envDir: "../"` でルート `.env` を読み込む
- Express側は `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` でルートを明示

**メリット:**
- シンプルで理解しやすい
- ファイルが1つで管理が容易
- 既存のワークフローとの互換性が高い
- Viteの `VITE_` プレフィックス機能により、秘密情報は自動的に保護される

**セキュリティ:**
- Viteは `VITE_` プレフィックスのみフロントエンドに公開される
- `SPONSOR_PRIVATE_KEY` や `SEAL_DECRYPTION_KEY` のような秘密情報は `VITE_` プレフィックスを付けない限り、フロントエンドには公開されない

## 実装計画

### ステップ1: Vite設定の修正

**ファイル**: `app/vite.config.ts`

**変更内容:**
- `envDir: "../"` を追加してルートディレクトリを環境変数の読み込み元に設定
- `loadEnv` を使用してルート `.env` を読み込む（オプション、デバッグ用）

**実装コード:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

### ステップ2: Express設定の修正

**対象ファイル:**
- `app/src/server/server.ts`
- `app/src/server/sponsor.ts`
- `app/src/server/seal.ts`
- `app/src/server/kiosk.ts`

**変更内容:**
- `dotenv.config()` を `dotenv.config({ path: path.resolve(__dirname, "../../../.env") })` に変更
- `path` と `fileURLToPath` をインポート（ES Modules用）

**実装コード（各ファイル共通パターン）:**

```typescript
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
```

**注意**: `app/src/server/server.ts` は既に `dotenv.config()` があるため、その行を置き換える

### ステップ3: ルート `.env` に `VITE_PACKAGE_ID` を追加

**ファイル**: ルート `.env`

**変更内容:**
- 既存の `PACKAGE_ID` はそのまま残す（サーバー側で使用）
- `VITE_PACKAGE_ID=${PACKAGE_ID}` を追加（フロントエンド用）

**追加する行:**

```bash
# フロントエンド用（Viteが読み込む）
VITE_PACKAGE_ID=${PACKAGE_ID}
```

**注意**: `${PACKAGE_ID}` は環境変数の展開形式。実際の値に置き換えるか、シェルスクリプトで展開する必要がある場合は、ルート `.env` に直接値を記述する

### ステップ4: `app/.env` の削除

**作業内容:**
- `app/.env` ファイルが存在する場合は削除
- 手動コピーが不要になることを確認

### ステップ5: ドキュメントの更新

**ファイル**: `app/src/server/README.md`

**変更内容:**
- 「ルート `.env` を `app/.env` にコピーしてください」という指示を削除
- ルート `.env` を直接使用することを明記
- 環境変数の読み込み方法を更新

### ステップ6: 動作確認

**確認項目:**

1. **フロントエンドの動作確認**
   ```bash
   pnpm dev
   ```
   - フロントエンドが起動することを確認
   - ブラウザのコンソールで `VITE_PACKAGE_ID` が正しく読み込まれていることを確認
   - `app/src/lib/sui.ts` で `VITE_PACKAGE_ID` が使用されていることを確認

2. **サーバーの動作確認**
   ```bash
   pnpm dev:server
   ```
   - サーバーが起動することを確認
   - 環境変数が正しく読み込まれていることを確認（ログ出力で確認）
   - `/api/health` エンドポイントが正常に動作することを確認

3. **環境変数の読み込み確認**
   - サーバー側: `process.env.PACKAGE_ID`, `process.env.SPONSOR_PRIVATE_KEY` などが読み込まれていることを確認
   - フロントエンド側: `import.meta.env.VITE_PACKAGE_ID` が読み込まれていることを確認
   - フロントエンド側: `import.meta.env.SPONSOR_PRIVATE_KEY` が `undefined` であることを確認（セキュリティ確認）

## 実装タスク

- [ ] **タスク1**: `app/vite.config.ts` を修正
  - `envDir: "../"` を追加
  - 動作確認: `pnpm dev` でフロントエンドが起動することを確認

- [ ] **タスク2**: `app/src/server/server.ts` を修正
  - `dotenv.config()` をルート `.env` を読み込むように変更
  - `path` と `fileURLToPath` をインポート

- [ ] **タスク3**: `app/src/server/sponsor.ts` を修正
  - ルート `.env` を読み込むように変更
  - `path` と `fileURLToPath` をインポート

- [ ] **タスク4**: `app/src/server/seal.ts` を修正
  - ルート `.env` を読み込むように変更
  - `path` と `fileURLToPath` をインポート

- [ ] **タスク5**: `app/src/server/kiosk.ts` を修正
  - ルート `.env` を読み込むように変更
  - `path` と `fileURLToPath` をインポート

- [ ] **タスク6**: ルート `.env` に `VITE_PACKAGE_ID` を追加
  - `VITE_PACKAGE_ID=${PACKAGE_ID}` を追加（または実際の値を記述）

- [ ] **タスク7**: `app/.env` を削除
  - `app/.env` ファイルが存在する場合は削除

- [ ] **タスク8**: `app/src/server/README.md` を更新
  - 「ルート `.env` を `app/.env` にコピーしてください」という指示を削除
  - ルート `.env` を直接使用することを明記

- [ ] **タスク9**: 動作確認
  - `pnpm dev` でフロントエンドが起動することを確認
  - `pnpm dev:server` でサーバーが起動することを確認
  - 環境変数が正しく読み込まれることを確認
  - フロントエンドに秘密情報が公開されていないことを確認

## 注意事項

1. **Viteの環境変数公開ルール**
   - Viteは `VITE_` プレフィックスのみフロントエンドに公開される
   - `SPONSOR_PRIVATE_KEY` や `SEAL_DECRYPTION_KEY` のような秘密情報は `VITE_` プレフィックスを付けない限り、フロントエンドには公開されない

2. **既存の環境変数名の互換性**
   - 既存のコードは `process.env.PACKAGE_ID` を使用しているため、サーバー側ではそのまま使用可能
   - フロントエンド側は `VITE_PACKAGE_ID` を使用する必要がある

3. **デプロイ時の注意**
   - 本番環境でもルート `.env` を使用することを確認
   - CI/CDパイプラインでもルート `.env` を読み込むように設定

## 参考資料

- [Vite Environment Variables](https://vite.dev/guide/env-and-mode.html)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [dotenv-flow Documentation](https://github.com/kerimdzhanov/dotenv-flow)

