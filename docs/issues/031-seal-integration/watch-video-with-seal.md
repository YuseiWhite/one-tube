## Seal統合済みで視聴まで行う完全フロー

### フロー全体図

```
┌─────────────────────────────────────────────────────────────┐
│ フェーズ1: 運営者フェーズ（準備）                           │
├─────────────────────────────────────────────────────────────┤
│ 1. 環境設定確認                                             │
│ 2. Moveコントラクトデプロイ                                 │
│ 3. Seal鍵発行・生成                                         │
│ 4. 動画暗号化                                               │
│ 5. Walrusへの動画アップロード                               │
│ 6. NFTミント・Kiosk出品                                     │
└─────────────────────────────────────────────────────────────┘
                 
                 
                 
                 
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ フェーズ2: 視聴フェーズ（エンドユーザー）                   │
├─────────────────────────────────────────────────────────────┤
│ 7. NFT一覧取得                                              │
│ 8. NFT購入                                                  │
│ 9. セッション作成（/api/watch）                             │
│ 10. 動画視聴（/api/video）                                  │
└─────────────────────────────────────────────────────────────┘
```

## フェーズ1: 運営者フェーズ（準備）

### ステップ1: ビルド環境構築
1. 環境設定の確認
```bash
cat .env | grep -E "SEAL_|WALRUS_|DEV_MODE|PACKAGE_ID|KIOSK_ID"
```

2. 依存関係のインストール確認
```bash
# 依存関係がインストールされているか確認
pnpm i

# Seal SDKがインストールされているか確認
cd app & pnpm list @mysten/seal
```

3. Sui CLIの設定確認

```bash
# Sui CLIがインストールされているか確認
sui --version

# アクティブなアドレスを確認
sui client active-address

# devnetに接続されているか確認
sui client active-env
```

4. Seal CLIのインストール確認（オプション）

Seal CLIを使用する場合は、事前にインストールが必要です。

```bash
# Seal CLIがインストールされているか確認
seal-cli --version

# インストールされていない場合:
# cargo installでインストール（推奨）
cargo install --git https://github.com/MystenLabs/seal.git seal-cli

# インストール確認
seal-cli --version
```

### ステップ2: Moveコントラクトデプロイ

#### 2.1 Moveコントラクトのビルド

```bash
# Moveコントラクトをビルド
cd contracts & sui move build
```

#### 2.2 Moveコントラクトのテスト

```bash
sui move test
```

#### 2.3 コントラクトのデプロイ

testnetの場合は `pnpm deploy:testnet`になります。

```bash
# コントラクトをdevnetにデプロイ
pnpm deploy:devnet

# 確認
cat .env | grep -E "PACKAGE_ID|KIOSK_ID|TRANSFER_POLICY_ID"
```

### ステップ3: Seal鍵発行・生成
```bash
pnpm run create-seal-identity-config

# 確認
cat .env | grep -E "SEAL_PACKAGE_ID|SEAL_IDENTITY_ID|SEAL_THRESHOLD"
```

### ステップ4: 動画暗号化

1. 動画IDディレクトリを作成
```bash
VIDEO_ID="<match-name>"
mkdir -p videos/${VIDEO_ID}
```

2. 暗号対象の動画があることを確認
```bash
file videos/${VIDEO_ID}/full.mp4
```

3. メタデータファイルを作成（テンプレート）
```
cat > videos/${VIDEO_ID}/metadata.json << EOF
{
  "videoId": "${VIDEO_ID}",
  "title": "動画タイトル",
  "description": "動画の説明",
  "price": <price>,
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

1. 完全版動画の暗号化とアップロード
```bash
pnpm encrypt-video videos/${VIDEO_ID}/full.mp4
```

### ステップ5: NFTミント・Kiosk出品
#### 5.1 NFTミントとKiosk出品

```bash
# NFTをミントしてKioskに出品
# blob idが必要なのでこのタイミングで行う
# testnetの場合は `pnpm seed:testnet`になります。
pnpm seed:devnet
```

#### 5.2 NFTメタデータの確認

```bash
# NFTオブジェクトを確認
sui client object <NFT_ID> --json | jq .
```

#### 5.3 Kiosk listingsの確認

```bash
# APIエンドポイントからNFT一覧を取得
curl -X GET "http://localhost:3001/api/listings" | jq .

