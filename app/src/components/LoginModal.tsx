import { useRef } from "react";
import { ConnectButton } from "@mysten/dapp-kit";

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConnectWallet: () => void;
	onZkLogin: () => void;
}

export function LoginModal({
	isOpen,
	onClose,
	onConnectWallet,
	onZkLogin,
}: LoginModalProps) {
	const connectButtonRef = useRef<HTMLDivElement>(null);

	// ConnectButtonをプログラムから開く共通関数
	const openWalletModal = () => {
		setTimeout(() => {
			const container = connectButtonRef.current;
			if (!container) {
				console.warn("[LoginModal] ConnectButton containerが見つかりません");
				return;
			}

			// ConnectButtonのボタン要素を探してクリック
			const button = container.querySelector("button");
			if (button) {
				console.log("[LoginModal] ConnectButtonをクリックします");
				button.click();
			} else {
				console.warn("[LoginModal] ConnectButtonのbutton要素が見つかりません");
			}
		}, 50);
	};

	const handleConnectWallet = () => {
		onConnectWallet();
		openWalletModal();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* オーバーレイ */}
			<div
				onClick={onClose}
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					zIndex: 9998,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{/* モーダルコンテンツ */}
				<div
					onClick={(e) => e.stopPropagation()}
					style={{
						backgroundColor: "#18181b",
						border: "1px solid #27272a",
						borderRadius: "12px",
						padding: "24px",
						minWidth: "400px",
						maxWidth: "90vw",
						zIndex: 9999,
						boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
					}}
				>
					{/* タイトル */}
					<h2
						style={{
							fontFamily:
								"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
							fontSize: "20px",
							fontWeight: 600,
							color: "#ffffff",
							marginBottom: "24px",
							textAlign: "center",
						}}
					>
						Wallet Login
					</h2>

					{/* ボタンコンテナ */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
						}}
					>
						{/* Connect Wallet ボタン */}
						<button
							onClick={handleConnectWallet}
							style={{
								width: "100%",
								padding: "12px 24px",
								backgroundColor: "#3f3f47",
								border: "1px solid #27272a",
								borderRadius: "8px",
								color: "#ffffff",
								fontSize: "16px",
								fontWeight: 500,
								cursor: "pointer",
								fontFamily:
									"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
								transition: "background-color 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#4a4a52";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#3f3f47";
							}}
						>
							Connect Wallet
						</button>

						{/* Log in with Google ボタン */}
						<button
							onClick={onZkLogin}
							style={{
								width: "100%",
								padding: "12px 24px",
								backgroundColor: "#fdc700",
								border: "none",
								borderRadius: "8px",
								color: "#000000",
								fontSize: "16px",
								fontWeight: 500,
								cursor: "pointer",
								fontFamily:
									"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
								transition: "background-color 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#e6b800";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#fdc700";
							}}
						>
							Log in with Google
						</button>
					</div>

					{/* 閉じるボタン */}
					<button
						onClick={onClose}
						style={{
							marginTop: "16px",
							width: "100%",
							padding: "8px 16px",
							backgroundColor: "transparent",
							border: "1px solid #27272a",
							borderRadius: "8px",
							color: "#ffffff",
							fontSize: "14px",
							cursor: "pointer",
							fontFamily:
								"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
						}}
					>
						Cancel
					</button>
				</div>
			</div>

			{/* 非表示のConnectButton（モーダルを開くため） */}
			<div
				ref={connectButtonRef}
				style={{
					position: "fixed",
					top: "-9999px",
					left: "-9999px",
					opacity: 0,
					pointerEvents: "auto",
					width: "1px",
					height: "1px",
					overflow: "hidden",
					zIndex: -1,
				}}
			>
				<ConnectButton />
			</div>
		</>
	);
}

