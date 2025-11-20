# zkLogin統合実装計画書

## 1. 目的と要件

### 1.1 実装目的

- UI上でウォレットを接続することができる
- 接続する際に、パスフレーズでのログインではなく、Googleのgmailアドレスの認証によって、ログインできる
- 初めてgmailアドレス認証する際に、zkLoginによって、新しいアドレスを作成することができる

### 1.2 前提条件

- 必要なパッケージをインストールできていない
- 既存の`@mysten/dapp-kit`ベースの実装を拡張する
- `app/polymedia-zklogin-demo/`の実装を参考にする
- **ハッカソン向け**: プロダクション環境は不要、動作確認が目的
- **テスト不要**: フロントで動作し、バックエンドで期待通りのコンソール出力で良い

### 1.3 技術要件

- **OpenID Provider**: Google（Gmail）のみ対応（MVP）
- **ネットワーク**: Sui devnet / testnet（Enokiが両方をサポート）
- **zkLogin実装**: **Enoki SDKを使用**（推奨・前提）
  - フロントエンド・バックエンドの両方からAPIを呼び出し可能
  - Salt管理が自動化される
  - zkLogin証明の取得が簡素化される
- **実装場所**: フロントエンドまたはバックエンドのどちらからでも実装可能

---

## 2. 技術的な実装アプローチ

### 2.1 アーキテクチャ概要（Enokiベース）

**フロントエンド実装パターン**:
```
[ユーザー] 
    ↓ (Google OAuth認証)
[フロントエンド] 
    ↓ (Enoki SDK呼び出し)
[Enoki API] 
    ↓ (Salt管理・ZK証明取得を自動化)
[Sui Blockchain (devnet/testnet)] 
    ↓ (トランザクション実行)
[zkLoginアドレス作成/トランザクション実行]
```

**バックエンド実装パターン**:
```
[ユーザー] 
    ↓ (Google OAuth認証)
[フロントエンド] 
    ↓ (認証情報をバックエンドに送信)
[バックエンド] 
    ↓ (Enoki SDK呼び出し)
[Enoki API] 
    ↓ (Salt管理・ZK証明取得を自動化)
[Sui Blockchain (devnet/testnet)] 
    ↓ (トランザクション実行)
[zkLoginアドレス作成/トランザクション実行]
```

**Enokiの利点**:
- Salt管理が自動化される（バックエンドAPI実装不要）
- ZK証明の取得が簡素化される
- devnet・testnetの両方をサポート
- フロントエンド・バックエンドの両方から利用可能

### 2.2 zkLoginフロー（Enokiベース）

**フロントエンド実装の場合**:

1. **認証開始**
   - Enoki SDKを使用してGoogle OAuth認証を開始
   - EnokiがNonce、Ephemeral Key Pairの生成を自動化

2. **認証完了**
   - Google OAuth認証が完了すると、JWTトークンを取得
   - Enoki SDKにJWTを渡すと、以下を自動化：
     - Salt管理（Enokiが自動的にSaltを生成・管理）
     - Suiアドレスの導出
     - ZK証明の取得

3. **トランザクション実行**
   - Enoki SDKを使用してトランザクションに署名
   - EnokiがzkLogin署名の組み立てを自動化
   - Suiネットワークに送信

**バックエンド実装の場合**:

1. **認証開始**
   - フロントエンドでGoogle OAuth認証を開始
   - 認証完了後、JWTトークンをバックエンドに送信

2. **認証完了（バックエンド）**
   - バックエンドでEnoki SDKを使用
   - EnokiがSalt管理、アドレス導出、ZK証明取得を自動化

3. **トランザクション実行（バックエンド）**
   - バックエンドでEnoki SDKを使用してトランザクションに署名
   - 結果をフロントエンドに返す

### 2.3 既存実装との統合

- **既存**: `@mysten/dapp-kit`の`ConnectButton`を使用
- **新規**: zkLogin用のカスタム接続ボタンを追加
- **状態管理**: SessionStorageを使用してzkLoginアカウント情報を保存
- **統合方針**: 既存のSui Wallet接続とzkLogin接続を並行してサポート

---

## 3. Enoki SDKのインストールとセットアップ

### 3.1 Enoki SDKのインストール

**フロントエンド用**:
```bash
cd app
pnpm add @mysten/enoki
```

**バックエンド用**:
```bash
cd app
pnpm add @mysten/enoki
```

### 3.2 Enoki APIキーの取得

1. **Enokiダッシュボードにアクセス**
   - Enokiの公式サイトからアカウント作成
   - APIキーを取得