# 特定のフィールドのみ表示
curl -s "http://localhost:3001/api/listings" | jq '.listings[] | {id: .id, name: .name, price: .price, listingId: .listingId}'
```

#### 5.4 NFT購入（Sponsored Transaction）

```bash
# NFT購入リクエスト（Sponsored Transaction経由）
# 注意: userAddressは購入者のSuiアドレス、nftIdはNFTのオブジェクトID
curl -X POST "http://localhost:3001/api/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x92ab53f0846de2a90df2c4d3669d3cc25f3a60126802537f879ef97eddb28e88",
    "nftId": "0x15722ed6933baaee7ddbd919948ed576828eff438424c1170946461cc28daccd"
  }' | jq .

# レスポンス例:
# {
#   "success": true,
#   "nftId": "0x...",
#   "transactionDigest": "0x..."
# }
```

#### 5.5 購入後のNFT所有確認

```bash
# 購入したNFTの所有権を確認
# 購入レスポンスで返されたnftIdを使用
sui client object <NFT_ID> --json | jq '.data.owner'

# 特定のアドレスが所有するNFT一覧を確認
sui client objects <YOUR_SUI_ADDRESS> --json | jq '.[] | select(.data.type | contains("PremiumTicketNFT"))'

# NFTメタデータ（blob_id等）を確認
sui client object <NFT_ID> --json | jq '.data.content.fields'
```

---

## フェーズ2: 視聴フェーズ（エンドユーザー）- 技術詳細

### 重要: curlでは実行できない理由

`/api/watch`エンドポイントは、**フロントエンドからユーザーのウォレットで署名したSessionKeyを受け取る**必要があります。curlからはウォレットの署名を取得できないため、このエンドポイントはcurlでは実行できません。

**正しいフロー**:
1. フロントエンド（ブラウザ）でウォレット接続
2. フロントエンドでSessionKeyを作成し、ウォレットで署名
3. 署名済みSessionKeyをバックエンドに送信
4. バックエンドでセッションを作成

---

## 技術詳細: 動画復号フローの実装

### 概要

このセクションでは、Seal統合による動画復号フローの技術的な実装詳細を説明します。実装ファイル（`app/src/lib/api.ts`, `app/src/server/server.ts`, `app/src/server/seal.ts`）を基に、各ステップで必要なデータ、オブジェクト、関数の動作を解説します。

### 必要な環境変数とデータ構造

#### 環境変数

```typescript
// app/src/lib/api.ts, app/src/server/seal.ts で使用
SEAL_PACKAGE_ID: string        // SealパッケージID（MoveコントラクトのPACKAGE_IDと同じ）
SEAL_IDENTITY_ID: string       // Seal Identity ID（hex形式、動画暗号化時に使用）
SEAL_KEY_SERVER_OBJECT_IDS: string  // Seal key serverのオブジェクトID（カンマ区切り）
SEAL_SESSION_DURATION: number  // セッション有効期限（秒、デフォルト300秒）
NETWORK: "devnet" | "testnet" | "mainnet" | "localnet"
RPC_URL: string                // Sui RPC URL
```

#### データ構造

```typescript
// app/src/shared/types.ts
interface ExportedSessionKey {
  address: string;                    // NFT所有者のアドレス
  packageId: string;                  // SEAL_PACKAGE_ID
  mvrName?: string;                   // Move Package Registry名（オプション）
  creationTimeMs: number;              // 作成時刻（Unix timestamp、ミリ秒）
  ttlMin: number;                     // TTL（分）
  personalMessageSignature: string;    // ユーザー署名（Base64形式、必須）
  sessionKey: string;                  // セッションキー証明書（Base64形式、Uint8Array）
}

