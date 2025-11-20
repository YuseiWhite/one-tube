/**
 * Enoki SDK 統合テスト
 * 
 * 実際のEnoki APIを呼び出すテスト（モックなし）
 * 
 * 注意: これらのテストは実際のEnoki APIを呼び出すため、
 * 環境変数（VITE_ENOKI_API_KEY）が設定されている必要があります
 */

import { describe, it, expect, beforeEach } from "vitest";
import { EnokiFlow } from "@mysten/enoki";
import config from "../../config.json";

// 環境変数の取得
const getEnvVar = (key: string): string => {
	return (import.meta as any).env?.[key] || "";
};

describe("Enoki SDK 統合テスト", () => {
	const apiKey = getEnvVar("VITE_ENOKI_API_KEY");
	const network = (getEnvVar("VITE_ENOKI_NETWORK") as "devnet" | "testnet") || "devnet";
	const clientId = config.CLIENT_ID_GOOGLE;

	beforeEach(() => {
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

	describe("設定確認", () => {
		it("環境変数が設定されている", () => {
			expect(apiKey).toBeTruthy();
			expect(clientId).toBeTruthy();
		});
	});

	describe("EnokiFlow初期化", () => {
		it("API KeyでEnokiFlowを初期化できる", () => {
			if (!apiKey) {
				// 環境変数が設定されていない場合はスキップ
				return;
			}

			const enokiFlow = new EnokiFlow({ apiKey });

			expect(enokiFlow).toBeDefined();
		});
	});

	describe("OAuth URL生成", () => {
		it("Google OAuth URLを生成できる", async () => {
			if (!apiKey) {
				return;
			}

			const enokiFlow = new EnokiFlow({ apiKey });

			const authUrl = await enokiFlow.createAuthorizationURL({
				provider: "google",
				clientId: clientId,
				redirectUrl: window.location.origin,
				network: network,
			});

			expect(authUrl).toBeTruthy();
			expect(authUrl).toContain("accounts.google.com");
		});
	});

	describe("セッション管理", () => {
		it("セッションを取得できる（セッションがない場合はnull）", async () => {
			if (!apiKey) {
				return;
			}

			const enokiFlow = new EnokiFlow({ apiKey });
			const session = await enokiFlow.getSession();

			// セッションがない場合はnull、ある場合はオブジェクト
			expect(session === null || typeof session === "object").toBe(true);
		});
	});

	describe("zkLoginState", () => {
		it("zkLoginStateを取得できる", () => {
			if (!apiKey) {
				return;
			}

			const enokiFlow = new EnokiFlow({ apiKey });
			const state = enokiFlow.$zkLoginState.get();

			expect(state).toBeDefined();
			expect(typeof state === "object").toBe(true);
		});
	});
});

