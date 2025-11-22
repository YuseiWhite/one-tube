import { useState, useEffect } from "react";
import {
	getZkLoginAddress,
	handleAuthCallback,
} from "./lib/enoki";
import { debugLog, infoLog, warnLog, errorLog } from "./lib/logger";
import { Header } from "./components/Header";
import { Sidebar, type PageType } from "./components/Sidebar";

function App() {
	// OAuthコールバック処理でzkLoginアドレスを設定（将来の使用のために保持）
	const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
	// 現在のページ状態（後からチケットページとビデオページを実装するための準備）
	const [currentPage, setCurrentPage] = useState<PageType>("tickets");

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

	return (
		<div style={{ fontFamily: "sans-serif", minHeight: "100vh", backgroundColor: "#000000", display: "flex", flexDirection: "column" }}>
			<Header />
			{/* サイドバーとメインコンテンツのコンテナ */}
			<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
				<Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
				{/* メインコンテンツ領域 */}
				<div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
					{currentPage === "tickets" && (
						<div>
							{/* チケットページのコンテンツ（後から実装） */}
						</div>
					)}
					{currentPage === "videos" && (
						<div>
							{/* ビデオページのコンテンツ（後から実装） */}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