interface Session {
  sessionId: string;                   // セッションID（SHA256ハッシュ）
  userAddress: string;                 // NFT所有者のアドレス
  nftId: string;                       // NFTオブジェクトID
  blobId: string;                      // Walrus BLOB ID（NFTのblob_idフィールドから取得）
  sessionKey: ExportedSessionKey;      // ExportedSessionKey形式
  txBytes: string;                     // 空文字列（互換性のため、実際は毎回新しく作成）
  userKeypairSecretKey?: string;       // 未使用（フロントエンドで署名済みのため）
  publicKeyHex?: string;               // 未使用（フロントエンドで署名済みのため）
  expiresAt: number;                   // 有効期限（Unix timestamp、ミリ秒）
  createdAt: number;                   // 作成時刻（Unix timestamp、ミリ秒）
}

interface WatchRequest {
  nftId: string;                       // NFTオブジェクトID
  userAddress: string;                  // NFT所有者のアドレス
  sessionKey?: ExportedSessionKey;     // フロントエンドで作成したExportedSessionKey
}
```

---

### ステップ1: フロントエンドでのSessionKey作成

**実装ファイル**: `app/src/lib/api.ts`

#### 1.1 SessionKey.create()の呼び出し

```typescript
// app/src/lib/api.ts:318-324
const sessionKey = await SessionKey.create({
  address: userAddress,              // NFT所有者のアドレス（必須）
  packageId: SEAL_PACKAGE_ID,       // SealパッケージID（必須）
  suiClient,                        // SuiClientインスタンス（必須）
  ttlMin: Math.max(1, Math.floor(SEAL_SESSION_DURATION / 60)), // TTL（分、必須）
  // signerは渡さない（公式ドキュメントに従い、後でsetPersonalMessageSignature()で設定）
});
```

**動作**:
- `SessionKey.create()`は、指定された`address`と`packageId`でセッションキー証明書を生成します
- この時点では**署名はまだ含まれていません**
- 内部で`ephemeralSecretKey`（一時秘密鍵）と`ephemeralPublicKey`（一時公開鍵）を生成します
- `creationTimeMs`（作成時刻）と`ttlMin`（TTL）を設定します

**必要なデータ**:
- `userAddress`: NFT所有者のSuiアドレス（`0x`で始まる64文字の16進数）
- `SEAL_PACKAGE_ID`: SealパッケージID（環境変数から取得）
- `SEAL_SESSION_DURATION`: セッション有効期限（秒、環境変数から取得）

#### 1.2 getPersonalMessage()でメッセージ取得

```typescript
// app/src/lib/api.ts:335
const message = sessionKey.getPersonalMessage();
```

**動作**:
- `SessionKey.getPersonalMessage()`は、ユーザーが署名すべきメッセージを返します
- メッセージ形式: `"Accessing keys of package <packageId> for <ttlMin> mins from <timestamp> UTC, session key <base64-session-key>"`

**返り値**:
- `Uint8Array`: 署名対象のメッセージ（UTF-8エンコード）

**例**:
```
"Accessing keys of package 0x5fbc8c6aee2463e05a347cd2dc4d7c26b8572a9da826370049c7218333d638f5 for 5 mins from 2025-11-23 10:37:43 UTC, session key I2q4qlDTBNJex02vb6cUfuFmGkqq1+2Kgdth2V3J9v8="
```

#### 1.3 signPersonalMessage()で署名取得

```typescript
// app/src/lib/api.ts:348-363
const signatureResult = await (actualSigner as any).signPersonalMessage(message);

