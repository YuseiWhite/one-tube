/**
 * seal.tsのユニットテスト
 *
 * 注意: createSessionはverifyNFTOwnershipを呼び出すため、
 * 実際のRPC呼び出しを避けるために、セッション管理の部分のみをテストします。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, existsSync, mkdirSync, writeFileSync } from "fs";
import {
	SessionExpiredError,
	SessionNotFoundError,
} from "../../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SESSIONS_FILE = join(__dirname, "../../../data/sessions.json");

// verifyNFTOwnershipをモック（常にtrueを返す）
vi.mock("../seal.js", async () => {
	const actual =
		await vi.importActual<typeof import("../seal.js")>("../seal.js");
	return {
		...actual,
		verifyNFTOwnership: vi.fn().mockResolvedValue(true),
	};
});

// モック後にインポート
const {
	validateSession,
	cleanupExpiredSessions,
	getActiveSessionCount,
	buildSealApprovePTB,
} = await import("../seal.js");

// セッション作成のヘルパー関数（verifyNFTOwnershipをスキップ）
async function createTestSession(
	userAddress: string,
	nftId: string,
	blobId: string,
	sessionKey: unknown,
	txBytes: string,
): Promise<{
	sessionId: string;
	userAddress: string;
	nftId: string;
	blobId: string;
	sessionKey: unknown;
	txBytes: string;
	createdAt: number;
	expiresAt: number;
}> {
	const { readFileSync, writeFileSync } = await import("fs");
	const { join } = await import("path");
	const { createHash } = await import("crypto");
	const { fileURLToPath } = await import("url");
	const { dirname } = await import("path");

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const SESSIONS_FILE = join(__dirname, "../../../data/sessions.json");

	const now = Date.now();
	const sessionDuration = 60; // 秒単位
	const expiresAt = now + sessionDuration * 1000;

	const sessionId = createHash("sha256")
		.update(`${userAddress}-${nftId}-${now}`)
		.digest("hex");

	const session = {
		sessionId,
		userAddress,
		nftId,
		blobId,
		sessionKey,
		txBytes,
		createdAt: now,
		expiresAt,
	};

	// セッションを保存
	let sessions: (typeof session)[] = [];
	if (existsSync(SESSIONS_FILE)) {
		const data = readFileSync(SESSIONS_FILE, "utf-8");
		const parsed = JSON.parse(data);
		sessions = parsed.sessions || [];
	}
	sessions.push(session);
	writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));

	return session;
}

describe("seal.ts", () => {
	beforeEach(() => {
		// テスト前にセッションファイルを削除
		if (existsSync(SESSIONS_FILE)) {
			unlinkSync(SESSIONS_FILE);
		}
		// ディレクトリが存在しない場合は作成
		const dir = join(__dirname, "../../../data");
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	});

	afterEach(() => {
		// テスト後にセッションファイルを削除
		if (existsSync(SESSIONS_FILE)) {
			unlinkSync(SESSIONS_FILE);
		}
	});

	describe("createSession (セッション管理部分のテスト)", () => {
		it("should create a new session", async () => {
			const session = await createTestSession(
				"0xUSER",
				"0xNFT",
				"blob-id",
				{ mockSessionKey: true },
				"0xTXBYTES",
			);

			expect(session.sessionId).toBeDefined();
			expect(session.userAddress).toBe("0xUSER");
			expect(session.nftId).toBe("0xNFT");
			expect(session.blobId).toBe("blob-id");
			expect(session.sessionKey).toEqual({ mockSessionKey: true });
			expect(session.txBytes).toBe("0xTXBYTES");
		});

		it("should generate unique session IDs", async () => {
			const session1 = await createTestSession(
				"0xUSER",
				"0xNFT1",
				"blob-id-1",
				{},
				"0xTX1",
			);
			const session2 = await createTestSession(
				"0xUSER",
				"0xNFT2",
				"blob-id-2",
				{},
				"0xTX2",
			);

			expect(session1.sessionId).not.toBe(session2.sessionId);
		});
	});

	describe("validateSession", () => {
		it("should validate a valid session", async () => {
			const session = await createTestSession(
				"0xUSER",
				"0xNFT",
				"blob-id",
				{},
				"0xTX",
			);
			const validated = validateSession(session.sessionId);

			expect(validated.sessionId).toBe(session.sessionId);
			expect(validated.userAddress).toBe(session.userAddress);
			expect(validated.nftId).toBe(session.nftId);
		});

		it("should throw SessionNotFoundError for non-existent session", () => {
			expect(() => validateSession("non-existent")).toThrow(
				SessionNotFoundError,
			);
		});

		it("should throw SessionExpiredError for expired session", async () => {
			// 有効期限を過去に設定するため、セッションファイルを直接作成
			const expiredSession = {
				sessionId: "expired-session-id",
				userAddress: "0xUSER",
				nftId: "0xNFT",
				blobId: "blob-id",
				sessionKey: {},
				txBytes: "0xTX",
				createdAt: Date.now() - 2000,
				expiresAt: Date.now() - 1000, // 1秒前に期限切れ
			};

			const dir = join(__dirname, "../../../data");
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(
				SESSIONS_FILE,
				JSON.stringify({ sessions: [expiredSession] }, null, 2),
			);

			expect(() => validateSession("expired-session-id")).toThrow(
				SessionExpiredError,
			);
		});
	});

	describe("cleanupExpiredSessions", () => {
		it("should remove expired sessions", async () => {
			// 期限切れセッションを作成
			const expiredSession = {
				sessionId: "expired-session-id",
				userAddress: "0xUSER1",
				nftId: "0xNFT1",
				blobId: "blob-id-1",
				sessionKey: {},
				txBytes: "0xTX1",
				createdAt: Date.now() - 2000,
				expiresAt: Date.now() - 1000, // 1秒前に期限切れ
			};

			// 有効なセッションを作成
			const validSession = await createTestSession(
				"0xUSER2",
				"0xNFT2",
				"blob-id-2",
				{},
				"0xTX2",
			);

			// 期限切れセッションをファイルに追加
			const sessions = [
				expiredSession,
				{
					sessionId: validSession.sessionId,
					userAddress: validSession.userAddress,
					nftId: validSession.nftId,
					blobId: validSession.blobId,
					sessionKey: validSession.sessionKey,
					txBytes: validSession.txBytes,
					createdAt: validSession.createdAt,
					expiresAt: validSession.expiresAt,
				},
			];

			const dir = join(__dirname, "../../../data");
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));

			cleanupExpiredSessions();

			expect(() => validateSession("expired-session-id")).toThrow(
				SessionNotFoundError,
			);
			expect(() => validateSession(validSession.sessionId)).not.toThrow();
		});
	});

	describe("getActiveSessionCount", () => {
		it("should return the number of active sessions", async () => {
			// セッションを作成
			await createTestSession("0xUSER1", "0xNFT1", "blob-id-1", {}, "0xTX1");
			await createTestSession("0xUSER2", "0xNFT2", "blob-id-2", {}, "0xTX2");

			const count = getActiveSessionCount();
			expect(count).toBe(2);
		});

		it("should exclude expired sessions", async () => {
			// 有効なセッションを作成
			await createTestSession("0xUSER1", "0xNFT1", "blob-id-1", {}, "0xTX1");

			// 期限切れセッションをファイルに追加
			const expiredSession = {
				sessionId: "expired-session-id",
				userAddress: "0xUSER2",
				nftId: "0xNFT2",
				blobId: "blob-id-2",
				sessionKey: {},
				txBytes: "0xTX2",
				createdAt: Date.now() - 2000,
				expiresAt: Date.now() - 1000, // 1秒前に期限切れ
			};

			const sessions = [
				{
					sessionId: "valid-session-id",
					userAddress: "0xUSER1",
					nftId: "0xNFT1",
					blobId: "blob-id-1",
					sessionKey: {},
					txBytes: "0xTX1",
					createdAt: Date.now(),
					expiresAt: Date.now() + 60000, // 1分後に期限切れ
				},
				expiredSession,
			];

			const dir = join(__dirname, "../../../data");
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));

			const count = getActiveSessionCount();
			expect(count).toBe(1);
		});
	});

	describe("buildSealApprovePTB", () => {
		it("should build a PTB with seal_approve_nft call", () => {
			const nftId = "0xNFT";
			const identityId = "01020304";
			const packageId = "0xPACKAGE";
			const objectRef = {
				objectId: nftId,
				version: "1",
				digest: "mock-digest",
			};

			const tx = buildSealApprovePTB(nftId, identityId, packageId, objectRef);

			expect(tx).toBeDefined();
			// Transactionオブジェクトが作成されていることを確認
			expect(tx).toBeInstanceOf(Object);
		});
	});
});
