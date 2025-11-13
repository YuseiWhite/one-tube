// API Base URL - 環境変数で切り替え可能
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ===== Legacy Mock API Types =====
export interface WatchResponse {
	success: boolean;
	sessionToken?: string;
	videoUrl?: string;
	expiresInSec?: number;
	message?: string;
}

export interface PurchaseResponse {
	success: boolean;
	txDigest?: string;
	message?: string;
}

// ===== New Backend API Types (Issue #009) =====
export interface Health {
	status: "ok";
	sponsorBalance?: string;
	activeSessions?: number;
	rpc?: "ok" | "down";
}

export interface Listing {
	listingId: string;
	objectId: string;
	price: number;
}

/**
 * Watch API - Request a video session token
 */
export async function watch(videoId: string): Promise<WatchResponse> {
	try {
		const response = await fetch(API_BASE + "/api/watch", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ videoId }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				message: errorData.message || `HTTP error: ${response.status}`,
			};
		}

		const data = await response.json();
		return data;
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Purchase API - Purchase a video listing
 */
export async function purchase(listingId: string): Promise<PurchaseResponse> {
	try {
		const response = await fetch(API_BASE + "/api/purchase", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ listingId }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				message: errorData.message || `HTTP error: ${response.status}`,
			};
		}

		const data = await response.json();
		return data;
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// ===== New Backend API Functions (Issue #009) =====

/**
 * Health Check API - Get server health status
 */
export async function getHealth(): Promise<Health> {
	const r = await fetch(API_BASE + "/api/health");
	return r.json();
}

/**
 * Listings API - Get available video listings
 */
export async function getListings(): Promise<Listing[]> {
	const r = await fetch(API_BASE + "/api/listings");
	if (!r.ok) throw new Error("HTTP " + r.status);
	return r.json();
}

/**
 * Create Watch Session - Request a session token for video playback
 */
export async function createWatchSession(videoId: string) {
	const r = await fetch(API_BASE + "/api/watch", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ videoId }),
	});
	return r.json();
}

/**
 * Get Video URL - Retrieve the video streaming URL with session token
 */
export async function getVideoUrl(videoId: string, sessionToken: string) {
	const url = new URL(API_BASE + "/api/video", window.location.origin);
	url.searchParams.set("videoId", videoId);
	url.searchParams.set("sessionToken", sessionToken);
	const r = await fetch(url.toString());
	return r.json();
}

// ===== Switchable Purchase Wrapper =====
// 将来: VITE_API_BASE_URL が設定されたら本APIに差し替える予定の集約ポイント
// 現在: モック購入API purchase(listingId) をそのまま使用
export async function purchaseSmart(listingId: string) {
	// TODO: 切替時のイメージ
	// if (import.meta.env.VITE_API_BASE_URL) {
	//   // 例: 本APIが Listing → Sponsor Purchase の形に揃ったらこちらへ
	//   // return purchaseNFT({ listingId, userAddress: ... })
	// }
	return purchase(listingId);
}