// 署名を取得（Wallet Standard形式: { signature: string, bytes: Uint8Array }）
if (signatureResult && typeof signatureResult === 'object') {
  if (typeof signatureResult.signature === 'string') {
    signatureForSessionKey = signatureResult.signature;  // Base64形式の署名
  } else if (signatureResult.bytes instanceof Uint8Array) {
    signatureForSessionKey = btoa(String.fromCharCode(...Array.from(signatureResult.bytes)));
  }
}
```

**動作**:
- `signPersonalMessage()`は、ウォレットの承認画面を表示し、ユーザーに署名を要求します
- 署名は`message`（`getPersonalMessage()`で取得したメッセージ）に対して行われます
- Wallet Standard形式: `{ signature: string, bytes: Uint8Array }`
- Seal SDKはBase64形式の署名を期待するため、`signature`フィールドを優先的に使用します

**必要なオブジェクト**:
- `actualSigner`: `Signer`インターフェイスを実装したオブジェクト
  - `getPublicKey()`: 公開鍵を取得（`Ed25519PublicKey`を返す）
  - `signPersonalMessage(message: Uint8Array)`: パーソナルメッセージに署名

**カスタムSigner実装**:
- `app/src/lib/api.ts:78-170`で`createWalletSigner()`関数を実装
- Wallet Standard準拠のウォレット（Slush等）を`Signer`インターフェイスに適合させる
- `getPublicKey()`は`Ed25519PublicKey`を返す必要がある（`SessionKey.create()`が内部で`getPublicKey().toSuiAddress()`を呼ぶため）

#### 1.4 setPersonalMessageSignature()で署名をセット

```typescript
// app/src/lib/api.ts:377
sessionKey.setPersonalMessageSignature(signatureForSessionKey);
```

**動作**:
- `setPersonalMessageSignature()`は、取得した署名を`SessionKey`オブジェクトに設定します
- この署名は、セッションキー証明書（`sessionKey`フィールド）に埋め込まれます
- **重要**: `setPersonalMessageSignature()`を呼ばないと、`export()`に`personalMessageSignature`が含まれません

**必要なデータ**:
- `signatureForSessionKey`: Base64形式の署名文字列

#### 1.5 export()でExportedSessionKey形式に変換

```typescript
// app/src/lib/api.ts:398
const exported = sessionKey.export();

