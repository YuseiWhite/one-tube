import { useState, useEffect } from "react";
import { VideoCard } from "../components/VideoCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoTitleSection } from "../components/VideoTitleSection";
import { VideoInfo } from "../components/VideoInfo";
import { CommentForm } from "../components/CommentForm";
import { PremiumTicketPrompt } from "../components/PremiumTicketPrompt";
import { getListings } from "../lib/api";
import type { Video } from "../shared/types";

const imgIcon = "https://www.figma.com/api/mcp/asset/09291e07-1e9a-4c3b-b850-ee95b9ca19ea";

export function VideosPage() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [hasPremiumTicket, setHasPremiumTicket] = useState(false);

	useEffect(() => {
		async function fetchVideos() {
			try {
				const listings = await getListings();
				setVideos(listings);
				// 最初のビデオを選択状態にする
				if (listings.length > 0 && !selectedVideoId) {
					setSelectedVideoId(listings[0].id);
				}
			} catch (error) {
				console.error("Failed to fetch videos:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchVideos();
	}, []);

	// モックデータ（APIから取得できない場合のフォールバック）
	const mockVideos: Video[] = [
		{
			id: "1",
			title: "Superbon vs Masaaki Noiri - full match",
			description: "Full match between Superbon and Masaaki Noiri",
			previewBlobId: "",
			fullBlobId: "",
			previewUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
			price: 0,
		},
		{
			id: "2",
			title: "Superbon vs Masaaki Noiri - KO Scene",
			description: "KO scene from Superbon vs Masaaki Noiri",
			previewBlobId: "",
			fullBlobId: "",
			previewUrl: undefined,
			price: 0,
		},
		{
			id: "3",
			title: "Rodtang vs Prajanchai - Highlights",
			description: "Highlights from Rodtang vs Prajanchai",
			previewBlobId: "",
			fullBlobId: "",
			previewUrl: undefined,
			price: 0,
		},
		{
			id: "4",
			title: "Tawanchai vs Nattawut - Championship Round",
			description: "Championship round from Tawanchai vs Nattawut",
			previewBlobId: "",
			fullBlobId: "",
			previewUrl: undefined,
			price: 0,
		},
	];

	const displayVideos = videos.length > 0 ? videos : mockVideos;
	const selectedVideo = displayVideos.find((v) => v.id === selectedVideoId) || displayVideos[0] || null;

	// 最初のビデオを選択状態にする
	useEffect(() => {
		if (displayVideos.length > 0 && !selectedVideoId) {
			setSelectedVideoId(displayVideos[0].id);
		}
	}, [displayVideos]);

	const handlePreviewPlay = () => {
		setIsPlaying(true);
	};

	const handleFullVersionPlay = () => {
		if (hasPremiumTicket) {
			setIsPlaying(true);
		}
	};

	// 動画タイトルから情報を抽出
	const extractFighters = (title: string): string => {
		const match = title.match(/^(.+?)\s*-\s*(.+)$/);
		return match ? match[1].trim() : title;
	};

	const fighters = selectedVideo ? extractFighters(selectedVideo.title) : "";

	return (
		<div
			style={{
				backgroundColor: "#18181b",
				boxSizing: "border-box",
				display: "flex",
				gap: 0,
				padding: 0,
				width: "100%",
				minHeight: "100%",
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
					boxSizing: "border-box",
				}}
			>
				{/* FIGHT ARCHIVE タイトル */}
				<div
					style={{
						height: "24px",
						position: "relative",
						width: "100%",
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
							position: "absolute",
							left: 0,
							top: "-0.5px",
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
					{loading ? (
						<div
							style={{
								color: "#71717b",
								fontFamily: "'Inter', sans-serif",
								fontSize: "14px",
								padding: "20px",
								textAlign: "center",
							}}
						>
							読み込み中...
						</div>
					) : (
						displayVideos.map((video) => (
							<VideoCard
								key={video.id}
								video={video}
								isSelected={selectedVideoId === video.id}
								onClick={() => setSelectedVideoId(video.id)}
							/>
						))
					)}
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
						padding: "0 16px",
						boxSizing: "border-box",
						overflow: "auto",
						alignItems: "flex-start",
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
								videoUrl={hasPremiumTicket ? undefined : selectedVideo.previewUrl}
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
								style={{
									flex: "1 0 0",
									backgroundColor: "#27272a",
									borderRadius: "8px",
									height: "36px",
									border: "none",
									cursor: "pointer",
									position: "relative",
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
							blobId={selectedVideo.fullBlobId || "xFp9kLmN3qW8rT2vY7sH4jK6gD1aE5cB"}
							walruscanUrl="https://walruscan.com/testnet"
						/>

						{/* コメントフォーム */}
						<CommentForm />
					</div>
				</div>
			)}
		</div>
	);
}
