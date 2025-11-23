import { SealClient, SessionKey, type ExportedSessionKey } from "@mysten/seal";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import crypto from "node:crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { Session } from "../shared/types.js";
import {
	NFTNotOwnedError,
	SessionExpiredError,
	SessionNotFoundError,
	SessionStorageError,
} from "../shared/types.js";
import { logSessionKey, logInfo } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const RPC_URL = process.env.RPC_URL || "https://fullnode.devnet.sui.io:443";
export const PACKAGE_ID = process.env.PACKAGE_ID;
// SEAL_PACKAGE_ID and SEAL_IDENTITY_ID are used in server.ts
// They are exported for use in other modules
export const SEAL_PACKAGE_ID = process.env.SEAL_PACKAGE_ID || PACKAGE_ID || "";
export const SEAL_IDENTITY_ID = process.env.SEAL_IDENTITY_ID || "";
const SEAL_SESSION_DURATION = parseInt(
	process.env.SEAL_SESSION_DURATION || "300",
	10,
);

if (!PACKAGE_ID) {
	throw new Error("Missing PACKAGE_ID in environment");
}

const client = new SuiClient({ url: RPC_URL });

// セッションファイルのパス
const SESSIONS_FILE = join(__dirname, "../../data/sessions.json");

// ====== SealClient初期化 ======

let sealClient: SealClient | null = null;

/**
 * SealClientを初期化
 */
export function initializeSealClient(): SealClient {
	if (sealClient) {
		return sealClient;
	}

	const keyServerObjectIds =
		process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(",").filter(Boolean) || [];
	const verifyKeyServers = process.env.VERIFY_KEY_SERVERS === "true";
	const network = (process.env.NETWORK || "devnet") as
		| "mainnet"
		| "testnet"
		| "devnet"
		| "localnet";

	if (keyServerObjectIds.length === 0) {
		throw new Error(
			"SEAL_KEY_SERVER_OBJECT_IDS is not set. " +
				"Please set SEAL_KEY_SERVER_OBJECT_IDS in .env file (comma-separated object IDs).",
		);
	}

	const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

	// SealClientのコンストラクタは`serverConfigs: KeyServerConfig[]`を期待します
	// 各key serverのobject IDとweightを設定します
	const serverConfigs = keyServerObjectIds.map((objectId) => ({
		objectId: objectId.trim(),
		weight: 1, // デフォルトのweightは1
	}));

	// @ts-ignore - SealClient API may vary by version
	const client = new (SealClient as any)({
		suiClient,
		serverConfigs,
		verifyKeyServers,
	});
	sealClient = client as SealClient;

	return sealClient;
}

/**
 * SealClientインスタンスを取得
 */
export function getSealClient(): SealClient {
	if (!sealClient) {
		return initializeSealClient();
	}
	return sealClient;
}

// ====== SessionKey作成とPTB構築 ======

/**
 * SessionKeyを作成する
 * @param userKeypair - ユーザーのEd25519Keypair
 * @returns Seal SessionKeyオブジェクト
 */
export async function createSessionKey(
	userKeypair: Ed25519Keypair,
): Promise<ExportedSessionKey> {
	const sessionDuration = SEAL_SESSION_DURATION; // 秒単位

	const network = (process.env.NETWORK || "devnet") as
		| "mainnet"
		| "testnet"
		| "devnet"
		| "localnet";

	// SessionKey.create用のSuiClient（SealClientではない）
	const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

	if (!SEAL_PACKAGE_ID) {
		throw new Error("SEAL_PACKAGE_ID must be set");
	}

	// userKeypairからSuiアドレスを取得
	const address = userKeypair.getPublicKey().toSuiAddress();

	// 公式APIに沿ったSessionKey.create呼び出し
	const sessionKey = await SessionKey.create({
		address,
		packageId: SEAL_PACKAGE_ID,
		suiClient,
		ttlMin: Math.max(1, Math.floor(sessionDuration / 60)), // 分単位に変換
		signer: userKeypair, // サーバ側で署名するなら渡しておく（任意）
	});

	// 公式サンプルに従い、export()してExportedSessionKey形式で返す
	const exportedSessionKey = sessionKey.export();
	logSessionKey(sessionKey);
	return exportedSessionKey;
}