// setPersonalMessageSignature()を呼んだのにexport()にpersonalMessageSignatureが含まれていない場合、
// 手動で設定（Seal SDKのバグの可能性があるため）
if (!exported.personalMessageSignature) {
  (exported as any).personalMessageSignature = signatureForSessionKey;
}
```

**動作**:
- `export()`は、`SessionKey`オブジェクトを`ExportedSessionKey`形式（JSONシリアライズ可能）に変換します
- `sessionKey`フィールド（セッションキー証明書）は`Uint8Array`からBase64文字列に変換されます
- `personalMessageSignature`が含まれていない場合は、手動で設定します（Seal SDKのバグ対策）

**返り値**:
- `ExportedSessionKey`: JSONシリアライズ可能な形式
  - `sessionKey`: Base64文字列（`Uint8Array`から変換）
  - `personalMessageSignature`: Base64文字列（ユーザー署名）

**シリアライズ処理**:
```typescript
// app/src/lib/api.ts:520-545
// ExportedSessionKeyにはUint8Arrayが含まれている可能性があるため、シリアライズ可能な形式に変換
const serializableSessionKey: any = {};
for (const [key, value] of Object.entries(sessionKey as any)) {
  const val = value as any;
  if (val != null && typeof val === 'object' && val.constructor === Uint8Array) {
    // Uint8Arrayを16進数文字列に変換
    serializableSessionKey[key] = Array.from(val as Uint8Array)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

---

### ステップ2: バックエンドでのセッション作成（/api/watch）

**実装ファイル**: `app/src/server/server.ts`

#### 2.1 NFTメタデータからblobIdを取得

```typescript
// app/src/server/server.ts:213-276
const object = await suiClient.getObject({
  id: request.nftId,
  options: { showContent: true },
});

const fields = (content as unknown as {
  fields: {
    name?: string;
    description?: string;
    blob_id?: string;
  };
}).fields;

const blobId = fields.blob_id;  // またはハードコードされた値
```

**動作**:
- Sui RPCの`getObject()`を使用してNFTオブジェクトを取得します
- `fields.blob_id`からWalrus BLOB IDを取得します
- **注意**: 現在の実装では、デプロイされたNFTの`blob_id`が間違っているため、ハードコードされた値を使用しています

**必要なデータ**:
- `request.nftId`: NFTオブジェクトID（`0x`で始まる64文字の16進数）

**必要なオブジェクト**:
- `suiClient`: `SuiClient`インスタンス（`app/src/server/seal.ts:41`で作成）

#### 2.2 セッション作成と保存

```typescript
// app/src/server/server.ts:280-285
let sessionKey: ExportedSessionKey;

if (request.sessionKey) {
  // フロントから受け取ったsessionKeyを使用
  sessionKey = request.sessionKey;
  logInfo("SessionKey received from frontend", { hasSessionKey: true });
}

// セッション作成
const session = await createSession(
  request.userAddress,
  request.nftId,
  blobId,
  sessionKey,  // ExportedSessionKey形式（フロントから受け取る）
  undefined,   // userKeypairSecretKeyは不要（フロントで署名済み）
  undefined,   // publicKeyは不要（フロントで署名済み）
);
```

**動作**:
- `createSession()`関数（`app/src/server/seal.ts:103-191`）を呼び出します
- セッションIDは`sessionKey`（ExportedSessionKey）のSHA256ハッシュから生成されます
- セッション情報は`app/data/sessions.json`に保存されます

**必要なデータ**:
- `request.userAddress`: NFT所有者のアドレス
- `request.nftId`: NFTオブジェクトID
- `blobId`: Walrus BLOB ID
- `request.sessionKey`: フロントエンドから受け取った`ExportedSessionKey`

**createSession()関数の実装**:
```typescript
// app/src/server/seal.ts:103-191
export async function createSession(
  userAddress: string,
  nftId: string,
  blobId: string,
  exportedSessionKey: ExportedSessionKey,
  userKeypairSecretKey: string | undefined,
  publicKeyHex: string | undefined,
  verifyOwnership?: (userAddress: string, nftId: string) => Promise<boolean>,
): Promise<Session> {
  // 1. セッションID生成（ExportedSessionKeyのSHA256ハッシュ）
  const sessionId = crypto
    .createHash("sha256")
    .update(JSON.stringify(exportedSessionKey))
    .digest("hex");

  // 2. 有効期限計算
  const now = Date.now();
  const expiresAt = now + SEAL_SESSION_DURATION * 1000;

  // 3. セッションオブジェクト作成
  const session: Session = {
    sessionId,
    userAddress,
    nftId,
    blobId,
    sessionKey: exportedSessionKey,
    txBytes: "",  // 空文字列（互換性のため、実際は毎回新しく作成）
    userKeypairSecretKey,
    publicKeyHex,
    createdAt: now,
    expiresAt,
  };

  // 4. セッションファイルに保存
  // app/data/sessions.jsonに書き込み
  // ...

  return session;
}
```

---

### ステップ3: バックエンドでの動画復号（/api/video）

**実装ファイル**: `app/src/server/server.ts`

#### 3.1 セッション検証

```typescript
// app/src/server/server.ts:470
const session = validateSession(sessionId);
```

**動作**:
- `validateSession()`関数（`app/src/server/seal.ts:193-220`）を呼び出します
- セッションIDが存在するか確認します
- セッションが期限切れでないか確認します

**validateSession()関数の実装**:
```typescript
// app/src/server/seal.ts:193-220
export function validateSession(sessionId: string): Session {
  // 1. セッションファイルから読み込み
  const sessions = loadSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new SessionNotFoundError(`Session ${sessionId} not found`);
  }

  // 2. 有効期限確認
  if (Date.now() > session.expiresAt) {
    throw new SessionExpiredError(`Session ${sessionId} expired`);
  }

  return session;
}
```

#### 3.2 SealApprovePTBの構築

```typescript
// app/src/server/server.ts:500-509
const objectRef = {
  objectId: session.nftId,
  version: String(objResponse.data.version),
  digest: objResponse.data.digest,
};

const tx = buildSealApprovePTB(
  session.nftId,
  SEAL_IDENTITY_ID,
  SEAL_PACKAGE_ID,
  objectRef,
);

const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
```

**動作**:
- `buildSealApprovePTB()`関数（`app/src/server/seal.ts:223-250`）を呼び出します
- Sealの`seal_approve_nft`関数を呼び出すPTB（Programmable Transaction Block）を構築します
- `onlyTransactionKind: true`を使用して、TransactionKind形式（PTBだけ）のBCSバイト列を生成します

**buildSealApprovePTB()関数の実装**:
```typescript
// app/src/server/seal.ts:223-250
export function buildSealApprovePTB(
  _nftId: string,  // 将来の使用のため保持（現在はobjectRef.objectIdを使用）
  identityId: string,
  packageId: string,
  objectRef: { objectId: string; version: string; digest: string },
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::contracts::seal_approve_nft`,
    arguments: [
      tx.pure.vector("u8", Buffer.from(identityId, "hex")),  // identity ID（hex文字列からバイト配列に変換）
      tx.objectRef(objectRef),  // NFTオブジェクト参照（完全な参照: objectId, version, digest）
    ],
  });
  return tx;
}
```

**必要なデータ**:
- `session.nftId`: NFTオブジェクトID
- `SEAL_IDENTITY_ID`: Seal Identity ID（hex形式）
- `SEAL_PACKAGE_ID`: SealパッケージID
- `objectRef`: 完全なオブジェクト参照（`objectId`, `version`, `digest`）

**重要なポイント**:
- `objectRef`は完全な参照（`version`と`digest`を含む）である必要があります
- これにより、フルノードの視界差（view difference）を回避できます
- `onlyTransactionKind: true`を使用することで、Seal SDKの`decrypt()`メソッドが期待する形式（TransactionKind形式）のBCSバイト列を生成します

#### 3.3 Walrusから暗号化オブジェクトを取得

```typescript
// app/src/server/server.ts:512-523
let encryptedObject: Buffer;
try {
  encryptedObject = await getEncryptedBlob(blobId);
} catch (error) {
  if (error instanceof Error && error.message.includes("BlobNotFoundError")) {
    throw new BlobNotFoundError(`BLOB ID ${blobId} not found`);
  }
  throw error;
}
```

**動作**:
- `getEncryptedBlob()`関数（`app/src/server/walrus.ts:377-457`）を呼び出します
- 複数のWalrus Aggregatorを順番に試行し、BLOBを取得します
- 取得したBLOBは`Buffer`形式で返されます

**getEncryptedBlob()関数の実装**:
```typescript
// app/src/server/walrus.ts:377-457
export async function getEncryptedBlob(blobId: string): Promise<Buffer> {
  // 優先Aggregator（環境変数で指定されている場合）
  const primaryAggregator = WALRUS_AGGREGATOR_URL || "";
  const aggregatorsToTry = primaryAggregator
    ? [primaryAggregator, ...WALRUS_TESTNET_AGGREGATORS]
    : WALRUS_TESTNET_AGGREGATORS;

  // 複数のAggregatorを順番に試行
  for (const aggregator of aggregatorsToTry) {
    try {
      const data = await getBlobFromAggregator(aggregator, blobId);
      return data;  // 成功したら即座に返す
    } catch (error) {
      // エラーを記録して次のAggregatorを試す
      continue;
    }
  }

  // すべてのAggregatorで失敗した場合
  throw new BlobNotFoundError(`BLOB ID ${blobId} not found`);
}
```

**必要なデータ**:
- `blobId`: Walrus BLOB ID（NFTの`blob_id`フィールドから取得）

**必要な環境変数**:
- `WALRUS_AGGREGATOR_URL`: 優先Aggregator URL（オプション）

#### 3.4 SessionKeyの復元

```typescript
// app/src/server/server.ts:529-549
const exportedSessionKey = session.sessionKey;

