import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getZkLoginAddress, handleAuthCallback } from "./lib/enoki";
import { logDebug, logInfo, logError } from "./lib/logger";
import { Header } from "./components/Header";
import { Sidebar, type PageType } from "./components/Sidebar";
import { TicketsPage } from "./pages/TicketsPage";
import { VideosPage } from "./pages/VideosPage";
import { VideoDetailPage } from "./pages/VideoDetailPage";

function App() {
	// OAuthコールバック処理でzkLoginアドレスを設定（将来の使用のために保持）
	const [, setZkLoginAddress] = useState<string | null>(null);
	const location = useLocation();

	// URLパスから現在のページを判定
	const getCurrentPage = (): PageType => {
		const path = location.pathname;
		if (path === "/tickets" || path === "/") {
			return "tickets";
		}
		if (path === "/videos") {
			return "videos";
		}
		return "tickets";
	};

	const currentPage = getCurrentPage();

	// ページ読み込み時にOAuthコールバックを処理し、アカウント情報を復元
	useEffect(() => {
		// OAuthコールバックを処理（URLにhashがある場合）
		if (window.location.hash) {
			logDebug("[App] OAuthコールバックを検出しました", {
				hash: window.location.hash,
			});

			handleAuthCallback()
				.then((address) => {
					if (address) {
						setZkLoginAddress(address);
						logInfo("[App] zkLoginアドレスを設定しました", { address });
					} else {
						logInfo("[App] zkLoginアドレスが取得できませんでした");
					}
				})
				.catch((error) => {
					logError(
						"[App] handleAuthCallbackエラー",
						error instanceof Error ? error : new Error(String(error)),
					);
				});
		} else {
			// SessionStorageにない場合、Enoki SDKから取得を試みる
			// ただし、ウォレット接続時はzkLoginを使用していないため、エラーを無視
			getZkLoginAddress()
				.then((address) => {
					if (address) {
						setZkLoginAddress(address);
						logDebug("[App] 既存のzkLoginアドレスを取得しました", {
							address,
						});
					}
				})
				.catch((error) => {
					// zkLoginを使用していない場合（ウォレット接続時）はエラーを無視
					logDebug(
						"[App] zkLoginアドレス取得をスキップ（ウォレット接続時は正常）",
						{
							error: error instanceof Error ? error.message : String(error),
						},
					);
				});
		}
	}, []);

	return (
		<div
			style={{
				fontFamily: "sans-serif",
				margin: 0,
				padding: 0,
				width: "100%",
				height: "100vh",
				backgroundColor: "#000000",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<Header />
			{/* サイドバーとメインコンテンツのコンテナ */}
			<div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
				<Sidebar currentPage={currentPage} />
				{/* メインコンテンツ領域 */}
				<div
					style={{
						flex: 1,
						overflow: currentPage === "videos" ? "hidden" : "auto",
						width: "100%",
						backgroundColor: "#18181b",
					}}
				>
					<Routes>
						<Route path="/" element={<Navigate to="/tickets" replace />} />
						<Route path="/tickets" element={<TicketsPage />} />
						<Route path="/videos" element={<VideosPage />} />
						<Route path="/videos/:videoId" element={<VideoDetailPage />} />
					</Routes>
				</div>
			</div>
		</div>
	);
}

export default App;
