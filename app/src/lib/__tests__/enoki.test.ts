/**
 * Enoki SDK ユニットテスト
 * 
 * Enoki SDKの基本機能とenoki.tsの関数をテスト
 * モックを使用したユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// @mysten/enokiのモック（ホイスティングされるため、モックオブジェクトをモック内で作成）
vi.mock("@mysten/enoki", () => {
	// モックオブジェクトをモック内で作成
	const mockMethods = {
		createAuthorizationURL: vi.fn(),
		handleAuthCallback: vi.fn(),
		getSession: vi.fn(),
		$zkLoginState: {
			get: vi.fn(),
		},
		getKeypair: vi.fn(),
		getProof: vi.fn(),
		logout: vi.fn(),
	};

	class MockEnokiFlow {
		apiKey: string;
		createAuthorizationURL = mockMethods.createAuthorizationURL;
		handleAuthCallback = mockMethods.handleAuthCallback;
		getSession = mockMethods.getSession;
		$zkLoginState = mockMethods.$zkLoginState;
		getKeypair = mockMethods.getKeypair;
		getProof = mockMethods.getProof;
		logout = mockMethods.logout;

		constructor(config: { apiKey: string }) {
			this.apiKey = config.apiKey;
		}
	}

	return {
		EnokiFlow: MockEnokiFlow,
		// テストで使用するために、モックメソッドをエクスポート
		__mockEnokiFlowMethods: mockMethods,
	};
});

import { EnokiFlow } from "@mysten/enoki";
import * as enokiModule from "../enoki";

// モックメソッドを取得するヘルパー関数
async function getMockEnokiFlow() {
	// vi.mock()で定義されたモックモジュールから直接取得
	const mockModule = await import("@mysten/enoki");
	return (mockModule as any).__mockEnokiFlowMethods;
}

describe("Enoki SDK ユニットテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// window.locationをモック
		Object.defineProperty(window, "location", {
			writable: true,
			value: {
				hash: "",
				href: "http://localhost:3000",
				origin: "http://localhost:3000",
				pathname: "/",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Enoki SDK基本機能テスト
	// ============================================================================

	describe("Enoki SDK基本機能", () => {
		describe("EnokiFlow初期化", () => {
			it("API KeyでEnokiFlowを初期化できる", () => {
				const apiKey = "test-api-key";
				const enokiFlow = new EnokiFlow({ apiKey });

				expect(enokiFlow).toBeDefined();
				// apiKeyは内部プロパティのため、直接アクセスしない
			});

			it("API Keyが空文字列でも初期化できる", () => {
				const enokiFlow = new EnokiFlow({ apiKey: "" });

				expect(enokiFlow).toBeDefined();
			});
		});

		describe("セッション管理", () => {
			it("セッションを取得できる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockSession = {
					ephemeralKeyPair: "test-key-pair",
					maxEpoch: 50,
					randomness: "123456789",
					jwt: "test-jwt",
				};

				vi.mocked(enokiFlow.getSession).mockResolvedValue(mockSession as any);

				const session = await enokiFlow.getSession();

				expect(session).toEqual(mockSession);
				expect(enokiFlow.getSession).toHaveBeenCalledTimes(1);
			});

			it("セッションが存在しない場合はnullを返す", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });

				vi.mocked(enokiFlow.getSession).mockResolvedValue(null as any);

				const session = await enokiFlow.getSession();

				expect(session).toBeNull();
			});
		});

		describe("zkLoginState", () => {
			it("zkLoginStateからアドレスを取得できる", () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockState = {
					address: "0x1234567890abcdef",
					salt: "test-salt",
					publicKey: "test-public-key",
				};

				vi.mocked(enokiFlow.$zkLoginState.get).mockReturnValue(mockState as any);

				const state = enokiFlow.$zkLoginState.get();

				expect(state).toEqual(mockState);
				expect(state.address).toBe("0x1234567890abcdef");
			});

			it("zkLoginStateが空の場合は空オブジェクトを返す", () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });

				vi.mocked(enokiFlow.$zkLoginState.get).mockReturnValue({} as any);

				const state = enokiFlow.$zkLoginState.get();

				expect(state).toEqual({});
				expect(state.address).toBeUndefined();
			});
		});

		describe("OAuth URL生成", () => {
			it("Google OAuth URLを生成できる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=http://localhost:3000";

				vi.mocked(enokiFlow.createAuthorizationURL).mockResolvedValue(mockAuthUrl);

				const authUrl = await enokiFlow.createAuthorizationURL({
					provider: "google",
					clientId: "test-client-id",
					redirectUrl: "http://localhost:3000",
					network: "devnet",
				});

				expect(authUrl).toBe(mockAuthUrl);
				expect(enokiFlow.createAuthorizationURL).toHaveBeenCalledWith({
					provider: "google",
					clientId: "test-client-id",
					redirectUrl: "http://localhost:3000",
					network: "devnet",
				});
			});
		});

		describe("OAuthコールバック処理", () => {
			it("OAuthコールバックを処理してアドレスを取得できる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockAddress = "0x1234567890abcdef";
				const hash = "#id_token=test-token";

				vi.mocked(enokiFlow.handleAuthCallback).mockResolvedValue(mockAddress as any);

				const address = await enokiFlow.handleAuthCallback(hash);

				expect(address).toBe(mockAddress);
				expect(enokiFlow.handleAuthCallback).toHaveBeenCalledWith(hash);
			});

			it("無効なhashの場合はエラーを返す", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });

				vi.mocked(enokiFlow.handleAuthCallback).mockRejectedValue(new Error("Invalid hash"));

				await expect(enokiFlow.handleAuthCallback("")).rejects.toThrow("Invalid hash");
			});
		});

		describe("zk proof取得", () => {
			it("zk proofを取得できる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockProof = {
					proof: "test-proof",
					epoch: 50,
				};

				vi.mocked(enokiFlow.getProof).mockResolvedValue(mockProof as any);

				const proof = await enokiFlow.getProof({ network: "devnet" });

				expect(proof).toEqual(mockProof);
				expect(enokiFlow.getProof).toHaveBeenCalledWith({ network: "devnet" });
			});

			it("zk proofが存在しない場合はエラーを返す", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });

				vi.mocked(enokiFlow.getProof).mockRejectedValue(new Error("Proof not found"));

				await expect(enokiFlow.getProof({ network: "devnet" })).rejects.toThrow("Proof not found");
			});
		});

		describe("Keypair取得", () => {
			it("Keypairを取得できる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });
				const mockKeypair = {
					getPublicKey: vi.fn().mockReturnValue({
						toSuiAddress: vi.fn().mockReturnValue("0x1234567890abcdef"),
					}),
				};

				vi.mocked(enokiFlow.getKeypair).mockResolvedValue(mockKeypair as any);

				const keypair = await enokiFlow.getKeypair({ network: "devnet" });

				expect(keypair).toBeDefined();
				expect(enokiFlow.getKeypair).toHaveBeenCalledWith({ network: "devnet" });
			});
		});

		describe("ログアウト", () => {
			it("ログアウトできる", async () => {
				const enokiFlow = new EnokiFlow({ apiKey: "test-api-key" });

				vi.mocked(enokiFlow.logout).mockResolvedValue(undefined);

				await enokiFlow.logout();

				expect(enokiFlow.logout).toHaveBeenCalledTimes(1);
			});
		});
	});

	// ============================================================================
	// enoki.ts関数テスト
	// ============================================================================

	describe("enoki.ts関数", () => {
		describe("loginWithGoogle", () => {
			it("Google OAuth URLを生成してリダイレクトする", async () => {
				const mockAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test";
				const mockEnokiFlow = await getMockEnokiFlow();
				vi.mocked(mockEnokiFlow.createAuthorizationURL).mockResolvedValue(mockAuthUrl);
				
				// window.location.hrefをモック
				const originalHref = window.location.href;
				Object.defineProperty(window, "location", {
					writable: true,
					value: {
						...window.location,
						href: "http://localhost:3000",
						origin: "http://localhost:3000",
					},
				});

				await enokiModule.loginWithGoogle();

				expect(mockEnokiFlow.createAuthorizationURL).toHaveBeenCalled();
				
				// リセット
				Object.defineProperty(window, "location", {
					writable: true,
					value: { ...window.location, href: originalHref },
				});
			});
		});

		describe("handleAuthCallback", () => {
			it("OAuthコールバックを処理してアドレスを返す", async () => {
				const mockAddress = "0x1234567890abcdef";
				const hash = "#id_token=test-token";
				const mockEnokiFlow = await getMockEnokiFlow();
				
				Object.defineProperty(window, "location", {
					writable: true,
					value: {
						...window.location,
						hash: hash,
						pathname: "/",
					},
				});
				
				// window.history.replaceStateをモック
				window.history.replaceState = vi.fn();
				
				vi.mocked(mockEnokiFlow.handleAuthCallback).mockResolvedValue({} as any);
				vi.mocked(mockEnokiFlow.$zkLoginState.get).mockReturnValue({
					address: mockAddress,
				} as any);

				const address = await enokiModule.handleAuthCallback();

				expect(address).toBe(mockAddress);
				expect(mockEnokiFlow.handleAuthCallback).toHaveBeenCalledWith(hash);
			});

			it("hashが存在しない場合はnullを返す", async () => {
				Object.defineProperty(window, "location", {
					writable: true,
					value: {
						...window.location,
						hash: "",
					},
				});

				const address = await enokiModule.handleAuthCallback();

				expect(address).toBeNull();
			});

			it("id_tokenが存在しない場合はnullを返す", async () => {
				Object.defineProperty(window, "location", {
					writable: true,
					value: {
						...window.location,
						hash: "#other_param=value",
					},
				});

				const address = await enokiModule.handleAuthCallback();

				expect(address).toBeNull();
			});
		});

		describe("getZkLoginAddress", () => {
			it("zkLoginStateからアドレスを取得できる", async () => {
				const mockAddress = "0x1234567890abcdef";
				const mockEnokiFlow = await getMockEnokiFlow();

				vi.mocked(mockEnokiFlow.$zkLoginState.get).mockReturnValue({
					address: mockAddress,
				} as any);

				const address = await enokiModule.getZkLoginAddress();

				expect(address).toBe(mockAddress);
			});

			it("アドレスが存在しない場合はnullを返す", async () => {
				const mockEnokiFlow = await getMockEnokiFlow();
				vi.mocked(mockEnokiFlow.$zkLoginState.get).mockReturnValue({} as any);

				const address = await enokiModule.getZkLoginAddress();

				expect(address).toBeNull();
			});
		});

		// signTransactionWithEnokiは現在コメントアウトされているため、テストもスキップ
		// 将来的にzkLoginアカウントでトランザクションを実行する際に必要になります
		// describe("signTransactionWithEnoki", () => {
		// 	it("トランザクションに署名できる", async () => {
		// 		// 実装は将来のissueで対応
		// 	});
		// });

		describe("clearEnokiAccount", () => {
			it("SessionStorageからEnokiアカウント情報をクリアできる", () => {
				sessionStorage.setItem("enoki.account", JSON.stringify({ test: "data" }));

				enokiModule.clearEnokiAccount();

				expect(sessionStorage.getItem("enoki.account")).toBeNull();
			});
		});

		describe("verifyZkProof", () => {
			it("zk proofを検証できる", async () => {
				const mockProof = {
					proof: "test-proof",
					epoch: 50,
				};
				const mockEnokiFlow = await getMockEnokiFlow();
				
				vi.mocked(mockEnokiFlow.getProof).mockResolvedValue(mockProof as any);

				await enokiModule.verifyZkProof();

				expect(mockEnokiFlow.getProof).toHaveBeenCalled();
			});

			it("zk proofが取得できない場合は警告を出力する", async () => {
				const mockEnokiFlow = await getMockEnokiFlow();
				
				vi.mocked(mockEnokiFlow.getProof).mockResolvedValue(null as any);

				await enokiModule.verifyZkProof();

				expect(mockEnokiFlow.getProof).toHaveBeenCalled();
			});

			it("zk proof取得エラーの場合はエラーをスローする", async () => {
				const mockEnokiFlow = await getMockEnokiFlow();
				
				vi.mocked(mockEnokiFlow.getProof).mockRejectedValue(new Error("Proof error"));

				await expect(enokiModule.verifyZkProof()).rejects.toThrow("Proof error");
			});
		});
	});
});