// SessionKey.import()で復元
// signerは渡さない（オプション）
// フロントエンドでsetPersonalMessageSignature()を呼んでからexport()したExportedSessionKeyを受け取っているため、
// バックエンドではsignerは不要
const sessionKeyInstance = SessionKey.import(
  exportedSessionKey,
  suiClient,
  // signerは渡さない（オプション）
);
```

**動作**:
- `SessionKey.import()`関数（Seal SDK）を呼び出します
- `ExportedSessionKey`形式から`SessionKey`インスタンスを復元します
- **重要**: `signer`は渡しません（オプション）
- フロントエンドで`setPersonalMessageSignature()`を呼んでから`export()`した`ExportedSessionKey`には既に`personalMessageSignature`が含まれているため、`signer`は不要です

**必要なデータ**:
- `exportedSessionKey`: `ExportedSessionKey`形式（セッションファイルから読み込まれたもの）
- `suiClient`: `SuiClient`インスタンス

**重要なポイント**:
- `personalMessageSignature`が含まれていない場合、復号に失敗します
- `SessionKey.import()`は、`personalMessageSignature`を検証します（署名者のアドレスと`address`フィールドが一致する必要があります）

#### 3.5 Seal復号の実行

```typescript
// app/src/server/server.ts:551-570
const sealClient = getSealClient();

