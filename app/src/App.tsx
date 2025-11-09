import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

function App() {
	const currentAccount = useCurrentAccount();

	return (
		<div style={{ padding: "20px", fontFamily: "sans-serif" }}>
			<h1>OneTube - NFT-Gated Video Streaming</h1>
			<ConnectButton />
			{currentAccount && (
				<div style={{ marginTop: "20px" }}>
					<p>
						<strong>Connected:</strong> {currentAccount.address}
					</p>
				</div>
			)}
		</div>
	);
}

export default App;
