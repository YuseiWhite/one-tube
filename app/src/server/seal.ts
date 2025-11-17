import { SuiClient } from "@mysten/sui/client";
import crypto from "crypto";
import dotenv from "dotenv";
import type { Session } from "../shared/types.js";
import { NFTNotOwnedError, SessionExpiredError } from "../shared/types.js";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://fullnode.devnet.sui.io:443";
const PACKAGE_ID = process.env.PACKAGE_ID;
const SEAL_SESSION_DURATION = parseInt(
	process.env.SEAL_SESSION_DURATION || "30",
	10,
);
const SEAL_DECRYPTION_KEY =
	process.env.SEAL_DECRYPTION_KEY || "mock-decryption-key-dev";

// 環境変数の検証（明確なエラーメッセージ）
if (!PACKAGE_ID) {
	throw new Error("PACKAGE_ID is not set in environment variables");
}

const client = new SuiClient({ url: RPC_URL });
const sessions = new Map<string, Session>();

export async function verifyNFTOwnership(
	userAddress: string,
	nftId: string,
): Promise<boolean> {
	try {
		console.log(`🔄 Verifying NFT ownership: ${nftId} by ${userAddress}`);

		const ownedObjects = await client.getOwnedObjects({
			owner: userAddress,
			filter: {
				StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`,
			},
			options: { showContent: true },
		});

		// ✅ デバッグログ追加
		console.log(
			`📊 Found ${ownedObjects.data.length} PremiumTicketNFT(s) owned by this address`,
		);
		console.log(
			`📋 Owned NFT IDs:`,
			ownedObjects.data.map((obj) => obj.data?.objectId),
		);
		console.log(`🎯 Looking for NFT ID: ${nftId}`);

		const ownsNFT = ownedObjects.data.some(
			(obj) => obj.data?.objectId === nftId,
		);

		console.log(ownsNFT ? "✅ NFT ownership verified" : "❌ NFT not owned");
		return ownsNFT;
	} catch (error) {
		console.error("❌ Ownership verification failed:", error);
		return false;
	}
}

export async function createSession(
	userAddress: string,
	nftId: string,
	blobId: string,
): Promise<Session> {
	const isOwner = await verifyNFTOwnership(userAddress, nftId);
	if (!isOwner) {
		throw new NFTNotOwnedError(userAddress, nftId);
	}

	const existingSession = findValidSession(userAddress, nftId);
	if (existingSession) {
		console.log(
			"♻️  Reusing existing valid session:",
			existingSession.sessionId,
		);
		return existingSession;
	}

	const now = Date.now();
	const sessionId = generateSessionId(userAddress, nftId);
	const decryptionKey = generateDecryptionKey(nftId);

	const session: Session = {
		sessionId,
		userAddress,
		nftId,
		blobId, // BLOB IDを保存（動画URLは /api/video で解決）
		decryptionKey,
		createdAt: now,
		expiresAt: now + SEAL_SESSION_DURATION * 1000,
	};

	sessions.set(sessionId, session);

	console.log(
		`✅ Session created: ${sessionId} (expires in ${SEAL_SESSION_DURATION}s)`,
	);
	console.log(`📦 Blob ID: ${blobId}`);
	return session;
}

export async function validateSession(
	sessionId: string,
): Promise<Session | null> {
	const session = sessions.get(sessionId);

	if (!session) {
		console.log("❌ Session not found:", sessionId);
		return null;
	}

	if (Date.now() > session.expiresAt) {
		console.log("❌ Session expired:", sessionId);
		sessions.delete(sessionId);
		throw new SessionExpiredError(sessionId);
	}

	console.log("✅ Session valid:", sessionId);
	return session;
}

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

export function getActiveSessionCount(): number {
	return sessions.size;
}

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
	return crypto.createHash("sha256").update(data).digest("hex");
}

function generateDecryptionKey(nftId: string): string {
	return crypto
		.createHmac("sha256", SEAL_DECRYPTION_KEY)
		.update(nftId)
		.digest("hex");
}