const decryptedData = await sealClient.decrypt({
  data: encryptedObject,      // Buffer形式の暗号化オブジェクト
  sessionKey: sessionKeyInstance,  // SessionKeyインスタンス
  txBytes,                    // TransactionKind形式のBCSバイト列
});
```

**動作**:
- `SealClient.decrypt()`メソッド（Seal SDK）を呼び出します
- Seal key serverから復号キーを取得します
- `txBytes`を使用して`seal_approve_nft`関数を評価し、アクセス権を確認します
- 復号キーを使用して暗号化オブジェクトを復号します

**getSealClient()関数の実装**:
```typescript
// app/src/server/seal.ts:53-92
export function initializeSealClient(): SealClient {
  const keyServerObjectIds =
    process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(",").filter(Boolean) || [];

  const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

  const serverConfigs = keyServerObjectIds.map((objectId) => ({
    objectId: objectId.trim(),
    weight: 1,  // デフォルトのweightは1
  }));

  const client = new SealClient({
    suiClient,
    serverConfigs,
    verifyKeyServers: false,
  });

  return client;
}
```

**必要なデータ**:
- `encryptedObject`: `Buffer`形式の暗号化オブジェクト（Walrusから取得）
- `sessionKeyInstance`: `SessionKey`インスタンス（`SessionKey.import()`で復元）
- `txBytes`: `Uint8Array`形式のTransactionKind形式のBCSバイト列

**必要な環境変数**:
- `SEAL_KEY_SERVER_OBJECT_IDS`: Seal key serverのオブジェクトID（カンマ区切り）

**復号プロセス**:
1. `SealClient.decrypt()`は、`txBytes`を使用して`dry_run_transaction_block` RPCを呼び出します
2. `seal_approve_nft`関数が評価され、NFT所有者のアクセス権が確認されます
3. Seal key serverから復号キーを取得します（threshold署名方式）
4. 復号キーを使用して暗号化オブジェクトを復号します

#### 3.6 動画ファイルの返却

```typescript
// app/src/server/server.ts:571-580
res.setHeader("Content-Type", "video/mp4");
res.setHeader("Content-Length", decryptedData.length);
res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
res.setHeader("Pragma", "no-cache");
res.setHeader("Expires", "0");

