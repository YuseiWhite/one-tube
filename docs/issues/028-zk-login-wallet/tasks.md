# zkLogin統合実装タスクリスト

このドキュメントは`plan.md`に基づいて作成された実装タスクリストです。

## タスク一覧

### Phase 1: 設定と型定義の準備

#### 1.1 設定ファイルの作成

- [x] **zklogin-001**: `app/src/config.json`を作成
  - `CLIENT_ID_GOOGLE`を含む設定ファイルを作成
  - 開発環境用の設定値を設定
  - `.gitignore`に追加済み

- [x] **zklogin-002**: `app/src/config.example.json`を作成
  - 設定ファイルのテンプレートを作成
  - 他の開発者が設定をコピーできるようにする

#### 1.2 型定義の追加

- [x] **zklogin-003**: `app/src/shared/types.ts`に型定義を追加
  - `OpenIdProvider`型を追加（`"Google"`のみ）
  - `SetupData`型を追加
  - `ZkLoginAccount`型を追加

#### 1.3 パッケージのインストール

- [x] **zklogin-004**: `@mysten/enoki`パッケージをインストール
  ```bash
  cd app
  pnpm add @mysten/enoki
  ```

---

### Phase 2: Enoki SDKのセットアップ

#### 2.1 EnokiアカウントとAPIキーの取得

- [x] **zklogin-005**: Enokiアカウントの作成
  - Enokiダッシュボードにアクセス
  - アカウントを作成

- [x] **zklogin-006**: Enoki APIキーの取得
  - EnokiダッシュボードからAPIキーを取得
  - APIキーを安全に保管

#### 2.2 環境変数の設定

- [x] **zklogin-007**: 環境変数の設定
  - `.env`ファイルに`ENOKI_API_KEY`を追加
  - `.env`ファイルに`ENOKI_NETWORK`を追加（`devnet`または`testnet`）
  - `.env.example`ファイルも更新

#### 2.3 Enoki SDKの初期化

- [x] **zklogin-008**: Enoki SDKの初期化（フロントエンド）
  - `app/src/lib/enoki.ts`ファイルを作成
  - `EnokiClient`を初期化
  - 環境変数からAPIキーとネットワークを読み込む

---

### Phase 3: Enoki SDKを使ったzkLogin実装

#### 3.1 コア機能の実装

- [x] **zklogin-009**: `loginWithGoogle()`関数の実装
  - Enoki SDKを使用してGoogle認証を開始
  - JWTトークンを取得
  - Enoki SDKにJWTを渡してログイン処理を実行
  - デバッグ用コンソール出力を追加

- [x] **zklogin-010**: `getZkLoginAddress()`関数の実装
  - Enoki SDKからzkLoginアドレスを取得
  - アドレスを返す

- [x] **zklogin-011**: `signTransactionWithEnoki()`関数の実装
  - Enoki SDKを使用してトランザクションに署名
  - 署名済みトランザクションを返す

#### 3.2 状態管理の実装

- [x] **zklogin-012**: SessionStorage管理関数の実装
  - Enokiの結果をSessionStorageに保存する関数
  - SessionStorageからアカウント情報を読み込む関数
  - SessionStorageからアカウント情報をクリアする関数

- [x] **zklogin-013**: デバッグ用コンソール出力の追加
  - `[Enoki] 認証開始: Google`ログ
  - `[Enoki] JWT取得完了`ログ
  - `[Enoki] Enoki SDK呼び出し`ログ
  - `[Enoki] アドレス生成:`ログ
  - `[Enoki] ログイン完了`ログ
  - `[Enoki] アカウント保存完了`ログ

---

### Phase 4: UIコンポーネントの実装

#### 4.1 UI要素の追加

- [x] **zklogin-014**: Googleログインボタンの追加
  - `app/src/App.tsx`に「Googleでログイン」ボタンを追加
  - ボタンクリック時に`loginWithGoogle()`を呼び出す

- [x] **zklogin-015**: zkLoginアカウントの表示機能
  - 接続済みzkLoginアカウントのアドレスをUIに表示
  - アドレスの短縮表示（必要に応じて）
  - 残高の表示（オプション）

#### 4.2 状態管理の統合

- [x] **zklogin-016**: 状態管理の統合
  - `useState`でzkLoginアカウントの状態を管理
  - `useEffect`でページ読み込み時にSessionStorageからアカウント情報を復元
  - アカウント情報が変更されたときにUIを更新

- [x] **zklogin-017**: 既存のConnectButtonとの並列表示
  - 既存の`@mysten/dapp-kit`の`ConnectButton`を維持
  - zkLogin接続ボタンと並列で表示
  - 両方の接続方法が同時に使用可能であることを確認

---

### Phase 5: Google OAuth設定と動作確認

#### 6.1 Google OAuth設定

- [x] **zklogin-021.1**: Google Cloud Consoleクライアント作成
  - Google Cloud Consoleにアクセス
  - 新しいプロジェクトを作成
  - OAuth同意画面を設定（ユーザータイプ: 外部）
  - OAuth 2.0クライアントIDを作成
- [x] **zklogin-021.2**: Google Cloud Consoleでの設定
  - 承認済みのリダイレクトURIを設定（`http://localhost:3000`）
  - クライアントIDを`app/src/config.json`に設定（完了済み）

#### 6.2 動作確認

- [x] **zklogin-022**: Googleログインボタンの動作確認
  - UI上に「Googleでログイン」ボタンが表示されることを確認
  - ボタンをクリックするとGoogle OAuth画面に遷移することを確認
  - Google認証が正常に完了することを確認
  - コンソールに期待通りのログが出力されることを確認

- [x] **zklogin-023**: zkLoginアドレスの生成確認
  - zkLoginアドレスが生成されることを確認
  - 同じGoogleアカウントで再ログインすると、同じアドレスが表示されることを確認
  - SessionStorageにアカウント情報が保存されることを確認

---

### Phase 6: ドキュメント（最小限）

#### 7.1 ドキュメントの更新

- [x] **zklogin-026**: README.mdの更新
  - zkLogin機能の追加をREADME.mdに記載
  - Google OAuth設定手順を簡潔に記載
  - Enoki SDKの使用方法を記載
  - zkLogin機能のセットアップ手順を追加
  - ユーザーフローにzkLogin接続の場合を追加

---

## 実装の優先順位

1. **最優先**: zkLoginでGoogle認証が動作すること（zklogin-009, zklogin-014, zklogin-021, zklogin-022）
2. **次**: zkLoginアドレスが生成されること（zklogin-010, zklogin-015, zklogin-023）

**注意**: このissueのスコープはログイン機能のみです。NFT購入や動画視聴の統合は別のissueとして扱います。

## 注意事項

- Enoki SDKの実際のAPIは公式ドキュメントを確認する必要があります
- Salt管理、ZK証明取得はEnoki SDKが自動化するため、開発者は意識する必要がありません
- ハッカソン向けのため、テストコードは不要です。動作確認のみ実施します
- エラーハンドリングは最小限で良いです。コンソール出力で動作確認を行います

## 参考資料

- `docs/issues/028-zk-login-wallet/plan.md` - 詳細な実装計画書
- `app/polymedia-zklogin-demo/web/src/App.tsx` - zkLoginの参考実装
- [Sui zkLogin公式ドキュメント](https://docs.sui.io/concepts/cryptography/zklogin)
- [Enoki SDK公式ドキュメント](https://docs.enoki.mystenlabs.com/)（要確認）