2. **環境変数の設定**
   - `.env`ファイルに追加:
   ```bash
   ENOKI_API_KEY=your-enoki-api-key
   ENOKI_NETWORK=devnet  # または testnet
   ```

### 3.3 Enoki SDKの初期化

**フロントエンドでの初期化** (`app/src/lib/enoki.ts`):
```typescript
import { EnokiClient } from "@mysten/enoki";

const enokiClient = new EnokiClient({
  apiKey: import.meta.env.VITE_ENOKI_API_KEY,
  network: import.meta.env.VITE_ENOKI_NETWORK || "devnet",
});
```

**バックエンドでの初期化** (`app/src/server/enoki.ts`):
```typescript
import { EnokiClient } from "@mysten/enoki";

const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_API_KEY,
  network: process.env.ENOKI_NETWORK || "devnet",
});
```

### 3.4 Enoki SDKの主要機能

Enoki SDKが提供する機能（推測）:
- `enokiClient.loginWithGoogle()` - Google認証によるログイン
- `enokiClient.getAddress()` - zkLoginアドレスの取得
- `enokiClient.signTransaction()` - トランザクションへの署名
- Salt管理、ZK証明取得は自動化される

**注意**: Enoki SDKの実際のAPIは公式ドキュメントを確認する必要があります。

---

## 4. 実装ステップ

### Phase 1: 設定ファイルと型定義の準備

#### 4.1.1 設定ファイルの作成

**ファイル**: `app/src/config.json`（開発用）

```json
{
  "URL_ZK_PROVER": "https://prover-dev.mystenlabs.com/v1",
  "URL_SALT_SERVICE": "/api/salt",
  "CLIENT_ID_GOOGLE": "YOUR_GOOGLE_CLIENT_ID"
}
```

**ファイル**: `app/src/config.example.json`（テンプレート）

```json
{
  "URL_ZK_PROVER": "https://prover-dev.mystenlabs.com/v1",
  "URL_SALT_SERVICE": "/api/salt",
  "CLIENT_ID_GOOGLE": "YOUR_GOOGLE_CLIENT_ID"
}
```

#### 4.1.2 型定義の追加

**ファイル**: `app/src/shared/types.ts`に追加

```typescript
export type OpenIdProvider = "Google";

export type SetupData = {
  provider: OpenIdProvider;
  maxEpoch: number;
  randomness: string;
  ephemeralPrivateKey: string;
};

export type ZkLoginAccount = {
  provider: OpenIdProvider;
  userAddr: string;
  zkProofs: any;
  ephemeralPrivateKey: string;
  userSalt: string;
  sub: string;
  aud: string;
  maxEpoch: number;
};
```

### Phase 2: Enoki SDKを使ったzkLogin実装

#### 4.2.1 フロントエンド実装パターン

**ファイル**: `app/src/lib/enoki.ts`（新規作成）

**実装内容**:
- Enoki SDKの初期化
- `loginWithGoogle()` - Google認証によるログイン
- `getZkLoginAddress()` - zkLoginアドレスの取得
- `signTransactionWithEnoki()` - Enokiを使用したトランザクション署名

**実装例（推測）**:
```typescript
import { EnokiClient } from "@mysten/enoki";

const enokiClient = new EnokiClient({
  apiKey: import.meta.env.VITE_ENOKI_API_KEY,
  network: "devnet", // または "testnet"
});

export async function loginWithGoogle() {
  // Enoki SDKを使用してGoogle認証を開始
  const result = await enokiClient.loginWithGoogle();
  console.log("[Enoki] ログイン完了:", result.address);
  return result;
}

export async function getZkLoginAddress() {
  // EnokiからzkLoginアドレスを取得
  const address = await enokiClient.getAddress();
  return address;
}

export async function signTransactionWithEnoki(tx: Transaction) {
  // Enokiを使用してトランザクションに署名
  const signedTx = await enokiClient.signTransaction(tx);
  return signedTx;
}
```

#### 4.2.2 バックエンド実装パターン（オプション）

**ファイル**: `app/src/server/enoki.ts`（新規作成）

**実装内容**:
- バックエンドでのEnoki SDKの初期化
- `/api/enoki/login` - Google認証エンドポイント
- `/api/enoki/address` - zkLoginアドレス取得エンドポイント
- `/api/enoki/sign` - トランザクション署名エンドポイント