/**
 * seal_approve_nftを呼び出すPTBを構築する（objectRefを使用）
 * @param nftId - NFTオブジェクトID
 * @param identityId - Seal identity ID（hex形式、package IDのprefixなし）
 * @param packageId - seal_approve_nft関数を含むMoveパッケージID
 * @param objectRef - 完全なオブジェクト参照（objectId, version, digest）
 * @returns Transactionオブジェクト
 */
export function buildSealApprovePTB(
	_nftId: string, // 将来の使用のため保持（現在はobjectRef.objectIdを使用）
	identityId: string,
	packageId: string,
	objectRef: { objectId: string; version: string; digest: string },
): Transaction {
	const tx = new Transaction();
	// onlyTransactionKind: trueの場合、setSenderは無効（SessionKeyのaddressが使われる）

	// seal_approve_nft関数を呼び出す
	// objectRefを使用して完全なオブジェクト参照を渡す（フルノードの視界差を回避）
	tx.moveCall({
		target: `${packageId}::contracts::seal_approve_nft`,
		arguments: [
			tx.pure.vector("u8", Buffer.from(identityId, "hex")),
			tx.objectRef(objectRef), // 完全なオブジェクト参照を使用
		],
	});

	return tx;
}

export async function verifyNFTOwnership(
	userAddress: string,
	nftId: string,
): Promise<boolean> {
	try {
		logInfo("Verifying NFT ownership", { nftId, userAddress });

		const ownedObjects = await client.getOwnedObjects({
			owner: userAddress,
			filter: {
				StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`,
			},
			options: { showContent: true },
		});

		logInfo("NFT ownership check", {
			userAddress,
			nftId,
			ownedCount: ownedObjects.data.length,
			ownedNFTIds: ownedObjects.data.map((obj) => obj.data?.objectId),
		});

		const ownsNFT = ownedObjects.data.some(
			(obj) => obj.data?.objectId === nftId,
		);

		if (ownsNFT) {
			logInfo("NFT ownership verified", { nftId, userAddress });
		} else {
			logInfo("NFT ownership verification failed", { nftId, userAddress });
		}
		return ownsNFT;
	} catch (error) {
		logInfo("Ownership verification error", {
			nftId,
			userAddress,
			error: error instanceof Error ? error.message : String(error),
		});
		return false;
	}
}

// ====== セッション永続化（JSONファイル管理） ======

/**
 * セッションファイルを読み込む
 */
function loadSessions(): Session[] {
	try {
		if (!existsSync(SESSIONS_FILE)) {
			// ディレクトリが存在しない場合は作成
			const dir = join(__dirname, "../../data");
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			return [];
		}
		const data = readFileSync(SESSIONS_FILE, "utf-8");
		const parsed = JSON.parse(data);
		return parsed.sessions || [];
	} catch (error) {
		throw new SessionStorageError(`Failed to load sessions: ${error}`);
	}
}

/**
 * セッションファイルに保存する
 */
function saveSessions(sessions: Session[]): void {
	try {
		const dir = join(__dirname, "../../data");
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		// ExportedSessionKeyをシリアライズ可能な形式に変換
		const serializableSessions = sessions.map((session) => ({
			...session,
			sessionKey: {
				address: String(session.sessionKey.address),
				packageId: String(session.sessionKey.packageId),
				mvrName: session.sessionKey.mvrName
					? String(session.sessionKey.mvrName)
					: undefined,
				creationTimeMs: Number(session.sessionKey.creationTimeMs),
				ttlMin: Number(session.sessionKey.ttlMin),
				personalMessageSignature: session.sessionKey.personalMessageSignature
					? String(session.sessionKey.personalMessageSignature)
					: undefined,
				sessionKey: String(session.sessionKey.sessionKey), // bech32文字列
			},
		}));
		writeFileSync(
			SESSIONS_FILE,
			JSON.stringify({ sessions: serializableSessions }, null, 2),
		);
	} catch (error) {
		throw new SessionStorageError(`Failed to save sessions: ${error}`);
	}
}

/**
 * セッションを作成する
 * @param verifyOwnership - NFT所有確認関数（テスト用にオプショナル）
 * @param txBytes - トランザクションバイト（テスト用にオプショナル、通常は空文字列）
 */
export async function createSession(
	userAddress: string,
	nftId: string,
	blobId: string,
	exportedSessionKey: ExportedSessionKey,
	userKeypairSecretKey: string | undefined,
	publicKey?: string, // フロントエンドから受け取った公開鍵（16進数文字列、検証用signer作成用）
	verifyOwnership?: (userAddress: string, nftId: string) => Promise<boolean>,
	txBytes?: string, // トランザクションバイト（テスト用、通常は空文字列）
): Promise<Session> {
	const ownershipVerifier = verifyOwnership || verifyNFTOwnership;
	const isOwner = await ownershipVerifier(userAddress, nftId);
	if (!isOwner) {
		throw new NFTNotOwnedError(userAddress, nftId);
	}

	const existingSession = findValidSession(userAddress, nftId);
	if (existingSession) {
		logInfo("Reusing existing valid session", {
			sessionId: existingSession.sessionId,
		});
		return existingSession;
	}

	const now = Date.now();
	const sessionDuration = SEAL_SESSION_DURATION; // 秒単位
	const expiresAt = now + sessionDuration * 1000; // ミリ秒単位

	// セッションIDを生成（SHA-256ハッシュ）
	const sessionId = crypto
		.createHash("sha256")
		.update(`${userAddress}-${nftId}-${now}`)
		.digest("hex");

	const session: Session = {
		sessionId,
		userAddress,
		nftId,
		blobId,
		sessionKey: exportedSessionKey, // ExportedSessionKey形式で保存
		txBytes: txBytes || "", // txBytesは通常保存しない（毎回新しく作成する）、テスト用にオプショナル
		userKeypairSecretKey,
		publicKey, // フロントエンドから受け取った公開鍵（検証用signer作成用）
		createdAt: now,
		expiresAt,
	};

	// セッションを保存
	const sessions = loadSessions();
	sessions.push(session);
	saveSessions(sessions);

	logInfo("Session created", { sessionId, userAddress, nftId });
	return session;
}

/**
 * セッションを検証する
 */
export function validateSession(sessionId: string): Session {
	const sessions = loadSessions();
	const session = sessions.find((s) => s.sessionId === sessionId);

	if (!session) {
		throw new SessionNotFoundError(`Session ${sessionId} not found`);
	}

	const now = Date.now();
	if (now > session.expiresAt) {
		// 期限切れセッションを削除
		const filtered = sessions.filter((s) => s.sessionId !== sessionId);
		saveSessions(filtered);
		throw new SessionExpiredError(`Session ${sessionId} expired`);
	}

	return session;
}

/**
 * 期限切れセッションをクリーンアップする
 */
export function cleanupExpiredSessions(): void {
	const sessions = loadSessions();
	const now = Date.now();
	const filtered = sessions.filter((s) => s.expiresAt > now);

	const removed = sessions.length - filtered.length;
	if (removed > 0) {
		saveSessions(filtered);
		logInfo(`Cleaned up ${removed} expired sessions`);
	}
}

/**
 * アクティブなセッション数を取得
 */
export function getActiveSessionCount(): number {
	const sessions = loadSessions();
	const now = Date.now();
	return sessions.filter((s) => s.expiresAt > now).length;
}

/**
 * 有効なセッションを検索
 */
function findValidSession(userAddress: string, nftId: string): Session | null {
	const sessions = loadSessions();
	const now = Date.now();

	for (const session of sessions) {
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
