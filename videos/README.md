# videos/ - 動画ファイル管理ディレクトリ

## 📂 ディレクトリ構造

動画の種類と紐付けを明確にするため、以下の構造を推奨します：

```
videos/
├── README.md                          # このファイル
├── {video-id}/                        # 動画IDごとのディレクトリ
│   ├── metadata.json                  # 動画メタデータ（BLOB ID、NFT ID等の紐付け）
│   ├── thumbnail.png                  # サムネイル画像（完全版・プレビュー共通）
│   ├── preview.mp4                     # プレビュー動画（暗号化なし）
│   └── full.mp4                        # 完全版動画（暗号化前）
└── encrypted/                         # 暗号化後のメタデータ（Walrusアップロード後）
    └── {video-id}-metadata.json        # 暗号化メタデータ（BLOB ID、Identity ID等）
```

## 📝 動画の種類と用途

### 1. サムネイル画像（`thumbnail.png`）
- **用途**: 完全版とプレビュー動画のサムネイル（画像）
- **暗号化**: 不要（公開可能）
- **Walrusアップロード**: 必要（画像として）

### 2. プレビュー動画（`preview.mp4`）
- **用途**: 購入前のプレビュー（短い動画）
- **暗号化**: 不要（公開可能）
- **Walrusアップロード**: 必要（動画として）

### 3. 完全版動画（`full.mp4`）
- **用途**: PremiumTicketNFT所有者のみが視聴可能な完全版動画
- **暗号化**: **必要**（Sealで暗号化）
- **Walrusアップロード**: 必要（暗号化後）

## 🔗 紐付けの管理

### `metadata.json`の構造

各動画IDディレクトリに`metadata.json`を作成し、以下の情報を管理します：

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
    "thumbnailBlobId": null,        // Walrusアップロード後に設定
    "previewBlobId": null,          // Walrusアップロード後に設定
    "fullBlobId": null              // 暗号化・アップロード後に設定
  },
  "nft": {
    "blobId": null                  // NFTのblob_idフィールドに設定する値（fullBlobIdと同じ）
  },
  "seal": {
    "identityId": null,             // Seal Identity ID（暗号化時に使用）
    "encryptedAt": null             // 暗号化日時
  }
}
```

### `encrypted/{video-id}-metadata.json`の構造

暗号化後のメタデータを保存します：

```json
{
  "videoId": "one-173-premium-ticket",
  "blobId": "KmdAvDyXovSOO-vjXAqjOt70zg8aCC9CPS15w_SZg0c",
  "identityId": "7d7261cd82f7856ae416cba2a103b87e7a606f30aa48ad52e182c516a02842c3",
  "packageId": "0x5ef8575011e93e9fb78eca72ddd94ffc2b724e46256c2929c1d97e0bbb09c36a",
  "threshold": 2,
  "encryptedAt": "2025-01-XX..."
}
```

## 🚀 使用方法

### 1. 動画ファイルの準備

```bash
# 動画IDディレクトリを作成
mkdir -p videos/one-173-premium-ticket

# ファイルを配置
cp /path/to/thumbnail.png videos/one-173-premium-ticket/thumbnail.png
cp /path/to/preview.mp4 videos/one-173-premium-ticket/preview.mp4
cp /path/to/full.mp4 videos/one-173-premium-ticket/full.mp4

# メタデータファイルを作成
cat > videos/one-173-premium-ticket/metadata.json << EOF
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
    "thumbnailBlobId": null,
    "previewBlobId": null,
    "fullBlobId": null
  },
  "nft": {
    "blobId": null
  },
  "seal": {
    "identityId": null,
    "encryptedAt": null
  }
}
EOF
```

### 2. サムネイルとプレビューのアップロード

```bash
# サムネイル画像をWalrusにアップロード（暗号化なし）
# （スクリプトが必要な場合は作成）

# プレビュー動画をWalrusにアップロード（暗号化なし）
# （スクリプトが必要な場合は作成）
```

### 3. 完全版動画の暗号化とアップロード

```bash
# 完全版動画を暗号化してWalrusにアップロード
pnpm encrypt-video videos/one-173-premium-ticket/full.mp4

# 暗号化メタデータを確認
cat encrypted-video-metadata.json | jq .

# メタデータを動画IDディレクトリにコピー
mkdir -p videos/encrypted
cp encrypted-video-metadata.json videos/encrypted/one-173-premium-ticket-metadata.json

# metadata.jsonを更新（fullBlobIdとnft.blobIdを設定）
# （手動またはスクリプトで更新）
```

### 4. NFTミント時の使用

```bash
# NFTをミントする際、metadata.jsonのnft.blobIdを使用
pnpm seed:devnet

# seed.tsで、metadata.jsonからblobIdを読み込んでNFTに設定
```

## 📋 重要なポイント

1. **完全版動画のみ暗号化**: `full.mp4`のみSealで暗号化します
2. **NFTのblob_id**: NFTの`blob_id`フィールドには、暗号化された完全版動画のBLOB IDを設定します
3. **紐付けの明確化**: `metadata.json`で動画ID、BLOB ID、NFT IDの紐付けを管理します
4. **ファイル名の統一**: 各動画IDディレクトリ内で、`thumbnail.png`、`preview.mp4`、`full.mp4`という統一された名前を使用します

## 🔒 セキュリティ

- **完全版動画**: 暗号化してからWalrusにアップロード
- **プレビュー動画**: 暗号化不要（公開可能）
- **サムネイル**: 暗号化不要（公開可能）
- **メタデータ**: BLOB IDやIdentity IDを含むため、機密情報として扱う

## 📝 注意事項

- `videos/`ディレクトリは`.gitignore`で除外されています（動画ファイルはリポジトリに含めません）
- 暗号化後も元のファイル（`full.mp4`）は残ります（必要に応じて削除してください）
- `metadata.json`はリポジトリに含めることができます（BLOB IDは公開情報のため）
