# OneTube - バックエンドAPI実装計画書（Sponsored Tx + Seal統合）

## 1. 実装概要

### 目的
NFT購入・視聴のバックエンドロジックを実装し、フロントエンドとの統合を完了する。

### 技術的決定事項
- **セッションストレージ**: インメモリMap（シンプル、MVP向け）
- **トランザクションフロー**: バックエンドが署名＋ブロードキャスト（完全なスポンサーシップ）
- **型定義**: 別ファイル `app/src/shared/types.ts` に集約（バックエンド・フロントエンド共通）
- **動画配信**: モックWalrus URL（MVP）

### 実装規模
- **推定時間**: 8時間
- **ファイル数**: 6ファイル（新規作成）+ 2ファイル（拡張）
- **実装フェーズ**: 6フェーズ

---

## 2. 現状分析

### ✅ 完了している項目
- スマートコントラクト完全実装・デプロイ済み
  - `PremiumTicketNFT` 構造（id, name, description, blob_id）
  - `mint_batch` 関数
  - Transfer Policy + 収益分配ルール（70%/25%/5%）
- 基本Express Server実装（app/src/server/server.ts）
  - `GET /api/health` エンドポイント
  - JSON body parsing設定済み
- .env設定完了
  - PACKAGE_ID, KIOSK_ID, TRANSFER_POLICY_ID等全て設定済み
  - SPONSOR_PRIVATE_KEY設定済み

### ❌ 未実装の項目
- **バックエンドビジネスロジック**:
  - `app/src/server/sponsor.ts` - Sponsored Transaction署名サービス
  - `app/src/server/kiosk.ts` - Kiosk購入処理
  - `app/src/server/seal.ts` - Seal統合（モック）
- **APIエンドポイント**:
  - `POST /api/purchase` - NFT購入
  - `POST /api/watch` - 視聴セッション作成
  - `GET /api/video` - 動画コンテンツ配信
- **フロントエンド統合**:
  - `app/src/lib/api.ts` - APIクライアント
  - `app/src/lib/sui.ts` - Sui SDKヘルパー
- **共通型定義**:
  - `app/src/shared/types.ts` - 型定義（バックエンド・フロントエンド共通）
- **環境変数**: Seal/Walrus関連変数（SEAL_SESSION_DURATION等）

---

## 3. 詳細仕様

### 3.1 共通型定義: app/src/shared/types.ts

バックエンド・フロントエンドで共有する型を集約。

```typescript
// ===== NFT & Video Types =====

export interface PremiumTicketNFT {
  id: string;
  name: string;
  description: string;
  blobId: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  previewBlobId: string;
  fullBlobId: string;
  price: number; // MIST単位
  listingId?: string;
}

// ===== Session Types =====

export interface Session {
  sessionId: string;
  userAddress: string;
  nftId: string;
  decryptionKey: string;
  expiresAt: number; // Unix timestamp (ms)
  createdAt: number; // Unix timestamp (ms)
}

// ===== API Request Types =====

export interface PurchaseRequest {
  userAddress: string;
  nftId: string;
}

export interface WatchRequest {
  nftId: string;
  userAddress: string;
}

export interface VideoContentRequest {
  sessionId: string;
}

// ===== API Response Types =====

export interface PurchaseResponse {
  success: boolean;
  txDigest?: string;
  nftId?: string;
  error?: string;
}

export interface WatchResponse {
  success: boolean;
  session?: Session;
  error?: string;
}

export interface VideoContentResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  network: string;
  rpcConnected: boolean;
  sponsorBalance?: string;
  activeSessions: number;
  timestamp: number;
}

// ===== Error Types =====

export class NFTNotOwnedError extends Error {
  constructor(address: string, nftId: string) {
    super(`Address ${address} does not own NFT ${nftId}`);
    this.name = 'NFTNotOwnedError';
  }
}

export class SessionExpiredError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} has expired`);
    this.name = 'SessionExpiredError';
  }
}

export class InvalidInputError extends Error {
  constructor(field: string, reason: string) {
    super(`Invalid ${field}: ${reason}`);
    this.name = 'InvalidInputError';
  }
}
```

**実装ポイント**:
- 全モジュールで一貫した型定義
- エラークラスで型安全なエラーハンドリング
- API契約の明確化

---

### 3.2 Sponsored Transaction: app/src/server/sponsor.ts

バックエンドがガス代を負担し、トランザクションを署名＋ブロードキャストする。

```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';
import dotenv from 'dotenv';
import type { PurchaseRequest, PurchaseResponse } from '../shared/types.js';

dotenv.config();

