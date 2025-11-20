import { useState, useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import {
	loginWithGoogle,
	getZkLoginAddress,
	handleAuthCallback,
	clearEnokiAccount,
	getEnokiFlow,
} from "./lib/enoki";
import { debugLog, infoLog, warnLog, errorLog } from "./lib/logger";

function App() {
	const currentAccount = useCurrentAccount();
	const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// ページ読み込み時にOAuthコールバックを処理し、アカウント情報を復元
	useEffect(() => {
		// OAuthコールバックを処理（URLにhashがある場合）
		if (window.location.hash) {
			debugLog("[App] OAuthコールバックを検出しました");
			
			// デバッグ用: id_tokenをAPIに送信して確認（デバッグモードのみ）
			const isDebugMode = (import.meta as any).env?.VITE_DEBUG === "true" || (import.meta as any).env?.DEV;
			if (isDebugMode) {
				const hash = window.location.hash.substring(1);
				const params = new URLSearchParams(hash);
				const idToken = params.get("id_token");
				
				if (idToken) {
					debugLog("[App] id_tokenをAPIに送信して確認します");
					fetch(`/api/debug/zklogin?id_token=${encodeURIComponent(idToken)}`)
						.then((res) => res.json())
						.then((data) => {
							debugLog("[App] API応答:", data);
						})
						.catch((error) => {
							errorLog("[App] API呼び出しエラー:", error);
						});
				}
			}
			
			handleAuthCallback()
				.then((address) => {
					if (address) {
						setZkLoginAddress(address);
						infoLog("[App] zkLoginアドレスを設定しました:", address);
					} else {
						warnLog("[App] zkLoginアドレスが取得できませんでした");
					}
				})
				.catch((error) => {
					errorLog("[App] handleAuthCallbackエラー:", error);
				});
		} else {
			// SessionStorageにない場合、Enoki SDKから取得を試みる
			getZkLoginAddress().then((address) => {
				if (address) {
					setZkLoginAddress(address);
					debugLog("[App] 既存のzkLoginアドレスを取得しました:", address);
				}
			});
		}
	}, []);

	const handleGoogleLogin = async () => {
		debugLog("[App] Googleログインボタンがクリックされました");
		setIsLoading(true);
		try {
			// loginWithGoogle()はGoogle OAuthページにリダイレクトするため、戻り値はありません
			// リダイレクトが発生するため、この後のコードは実行されません
			await loginWithGoogle();
		} catch (error) {
			errorLog("[App] Google login failed:", error);
			alert(`ログインエラー: ${error instanceof Error ? error.message : String(error)}`);
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		debugLog("[App] ログアウトを開始します");
		try {
			const enokiFlow = getEnokiFlow();
			await enokiFlow.logout();
			clearEnokiAccount();
			setZkLoginAddress(null);
			debugLog("[App] ログアウト完了");
		} catch (error) {
			errorLog("[App] ログアウトエラー:", error);
			clearEnokiAccount();
			setZkLoginAddress(null);
		}
	};

	// 現在のユーザーアドレスを取得（zkLoginまたはSui Wallet）
	const currentAddress = zkLoginAddress || currentAccount?.address || null;

	return (
		<div style={{ padding: "20px", fontFamily: "sans-serif" }}>
			<h1>OneTube - Wallet Login</h1>

			{/* ウォレット接続 */}
			<div style={{ marginBottom: "30px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
				{/* Sui Wallet接続 */}
				<div style={{ flex: 1 }}>
					<h2>Sui Wallet接続</h2>
					<ConnectButton />
					{currentAccount && (
						<div style={{ marginTop: "10px" }}>
							<p>
								<strong>Connected:</strong> {currentAccount.address}
							</p>
						</div>
					)}
				</div>

				{/* zkLogin接続（Google） */}
				<div style={{ flex: 1 }}>
					<h2>Googleでログイン</h2>
					{!zkLoginAddress ? (
						<button
							onClick={handleGoogleLogin}
							disabled={isLoading}
							style={{
								padding: "10px 20px",
								fontSize: "16px",
								cursor: isLoading ? "not-allowed" : "pointer",
								backgroundColor: isLoading ? "#ccc" : "#4285f4",
								color: "white",
								border: "none",
								borderRadius: "4px",
							}}
						>
							{isLoading ? "ログイン中..." : "Googleでログイン"}
						</button>
					) : (
						<div>
							<p>
								<strong>zkLogin Address:</strong> {zkLoginAddress}
							</p>
							<button
								onClick={handleLogout}
								style={{
									padding: "8px 16px",
									fontSize: "14px",
									cursor: "pointer",
									backgroundColor: "#dc3545",
									color: "white",
									border: "none",
									borderRadius: "4px",
									marginTop: "10px",
								}}
							>
								ログアウト
							</button>
						</div>
					)}
				</div>
			</div>

			{/* 現在のユーザーアドレス表示 */}
			{currentAddress && (
				<div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
					<p>
						<strong>現在のユーザーアドレス:</strong> {currentAddress}
					</p>
				</div>
			)}
		</div>
	);
}

export default App;
