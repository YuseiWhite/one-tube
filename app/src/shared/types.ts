import type { ExportedSessionKey } from "@mysten/seal";

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
	previewUrl?: string; // プレビュー動画URL（誰でも見れる）
	price: number; // MIST単位
	listingId?: string;
}

// ===== Session Types =====
export interface Session {
	sessionId: string;
	userAddress: string;
	nftId: string;
	blobId: string; // NFTのBLOB ID（動画URL取得用）
	sessionKey: ExportedSessionKey; // ExportedSessionKey形式（SessionKey.export()の結果）
	txBytes: string; // 互換性のため残すが、空文字列（txBytesは毎回新しく作成する）
	userKeypairSecretKey?: string; // ユーザーのkeypairの秘密鍵（bech32文字列またはBase64エンコード、復号時にsignerとして使用）
	publicKey?: string; // フロントエンドから受け取った公開鍵（16進数文字列、検証用signer作成用）
	expiresAt: number; // Unix timestamp (ms)
	createdAt: number; // Unix timestamp (ms)
}

// セッションメタ情報（/api/watch のレスポンス用、videoUrl を含まない）
export interface SessionMetadata {
	sessionId: string;
	expiresAt: number; // Unix timestamp (ms)
}

// ===== API Request Types =====
export interface PurchaseRequest {
	userAddress: string;
	nftId: string;
	transactionBytes?: string; // Base64エンコードされたトランザクションデータ（署名前）
	transactionBlockBytes?: string; // Base64エンコードされた署名済みトランザクションデータ
	userSignature?: string; // ユーザーの署名
}

export interface PurchasePrepareResponse {
	success: boolean;
	transactionBytes?: string; // Base64エンコードされたトランザクションデータ
	error?: string;
}

export interface WatchRequest {
	nftId: string;
	userAddress: string;
	sessionKey: ExportedSessionKey; // フロントで作成したExportedSessionKey（必須）
	// blobIdは内部で解決（NFTメタデータから取得）
}

export interface VideoContentRequest {
	sessionId: string;
}

// ===== API Response Types =====
export interface PurchaseResponse {
	success: boolean;
	txDigest?: string;
	error?: string;
}

export interface NFTsResponse {
	success: boolean;
	nfts?: PremiumTicketNFT[];
	error?: string;
}

export interface WatchResponse {
	success: boolean;
	session?: SessionMetadata; // セッションメタ情報のみ（videoUrl を含まない）
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
		this.name = "NFTNotOwnedError";
	}
}

export class SessionExpiredError extends Error {
	constructor(sessionId: string) {
		super(`Session ${sessionId} has expired`);
		this.name = "SessionExpiredError";
	}
}

export class InvalidInputError extends Error {
	constructor(field: string, reason: string) {
		super(`Invalid ${field}: ${reason}`);
		this.name = "InvalidInputError";
	}
}

// ===== Seal統合エラータイプ =====

export class RPCConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RPCConnectionError";
	}
}

export class SessionNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SessionNotFoundError";
	}
}

export class SessionStorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SessionStorageError";
	}
}

export class WalrusConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WalrusConnectionError";
	}
}

export class BlobNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BlobNotFoundError";
	}
}

export class SealDecryptionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SealDecryptionError";
	}
}

export class SealEncryptionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SealEncryptionError";
	}
}

export class SealKeyServerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SealKeyServerError";
	}
}

// ===== HTTPステータスコードマッピング =====

/**
 * エラータイプからHTTPステータスコードを取得
 */
export function getHttpStatusForError(error: Error): number {
	switch (error.name) {
		case "NFTNotOwnedError":
			return 403; // Forbidden
		case "SessionExpiredError":
		case "SessionNotFoundError":
			return 401; // Unauthorized
		case "RPCConnectionError":
		case "WalrusConnectionError":
		case "SealKeyServerError":
			return 502; // Bad Gateway
		case "SessionStorageError":
		case "SealDecryptionError":
		case "SealEncryptionError":
			return 500; // Internal Server Error
		case "BlobNotFoundError":
			return 404; // Not Found
		case "InvalidInputError":
			return 400; // Bad Request
		default:
			return 500; // Internal Server Error
	}
}

// ===== zkLogin Types =====
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