res.send(Buffer.from(decryptedData));
```

**動作**:
- 復号された動画データをHTTPレスポンスとして返却します
- `Content-Type: video/mp4`ヘッダーを設定します
- キャッシュを無効化するヘッダーを設定します

**返り値**:
- `Buffer`: 復号された動画データ（MP4形式）

---

## データフロー図

```
┌─────────────────────────────────────────────────────────────┐
│ フロントエンド（ブラウザ）                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. SessionKey.create()                                      │
│    → ephemeralSecretKey/ephemeralPublicKey生成             │
│                                                             │
│ 2. sessionKey.getPersonalMessage()                         │
│    → 署名対象メッセージ取得（Uint8Array）                  │
│                                                             │
│ 3. signer.signPersonalMessage(message)                     │
│    → ウォレットで署名（Base64文字列）                       │
│                                                             │
│ 4. sessionKey.setPersonalMessageSignature(signature)        │
│    → 署名をSessionKeyに設定                                 │
│                                                             │
│ 5. sessionKey.export()                                      │
│    → ExportedSessionKey形式に変換                          │
│    → Uint8Arrayを16進数文字列に変換（シリアライズ）         │
│                                                             │
│ 6. POST /api/watch                                          │
│    → { nftId, userAddress, sessionKey }                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ バックエンド（/api/watch）                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. suiClient.getObject({ id: nftId })                       │
│    → NFTオブジェクト取得                                    │
│    → fields.blob_idからBLOB ID取得                          │
│                                                             │
│ 2. createSession()                                          │
│    → セッションID生成（ExportedSessionKeyのSHA256）         │
│    → セッション情報をsessions.jsonに保存                    │
│                                                             │
│ 3. レスポンス返却                                            │
│    → { sessionId, expiresAt }                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ バックエンド（/api/video）                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. validateSession(sessionId)                               │
│    → セッションファイルから読み込み                          │
│    → 有効期限確認                                           │
│                                                             │
│ 2. buildSealApprovePTB()                                    │
│    → seal_approve_nftを呼ぶPTB構築                         │
│    → tx.build({ onlyTransactionKind: true })               │
│    → TransactionKind形式のBCSバイト列生成                  │
│                                                             │
│ 3. getEncryptedBlob(blobId)                                 │
│    → Walrus Aggregatorから暗号化オブジェクト取得            │
│    → Buffer形式で返却                                       │
│                                                             │
│ 4. SessionKey.import(exportedSessionKey)                    │
│    → ExportedSessionKeyからSessionKeyインスタンス復元      │
│    → personalMessageSignatureを検証                        │
│                                                             │
│ 5. sealClient.decrypt()                                     │
│    → dry_run_transaction_blockでseal_approve_nft評価       │
│    → Seal key serverから復号キー取得                       │
│    → 暗号化オブジェクトを復号                                │
│    → Uint8Array形式で返却                                   │
│                                                             │
│ 6. 動画ファイル返却                                          │
│    → Content-Type: video/mp4                                │
│    → Buffer.from(decryptedData)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 重要な実装ポイント

### 1. SessionKeyの署名フロー

**公式ドキュメントに従った正しいフロー**:
1. `SessionKey.create()`を呼ぶ（signerは渡さない）
2. `getPersonalMessage()`でメッセージを取得
3. `signPersonalMessage()`で署名を取得
4. `setPersonalMessageSignature()`で署名をセット
5. `export()`でExportedSessionKey形式に変換

**注意点**:
- `setPersonalMessageSignature()`を呼ばないと、`export()`に`personalMessageSignature`が含まれません
- Seal SDKのバグ対策として、`export()`後に`personalMessageSignature`が含まれていない場合は手動で設定します

### 2. PTBの構築

**重要なポイント**:
- `onlyTransactionKind: true`を使用して、TransactionKind形式（PTBだけ）のBCSバイト列を生成します
- Seal SDKの`decrypt()`メソッドは、TransactionKind形式のBCSバイト列を期待しています
- `objectRef`は完全な参照（`objectId`, `version`, `digest`）である必要があります

### 3. WalrusからのBLOB取得

**フォールバック戦略**:
- 複数のWalrus Aggregatorを順番に試行します
- 優先Aggregator（`WALRUS_AGGREGATOR_URL`）を最初に試行します
- 404エラーやタイムアウトの場合は、次のAggregatorを試行します

### 4. セッション管理

**セッションIDの生成**:
- `ExportedSessionKey`のJSON文字列のSHA256ハッシュから生成します
- 同じ`ExportedKey`からは常に同じセッションIDが生成されます

**セッションの保存**:
- `app/data/sessions.json`にJSON形式で保存します
- セッション情報には`ExportedSessionKey`が含まれます（`personalMessageSignature`を含む）

---

## まとめ

このドキュメントでは、Seal統合による動画復号フローの技術的な実装詳細を説明しました。主なポイントは以下の通りです:

1. **フロントエンド**: SessionKeyを作成し、ウォレットで署名してからバックエンドに送信
2. **バックエンド（/api/watch）**: セッションを作成し、セッションIDを返却
3. **バックエンド（/api/video）**: セッションを検証し、PTBを構築し、Walrusから暗号化オブジェクトを取得し、Sealで復号して動画を返却

各ステップで必要なデータ、オブジェクト、関数の動作を詳細に説明しました。実装ファイルを参照しながら、このドキュメントを活用してください。
