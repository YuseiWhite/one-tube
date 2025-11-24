import { useState, useEffect } from "react";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { LoginModal } from "./LoginModal";
import { toast } from "../lib/toast";
import { getEnokiFlow, clearEnokiAccount } from "../lib/enoki";


const ONETUBE_LOGO_URL =
	"https://www.figma.com/api/mcp/asset/7938ffcb-a024-45e1-936a-d7f6456077a3";

// ウォレットアドレスを短縮表示する関数
function formatAddress(address: string): string {
	if (!address) return "";
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type NetworkType = "devnet" | "testnet" | "mainnet";

interface NetworkButtonProps {
	network: NetworkType;
	isActive: boolean;
	onClick: () => void;
}

function NetworkButton({ network, isActive, onClick }: NetworkButtonProps) {
	const networkLabels: Record<NetworkType, string> = {
		devnet: "Sui devnet",
		testnet: "Sui testnet",
		mainnet: "Sui mainnet",
	};

	if (isActive) {
		return (
			<button
				onClick={onClick}
				style={{
					backgroundColor: "#3f3f47",
					border: "none",
					borderRadius: "9999px",
					height: "36px",
					padding: "0 16px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					cursor: "pointer",
					flex: "1 0 0",
					minWidth: 0,
				}}
			>
				<div
					style={{
						width: "8px",
						height: "8px",
						borderRadius: "9999px",
						backgroundColor: "#00c950",
						opacity: 0.995,
						flexShrink: 0,
					}}
				/>
				<span
					style={{
						fontFamily:
							"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
						fontSize: "14px",
						fontWeight: 400,
						lineHeight: "20px",
						color: "#05df72",
						letterSpacing: "-0.1504px",
						whiteSpace: "nowrap",
					}}
				>
					{networkLabels[network]}
				</span>
			</button>
		);
	}

	const buttonWidths: Record<NetworkType, string> = {
		devnet: "auto",
		testnet: "103.414px",
		mainnet: "109.625px",
	};

	return (
		<button
			onClick={onClick}
			style={{
				backgroundColor: "transparent",
				border: "1px solid rgba(251, 44, 54, 0.2)",
				borderRadius: "9999px",
				height: "38px",
				padding: "1px 17px",
				display: "flex",
				alignItems: "center",
				cursor: "pointer",
				opacity: 0.5,
				whiteSpace: "nowrap",
				width: buttonWidths[network],
				flexShrink: 0,
			}}
		>
			<span
				style={{
					fontFamily:
						"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
					fontSize: "14px",
					fontWeight: 400,
					lineHeight: "20px",
					color: "rgba(251, 44, 54, 0.5)",
					letterSpacing: "-0.1504px",
				}}
			>
				{networkLabels[network]}
			</span>
		</button>
	);
}

export function Header() {
	const currentAccount = useCurrentAccount();
	const { mutate: disconnectWallet } = useDisconnectWallet();
	const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("devnet");
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	const handleNetworkChange = (networkType: NetworkType) => {
		if (networkType === "mainnet") {
			// mainnetは現在サポートされていない可能性があるため、警告を表示
			console.warn("Mainnet is not configured in SuiClientProvider");
			return;
		}
		setCurrentNetwork(networkType);
		// TODO: SuiClientProviderのネットワークを切り替える実装が必要
		// 現在は状態のみ更新
	};

	const handleConnectWallet = () => {
		// モーダルは閉じずに、LoginModal内でConnectButtonを開く
		// この関数はLoginModalに渡される
	};

	const handleZkLogin = () => {
		toast.info("zkLogin with Google is coming soon");
		setIsLoginModalOpen(false);
	};

	const handleLogout = async () => {
		try {
			// Sui Walletの切断
			if (currentAccount) {
				disconnectWallet();
			}
			// zkLoginのログアウト（Enoki）
			try {
				const enokiFlow = getEnokiFlow();
				await enokiFlow.logout();
				clearEnokiAccount();
			} catch (error) {
				// Enokiが初期化されていない場合は無視
				console.log("[Header] Enoki logout skipped:", error);
			}
			toast.success("Logged out");
		} catch (error) {
			console.error("[Header] Logout error:", error);
			toast.error("Logout failed");
		}
	};

	const isLoggedIn = !!currentAccount;
	const displayAddress = currentAccount?.address || "";

	// ログインが完了したらモーダルを自動で閉じる
	useEffect(() => {
		if (isLoggedIn && isLoginModalOpen) {
			setIsLoginModalOpen(false);
		}
	}, [isLoggedIn, isLoginModalOpen]);

	return (
		<header
			style={{
				width: "100%",
				height: "auto",
				backgroundColor: "#000000",
				borderBottom: "1px solid #27272a",
				padding: "16px 32px",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				boxSizing: "border-box",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "48px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
			{/* ロゴ */}
			<div
				style={{
					width: "234px",
					height: "auto",
					flexShrink: 0,
				}}
			>
				<img
					src={ONETUBE_LOGO_URL}
					alt="OneTube"
					style={{
						width: "100%",
						height: "auto",
						objectFit: "contain",
					}}
				/>
			</div>

			{/* ネットワーク選択とログイン/ログアウト */}
			<div
				style={{
					height: "48px",
					display: "flex",
					alignItems: "center",
					gap: "16px",
					flexShrink: 0,
					width: isLoggedIn ? "627.898px" : "457.93px",
				}}
			>
				{/* ネットワーク選択コンテナ */}
				<div
					style={{
						backgroundColor: "#18181b",
						border: "1px solid #27272a",
						borderRadius: "9999px",
						height: "48px",
						padding: "6px",
						display: "flex",
						alignItems: "center",
						gap: "8px",
						flex: "1 0 0",
						minWidth: 0,
					}}
				>
					<NetworkButton
						network="devnet"
						isActive={currentNetwork === "devnet"}
						onClick={() => handleNetworkChange("devnet")}
					/>
					<NetworkButton
						network="testnet"
						isActive={currentNetwork === "testnet"}
						onClick={() => handleNetworkChange("testnet")}
					/>
					<NetworkButton
						network="mainnet"
						isActive={currentNetwork === "mainnet"}
						onClick={() => handleNetworkChange("mainnet")}
					/>
				</div>

				{/* ログイン済み時のUI */}
				{isLoggedIn ? (
					<div
						style={{
							height: "42px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							flexShrink: 0,
							width: "256.57px",
						}}
					>
						{/* ウォレットアドレス表示 */}
						<div
							style={{
								backgroundColor: "#18181b",
								border: "1px solid #3f3f47",
								borderRadius: "10px",
								height: "42px",
								padding: "0 17px",
								flex: "1 0 0",
								minWidth: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-start",
							}}
						>
							<span
								style={{
									fontFamily:
										"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
									fontSize: "16px",
									fontWeight: 400,
									lineHeight: "24px",
									color: "#ffffff",
									letterSpacing: "-0.3125px",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{formatAddress(displayAddress)}
							</span>
						</div>

						{/* ログアウトボタン */}
						<button
							onClick={handleLogout}
							style={{
								backgroundColor: "#ffffff",
								border: "1px solid #3f3f47",
								borderRadius: "8px",
								height: "36px",
								width: "104px",
								padding: "9px 17px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								flexShrink: 0,
								minWidth: "104px",
							}}
						>
							<span
								style={{
									fontFamily:
										"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "20px",
									color: "#0a0a0a",
									letterSpacing: "-0.1504px",
									textAlign: "center",
									whiteSpace: "nowrap",
								}}
							>
								Logout
							</span>
						</button>
					</div>
				) : (
					/* ログインボタン */
					<button
						onClick={() => setIsLoginModalOpen(true)}
						style={{
							backgroundColor: "#fdc700",
							border: "none",
							borderRadius: "8px",
							height: "36px",
							width: "86.602px",
							padding: "0 16px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							flexShrink: 0,
						}}
					>
						<span
							style={{
								fontFamily:
									"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
								fontSize: "14px",
								fontWeight: 500,
								lineHeight: "20px",
								color: "#000000",
								letterSpacing: "-0.1504px",
								textAlign: "center",
							}}
						>
							Login
						</span>
					</button>
				)}
			</div>
		</div>

		{/* ログインモーダル */}
		<LoginModal
			isOpen={isLoginModalOpen}
			onClose={() => setIsLoginModalOpen(false)}
			onConnectWallet={handleConnectWallet}
			onZkLogin={handleZkLogin}
		/>
	</header>
	);
}


