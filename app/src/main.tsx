import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import App from "./App";

import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const networks = {
	devnet: { url: getFullnodeUrl("devnet") },
	testnet: { url: getFullnodeUrl("testnet") },
};

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networks} defaultNetwork="devnet">
				<WalletProvider>
					<App />
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	</StrictMode>,
);