// ===== 環境変数読み込み =====
const RPC_URL = process.env.RPC_URL || 'https://fullnode.devnet.sui.io:443';
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const PACKAGE_ID = process.env.PACKAGE_ID;
const KIOSK_ID = process.env.KIOSK_ID;
const TRANSFER_POLICY_ID = process.env.TRANSFER_POLICY_ID;

if (!SPONSOR_PRIVATE_KEY || !PACKAGE_ID || !KIOSK_ID || !TRANSFER_POLICY_ID) {
  throw new Error('Missing required environment variables for sponsor.ts');
}

const client = new SuiClient({ url: RPC_URL });
const sponsorKeypair = Ed25519Keypair.fromSecretKey(
  SPONSOR_PRIVATE_KEY.startsWith('suiprivkey')
    ? fromB64(SPONSOR_PRIVATE_KEY.slice(10))
    : SPONSOR_PRIVATE_KEY
);

// ===== メイン関数 =====

/**
 * Sponsored Transaction: NFT購入をバックエンドが代行
 *
 * フロー:
 * 1. Kiosk購入トランザクション構築
 * 2. Transfer Policy統合（収益分配）
 * 3. バックエンドが署名＋ブロードキャスト
 * 4. NFT IDを返却
 *
 * @param request - ユーザーアドレスとNFT ID
 * @returns 購入結果（トランザクションダイジェスト、NFT ID）
 */
