<div align="center">

![OneTube Logo](docs/assets/one-tube-logo.png)


NFT保有による動画視聴権限管理のデモプラットフォーム（MVP）

</div>

## 📖 概要

OneTubeは、ONE Championshipの試合動画をNFT保有によって視聴できるプラットフォームのデモです。Suiエコシステム（Kiosk、Sponsored Transaction、Transfer Policy）とWalrus/Sealを統合し、Web2的なシームレスな購入体験を実現します。

### 主な機能

- 🎫 **NFT購入**: Kiosk経由でプレミアムチケットNFTを購入（0.5 SUI）
- 🎬 **動画視聴**: NFT保有者だけが完全版動画を視聴可能
- 💰 **収益分配**: 購入時に自動で収益を分配（アスリート70% / ONE 25% / Platform 5%）
- ⛽ **ガス代不要**: Sponsored Transactionでユーザーのガス代をプラットフォームが負担
- 🔐 **zkLogin認証**: Googleアカウントでログイン可能（Enoki SDK使用）

## 🚀 クイックスタート

### 前提条件

- Node.js 18+
- pnpm 10.x
- Sui CLI
- Enokiアカウント（zkLogin機能を使用する場合）
- Google Cloud Consoleアカウント（zkLogin機能を使用する場合）

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定
# - VITE_ENOKI_API_KEY: Enoki APIキー（zkLogin機能を使用する場合）
# - VITE_ENOKI_NETWORK: devnet または testnet（zkLogin機能を使用する場合）

# Google OAuth設定（zkLogin機能を使用する場合）
cp app/src/config.example.json app/src/config.json
# app/src/config.jsonを編集してCLIENT_ID_GOOGLEを設定

# スマートコントラクトのデプロイ
pnpm run deploy:devnet

# NFTのシード（Kioskに出品）
pnpm run seed:devnet

# フロントエンド起動
pnpm run dev

# バックエンドの起動
pnpm run dev:server
```

### zkLogin機能のセットアップ（オプション）

zkLogin機能を使用する場合は、以下の追加設定が必要です：

1. **Enokiアカウントの作成**
   - [Enokiダッシュボード](https://enoki.mystenlabs.com/)にアクセス
   - アカウントを作成してAPIキーを取得
   - `.env`ファイルに`VITE_ENOKI_API_KEY`と`VITE_ENOKI_NETWORK`を設定

2. **Google OAuth設定**
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - 新しいプロジェクトを作成
   - OAuth同意画面を設定（ユーザータイプ: 外部）
   - OAuth 2.0クライアントIDを作成
   - 承認済みのリダイレクトURIに`http://localhost:3000`を追加
   - `app/src/config.json`に`CLIENT_ID_GOOGLE`を設定

詳細は`docs/issues/028-zk-login-wallet/plan.md`を参照してください。

## 📁 プロジェクト構成

```
one-tube/
├── contracts/          # Moveスマートコントラクト
├── app/               # React + Express (フロントエンド・バックエンド)
├── scripts/           # デプロイ・シードスクリプト
└── docs/              # プロジェクト仕様書・開発ガイド
```

## 🛠️ テックスタック

- **Blockchain**: Sui devnet
- **Smart Contract**: Sui Move
- **NFT販売**: Kiosk標準 (TransforPolicy)
- **ガス代負担**: Sponsored Transaction
- **ストレージ**: Walrus Testnet（分散型動画保存）
- **アクセス制御**: Seal（暗号化/復号）
- **認証**: zkLogin（Enoki SDK）+ Google OAuth
- **Frontend**: React + Vite
- **Backend**: Express + TypeScript

## 📝 主要コマンド

```bash
# Moveコントラクトのテスト
pnpm run move:test

# スマートコントラクトのデプロイ
pnpm run deploy:devnet

# NFTのシード（Kioskに出品）
pnpm run seed:devnet

# 開発サーバー起動（フロントエンド）
pnpm run dev

# 開発サーバー起動（バックエンド）
pnpm run dev:server

# コードフォーマット
pnpm run format

# リンター
pnpm run biome:check
```

## 🔄 ユーザーフロー

### Sui Wallet接続の場合

1. **ウォレット接続**: Sui Walletで接続
2. **NFT購入**: KioskからプレミアムチケットNFTを購入（ガス代不要）
3. **動画視聴**: NFT保有者として完全版動画を視聴（セッション有効期限: 30秒（任意））

### zkLogin接続の場合（Google認証）

1. **Googleログイン**: 「Googleでログイン」ボタンをクリックしてGoogleアカウントで認証
2. **zkLoginアドレス生成**: Enoki SDKが自動的にzkLoginアドレスを生成
3. **NFT購入**: KioskからプレミアムチケットNFTを購入（ガス代不要、Sponsored Transaction）
4. **動画視聴**: NFT保有者として完全版動画を視聴

**注意**: Sui Wallet接続とzkLogin接続は並行して使用可能です。

## 💡 ビジネスモデル

- **収益分配**: アスリート 70% / ONE Championship 25% / Platform 5%
- **価格**: 0.5 SUI（テスト用）
- **特典**: 1ヶ月間過去試合見放題

## 📚 ドキュメント

詳細な仕様や開発ガイドは `docs/` ディレクトリを参照してください。

- [プロジェクト仕様書](docs/project-spec.md)
- [開発ワークフロー](docs/development-workflow.md)
- [zkLogin統合実装計画書](docs/issues/028-zk-login-wallet/plan.md)
- [zkLogin統合タスクリスト](docs/issues/028-zk-login-wallet/tasks.md)

## 📄 ライセンス

MIT
