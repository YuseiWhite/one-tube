# ONE 173 Premium Ticket: Superbon vs. Noiri

このディレクトリには、ONE 173 Premium Ticket NFTに関連する動画ファイルを配置します。

## 📁 必要なファイル

以下の3つのファイルを配置してください：

1. **`thumbnail.png`** - サムネイル画像（完全版・プレビュー共通）
   - 推奨サイズ: 1280x720px または 1920x1080px
   - 形式: PNG（透過可能）

2. **`preview.mp4`** - プレビュー動画（暗号化なし）
   - 購入前のプレビュー用（短い動画）
   - 推奨: 30秒〜1分程度
   - 形式: MP4（H.264推奨）

3. **`full.mp4`** - 完全版動画（暗号化前）
   - PremiumTicketNFT所有者のみが視聴可能な完全版
   - 形式: MP4（H.264推奨）

## 🔄 処理フロー

### 1. ファイル配置

```bash
# このディレクトリにファイルを配置
cp /path/to/thumbnail.png videos/one-173-premium-ticket/thumbnail.png
cp /path/to/preview.mp4 videos/one-173-premium-ticket/preview.mp4
cp /path/to/full.mp4 videos/one-173-premium-ticket/full.mp4
```

### 2. サムネイルとプレビューのアップロード（暗号化なし）

```bash
# サムネイル画像をWalrusにアップロード
# （スクリプトが必要な場合は作成）

# プレビュー動画をWalrusにアップロード
# （スクリプトが必要な場合は作成）

# metadata.jsonを更新（thumbnailBlobIdとpreviewBlobIdを設定）
```

### 3. 完全版動画の暗号化とアップロード

```bash
# 完全版動画を暗号化してWalrusにアップロード
pnpm encrypt-video videos/one-173-premium-ticket/full.mp4

# 暗号化メタデータを確認
cat encrypted-video-metadata.json | jq .

# 暗号化メタデータをコピー
mkdir -p videos/encrypted
cp encrypted-video-metadata.json videos/encrypted/one-173-premium-ticket-metadata.json

# metadata.jsonを更新
BLOB_ID=$(cat encrypted-video-metadata.json | jq -r '.blobId')
IDENTITY_ID=$(cat encrypted-video-metadata.json | jq -r '.identityId')

# metadata.jsonの以下を更新:
# - walrus.fullBlobId: ${BLOB_ID}
# - nft.blobId: ${BLOB_ID}  （NFTのblob_idフィールドに設定する値）
# - seal.identityId: ${IDENTITY_ID}
# - seal.encryptedAt: 現在の日時
```

### 4. NFTミント

```bash
# NFTをミント（seed.tsでmetadata.jsonからblobIdを読み込む）
pnpm seed:devnet
```

## 📝 メタデータの更新例

`metadata.json`を更新する例：

```json
{
  "videoId": "one-173-premium-ticket",
  "title": "ONE 173 Premium Ticket: Superbon vs. Noiri",
  "description": "...",
  "price": 500000000,
  "files": {
    "thumbnail": "thumbnail.png",
    "preview": "preview.mp4",
    "full": "full.mp4"
  },
  "walrus": {
    "thumbnailBlobId": "thumbnail-blob-id-here",
    "previewBlobId": "preview-blob-id-here",
    "fullBlobId": "KmdAvDyXovSOO-vjXAqjOt70zg8aCC9CPS15w_SZg0c"
  },
  "nft": {
    "blobId": "KmdAvDyXovSOO-vjXAqjOt70zg8aCC9CPS15w_SZg0c"
  },
  "seal": {
    "identityId": "7d7261cd82f7856ae416cba2a103b87e7a606f30aa48ad52e182c516a02842c3",
    "encryptedAt": "2025-01-XX..."
  }
}
```

## ⚠️ 重要

- **完全版動画（`full.mp4`）のみ暗号化**します
- NFTの`blob_id`フィールドには、**暗号化された完全版動画のBLOB ID**を設定します
- `nft.blobId`と`walrus.fullBlobId`は同じ値になります