export async function sponsorPurchase(
  request: PurchaseRequest
): Promise<PurchaseResponse> {
  try {
    console.log('🔄 Sponsored Purchase started:', request);

    // 1. トランザクション構築
    const tx = new Transaction();

    // 1-1. Kiosk購入
    const [nft, transferRequest] = tx.moveCall({
      target: '0x2::kiosk::purchase',
      arguments: [
        tx.object(KIOSK_ID),
        tx.pure.id(request.nftId),
        tx.splitCoins(tx.gas, [500_000_000]) // 0.5 SUI
      ],
      typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
    });

    // 1-2. 収益分配実行
    tx.moveCall({
      target: `${PACKAGE_ID}::contracts::split_revenue`,
      arguments: [
        tx.object(TRANSFER_POLICY_ID),
        transferRequest,
        tx.splitCoins(tx.gas, [500_000_000])
      ]
    });

    // 1-3. Transfer Request確認
    tx.moveCall({
      target: '0x2::transfer_policy::confirm_request',
      arguments: [
        tx.object(TRANSFER_POLICY_ID),
        transferRequest
      ],
      typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
    });

    // 1-4. NFT転送
    tx.transferObjects([nft], request.userAddress);

    // 2. 署名＋ブロードキャスト
    const result = await client.signAndExecuteTransaction({
      signer: sponsorKeypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });

    console.log('✅ Transaction executed:', result.digest);

    // 3. NFT ID抽出
    const nftId = extractNFTId(result.objectChanges, request.userAddress);

    if (!nftId) {
      throw new Error('NFT ID not found in transaction result');
    }

    return {
      success: true,
      txDigest: result.digest,
      nftId
    };

  } catch (error) {
    console.error('❌ Sponsored purchase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== ヘルパー関数 =====

function extractNFTId(
  objectChanges: any[] | undefined | null,
  recipient: string
): string | null {
  if (!objectChanges) return null;

  const normalizedRecipient = recipient.toLowerCase();
  const nftChange = objectChanges.find((change: any) => {
    if (
      !change?.objectType ||
      !change.objectType.includes('::contracts::PremiumTicketNFT')
    ) {
      return false;
    }

    if (!['created', 'mutated', 'transferred'].includes(change.type)) {
      return false;
    }

    const owner =
      typeof change.owner === 'object' ? change.owner?.AddressOwner : undefined;
    return owner?.toLowerCase() === normalizedRecipient;
  });

  return nftChange?.objectId || null;
}

/**
 * スポンサーウォレット残高確認
 */
export async function getSponsorBalance(): Promise<string> {
  const address = sponsorKeypair.getPublicKey().toSuiAddress();
  const balance = await client.getBalance({ owner: address });
  return balance.totalBalance;
}
```

**実装ポイント**:
- バックエンドが完全にトランザクション処理を担当
- ユーザーはガス代を支払わない
- Transfer Policyによる自動収益分配
- トランザクション結果からNFT IDを抽出

---

### 3.3 Kiosk操作: app/src/server/kiosk.ts

Kioskのクエリと購入トランザクション構築。

```typescript
import { SuiClient } from '@mysten/sui/client';
import type { Video } from '../shared/types.js';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://fullnode.devnet.sui.io:443';
const KIOSK_ID = process.env.KIOSK_ID;
const PACKAGE_ID = process.env.PACKAGE_ID;

if (!KIOSK_ID || !PACKAGE_ID) {
  throw new Error('Missing KIOSK_ID or PACKAGE_ID in environment');
}

const client = new SuiClient({ url: RPC_URL });

/**
 * Kioskの出品中NFTリストを取得
 *
 * @returns 出品中の動画リスト
 */
export async function getKioskListings(): Promise<Video[]> {
  try {
    console.log('🔄 Fetching Kiosk listings...');

    // Kioskオブジェクトを取得
    const kioskObject = await client.getObject({
      id: KIOSK_ID,
      options: { showContent: true }
    });

    if (!kioskObject.data?.content) {
      throw new Error('Kiosk object not found or has no content');
    }

    // リスティング情報抽出
    const content = kioskObject.data.content as any;
    const listings = content.fields?.listings || [];

    console.log(`✅ Found ${listings.length} listings`);

    // Video型に変換
    const videos: Video[] = listings.map((listing: any, index: number) => ({
      id: listing.item_id,
      title: `ONE 170 Premium Ticket #${index + 1}`,
      description: 'Superbon vs Masaaki Noiri - Full Match Access',
      previewBlobId: 'mock-preview-blob-id',
      fullBlobId: listing.blob_id || 'mock-full-blob-id',
      price: 500_000_000, // 0.5 SUI in MIST
      listingId: listing.item_id
    }));

    return videos;

  } catch (error) {
    console.error('❌ Failed to fetch Kiosk listings:', error);
    return [];
  }
}

/**
 * 特定のNFTがKioskに出品されているか確認
 *
 * @param nftId - NFT ID
 * @returns 出品中の場合はlisting情報、なければnull
 */
export async function getListingInfo(nftId: string): Promise<any | null> {
  const listings = await getKioskListings();
  return listings.find(
    video => video.id === nftId || video.listingId === nftId
  ) || null;
}
```

**実装ポイント**:
- RPCクエリでKiosk内のリスティング情報取得
- Video型への変換処理
- モック動画メタデータ（MVP）

---

### 3.4 Seal統合（モック）: app/src/server/seal.ts

NFT所有権確認、セッション管理、復号キー発行。

```typescript
import { SuiClient } from '@mysten/sui/client';
import crypto from 'crypto';
import type { Session } from '../shared/types.js';
import { NFTNotOwnedError, SessionExpiredError } from '../shared/types.js';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://fullnode.devnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID;
const SEAL_SESSION_DURATION = parseInt(process.env.SEAL_SESSION_DURATION || '30', 10);
const SEAL_DECRYPTION_KEY = process.env.SEAL_DECRYPTION_KEY || 'mock-decryption-key-dev';

if (!PACKAGE_ID) {
  throw new Error('Missing PACKAGE_ID in environment');
}

const client = new SuiClient({ url: RPC_URL });

// インメモリセッションストレージ（MVP）
const sessions = new Map<string, Session>();

/**
 * NFT所有権を確認
 *
 * @param userAddress - ユーザーアドレス
 * @param nftId - NFT ID
 * @returns 所有している場合true
 */
export async function verifyNFTOwnership(
  userAddress: string,
  nftId: string
): Promise<boolean> {
  try {
    console.log(`🔄 Verifying NFT ownership: ${nftId} by ${userAddress}`);

    // ユーザーの所有オブジェクトを取得
    const ownedObjects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`
      },
      options: { showContent: true }
    });

    const ownsNFT = ownedObjects.data.some(
      (obj) => obj.data?.objectId === nftId
    );

    console.log(ownsNFT ? '✅ NFT ownership verified' : '❌ NFT not owned');
    return ownsNFT;

  } catch (error) {
    console.error('❌ Ownership verification failed:', error);
    return false;
  }
}

/**
 * 視聴セッションを作成
 *
 * @param userAddress - ユーザーアドレス
 * @param nftId - NFT ID
 * @returns セッション情報
 */
export async function createSession(
  userAddress: string,
  nftId: string
): Promise<Session> {
  // 1. NFT所有権確認
  const isOwner = await verifyNFTOwnership(userAddress, nftId);
  if (!isOwner) {
    throw new NFTNotOwnedError(userAddress, nftId);
  }

  // 2. 既存の有効なセッションがあれば再利用
  const existingSession = findValidSession(userAddress, nftId);
  if (existingSession) {
    console.log('♻️  Reusing existing valid session:', existingSession.sessionId);
    return existingSession;
  }

  // 3. 新規セッション作成
  const now = Date.now();
  const sessionId = generateSessionId(userAddress, nftId);
  const decryptionKey = generateDecryptionKey(nftId);

  const session: Session = {
    sessionId,
    userAddress,
    nftId,
    decryptionKey,
    createdAt: now,
    expiresAt: now + SEAL_SESSION_DURATION * 1000 // 秒 → ミリ秒
  };

  sessions.set(sessionId, session);

  console.log(`✅ Session created: ${sessionId} (expires in ${SEAL_SESSION_DURATION}s)`);
  return session;
}

/**
 * セッションを検証
 *
 * @param sessionId - セッションID
 * @returns 有効な場合はセッション情報、無効ならnull
 */
export async function validateSession(sessionId: string): Promise<Session | null> {
  const session = sessions.get(sessionId);

  if (!session) {
    console.log('❌ Session not found:', sessionId);
    return null;
  }

  // 有効期限チェック
  if (Date.now() > session.expiresAt) {
    console.log('❌ Session expired:', sessionId);
    sessions.delete(sessionId);
    throw new SessionExpiredError(sessionId);
  }

  console.log('✅ Session valid:', sessionId);
  return session;
}

/**
 * 期限切れセッションをクリーンアップ
 * （メモリリーク防止）
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
  }
}

/**
 * アクティブセッション数を取得
 */
export function getActiveSessionCount(): number {
  return sessions.size;
}

// ===== ヘルパー関数 =====

function findValidSession(userAddress: string, nftId: string): Session | null {
  const now = Date.now();

  for (const session of sessions.values()) {
    if (
      session.userAddress === userAddress &&
      session.nftId === nftId &&
      now <= session.expiresAt
    ) {
      return session;
    }
  }

  return null;
}

function generateSessionId(userAddress: string, nftId: string): string {
  const data = `${userAddress}-${nftId}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateDecryptionKey(nftId: string): string {
  // モック実装: HMAC-SHA256でキー生成
  return crypto
    .createHmac('sha256', SEAL_DECRYPTION_KEY)
    .update(nftId)
    .digest('hex');
}
```

**実装ポイント**:
- RPC経由でNFT所有権確認
- インメモリMapでセッション管理（MVP）
- 既存セッション再利用（同一ユーザー・NFT）
- 自動クリーンアップでメモリリーク防止

---

### 3.5 APIエンドポイント: app/src/server/server.ts（拡張）

既存のserver.tsに3つのエンドポイントを追加。

```typescript
import express from 'express';
import dotenv from 'dotenv';
import { sponsorPurchase, getSponsorBalance } from './sponsor.js';
import { getKioskListings } from './kiosk.js';
import { createSession, validateSession, cleanupExpiredSessions, getActiveSessionCount } from './seal.js';
import type { PurchaseRequest, WatchRequest, HealthResponse } from '../shared/types.js';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// ===== 既存エンドポイント（拡張） =====

app.get('/api/health', async (req, res) => {
  try {
    const sponsorBalance = await getSponsorBalance();
    const activeSessions = getActiveSessionCount();

    const health: HealthResponse = {
      status: 'ok',
      network: process.env.NETWORK || 'devnet',
      rpcConnected: true,
      sponsorBalance,
      activeSessions,
      timestamp: Date.now()
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

// ===== 新規エンドポイント =====

/**
 * POST /api/purchase
 * NFT購入（Sponsored Transaction）
 */
app.post('/api/purchase', async (req, res) => {
  try {
    const request: PurchaseRequest = req.body;

    // 入力検証
    if (!request.userAddress || !request.nftId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, nftId'
      });
    }

    // Sui Address形式検証
    if (!request.userAddress.startsWith('0x') || request.userAddress.length !== 66) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Sui address format'
      });
    }

    console.log('📦 Purchase request received:', request);

    const result = await sponsorPurchase(request);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Purchase endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/watch
 * 視聴セッション作成（NFT所有権確認）
 */
app.post('/api/watch', async (req, res) => {
  try {
    const request: WatchRequest = req.body;

    // 入力検証
    if (!request.nftId || !request.userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nftId, userAddress'
      });
    }

    console.log('🎬 Watch request received:', request);

    const session = await createSession(request.userAddress, request.nftId);

    res.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('❌ Watch endpoint error:', error);

    // NFT未所有エラー
    if (error instanceof Error && error.name === 'NFTNotOwnedError') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/video?session=<sessionId>
 * 動画コンテンツ配信（モック）
 */
app.get('/api/video', async (req, res) => {
  try {
    const sessionId = req.query.session as string;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing session parameter'
      });
    }

    console.log('🎥 Video request received:', sessionId);

    const session = await validateSession(sessionId);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    // モックWalrus URL返却
    const videoUrl = `https://aggregator.walrus-testnet.walrus.space/v1/${session.nftId}`;

    res.json({
      success: true,
      videoUrl
    });

  } catch (error) {
    console.error('❌ Video endpoint error:', error);

    // セッション期限切れ
    if (error instanceof Error && error.name === 'SessionExpiredError') {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/listings
 * Kiosk出品リスト取得
 */
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await getKioskListings();
    res.json({ success: true, listings });
  } catch (error) {
    console.error('❌ Listings endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/', (req, res) => {
  res.send('OneTube API Server');
});

// ===== 定期クリーンアップ =====
setInterval(cleanupExpiredSessions, 60000); // 60秒ごと

app.listen(port, () => {
  console.log(`✅ OneTube API Server running on http://localhost:${port}`);
  console.log(`📍 Network: ${process.env.NETWORK || 'devnet'}`);
  console.log(`📍 RPC: ${process.env.RPC_URL || 'default'}`);
});
```

**実装ポイント**:
- 入力検証（必須フィールド、Suiアドレス形式）
- HTTPステータスコード適切に返却（400, 403, 500）
- 定期的なセッションクリーンアップ
- 拡張されたヘルスチェック

---

### 3.6 フロントエンドAPIクライアント: app/src/lib/api.ts

バックエンドAPIへのリクエストを型安全にラップ。

```typescript
import type {
  PurchaseRequest,
  PurchaseResponse,
  WatchRequest,
  WatchResponse,
  VideoContentResponse,
  HealthResponse,
  Video
} from '../shared/types';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * NFT購入リクエスト
 */
export async function purchaseNFT(
  request: PurchaseRequest
): Promise<PurchaseResponse> {
  const response = await fetch(`${API_BASE_URL}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * 視聴セッション作成リクエスト
 */
export async function createWatchSession(
  request: WatchRequest
): Promise<WatchResponse> {
  const response = await fetch(`${API_BASE_URL}/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  return response.json();
}

/**
 * 動画コンテンツ取得
 */
export async function getVideoContent(
  sessionId: string
): Promise<VideoContentResponse> {
  const response = await fetch(`${API_BASE_URL}/video?session=${sessionId}`);
  return response.json();
}

/**
 * Kiosk出品リスト取得
 */
export async function getListings(): Promise<Video[]> {
  const response = await fetch(`${API_BASE_URL}/listings`);
  const data = await response.json();
  return data.listings || [];
}

/**
 * ヘルスチェック
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
```

**実装ポイント**:
- 型安全なfetchラッパー
- シンプルなエラーハンドリング（レスポンスJSONそのまま返却）
- 環境変数でAPI_BASE_URL切り替え可能（将来対応）

---

### 3.7 Sui SDKヘルパー: app/src/lib/sui.ts

フロントエンドでのSui RPC操作をヘルパー化。

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { PremiumTicketNFT } from '../shared/types';

const NETWORK = 'devnet';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';

export const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

/**
 * ユーザーが所有するNFTを取得
 */
export async function getUserNFTs(address: string): Promise<PremiumTicketNFT[]> {
  const ownedObjects = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`
    },
    options: { showContent: true }
  });

  return ownedObjects.data.map((obj) => {
    const fields = (obj.data?.content as any)?.fields;
    return {
      id: obj.data?.objectId || '',
      name: fields?.name || '',
      description: fields?.description || '',
      blobId: fields?.blob_id || ''
    };
  });
}

/**
 * 特定のNFTを取得
 */
export async function getNFT(nftId: string): Promise<PremiumTicketNFT | null> {
  try {
    const object = await suiClient.getObject({
      id: nftId,
      options: { showContent: true }
    });

    if (!object.data?.content) return null;

    const fields = (object.data.content as any).fields;
    return {
      id: object.data.objectId,
      name: fields.name,
      description: fields.description,
      blobId: fields.blob_id
    };
  } catch (error) {
    console.error('Failed to fetch NFT:', error);
    return null;
  }
}

/**
 * NFT所有権確認
 */
export async function verifyOwnership(
  address: string,
  nftId: string
): Promise<boolean> {
  const nfts = await getUserNFTs(address);
  return nfts.some((nft) => nft.id === nftId);
}
```

**実装ポイント**:
- SuiClientインスタンスをエクスポート
- NFT取得・所有権確認のヘルパー
- Vite環境変数でPACKAGE_ID注入

---

## 4. 技術的要件

### 4.1 依存関係追加

```bash
# app/package.json に追加
pnpm add @mysten/kiosk dotenv

# @mysten/sui を最新版に更新
pnpm add @mysten/sui@^1.44.0
```

### 4.2 環境変数追加

`.env` に以下を追加:

```bash
# Seal/Walrus（モック）
SEAL_SESSION_DURATION=30
SEAL_DECRYPTION_KEY=mock-decryption-key-dev
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

### 4.3 TypeScript設定

既存の `app/tsconfig.json`, `app/tsconfig.node.json` で対応可能。
追加設定不要。

### 4.4 エラーハンドリング戦略

- **入力検証**: 全エンドポイントで必須パラメータチェック
- **型安全エラー**: カスタムErrorクラス（NFTNotOwnedError等）
- **HTTPステータスコード**:
  - `200`: 成功
  - `400`: 入力エラー
  - `403`: 権限エラー（NFT未所有）
  - `401`: 認証エラー（セッション期限切れ）
  - `500`: サーバーエラー
- **ログ出力**: 全操作で絵文字付きログ（デバッグ用）

---

## 5. 実装フェーズとチェックリスト

### Phase 1: セットアップ（30分）

- [ ] `pnpm add @mysten/kiosk dotenv` 実行
- [ ] `pnpm add @mysten/sui@^1.44.0` 実行（app/package.json更新）
- [ ] `.env` に環境変数追加（SEAL_SESSION_DURATION等）
- [ ] `pnpm install` 実行

### Phase 2: 型定義（30分）

- [ ] `app/src/shared/types.ts` 作成
  - [ ] NFT/Video/Session型定義
  - [ ] API Request/Response型定義
  - [ ] カスタムErrorクラス定義

### Phase 3: バックエンドコア（3時間）

- [ ] `app/src/server/sponsor.ts` 実装
  - [ ] `sponsorPurchase()` 関数
  - [ ] トランザクション構築・署名・ブロードキャスト
  - [ ] NFT ID抽出ロジック
  - [ ] `getSponsorBalance()` 関数
- [ ] `app/src/server/kiosk.ts` 実装
  - [ ] `getKioskListings()` 関数
  - [ ] `getListingInfo()` 関数
- [ ] `app/src/server/seal.ts` 実装
  - [ ] `verifyNFTOwnership()` 関数
  - [ ] `createSession()` 関数
  - [ ] `validateSession()` 関数
  - [ ] `cleanupExpiredSessions()` 関数
  - [ ] インメモリMap実装

### Phase 4: APIエンドポイント（1時間）

- [ ] `app/src/server/server.ts` 拡張
  - [ ] `POST /api/purchase` 実装
  - [ ] `POST /api/watch` 実装
  - [ ] `GET /api/video` 実装
  - [ ] `GET /api/listings` 実装
  - [ ] `GET /api/health` 拡張（sponsorBalance, activeSessions追加）
  - [ ] 定期クリーンアップ実装（setInterval）

### Phase 5: フロントエンド統合（1.5時間）

- [ ] `app/src/lib/api.ts` 実装
  - [ ] `purchaseNFT()` 関数
  - [ ] `createWatchSession()` 関数
  - [ ] `getVideoContent()` 関数
  - [ ] `getListings()` 関数
  - [ ] `checkHealth()` 関数
- [ ] `app/src/lib/sui.ts` 実装
  - [ ] `getUserNFTs()` 関数
  - [ ] `getNFT()` 関数
  - [ ] `verifyOwnership()` 関数
  - [ ] SuiClientインスタンス作成

### Phase 6: テスト（2時間）

- [ ] バックエンド起動確認（`pnpm run dev`）
- [ ] `GET /api/health` 手動テスト
- [ ] `GET /api/listings` 手動テスト
- [ ] E2Eテスト実行（`pnpm run test:e2e`）
  - [ ] Phase 1: Admin setup通過
  - [ ] Phase 2: User purchase通過
  - [ ] Phase 3A: Successful viewing通過
  - [ ] Phase 3B: Failed viewing通過
- [ ] 問題修正とイテレーション

**合計推定時間: 8時間**

---

## 6. 受け入れ条件（AC）

### 基本AC（Issue #008で定義）

- ✅ `POST /api/purchase` がKiosk購入を実行し、NFT IDを返す
- ✅ Sponsored Transactionでユーザーはガス代を支払わない
- ✅ Transfer Policyで収益が3者に分配される（70%/25%/5%）
- ✅ `POST /api/watch` がNFT所有確認後、セッションキーを返す
- ✅ セッションキーは30秒で期限切れ

### 追加AC提案（実装推奨）

#### 1. エラーハンドリング・UX
- ✅ `POST /api/purchase` がリスティング不在時に明確なエラーを返す
- ✅ `POST /api/purchase` が資金不足時に明確なエラーを返す
- ✅ `POST /api/watch` がNFT未所有時に403を返す
- ✅ `GET /api/video` がセッション期限切れ時に401を返す

#### 2. 可観測性・デバッグ
- ✅ 全APIエンドポイントがリクエスト/レスポンスをログ出力
- ✅ トランザクションダイジェストが購入レスポンスに含まれる
- ✅ サーバー起動時に設定情報をログ出力（秘密鍵は伏せ字）

#### 3. 入力検証
- ✅ `POST /api/purchase` がSuiアドレス形式を検証
- ✅ `POST /api/watch` がNFT ID形式を検証（ObjectID）
- ✅ 全エンドポイントが不正入力時に400と明確なメッセージを返す

#### 4. セッション管理
- ✅ `POST /api/watch` が同一ユーザー・NFTの有効セッションを再利用
- ✅ サーバーがアクティブセッション数を追跡（/api/healthで公開）
- ✅ 期限切れセッションが自動削除される（メモリリーク防止）

#### 5. ヘルスチェック拡張
- ✅ `GET /api/health` がSui RPC接続ステータスを返す
- ✅ `GET /api/health` がスポンサーウォレット残高を返す
- ✅ `GET /api/health` がアクティブセッション数を返す

#### 6. テストカバレッジ
- ⚠️ `sponsor.ts` の統合テスト（トランザクション署名）
- ⚠️ `seal.ts` の統合テスト（セッションライフサイクル）
- ⚠️ 入力検証ヘルパーの単体テスト

**注**: 6. テストカバレッジは時間に余裕があれば実装（MVP優先度は低い）

---

## 7. 非機能要件

### 7.1 セキュリティ
- ✅ 秘密鍵は.envで管理（.gitignore必須）
- ✅ Suiアドレス形式検証（インジェクション防止）
- ✅ セッション有効期限強制（30秒）
- ⚠️ CORS設定（本番環境では要設定、MVP時は未設定）

### 7.2 パフォーマンス
- ✅ セッション再利用（同一ユーザー・NFTの重複リクエスト削減）
- ✅ 定期クリーンアップ（60秒ごと）
- ✅ インメモリストレージ（高速アクセス）
- ⚠️ RPC呼び出しキャッシュなし（MVP）

### 7.3 可用性
- ✅ ヘルスチェックエンドポイント
- ✅ 全エラーログ出力
- ⚠️ リトライロジックなし（MVP）
- ⚠️ Rate Limitingなし（MVP）

---

## 8. 制約条件・スコープ外

### 技術的制約
- Sui devnet使用（testnet/mainnetは将来対応）
- インメモリセッションストレージ（永続化なし）
- モック動画URL（実際のWalrus統合は将来対応）
- モックSeal復号（実際の暗号化は将来対応）

### スコープ外（将来実装）
- ❌ 実際のWalrus動画ストリーミング
- ❌ 実際のSeal暗号化/復号
- ❌ 永続的なセッションストレージ（Redis、DB）
- ❌ Rate Limiting
- ❌ 認証/認可（ウォレット署名ベース）
- ❌ トランザクションリトライロジック
- ❌ ガス価格最適化
- ❌ CI/CDパイプライン
- ❌ 本番環境Secrets管理

---

## 9. 次のステップ

この実装計画が承認されたら、以下の順序で実装します：

1. **Phase 1（セットアップ）** から順番に進める
2. **TDDアプローチ**: E2Eテストが既に存在するため、それをゴールとして実装
3. **1フェーズずつ完了**: 各フェーズ完了後にTodoリスト更新
4. **Phase 6（テスト）**: E2E実行して全AC確認

**重要**: 実装中に問題が発生した場合は、すぐにClaude Codeに報告し、計画を調整します。

---

## 10. 参考資料

- **スマートコントラクト**: `contracts/sources/contracts.move`
- **E2Eテスト**: `tests/e2e.spec.ts`
- **既存サーバー**: `app/src/server/server.ts`
- **Sui SDK**: https://sdk.mystenlabs.com/typescript
- **Kiosk SDK**: https://docs.sui.io/standards/kiosk
- **プロジェクト仕様**: `docs/project-spec.md`
- **CLAUDE.md**: MVP開発ガイドライン

---

**作成日**: 2025-01-10
**想定実装時間**: 8時間
**優先度**: 🔴 高（MVP必須機能）

---

## 11. リファクタリング修正計画

### 11.1 共有オブジェクトの正しい取り扱い（Critical）

**問題箇所**: `app/src/server/sponsor.ts:L45-L71`

**現状の問題**:
`kiosk::purchase` と `transfer_policy::confirm_request` はどちらも共有オブジェクト (KIOSK_ID, TRANSFER_POLICY_ID) を引数に取りますが、現状は `tx.object(...)` で「所有オブジェクト」として渡しています。このままでは Sui runtime に reject され、実際のネットワークでは "Shared object used as owned object" エラーが出続けます。

**修正方針**:
1. `.env` の既存環境変数を使用（既に設定済み）:
   ```bash
   KIOSK_INITIAL_SHARED_VERSION=<version>  # ✅ 既存
   TRANSFER_POLICY_INITIAL_SHARED_VERSION=<version>  # 必要に応じて確認
   ```

2. `app/src/server/sponsor.ts` で共有オブジェクト参照を使用:
   ```typescript
   // 修正前（誤り）
   tx.object(KIOSK_ID)
   tx.object(TRANSFER_POLICY_ID)

   // 修正後（正しい）
   tx.sharedObjectRef({
     objectId: KIOSK_ID,
     initialSharedVersion: KIOSK_INITIAL_SHARED_VERSION,
     mutable: true
   })

   tx.sharedObjectRef({
     objectId: TRANSFER_POLICY_ID,
     initialSharedVersion: TRANSFER_POLICY_INITIAL_SHARED_VERSION,
     mutable: true
   })
   ```

**影響範囲**:
- `sponsor.ts` の `sponsorPurchase()` 関数全体
- Kiosk購入トランザクション構築部分（L223-L231）
- Transfer Policy確認部分（L244-L251）

**優先度**: 🔴 Critical（トランザクション実行に必須）

---

### 11.2 kiosk::purchase の listing 引数修正（Critical）

**問題箇所**: `app/src/server/sponsor.ts:L227`

**現状の問題**:
`kiosk::purchase` の第2引数 `id: ID` は純粋値（Move の ID 型）であり、`tx.object(request.nftId)` ではなく `tx.pure.id(request.nftId)` を渡すのが正しい挙動です。現在の実装は「リスティング ID を owned object として取得しようとする」ため `InvalidUsageOfPureArg` の DryRun 失敗を恒常的に誘発します。

**修正方針**:
```typescript
// 修正前（誤り）
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [
    tx.object(KIOSK_ID),
    tx.object(request.nftId),  // ❌ 誤り
    tx.splitCoins(tx.gas, [500_000_000])
  ],
  typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
});

// 修正後（正しい）
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [
    tx.sharedObjectRef({
      objectId: KIOSK_ID,
      initialSharedVersion: KIOSK_INITIAL_SHARED_VERSION,
      mutable: true
    }),
    tx.pure.id(request.nftId),  // ✅ 正しい
    tx.splitCoins(tx.gas, [500_000_000])
  ],
  typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`]
});
```

**影響範囲**:
- `sponsor.ts` の `sponsorPurchase()` 関数
- Kiosk購入トランザクション構築部分（L223-L231）

**優先度**: 🔴 Critical（トランザクション実行に必須）

---

### 11.3 修正作業チェックリスト

#### Phase 11A: 環境変数確認（5分）
- [ ] `.env` の `KIOSK_INITIAL_SHARED_VERSION` が設定済みか確認（✅ 既存）
- [ ] `.env` の `TRANSFER_POLICY_INITIAL_SHARED_VERSION` が設定済みか確認（必要に応じて追加）
- [ ] 環境変数が正しく `sponsor.ts` で読み込まれているか確認

#### Phase 11B: sponsor.ts リファクタリング（30分）
- [ ] 環境変数読み込み処理追加（L182-L187）
- [ ] `sponsorPurchase()` 関数内の Kiosk 参照修正（L223-L231）
  - [ ] `tx.object(KIOSK_ID)` → `tx.sharedObjectRef({...})` に置き換え
  - [ ] `tx.object(request.nftId)` → `tx.pure.id(request.nftId)` に置き換え
- [ ] Transfer Policy 参照修正（L244-L251）
  - [ ] `tx.object(TRANSFER_POLICY_ID)` → `tx.sharedObjectRef({...})` に置き換え

#### Phase 11C: 動作確認（15分）
- [ ] `pnpm run dev:server` でサーバー起動確認
- [ ] `POST /api/purchase` の DryRun 成功確認
- [ ] 実際のトランザクション実行確認（devnet）

**推定修正時間**: 50分

---

### 11.4 参考資料

- **Sui Shared Object 公式ドキュメント**: https://docs.sui.io/concepts/dynamic-fields/shared-objects
- **Sui Transaction Builder API**: https://sdk.mystenlabs.com/typescript/transaction-building
- **Kiosk 標準仕様**: https://docs.sui.io/standards/kiosk

---

**リファクタリング追記日**: 2025-11-13
**修正優先度**: 🔴 Critical（トランザクション実行に必須）
