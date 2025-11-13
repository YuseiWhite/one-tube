import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import App from "./App";

import "@mysten/dapp-kit/dist/index.css";
import "./styles/app.css";

// 依存パッケージ（インストール済み想定）:
// pnpm add @mysten/dapp-kit @mysten/sui.js @tanstack/react-query

// ネットワーク設定（devnet 固定）
const { networkConfig } = createNetworkConfig({
	devnet: {
		url: import.meta.env.VITE_RPC_URL ?? 'https://fullnode.devnet.sui.io:443',
	},
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
				<WalletProvider autoConnect>
					<App />
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	</StrictMode>,
);
