import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5174;

// Middleware
app.use(cors()); // CORS を許可（開発用）
app.use(express.json()); // JSON ボディを受けられるようにする

// Health check endpoint
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok" });
});

// Watch endpoint - returns mock session token and video URL
app.post("/api/watch", (_req, res) => {
	try {
		// Issue #11: セッション期限を30秒に設定
		const expiresInSec = Number(process.env.SEAL_SESSION_DURATION ?? 30);
		res.json({
			success: true,
			sessionToken: "mock-token",
			videoUrl: "https://example.com/mock.mp4",
			expiresInSec,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		res.status(500).json({ success: false, message });
	}
});

// Purchase endpoint - returns mock transaction digest
app.post("/api/purchase", (req, res) => {
	try {
		// Content-Type を設定
		res.setHeader("Content-Type", "application/json; charset=utf-8");

		// listingId のバリデーション
		const { listingId } = req.body;
		if (!listingId || typeof listingId !== "string") {
			return res.status(500).json({
				success: false,
				message: "listingId is required and must be a string",
			});
		}

		// 成功レスポンス
		res.json({
			success: true,
			txDigest: "0xmock_tx_digest",
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		res.status(500).json({ success: false, message });
	}
});

// Default route
app.get("/", (_req, res) => {
	res.json({ message: "OneTube API Server" });
});

app.listen(PORT, () => {
	console.log(`✅ API server running on http://localhost:${PORT}`);
	console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
