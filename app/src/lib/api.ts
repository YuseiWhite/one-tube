// API Response Types
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

/**
 * Watch API - Request a video session token
 */
export async function watch(videoId: string): Promise<WatchResponse> {
	try {
		const response = await fetch("/api/watch", {
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
		const response = await fetch("/api/purchase", {
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

