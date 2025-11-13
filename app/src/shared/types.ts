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
	videoUrl: string; // Walrus動画URL
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
	blobId: string; // NFTのBLOB ID（動画URL取得用）
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