**実装例（推測）**:
```typescript
import { EnokiClient } from "@mysten/enoki";
import express from "express";

const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_API_KEY,
  network: process.env.ENOKI_NETWORK || "devnet",
});

app.post("/api/enoki/login", async (req, res) => {
  const { jwt } = req.body;
  // Enoki SDKを使用してログイン処理
  const result = await enokiClient.loginWithJWT(jwt);
  res.json({ address: result.address });
});

app.get("/api/enoki/address", async (req, res) => {
  const address = await enokiClient.getAddress();
  res.json({ address });
});
```

**推奨**: まずはフロントエンド実装パターンから開始。必要に応じてバックエンド実装を追加。

### Phase 3: Enoki SDKの統合（Salt管理は自動化）

#### 4.3.1 EnokiによるSalt管理の自動化

**方針**: Enoki SDKを使用することで、Salt管理が自動化される。手動でのSalt生成は不要。

**Enokiの利点**:
- ✅ Salt管理が自動化される（バックエンドAPI不要）
- ✅ 同じユーザーは常に同じアドレスを取得（Enokiが管理）
- ✅ ZK証明の取得も自動化される
- ✅ devnet・testnetの両方をサポート
- ✅ フロントエンド・バックエンドの両方から利用可能

**実装**: Enoki SDKを使用するため、手動でのSalt生成は不要。

**注意**: Enoki SDKの実際のAPIは公式ドキュメントを確認する必要がありますが、Salt管理は自動化されるため、開発者はSaltを意識する必要がありません。

### Phase 4: UIコンポーネントの実装

#### 4.4.1 zkLogin接続ボタンの追加

**ファイル**: `app/src/App.tsx`を更新

**実装内容**:
- Googleでログインボタンの追加
- zkLoginアカウントの表示
- 既存の`ConnectButton`と並列で表示

**UI要素**:
- 「Googleでログイン」ボタン
- 接続済みzkLoginアカウントのリスト表示
- アドレス、残高の表示
- ログアウトボタン

#### 4.4.2 状態管理の統合

**実装内容**:
- `useState`でzkLoginアカウントの状態管理
- `useEffect`でページ読み込み時に`completeZkLogin`を実行
- SessionStorageからアカウント情報を復元

---

**注意**: このissueのスコープはログイン機能のみです。NFT購入や動画視聴の統合は別のissueとして扱います。

---

## 5. Google OAuth設定手順

### 5.1 Google Cloud Consoleでの設定

