import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sponsorPurchase, getSponsorBalance } from "./sponsor.js";
import { getKioskListings, getListingInfo } from "./kiosk.js";
import {
	createSession,
	validateSession,
	cleanupExpiredSessions,
	getActiveSessionCount,
} from "./seal.js";
import { getVideoUrl, getSiteIdPrefix } from "./videos.js";
import type {
	PurchaseRequest,
	WatchRequest,
	HealthResponse,
	SessionMetadata,
} from "../shared/types.js";

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json()); // JSON ボディを受けられるようにする

/**
 * GET /api/health
 * サーバーヘルスチェック
 */
app.get("/api/health", async (_req, res) => {
	try {
		const sponsorBalance = await getSponsorBalance();
		const activeSessions = getActiveSessionCount();

		const health: HealthResponse = {
			status: "ok",
			network: process.env.NETWORK || "devnet",
			rpcConnected: true,
			sponsorBalance,
			activeSessions,
			timestamp: Date.now(),
		};

		res.json(health);
	} catch (error) {
		res.status(500).json({
			status: "error",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: Date.now(),
		});
	}
});

/**
 * POST /api/purchase
 * NFT購入（Sponsored Transaction）
 */
app.post("/api/purchase", async (req, res) => {
	try {
		const request: PurchaseRequest = req.body;

		// 入力検証
		if (!request.userAddress || !request.nftId) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: userAddress, nftId",
			});
		}

		// Sui Address形式検証
		if (
			!request.userAddress.startsWith("0x") ||
			request.userAddress.length !== 66
		) {
			return res.status(400).json({
				success: false,
				error: "Invalid Sui address format",
			});
		}

		console.log("📦 Purchase request received:", request);

		const result = await sponsorPurchase(request);

		if (result.success) {
			res.json(result);
		} else {
			res.status(500).json(result);
		}
	} catch (error) {
		console.error("❌ Purchase endpoint error:", error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * POST /api/watch
 * 視聴セッション作成（NFT所有権確認）
 */
app.post("/api/watch", async (req, res) => {
	try {
		const request: WatchRequest = req.body;

		// 入力検証
		if (!request.nftId || !request.userAddress || !request.blobId) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: nftId, userAddress, blobId",
			});
		}

		console.log("🎬 Watch request received:", request);

		const session = await createSession(
			request.userAddress,
			request.nftId,
			request.blobId,
		);

		// BLOB IDからサイトIDプレフィックスを取得
		const siteIdPrefix = getSiteIdPrefix(request.blobId);
		if (!siteIdPrefix) {
			return res.status(500).json({
				success: false,
				error: "Failed to resolve site ID prefix for blobId",
			});
		}

		// セッションURLを構築
		const sessionUrl = `http://${siteIdPrefix}.localhost:3000/api/video?session=${session.sessionId}`;

		// セッションメタ情報のみを返す（videoUrl を含まない）
		const sessionMetadata: SessionMetadata = {
			sessionId: session.sessionId,
			userAddress: session.userAddress,
			nftId: session.nftId,
			decryptionKey: session.decryptionKey,
			sessionUrl,
			expiresAt: session.expiresAt,
			createdAt: session.createdAt,
		};

		res.json({
			success: true,
			session: sessionMetadata,
		});
	} catch (error) {
		console.error("❌ Watch endpoint error:", error);

		// NFT未所有エラー
		if (error instanceof Error && error.name === "NFTNotOwnedError") {
			return res.status(403).json({
				success: false,
				error: error.message,
			});
		}

		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * GET /api/video?session=<sessionId>
 * 動画コンテンツ配信（セッション経由）
 */
app.get("/api/video", async (req, res) => {
	try {
		const sessionId = req.query.session as string;
		const nftId = req.query.nftId as string;

		// NFT ID でリクエストされた場合
		if (nftId) {
			console.log("🎥 Video request received (by NFT ID):", nftId);

			const listing = await getListingInfo(nftId);
			if (!listing) {
				return res.status(404).json({
					success: false,
					error: "NFT not found in listings",
				});
			}

			// プレビュー動画URLを返す（誰でも見れる）
			if (listing.previewUrl) {
				return res.json({
					success: true,
					videoUrl: listing.previewUrl,
					type: "preview",
				});
			}

			// プレビューURLがない場合はエラー
			return res.status(404).json({
				success: false,
				error: "Preview URL not available",
			});
		}

		// セッションIDでリクエストされた場合（Seal復号フロー）
		if (!sessionId) {
			return res.status(400).json({
				success: false,
				error: "Missing session or nftId parameter",
			});
		}

		console.log("🎥 Video request received (by session):", sessionId);

		const session = await validateSession(sessionId);

		if (!session) {
			return res.status(401).json({
				success: false,
				error: "Invalid or expired session",
			});
		}

		// Seal復号キーを使って動画URLを取得（モック実装）
		// 実際の実装では、blobId と decryptionKey を使って復号済みストリームを提供
		const videoUrl =
			getVideoUrl(session.blobId) ||
			process.env.MOCK_VIDEO_URL ||
			"https://example.walrus.site/mock-video.mp4";

		console.log(`🔓 Decrypting video with Seal key for blobId: ${session.blobId}`);
		console.log(`📹 Video URL resolved: ${videoUrl}`);

		// 復号済み動画URL（またはストリーム）を返す
		res.json({
			success: true,
			videoUrl,
			type: "full",
		});
	} catch (error) {
		console.error("❌ Video endpoint error:", error);

		// セッション期限切れ
		if (error instanceof Error && error.name === "SessionExpiredError") {
			return res.status(401).json({
				success: false,
				error: error.message,
			});
		}

		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * GET /api/listings
 * Kiosk出品リスト取得
 */
app.get("/api/listings", async (_req, res) => {
	try {
		const listings = await getKioskListings();
		res.json({ success: true, listings });
	} catch (error) {
		console.error("❌ Listings endpoint error:", error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// ===== 期限切れセッション定期クリーンアップ =====
setInterval(() => {
	cleanupExpiredSessions();
}, 60000); // 1分ごと

// ===== サーバー起動 =====
app.listen(port, () => {
	console.log(`✅ OneTube API Server running on http://localhost:${port}`);
	console.log(`📍 Network: ${process.env.NETWORK || "devnet"}`);
	console.log(`📍 RPC: ${process.env.RPC_URL || "default"}`);
});
