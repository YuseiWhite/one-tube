/**
 * Appコンポーネントの統合テスト
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import App from "../App";

// モック設定
vi.mock("../lib/enoki", () => ({
	loginWithGoogle: vi.fn(),
	getZkLoginAddress: vi.fn().mockResolvedValue(null),
	handleAuthCallback: vi.fn().mockResolvedValue(null),
	clearEnokiAccount: vi.fn(),
	getEnokiFlow: vi.fn(),
}));

vi.mock("../lib/api", () => ({
	getListings: vi.fn().mockResolvedValue([]),
	purchaseNFT: vi.fn(),
}));

vi.mock("../lib/sui", () => ({
	getUserNFTs: vi.fn().mockResolvedValue([]),
}));

// テスト用のQueryClient
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

// テスト用のネットワーク設定
const networks = {
	devnet: { url: "https://fullnode.devnet.sui.io:443" },
	testnet: { url: "https://fullnode.testnet.sui.io:443" },
};

describe("Appコンポーネント", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = createTestQueryClient();
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

	it("アプリが正常にレンダリングされる", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<SuiClientProvider networks={networks} defaultNetwork="devnet">
					<WalletProvider>
						<App />
					</WalletProvider>
				</SuiClientProvider>
			</QueryClientProvider>,
		);

		expect(screen.getByText("OneTube - Wallet Login")).toBeInTheDocument();
	});

	it("Sui Wallet接続ボタンが表示される", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<SuiClientProvider networks={networks} defaultNetwork="devnet">
					<WalletProvider>
						<App />
					</WalletProvider>
				</SuiClientProvider>
			</QueryClientProvider>,
		);

		expect(screen.getByText("Sui Wallet接続")).toBeInTheDocument();
	});

	it("Googleでログインボタンが表示される", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<SuiClientProvider networks={networks} defaultNetwork="devnet">
					<WalletProvider>
						<App />
					</WalletProvider>
				</SuiClientProvider>
			</QueryClientProvider>,
		);

		// ボタン要素を取得（h2ではなくbutton要素）
		const loginButton = screen.getByRole("button", {
			name: "Googleでログイン",
		});
		expect(loginButton).toBeInTheDocument();
	});

	it("デバッグ用ボタンが表示されない", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<SuiClientProvider networks={networks} defaultNetwork="devnet">
					<WalletProvider>
						<App />
					</WalletProvider>
				</SuiClientProvider>
			</QueryClientProvider>,
		);

		expect(screen.queryByText("Enoki SDKテスト実行")).not.toBeInTheDocument();
		expect(screen.queryByText("zk proof検証")).not.toBeInTheDocument();
		expect(screen.queryByText("デバッグ用")).not.toBeInTheDocument();
	});

	// 動画一覧機能は削除されたため、このテストも削除
	// it("動画一覧が表示される", async () => {
	// 	// 実装は将来のissueで対応
	// });
});
