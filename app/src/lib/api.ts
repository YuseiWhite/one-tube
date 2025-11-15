import type {
	HealthResponse,
	PurchaseRequest,
	PurchaseResponse,
	Video,
	VideoContentResponse,
	WatchRequest,
	WatchResponse,
} from "../shared/types";

// Viteのプロキシを通すため、相対パスを使用
const API_BASE_URL = "/api";

export async function purchaseNFT(
	request: PurchaseRequest,
): Promise<PurchaseResponse> {
	const response = await fetch(`${API_BASE_URL}/purchase`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	return response.json();
}

export async function createWatchSession(
	request: WatchRequest,
): Promise<WatchResponse> {
	const response = await fetch(`${API_BASE_URL}/watch`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	return response.json();
}

export async function getVideoContent(
	sessionId: string,
): Promise<VideoContentResponse> {
	const response = await fetch(`${API_BASE_URL}/video?session=${sessionId}`);
	return response.json();
}

export async function getListings(): Promise<Video[]> {
	const response = await fetch(`${API_BASE_URL}/listings`);
	const data = await response.json();
	return data.listings || [];
}

export async function checkHealth(): Promise<HealthResponse> {
	const response = await fetch(`${API_BASE_URL}/health`);
	return response.json();
}