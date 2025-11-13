import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useRef, useState, useEffect } from "react";
// Legacy mock API (currently in use)
import { watch, purchase } from "./lib/api";
// New backend API functions available (Issue #009):
// import { getHealth, getListings, createWatchSession, getVideoUrl } from "./lib/api";

// Video data type
interface VideoData {
	id: string;
	title: string;
	thumbnail: string;
	previewUrl: string;
	date: string;
	athletes: string[];
}

function App() {
	const currentAccount = useCurrentAccount();
	const videoRef = useRef<HTMLVideoElement>(null);

	// Video data state
	const [videoData, setVideoData] = useState<VideoData | null>(null);
	const [loadingVideo, setLoadingVideo] = useState<boolean>(true);
	const [videoLoadError, setVideoLoadError] = useState<string>("");

	// State management
	const [videoUrl, setVideoUrl] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [sessionExpired, setSessionExpired] = useState<boolean>(false);

	// Purchase state
	const [owned, setOwned] = useState<boolean>(false);
	const [purchasing, setPurchasing] = useState<boolean>(false);
	const [purchaseError, setPurchaseError] = useState<string>("");
	const [txDigest, setTxDigest] = useState<string>("");

	// Session timer ref for cleanup
	const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Load video data from JSON
	useEffect(() => {
		const loadVideoData = async () => {
			try {
				const response = await fetch("/src/assets/videos.json");
				if (!response.ok) {
					throw new Error("Failed to load video data");
				}
				const videos: VideoData[] = await response.json();
				if (videos.length > 0) {
					setVideoData(videos[0]);
				}
			} catch (err) {
				console.error("Failed to load video data:", err);
				setVideoLoadError("動画データの読み込みに失敗しました");
			} finally {
				setLoadingVideo(false);
			}
		};

		loadVideoData();
	}, []);

	// Cleanup session timer on unmount
	useEffect(() => {
		return () => {
			if (sessionTimerRef.current) {
				clearTimeout(sessionTimerRef.current);
			}
		};
	}, []);

	// Handle watch video request
	const handleWatch = async () => {
		setLoading(true);
		setError("");
		setSessionExpired(false);

		try {
			const result = await watch("superbon-noiri-ko");

			if (result.success && result.videoUrl) {
				setVideoUrl(result.videoUrl);
				setError("");

				// Wait for video to load and play
				setTimeout(() => {
					if (videoRef.current) {
						videoRef.current.play().catch((err) => {
							console.error("Play failed:", err);
							setError("動画の再生に失敗しました");
						});
					}
				}, 100);

				// Setup session expiration timer
				const expiresInMs = (result.expiresInSec || 30) * 1000;
				if (sessionTimerRef.current) {
					clearTimeout(sessionTimerRef.current);
				}
				sessionTimerRef.current = setTimeout(() => {
					setSessionExpired(true);
					if (videoRef.current) {
						videoRef.current.pause();
					}
				}, expiresInMs);
			} else {
				setError(result.message || "動画の取得に失敗しました");
			}
		} catch (err) {
			setError("サーバーエラーが発生しました。再試行してください");
			console.error("Watch error:", err);
		} finally {
			setLoading(false);
		}
	};

	// Handle retry after session expiration
	const handleRetryWatch = async () => {
		setSessionExpired(false);
		await handleWatch();
	};

	// Handle purchase
	const handlePurchase = async () => {
		setPurchasing(true);
		setPurchaseError("");
		setTxDigest("");

		try {
			const result = await purchase("listing-superbon-noiri-ko");

			if (result.success && result.txDigest) {
				setTxDigest(result.txDigest);
				setOwned(true);
				setPurchaseError("");
			} else {
				setPurchaseError(result.message || "購入に失敗しました");
			}
		} catch (err) {
			setPurchaseError("サーバーエラーが発生しました。再試行してください");
			console.error("Purchase error:", err);
		} finally {
			setPurchasing(false);
		}
	};

	return (
		<div style={{ padding: "20px", fontFamily: "sans-serif" }}>
			{/* Devnet Banner */}
			<div
				style={{
					backgroundColor: "#fff3cd",
					border: "1px solid #ffc107",
					borderRadius: "4px",
					padding: "12px 20px",
					marginBottom: "20px",
					color: "#856404",
					textAlign: "center",
					fontWeight: "bold",
				}}
				role="alert"
				aria-label="テストネット警告"
			>
				⚠️ Sui devnetでテスト中です。これは実際のSUIではありません
			</div>

			<h1>OneTube - NFT-Gated Video Streaming</h1>
			<ConnectButton />
			{currentAccount && (
				<div style={{ marginTop: "20px" }}>
					<p>
						<strong>Connected:</strong> {currentAccount.address}
					</p>
				</div>
			)}

			{/* Loading State */}
			{loadingVideo && (
				<div style={{ marginTop: "40px", textAlign: "center" }}>
					<p>読み込み中...</p>
				</div>
			)}

			{/* Error State */}
			{videoLoadError && (
				<div
					style={{
						marginTop: "40px",
						padding: "20px",
						backgroundColor: "#f8d7da",
						border: "1px solid #f5c6cb",
						borderRadius: "4px",
						color: "#721c24",
					}}
				>
					❌ {videoLoadError}
				</div>
			)}

			{/* Video Card */}
			{!loadingVideo && !videoLoadError && videoData && (
				<div
					style={{
						marginTop: "40px",
						maxWidth: "800px",
						border: "1px solid #ddd",
						borderRadius: "8px",
						padding: "20px",
					}}
				>
					{/* Thumbnail */}
					<img
						src={videoData.thumbnail}
						alt={`${videoData.title} - ${videoData.athletes.join(", ")}`}
						style={{
							width: "100%",
							maxHeight: "400px",
							objectFit: "cover",
							borderRadius: "8px",
							marginBottom: "20px",
						}}
						onError={(e) => {
							// Fallback if thumbnail fails to load
							e.currentTarget.style.display = "none";
						}}
					/>

					{/* Title */}
					<h2>{videoData.title}</h2>

					{/* Date */}
					<p style={{ color: "#666", marginBottom: "10px" }}>
						<strong>日付:</strong> {videoData.date}
					</p>

					{/* Athletes */}
					<p style={{ color: "#666", marginBottom: "20px" }}>
						<strong>出演:</strong> {videoData.athletes.join(", ")}
					</p>

					{/* Price Display Block */}
					<div
						style={{
							backgroundColor: "#f8f9fa",
							border: "1px solid #dee2e6",
							borderRadius: "8px",
							padding: "20px",
							marginBottom: "20px",
						}}
						aria-label="価格情報"
					>
						<h3 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px" }}>
							💰 価格情報
						</h3>
						<div style={{ marginBottom: "10px" }}>
							<strong>物理チケット:</strong>{" "}
							<span style={{ color: "#666" }}>¥20,000 〜 ¥558,000</span>
						</div>
						<div style={{ marginBottom: "10px" }}>
							<strong>プレミアム追加:</strong>{" "}
							<span style={{ color: "#666" }}>+¥5,000</span>
						</div>
						<div
							style={{
								marginTop: "15px",
								paddingTop: "15px",
								borderTop: "1px solid #dee2e6",
							}}
						>
							<strong style={{ fontSize: "16px" }}>実購入価格:</strong>{" "}
							<span
								style={{
									fontSize: "20px",
									fontWeight: "bold",
									color: "#007bff",
								}}
							>
								0.5 SUI
							</span>
						</div>
					</div>

					{/* Session Expired Message */}
					{sessionExpired && (
						<div
							style={{
								backgroundColor: "#fff3cd",
								border: "1px solid #ffc107",
								borderRadius: "4px",
								padding: "15px",
								marginBottom: "20px",
							}}
						>
							<p style={{ margin: "0 0 10px 0", color: "#856404" }}>
								⚠️ セッションが期限切れになりました。もう一度視聴を押してください
							</p>
							<button
								onClick={handleRetryWatch}
								disabled={loading}
								style={{
									padding: "8px 16px",
									backgroundColor: "#ffc107",
									border: "none",
									borderRadius: "4px",
									cursor: loading ? "not-allowed" : "pointer",
									fontWeight: "bold",
								}}
							>
								{loading ? "読み込み中..." : "もう一度視聴"}
							</button>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div
							style={{
								backgroundColor: "#f8d7da",
								border: "1px solid #f5c6cb",
								borderRadius: "4px",
								padding: "15px",
								marginBottom: "20px",
								color: "#721c24",
							}}
						>
							❌ {error}
						</div>
					)}

					{/* Preview Section */}
					<div style={{ marginBottom: "20px" }}>
						<h3>プレビュー（10秒）</h3>
						<video
							controls
							style={{ width: "100%", maxHeight: "400px", borderRadius: "4px" }}
						>
							<source src={videoData.previewUrl} type="video/mp4" />
							プレビュー動画を再生できません
						</video>
					</div>

					{/* Purchase Section */}
					{!owned && (
						<div style={{ marginBottom: "20px" }}>
							<button
								onClick={handlePurchase}
								disabled={purchasing}
								style={{
									padding: "12px 24px",
									backgroundColor: purchasing ? "#ccc" : "#28a745",
									color: "white",
									border: "none",
									borderRadius: "4px",
									fontSize: "16px",
									fontWeight: "bold",
									cursor: purchasing ? "not-allowed" : "pointer",
									marginRight: "10px",
								}}
							>
								{purchasing ? "購入中..." : "購入する"}
							</button>

							{/* Purchase Error */}
							{purchaseError && (
								<div
									style={{
										backgroundColor: "#f8d7da",
										border: "1px solid #f5c6cb",
										borderRadius: "4px",
										padding: "15px",
										marginTop: "10px",
										color: "#721c24",
									}}
								>
									❌ {purchaseError}
								</div>
							)}
						</div>
					)}

					{/* Purchase Success Message */}
					{owned && txDigest && (
						<div
							style={{
								backgroundColor: "#d4edda",
								border: "1px solid #c3e6cb",
								borderRadius: "4px",
								padding: "15px",
								marginBottom: "20px",
								color: "#155724",
							}}
						>
							<p style={{ margin: "0 0 10px 0" }}>✅ 購入が完了しました！</p>
							<p style={{ margin: "0", fontSize: "14px" }}>
								<strong>トランザクション:</strong>{" "}
								<code
									style={{
										backgroundColor: "#fff",
										padding: "2px 6px",
										borderRadius: "3px",
									}}
								>
									{txDigest}
								</code>
							</p>
						</div>
					)}

					{/* Watch Full Video Button */}
					<button
						onClick={handleWatch}
						disabled={!owned || loading}
						aria-label="完全版を視聴"
						style={{
							padding: "12px 24px",
							backgroundColor: !owned || loading ? "#ccc" : "#007bff",
							color: "white",
							border: "none",
							borderRadius: "4px",
							fontSize: "16px",
							fontWeight: "bold",
							cursor: !owned || loading ? "not-allowed" : "pointer",
							marginBottom: "20px",
						}}
					>
						{loading
							? "読み込み中..."
							: owned
								? "完全版を視聴"
								: "完全版を視聴（要購入）"}
					</button>

					{/* Full Video Player */}
					{videoUrl && (
						<div style={{ marginTop: "20px" }}>
							<h3>完全版</h3>
							<video
								ref={videoRef}
								controls
								style={{
									width: "100%",
									maxHeight: "500px",
									borderRadius: "4px",
								}}
								src={videoUrl}
							>
								完全版動画を再生できません
							</video>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default App;
