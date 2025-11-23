import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { VideoCard } from "../components/VideoCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoTitleSection } from "../components/VideoTitleSection";
import { VideoInfo } from "../components/VideoInfo";
import { CommentForm } from "../components/CommentForm";
import { PremiumTicketPrompt } from "../components/PremiumTicketPrompt";
import { MOCK_VIDEOS, type MockVideo } from "../mocks/videos";

const imgIcon = "https://www.figma.com/api/mcp/asset/09291e07-1e9a-4c3b-b850-ee95b9ca19ea";

export function VideosPage() {
	const currentAccount = useCurrentAccount();
	const isLoggedIn = !!currentAccount;
	const [videos] = useState<MockVideo[]>(MOCK_VIDEOS);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isFullVersion, setIsFullVersion] = useState(false);

	// 購入済みチケットから所有状態を判定（ローカルストレージから読み取り）
	const [ownedTickets, setOwnedTickets] = useState<string[]>([]);

	useEffect(() => {
		// localStorage から購入済みチケットを読み込む
		const stored = localStorage.getItem("ownedTickets");
		if (stored) {
			try {
				setOwnedTickets(JSON.parse(stored));
			} catch (e) {
				console.error("Failed to parse owned tickets:", e);
			}
		}

		// 定期的に更新をチェック（他のタブでの変更を反映）
		const interval = setInterval(() => {
			const stored = localStorage.getItem("ownedTickets");
			if (stored) {
				try {
					setOwnedTickets(JSON.parse(stored));
				} catch (e) {
					// ignore
				}
			} else {
				// localStorageが空の場合はstateもクリア
				setOwnedTickets([]);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// ログイン/ログアウト時にチケット所有状態を更新
	useEffect(() => {
		const stored = localStorage.getItem("ownedTickets");
		let tickets: string[] = [];

		if (stored) {
			try {
				tickets = JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse owned tickets:", e);
			}
		}

		if (isLoggedIn) {
			// ログイン時: ID: 1を追加
			if (!tickets.includes("1")) {
				tickets.push("1");
				localStorage.setItem("ownedTickets", JSON.stringify(tickets));
				setOwnedTickets(tickets);
			}
		} else {
			// ログアウト時: ID: 1とID: 2を削除
			const filteredTickets = tickets.filter((id: string) => id !== "1" && id !== "2");
			localStorage.setItem("ownedTickets", JSON.stringify(filteredTickets));
			setOwnedTickets(filteredTickets);
		}
	}, [isLoggedIn]);

	const selectedVideo = videos.find((v) => v.id === selectedVideoId) || videos[0] || null;

	// プレミアムチケット所有状態を判定
	// TicketsPageで購入したチケットがあれば、プレミアムコンテンツが視聴可能
	const hasPremiumTicket = ownedTickets.length > 0;

	// 最初のビデオを選択状態にする
	useEffect(() => {
		if (videos.length > 0 && !selectedVideoId) {
			setSelectedVideoId(videos[0].id);
		}
	}, [videos, selectedVideoId]);

	const handlePreviewPlay = () => {
		setIsFullVersion(false);
		setIsPlaying(true);
	};

	const handleFullVersionPlay = () => {
		if (hasPremiumTicket) {
			setIsFullVersion(true);
			setIsPlaying(true);
		}
	};

	// 動画URLを取得（プレミアムチケット所有時は完全版、それ以外はプレビュー）
	const getVideoUrl = (): string | undefined => {
		if (!selectedVideo) return undefined;
		if (isFullVersion && hasPremiumTicket && selectedVideo.fullVideoUrl) {
			return selectedVideo.fullVideoUrl;
		}
		return selectedVideo.previewUrl;
	};

	// 動画タイトルから情報を抽出
	const extractFighters = (title: string): string => {
		const match = title.match(/^(.+?)\s*-\s*(.+)$/);
		return match ? match[1].trim() : title;
	};

	const fighters = selectedVideo ? extractFighters(selectedVideo.title) : "";

	return (
		<>
			<style>
				{`
					/* スクロールバーのスタイリング */
					::-webkit-scrollbar {
						width: 8px;
						height: 8px;
					}
					::-webkit-scrollbar-track {
						background: transparent;
					}
					::-webkit-scrollbar-thumb {
						background: #3f3f46;
						border-radius: 4px;
					}
					::-webkit-scrollbar-thumb:hover {
						background: #52525c;
					}

					/* ボタンのホバーアニメーション */
					@keyframes buttonHover {
						0% {
							transform: scale(1);
						}
						50% {
							transform: scale(1.02);
						}
						100% {
							transform: scale(1);
						}
					}

					.preview-button:hover {
						background-color: #3f3f46 !important;
						animation: buttonHover 0.3s ease;
					}

					.full-version-button:hover:not(:disabled) {
						background-color: #ffd700 !important;
						animation: buttonHover 0.3s ease;
					}
				`}
			</style>
			<div
				style={{
					backgroundColor: "#18181b",
					boxSizing: "border-box",
					display: "flex",
					gap: 0,
					padding: 0,
					width: "100%",
					height: "100vh",
					overflow: "hidden",
				}}
			>
				{/* 左側: ビデオ一覧 */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "16px",
						width: "383px",
						flexShrink: 0,
						padding: "16px",
						paddingTop: "16px",
						paddingBottom: "120px",
						boxSizing: "border-box",
						overflowY: "auto",
						overflowX: "hidden",
						height: "100%",
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
						willChange: "scroll-position",
						overscrollBehavior: "contain",
					}}
				>
					{/* FIGHT ARCHIVE タイトル */}
					<div
						style={{
							height: "24px",
							position: "relative",
							width: "100%",
							flexShrink: 0,
							marginBottom: "0",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								color: "#fdc700",
								margin: 0,
								letterSpacing: "0.0875px",
							}}
						>
							FIGHT ARCHIVE
						</p>
					</div>

					{/* 動画リストコンテナ */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							width: "100%",
							alignItems: "flex-start",
						}}
					>
						{videos.map((video) => (
							<VideoCard
								key={video.id}
								video={video}
								isSelected={selectedVideoId === video.id}
								onClick={() => setSelectedVideoId(video.id)}
								hasPremiumTicket={hasPremiumTicket}
							/>
						))}
					</div>
				</div>

				{/* 右側: ビデオプレイヤーと詳細情報 */}
				{selectedVideo && (
					<div
						style={{
							flex: "1 0 0",
							display: "flex",
							flexDirection: "column",
							gap: "24px",
							minWidth: 0,
							padding: "16px 16px 32px 16px",
							boxSizing: "border-box",
							overflowY: "auto",
							overflowX: "hidden",
							alignItems: "flex-start",
							height: "100%",
							scrollBehavior: "smooth",
							WebkitOverflowScrolling: "touch",
							willChange: "scroll-position",
							overscrollBehavior: "contain",
						}}
					>
						{/* ビデオプレイヤーセクション */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "24px",
								width: "672px",
							}}
						>
							{/* ビデオプレイヤー */}
							<div style={{ width: "100%" }}>
								<VideoPlayer
									videoUrl={getVideoUrl()}
									isPlaying={isPlaying}
									onPlay={() => setIsPlaying(true)}
									onPause={() => setIsPlaying(false)}
								/>
							</div>

							{/* アクションボタン */}
							<div
								style={{
									display: "flex",
									gap: "16px",
									width: "100%",
								}}
							>
								{/* プレビュー再生ボタン */}
								<button
									onClick={handlePreviewPlay}
									className="preview-button"
									style={{
										flex: "1 0 0",
										backgroundColor: "#27272a",
										borderRadius: "8px",
										height: "36px",
										border: "none",
										cursor: "pointer",
										position: "relative",
										transition: "background-color 0.2s ease",
									}}
								>
									<img
										alt="再生"
										src={imgIcon}
										style={{
											width: "16px",
											height: "16px",
											position: "absolute",
											left: "97px",
											top: "10px",
										}}
									/>
									<p
										style={{
											fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
											fontSize: "14px",
											fontWeight: 500,
											lineHeight: "20px",
											color: "#ffffff",
											margin: 0,
											letterSpacing: "-0.1504px",
											position: "absolute",
											left: "178px",
											top: "8.5px",
											transform: "translateX(-50%)",
											textAlign: "center",
										}}
									>
										プレビュー再生
									</p>
								</button>

								{/* 完全版を視聴ボタン */}
								<button
									onClick={handleFullVersionPlay}
									disabled={!hasPremiumTicket}
									className="full-version-button"
									style={{
										flex: "1 0 0",
										backgroundColor: hasPremiumTicket ? "#fdc700" : "#27272a",
										opacity: hasPremiumTicket ? 1 : 0.5,
										borderRadius: "8px",
										height: "36px",
										border: "none",
										cursor: hasPremiumTicket ? "pointer" : "not-allowed",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										padding: "0 16px",
										transition: "background-color 0.2s ease",
									}}
								>
									<p
										style={{
											fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
											fontSize: "14px",
											fontWeight: 500,
											lineHeight: "20px",
											color: hasPremiumTicket ? "#000000" : "#71717b",
											margin: 0,
											letterSpacing: "-0.1504px",
										}}
									>
										完全版を視聴
									</p>
								</button>
							</div>
						</div>

						{/* プレミアムチケット誘導メッセージ */}
						<div style={{ width: "672px" }}>
							<PremiumTicketPrompt hasPremiumTicket={hasPremiumTicket} />
						</div>

						{/* 動画詳細情報セクション */}
						<div
							style={{
								backgroundColor: "#09090b",
								border: "1px solid #27272a",
								borderRadius: "10px",
								padding: "25px",
								width: "672px",
								display: "flex",
								flexDirection: "column",
								gap: "16px",
								boxSizing: "border-box",
							}}
						>
							{/* タイトルとリアクション */}
							<VideoTitleSection
								title={selectedVideo.title}
								hasPremiumTicket={hasPremiumTicket}
							/>

							{/* 動画概要 */}
							<VideoInfo
								uploadDate="2024.01.15"
								athletes={fighters}
								venue="Ariake Arena"
								duration="1:50:00"
								blobId="xFp9kLmN3qW8rT2vY7sH4jK6gD1aE5cB"
								walruscanUrl="https://walruscan.com/testnet"
							/>

							{/* コメントフォーム */}
							<CommentForm />
						</div>
					</div>
				)}
			</div>
		</>
	);
}
