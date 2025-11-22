import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
	getZkLoginAddress,
	handleAuthCallback,
} from "./lib/enoki";
import { debugLog, infoLog, warnLog, errorLog } from "./lib/logger";
import { Header } from "./components/Header";
import { Sidebar, type PageType } from "./components/Sidebar";
import { TicketsPage } from "./components/TicketsPage";

function App() {
	// OAuthコールバック処理でzkLoginアドレスを設定（将来の使用のために保持）
	const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
	const location = useLocation();
	
	// URLパスから現在のページを判定
	const getCurrentPage = (): PageType => {
		const path = location.pathname;
		if (path === "/tickets" || path === "/") {
			return "tickets";
		} else if (path === "/videos") {
			return "videos";
		}
		return "tickets";
	};
	
	const currentPage = getCurrentPage();

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
		<div style={{ fontFamily: "sans-serif", margin: 0, padding: 0, width: "100%", height: "100vh", backgroundColor: "#000000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
			<Header />
			{/* サイドバーとメインコンテンツのコンテナ */}
			<div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
				<Sidebar currentPage={currentPage} />
				{/* メインコンテンツ領域 */}
				<div style={{ flex: 1, overflow: "auto", width: "100%" }}>
					<Routes>
						<Route path="/" element={<Navigate to="/tickets" replace />} />
						<Route path="/tickets" element={<TicketsPage />} />
						<Route path="/videos" element={
							<div>
								{/* ビデオページのコンテンツ（後から実装） */}
							</div>
						} />
					</Routes>
				</div>
			</div>
		</div>
	);
}

export default App;