1. **プロジェクトの作成**
   - [Google Cloud Console](https://console.cloud.google.com/home/dashboard)にアクセス
   - 新しいプロジェクトを作成

2. **OAuth同意画面の設定**
   - 「APIとサービス」→「OAuth同意画面」
   - ユーザータイプ: 外部を選択
   - アプリ名、ユーザーサポートメール、デベロッパーの連絡先情報を入力

3. **認証情報の作成**
   - 「認証情報」→「認証情報を作成」→「OAuth 2.0 クライアント ID」
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクト URI:
     - `http://localhost:3000`（開発環境）
     - 本番環境のURL（本番環境）

4. **Client IDの取得**
   - 作成されたクライアントIDをコピー
   - `app/src/config.json`の`CLIENT_ID_GOOGLE`に設定

### 5.2 環境変数の設定

**ファイル**: `.env`に追加（オプション）

```bash
GOOGLE_CLIENT_ID=your-client-id-here
```

---

## 6. Enoki SDKによるSalt管理（自動化）

### 6.1 Enokiによる自動化

**方針**: Enoki SDKを使用することで、Salt管理が完全に自動化される。

**Enokiの機能**:
- ✅ Saltの生成と管理を自動化
- ✅ 同じユーザーは常に同じアドレスを取得（Enokiが管理）
- ✅ ZK証明の取得も自動化
- ✅ バックエンドAPI実装不要
- ✅ フロントエンド・バックエンドの両方から利用可能

### 6.2 実装の簡素化

**従来の実装（手動）**:
- JWTの取得
- Saltの生成（ハッシュ関数など）
- アドレスの導出
- ZK証明の取得
- トランザクションへの署名

**Enokiを使用した実装**:
- Enoki SDKにJWTを渡す
- EnokiがSalt管理、アドレス導出、ZK証明取得を自動化
- Enoki SDKでトランザクションに署名

### 6.3 フロントエンド・バックエンドの選択

**フロントエンド実装**:
- ユーザー体験が良い（即座にアドレスが取得できる）
- バックエンドの負荷が少ない
- 推奨: ハッカソン用途には最適

**バックエンド実装**:
- セキュリティが高い（JWTをサーバー側で管理）
- フロントエンドのコードがシンプル
- オプション: 必要に応じて実装

**推奨**: まずはフロントエンド実装から開始。必要に応じてバックエンド実装を追加。

---

## 7. 動作確認計画（テスト不要）

### 7.1 動作確認の目的

ハッカソン向けのため、テストコードは不要。動作確認のみ実施。

### 7.2 動作確認項目

#### 7.2.1 フロントエンド動作確認

1. **Googleログインボタンの表示**
   - UI上に「Googleでログイン」ボタンが表示される
   - クリックするとGoogle OAuth画面に遷移する

2. **zkLogin認証フロー**
   - Google認証が完了すると、ページにリダイレクトされる
   - コンソールに「zkLogin認証完了」などのログが出力される
   - SessionStorageにアカウント情報が保存される

3. **アドレス表示**
   - zkLoginアカウントのアドレスがUIに表示される
   - 同じGoogleアカウントで再ログインすると、同じアドレスが表示される

#### 7.2.2 バックエンド動作確認

1. **コンソール出力**
   - zkLogin関連のAPI呼び出し時に、期待通りのログが出力される
   - エラーが発生した場合、エラーメッセージが出力される

2. **Enoki SDKの動作確認**
   - Enoki SDKが正常に初期化されることを確認
   - Enoki APIキーが正しく設定されていることを確認
   - コンソールにEnoki関連のログが出力される（デバッグ用）


### 7.3 デバッグ用コンソール出力

以下のようなログを出力して、動作を確認：

```typescript
console.log("[Enoki] 認証開始: Google");
console.log("[Enoki] JWT取得完了");
console.log("[Enoki] Enoki SDK呼び出し");
console.log("[Enoki] アドレス生成:", address);
console.log("[Enoki] ログイン完了");
console.log("[Enoki] アカウント保存完了");
```

### 7.4 動作確認チェックリスト

- [ ] Googleログインボタンが表示される
- [ ] Google認証が正常に完了する
- [ ] zkLoginアドレスが生成される
- [ ] 同じGoogleアカウントで再ログインすると、同じアドレスが表示される
- [ ] SessionStorageにアカウント情報が保存される
- [ ] コンソールに期待通りのログが出力される

**注意**: NFT購入や動画視聴の統合は別のissueとして扱います。

---

## 8. セキュリティ考慮事項

### 8.1 セッション管理

- **Ephemeral Key Pair**: 有効期限（MAX_EPOCH）を適切に設定
- **SessionStorage**: ブラウザを閉じるとクリアされる（適切な動作）

### 8.2 Salt管理

- **Enoki SDK**: Salt管理は自動化されるため、開発者は意識する必要がない
- **本番環境**: ユーザーごとに一意のSaltを生成・保存

### 8.3 JWT検証

- JWTの有効性を検証
- `sub`と`aud`の存在を確認

### 8.4 エラーハンドリング

- OAuth認証エラー
- Enoki APIエラー
- ZK証明サービスエラー（Enokiが自動化）
- トランザクション実行エラー

---

## 9. 実装チェックリスト

### Phase 1: 設定と型定義
- [ ] `app/src/config.json`の作成
- [ ] `app/src/config.example.json`の作成
- [ ] `app/src/shared/types.ts`に型定義を追加
- [ ] 必要なパッケージのインストール（`jwt-decode`、`@mysten/sui`の更新）

### Phase 2: Enoki SDKのセットアップ
- [ ] Enokiアカウントの作成
- [ ] Enoki APIキーの取得
- [ ] `@mysten/enoki`パッケージのインストール
- [ ] 環境変数の設定（`ENOKI_API_KEY`、`ENOKI_NETWORK`）
- [ ] Enoki SDKの初期化（フロントエンド）
- [ ] Enoki SDKの初期化（バックエンド、オプション）

### Phase 3: Enoki SDKを使ったzkLogin実装
- [ ] `app/src/lib/enoki.ts`の作成
- [ ] `loginWithGoogle()`関数の実装（Enoki SDK使用）
- [ ] `getZkLoginAddress()`関数の実装
- [ ] `signTransactionWithEnoki()`関数の実装
- [ ] SessionStorage管理関数の実装（Enokiの結果を保存）
- [ ] デバッグ用コンソール出力の追加
- [ ] （オプション）バックエンドAPIの実装（`/api/enoki/login`など）

### Phase 4: UI実装
- [ ] `app/src/App.tsx`にzkLogin接続ボタンを追加
- [ ] zkLoginアカウントの表示機能
- [ ] 状態管理の統合
- [ ] 既存の`ConnectButton`との並列表示

**注意**: NFT購入や動画視聴の統合は別のissueとして扱います。

### Phase 5: 動作確認
- [ ] Googleログインボタンが表示される
- [ ] Google認証が正常に完了する
- [ ] zkLoginアドレスが生成される
- [ ] 同じGoogleアカウントで再ログインすると、同じアドレスが表示される
- [ ] コンソールに期待通りのログが出力される

**注意**: NFT購入や動画視聴の統合は別のissueとして扱います。

### Phase 6: ドキュメント（最小限）
- [ ] README.mdの更新（zkLogin機能の追加）
- [ ] Google OAuth設定手順のドキュメント化

---

## 10. 参考資料

### 10.1 公式ドキュメント

- [Sui zkLogin公式ドキュメント](https://docs.sui.io/concepts/cryptography/zklogin)
- [Google OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

### 10.2 参考実装

- `app/polymedia-zklogin-demo/web/src/App.tsx` - zkLoginの完全な実装例
- `app/polymedia-zklogin-demo/web/src/config.example.json` - 設定ファイルのテンプレート

### 10.3 動画・記事

- [A Complete Guide to zkLogin: How it Works and How to Integrate | Joy Wang](https://www.youtube.com/watch?v=Jk4mq5IOUYc)
- [zkLogin Best Practices and Business Considerations for Builders](https://blog.sui.io/zklogin-best-practices-considerations/)

---

## 11. 実装時の注意事項

### 11.1 既存コードとの互換性

- 既存の`@mysten/dapp-kit`の`ConnectButton`は維持
- zkLogin接続とSui Wallet接続を並行してサポート

**注意**: NFT購入や動画視聴フローへの統合は別のissueとして扱います。

### 11.2 エラーハンドリング（最小限）

- OAuth認証のキャンセル: コンソールにエラーログを出力
- ZK証明サービスのエラー: コンソールにエラーログを出力
- ネットワークエラー: コンソールにエラーログを出力

**注意**: ハッカソン向けのため、エラーハンドリングは最小限で良い。動作確認が目的。

### 11.3 ユーザー体験（最小限）

- ローディング状態の表示（シンプルなテキストでOK）
- エラーメッセージの表示（コンソール出力でOK）
- 成功メッセージの表示（コンソール出力でOK）

### 11.4 パフォーマンス

- ZK証明の取得には数秒かかる可能性がある
- ローディング状態を適切に表示（シンプルなテキストでOK）
- 非同期処理の適切な処理

### 11.5 Enoki SDKの使用注意点

**Enoki SDKの初期化**:
- APIキーは環境変数から取得（`.env`ファイルに保存）
- ネットワークは`devnet`または`testnet`を指定
- フロントエンドとバックエンドで別々に初期化する

**Enoki SDKのAPI**:
- 実際のAPIは公式ドキュメントを確認する必要がある
- Salt管理、ZK証明取得は自動化されるため、開発者は意識する必要がない

**エラーハンドリング**:
- Enoki APIのエラーを適切にキャッチ
- ネットワークエラーの場合、リトライロジックを検討
- コンソールにエラーログを出力（デバッグ用）

**devnet・testnetの切り替え**:
- 環境変数`ENOKI_NETWORK`で切り替え可能
- 開発時は`devnet`、デモ時は`testnet`を使用

---

## 12. ハッカソン向けの実装方針まとめ

### 12.1 Enokiベースの簡素化された実装

**Salt管理**:
- ✅ Enoki SDKが自動化（開発者は意識不要）
- ❌ バックエンドAPI不要
- ❌ データベース不要
- ✅ フロントエンド・バックエンドの両方から利用可能

**ネットワークサポート**:
- ✅ devnet・testnetの両方をサポート
- ✅ 環境変数で簡単に切り替え可能

**テスト**:
- ❌ 単体テスト不要
- ❌ 統合テスト不要
- ❌ E2Eテスト不要
- ✅ 動作確認のみ（コンソール出力で確認）

**エラーハンドリング**:
- ✅ 最小限（コンソール出力でOK）
- ❌ 詳細なエラーメッセージは不要

**ユーザー体験**:
- ✅ 基本的なUI（ボタン、アドレス表示）
- ❌ 高度なUXは不要

### 12.2 実装の優先順位

1. **最優先**: zkLoginでGoogle認証が動作すること
2. **次**: zkLoginアドレスが生成されること

**注意**: このissueのスコープはログイン機能のみです。NFT購入や動画視聴の統合は別のissueとして扱います。

### 12.3 将来の拡張（ハッカソン後）

- Enoki SDKの本格導入
- バックエンドSaltサービスの実装
- セキュリティ強化
- テストコードの追加

