# Backend API Server - 使い方とテストガイド

OneTube Backend API（Express + TypeScript）のセットアップ、起動、テスト方法を説明します。

---

## 📋 目次

1. [セットアップ](#1-セットアップ)
2. [サーバー起動](#2-サーバー起動)
3. [API エンドポイント](#3-api-エンドポイント)
4. [テストケース](#4-テストケース)
5. [トラブルシューティング](#5-トラブルシューティング)

---

## 1. セットアップ

### 必須環境変数（`.env`）

ルートディレクトリに `.env` ファイルを作成し、以下を設定：

```bash
# Network Configuration
NETWORK=devnet
RPC_URL=https://fullnode.devnet.sui.io:443

# Smart Contract IDs
PACKAGE_ID=0xc1050750c44cff13393d0f2704610ca64a24fc8d97f14e8a02b2e42b05fb22fa
KIOSK_ID=0xb0f928168f884bba36055de85e5ef12c50a21e89ae52cfc608f54b9a39c84751
TRANSFER_POLICY_ID=0x...

# 共有オブジェクトのバージョン
KIOSK_INITIAL_SHARED_VERSION=27
TRANSFER_POLICY_INITIAL_SHARED_VERSION=22

# Sponsored Transaction
SPONSOR_PRIVATE_KEY=suiprivkey1qq...  # Bech32形式

# Session Management
SEAL_SESSION_DURATION=30  # 秒単位（30=テスト用、3600=本番推奨）
SEAL_DECRYPTION_KEY=your-seal-key

# Walrus（モック）
WALRUS_API_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

**重要**: ルートディレクトリの `.env` ファイルを直接使用します。
`app/.env` へのコピーは不要です。サーバーは自動的にルート `.env` を読み込みます。

---

## 2. サーバー起動

### 開発環境

```bash
cd app
pnpm run dev:server
```

**起動成功時の出力**:
```
✅ Sponsor service initialized
📍 Network: https://fullnode.devnet.sui.io:443
📍 Sponsor address: 0x...
✅ OneTube API Server running on http://localhost:3001
📍 Network: devnet
📍 RPC: https://fullnode.devnet.sui.io:443
```

---

## 3. API エンドポイント

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `GET /api/health` | GET | ヘルスチェック + スポンサー残高確認 |
| `GET /api/listings` | GET | Kiosk の NFT 一覧取得 |
| `POST /api/purchase` | POST | Kiosk の NFT 購入（スポンサードトランザクション・ガスレス取引） |
| `POST /api/watch` | POST | 視聴セッション作成（Kiosk の NFT 所有権確認） |
| `GET /api/video` | GET | 動画 URL 取得（セッション検証） |

### 基本フロー（Kiosk の NFT を使った視聴）

```
GET /api/listings → Kiosk の NFT 一覧を取得
  ↓
POST /api/purchase (userAddress, nftId) → Kiosk から NFT を購入（スポンサード取引）
  ↓
POST /api/watch (userAddress, nftId, blobId) → NFT 所有権確認 + セッション作成
  ↓
GET /api/video?session=<sessionId> → 動画 URL を取得
```

---

## 4. テストケース

### 4.1 ヘルスチェック

```bash
curl -s http://localhost:3001/api/health | jq
```

**期待レスポンス**:
```json
{
  "status": "ok",
  "network": "devnet",
  "sponsorBalance": "9992500000",
  "activeSessions": 0
}
```

---

### 4.2 Kiosk の NFT リスティング取得

```bash
curl -s http://localhost:3001/api/listings | jq
```

**期待レスポンス** (Kiosk に複数の NFT が出品されている場合):
```json
{
  "success": true,
  "listings": [
    {
      "id": "0x111518347d2d3b60a4ba9591c0977178dce5c57ed155f144d59aa3e3750d2520",
      "title": "ONE 170 Premium Ticket",
      "description": "Superbon vs Masaaki Noiri - Full Match Access",
      "previewBlobId": "mock-preview-blob-id",
      "fullBlobId": "mock-blob-id-fullmatch-one170",
      "price": 500000000,
      "listingId": "0xe6f6012943e6e7fa2fa5a17abfab287a385dc777d2b666dfa911a1a7ec99734f"
    },
    {
      "id": "0xd90a4dbeac44365f87d13b6d130de6585b3589a62e202866d7e36dc156a45d7d",
      "title": "ONE 170 Premium Ticket",
      "description": "Superbon vs Masaaki Noiri - Full Match Access",
      "previewBlobId": "mock-preview-blob-id",
      "fullBlobId": "mock-blob-id-fullmatch-one170",
      "price": 500000000,
      "listingId": "0x2ec9b35049e5f337b6af3de0882f34f1dff7d5abaf80a8fff77faa458391a0d9"
    }
    // ... 他の Kiosk で list された NFT
  ]
}
```

---

### 4.3 Kiosk の NFT 購入（スポンサード取引）

#### ✅ 成功ケース: NFT ID を直接指定

```bash
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
NFT_ID="0x3414a26db62a2703282f8b49e04d8cc463ad5cb371b8908d463a75eb87833df4"

PURCHASE_RESPONSE=$(
  curl -s -X POST http://localhost:3001/api/purchase \
    -H 'Content-Type: application/json' \
    -d "{\"userAddress\":\"$USER_ADDRESS\",\"nftId\":\"$NFT_ID\"}"
)
echo "$PURCHASE_RESPONSE" | jq
NEW_NFT_ID=$(echo "$PURCHASE_RESPONSE" | jq -r '.nftId')
```

**期待レスポンス**:
```json
{
  "success": true,
  "txDigest": "FEUo92jB7E5ujTFKZSCot7U9ur7pYyqUdMUdzCpWR6KJ",
  "nftId": "0x3414a26db62a2703282f8b49e04d8cc463ad5cb371b8908d463a75eb87833df4"
}
```

<details>
<summary>📌 別の方法: リスティングから動的に NFT ID を取得</summary>

```bash
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
# Kiosk の最初の NFT を動的に取得
NFT_ID=$(curl -s http://localhost:3001/api/listings | jq -r '.listings[0].id')

PURCHASE_RESPONSE=$(
  curl -s -X POST http://localhost:3001/api/purchase \
    -H 'Content-Type: application/json' \
    -d "{\"userAddress\":\"$USER_ADDRESS\",\"nftId\":\"$NFT_ID\"}"
)
echo "$PURCHASE_RESPONSE" | jq
```

</details>

#### ❌ エラーケース: Kiosk から既に売却済み

```bash
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
# 既に売却済みの NFT ID を指定
NFT_ID="0x3414a26db62a2703282f8b49e04d8cc463ad5cb371b8908d463a75eb87833df4"

PURCHASE_RESPONSE=$(
  curl -s -X POST http://localhost:3001/api/purchase \
    -H 'Content-Type: application/json' \
    -d "{\"userAddress\":\"$USER_ADDRESS\",\"nftId\":\"$NFT_ID\"}"
)
echo "$PURCHASE_RESPONSE" | jq
```

**期待レスポンス**:
```json
{
  "success": false,
  "error": "Listing not found (already sold or incorrect nftId)"
}
```

**注**: Kiosk から購入した NFT は自動的にリストから削除されます。

---

### 4.4 視聴セッション作成（Kiosk の NFT 所有権確認）

#### ✅ 成功ケース: Kiosk の NFT 所有者

```bash
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
# Kiosk から購入した NFT の ID
NFT_ID="0xe03531f009860b6fd1cfbb56304f34bb59f3fc9b7565307f3f8637f18448b974"
BLOB_ID="mock-blob-id-fullmatch-one170"

WATCH_RESPONSE=$(
  curl -s -X POST http://localhost:3001/api/watch \
    -H 'Content-Type: application/json' \
    -d "{\"nftId\":\"$NFT_ID\",\"userAddress\":\"$USER_ADDRESS\",\"blobId\":\"$BLOB_ID\"}"
)
echo "$WATCH_RESPONSE" | jq
SESSION_ID=$(echo "$WATCH_RESPONSE" | jq -r '.session.sessionId')
```

**期待レスポンス**:
```json
{
  "success": true,
  "session": {
    "sessionId": "1bd1e678d119f2fd0e8f9bf00f7e66f6e812fa8dca8d420361ea046ec4fff2dd",
    "userAddress": "0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6",
    "nftId": "0xe03531f009860b6fd1cfbb56304f34bb59f3fc9b7565307f3f8637f18448b974",
    "decryptionKey": "1379f191f6170c883f9f6606d515edad65ea03db187d2804e5200a83532f6bc0",
    "videoUrl": "https://example.walrus.site/full-match.mp4",
    "createdAt": 1762959765274,
    "expiresAt": 1762959795274
  }
}
```

#### ❌ エラーケース: Kiosk の NFT 非所有者

```bash
USER_ADDRESS="0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6"
# Kiosk の NFT（まだ購入していない、または所有していない）
NFT_ID="0x3414a26db62a2703282f8b49e04d8cc463ad5cb371b8908d463a75eb87833df4"
BLOB_ID="mock-blob-id-fullmatch-one170"

WATCH_RESPONSE=$(
  curl -s -X POST http://localhost:3001/api/watch \
    -H 'Content-Type: application/json' \
    -d "{\"nftId\":\"$NFT_ID\",\"userAddress\":\"$USER_ADDRESS\",\"blobId\":\"$BLOB_ID\"}"
)
echo "$WATCH_RESPONSE" | jq
```

**期待レスポンス**:
```json
{
  "success": false,
  "error": "Address 0x0c5fb30612e9577beee5984a37dfd84fcf7b413d50473ae3ff5919e9bb1f3ae6 does not own NFT 0x3414a26db62a2703282f8b49e04d8cc463ad5cb371b8908d463a75eb87833df4"
}
```

---

### 4.5 動画 URL 取得

#### ✅ 成功ケース: 有効なセッション

```bash
# 4.4 で取得した SESSION_ID を使用
curl -s "http://localhost:3001/api/video?session=$SESSION_ID" | jq
```

**期待レスポンス**:
```json
{
  "success": true,
  "videoUrl": "https://example.walrus.site/full-match.mp4"
}
```


#### ❌ エラーケース: セッション期限切れ（30秒後）

```bash
# 30秒待機後
sleep 30
curl -s "http://localhost:3001/api/video?session=$SESSION_ID" | jq
```

**期待レスポンス**:
```json
{
  "success": false,
  "error": "Invalid or expired session"
}
```

#### ❌ エラーケース: 無効なセッション ID

```bash
curl -s "http://localhost:3001/api/video?session=invalid-session-id" | jq
```

**期待レスポンス**:
```json
{
  "success": false,
  "error": "Invalid or expired session"
}
```

---

## 5. トラブルシューティング

### エラー: `Missing required environment variables`

**原因**: `.env` ファイルが存在しないか、必須変数が不足している。

**解決方法**:
```bash
# ルートディレクトリの .env を確認
cat .env

# 環境変数が正しく設定されていることを確認
# サーバーは自動的にルート .env を読み込みます
```

---

### エラー: `Letter "1" must be present between prefix and data only`

**原因**: `KIOSK_INITIAL_SHARED_VERSION` または `TRANSFER_POLICY_INITIAL_SHARED_VERSION` が設定されていない。

**解決方法**:
```bash
# Kiosk の initialSharedVersion を取得
sui client object $KIOSK_ID

# .env に追加
echo "KIOSK_INITIAL_SHARED_VERSION=27" >> .env
echo "TRANSFER_POLICY_INITIAL_SHARED_VERSION=22" >> .env
```

---

### エラー: `Listing not found (already sold or incorrect nftId)`

**原因**: Kiosk の NFT がすでに売却されているか、`nftId` が間違っている。

**解決方法**:
```bash
# Kiosk の最新のリスティングを取得
curl -s http://localhost:3001/api/listings | jq '.listings[0]'
```

---

### エラー: `Address does not own NFT`

**原因**: 指定した `userAddress` が Kiosk の NFT（`nftId`）を所有していない。

**解決方法**:
```bash
# ユーザーが所有する Kiosk の NFT を確認
sui client objects $USER_ADDRESS --filter '{"StructType": "PACKAGE_ID::contracts::PremiumTicketNFT"}'
```

---

### セッションが作成されない

**原因**: Kiosk の NFT 所有権確認に失敗している。

**デバッグ方法**:
```bash
# サーバーログを確認
# 以下のようなログが出力されるはず:
# 🔄 Verifying NFT ownership: 0x... by 0x...
# 📊 Found 3 PremiumTicketNFT(s) owned by this address
# 📋 Owned NFT IDs: [ '0x...', '0x...', '0x...' ]
# 🎯 Looking for NFT ID: 0x...
# ✅ NFT ownership verified
```

**注**: Kiosk から購入した NFT のみが所有権確認に使用されます。

---

**Last Updated**: 2025-01-19
**Author**: YuseiWhite, Claude Code
