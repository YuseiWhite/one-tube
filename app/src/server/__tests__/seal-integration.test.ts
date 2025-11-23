/**
 * Seal統合テスト
 * NFT所有確認 + セッション作成フロー全体の統合テスト
 *
 * 注意: SealClientの初期化には環境変数が必要なため、
 * セッション管理とPTB構築の部分を中心にテストします。
 */

import {
	describe,
	it,
	expect,
	beforeAll,
	beforeEach,
	afterEach,
	vi,
} from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SESSIONS_FILE = join(__dirname, "../../../data/sessions.json");

// 環境変数を設定（テスト用）
process.env.SEAL_KEY_SERVER_OBJECT_IDS = "0xTEST1,0xTEST2,0xTEST3";
process.env.SEAL_PACKAGE_ID = process.env.PACKAGE_ID || "0xTEST_PACKAGE";
process.env.SEAL_IDENTITY_ID = "01020304";
process.env.SEAL_SESSION_DURATION = "60";
process.env.VERIFY_KEY_SERVERS = "false";
process.env.NETWORK = "devnet";

// SealClientをモック
const mockSealClient = {
	createSessionKey: vi.fn().mockResolvedValue({
		ephemeralPublicKey: "mock-ephemeral-public-key",
		ephemeralSecretKey: "mock-ephemeral-secret-key",
		maxEpoch: 12345,
	}),
	decrypt: vi.fn(),
	encrypt: vi.fn(),
};

// verifyNFTOwnershipとSealClientをモック（統合テストでは実際のRPC呼び出しを避ける）
const mockVerifyNFTOwnership = vi.fn().mockResolvedValue(true);
const mockCreateSessionKey = vi.fn().mockResolvedValue({
	ephemeralPublicKey: "mock-ephemeral-public-key",
	ephemeralSecretKey: "mock-ephemeral-secret-key",
	maxEpoch: 12345,
});

vi.mock("../seal.js", async () => {
	const actual =
		await vi.importActual<typeof import("../seal.js")>("../seal.js");

	return {
		...actual,
		verifyNFTOwnership: mockVerifyNFTOwnership,
		getSealClient: () => mockSealClient,
		initializeSealClient: () => mockSealClient,
		createSessionKey: mockCreateSessionKey,
	};
});

// モック後にインポート
const sealModule = await import("../seal.js");
const {
	buildSealApprovePTB,
	createSession,
	validateSession,
	createSessionKey,
} = sealModule;

describe("Seal Integration Test", () => {
	let userKeypair: Ed25519Keypair;

	beforeAll(() => {
		userKeypair = Ed25519Keypair.generate();
	});

	beforeEach(() => {
		// verifyNFTOwnershipをモック（デフォルトでtrueを返す）
		mockVerifyNFTOwnership.mockClear();
		mockVerifyNFTOwnership.mockResolvedValue(true);
		mockCreateSessionKey.mockClear();
		mockCreateSessionKey.mockResolvedValue({
			ephemeralPublicKey: "mock-ephemeral-public-key",
			ephemeralSecretKey: "mock-ephemeral-secret-key",
			maxEpoch: 12345,
		});

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

	it("should build PTB with seal_approve_nft call", () => {
		// PTB構築のテスト
		const nftId = "0xMOCK_NFT_ID";
		const identityId = process.env.SEAL_IDENTITY_ID || "01020304";
		const packageId =
			process.env.SEAL_PACKAGE_ID || process.env.PACKAGE_ID || "0xPACKAGE";
		const objectRef = {
			objectId: nftId,
			version: "1",
			digest: "mock-digest",
		};
		const tx = buildSealApprovePTB(nftId, identityId, packageId, objectRef);
		expect(tx).toBeDefined();
		expect(tx).toBeInstanceOf(Object);
	});

	it("should complete PTB building and session validation flow", async () => {
		// verifyNFTOwnershipを強制的にtrueを返すように設定
		mockVerifyNFTOwnership.mockResolvedValueOnce(true);

		// 1. SessionKey作成（モック）
		const sessionKey = await createSessionKey(userKeypair);
		expect(sessionKey).toBeDefined();
		expect(sessionKey).toHaveProperty("ephemeralPublicKey");

		// 2. PTB構築
		const nftId = "0xMOCK_NFT_ID";
		const identityId = process.env.SEAL_IDENTITY_ID || "01020304";
		const packageId =
			process.env.SEAL_PACKAGE_ID || process.env.PACKAGE_ID || "0xPACKAGE";
		const userAddress = userKeypair.getPublicKey().toSuiAddress();
		const objectRef = {
			objectId: nftId,
			version: "1",
			digest: "mock-digest",
		};
		const tx = buildSealApprovePTB(nftId, identityId, packageId, objectRef);
		expect(tx).toBeDefined();
		expect(tx).toBeInstanceOf(Object);

		// 3. トランザクションをシリアライズ（モック）
		const txBytes = "0xMOCK_TX_BYTES";

		// 4. セッション作成（verifyNFTOwnershipをモック関数として渡す）

		const session = await createSession(
			userAddress,
			nftId,
			"mock-blob-id",
			sessionKey,
			undefined, // userKeypairSecretKey
			undefined, // publicKey
			mockVerifyNFTOwnership, // モック関数を渡す
			txBytes, // txBytesを渡す
		);

		expect(session.sessionId).toBeDefined();
		expect(session.userAddress).toBe(userAddress);
		expect(session.nftId).toBe(nftId);
		expect(session.blobId).toBe("mock-blob-id");
		expect(session.sessionKey).toBe(sessionKey);
		expect(session.txBytes).toBe(txBytes);

		// 5. セッション検証
		const validated = validateSession(session.sessionId);
		expect(validated.sessionId).toBe(session.sessionId);
		expect(validated.userAddress).toBe(userAddress);
		expect(validated.nftId).toBe(nftId);
	}, 30000); // 30秒タイムアウト

	it("should create session with correct expiration time", async () => {
		// verifyNFTOwnershipを強制的にtrueを返すように設定
		mockVerifyNFTOwnership.mockResolvedValueOnce(true);

		const userAddress = userKeypair.getPublicKey().toSuiAddress();
		const nftId = "0xMOCK_NFT_ID";
		const sessionKey = await createSessionKey(userKeypair);

		const session = await createSession(
			userAddress,
			nftId,
			"mock-blob-id",
			sessionKey,
			undefined, // userKeypairSecretKey
			undefined, // publicKey
			mockVerifyNFTOwnership, // モック関数を渡す
			undefined, // txBytes（このテストでは不要）
		);

		const now = Date.now();
		const sessionDuration = parseInt(
			process.env.SEAL_SESSION_DURATION || "60",
			10,
		);
		const expectedExpiresAt = now + sessionDuration * 1000;

		// 有効期限が適切に設定されていることを確認（±5秒の誤差を許容）
		expect(session.expiresAt).toBeGreaterThan(expectedExpiresAt - 5000);
		expect(session.expiresAt).toBeLessThan(expectedExpiresAt + 5000);
		expect(session.createdAt).toBeLessThanOrEqual(now + 1000);
	}, 30000);
});
