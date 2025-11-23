import { useState } from "react";
import { useParams } from "react-router-dom";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoTitleSection } from "../components/VideoTitleSection";
import { VideoInfo } from "../components/VideoInfo";
import { CommentForm } from "../components/CommentForm";
import { PremiumTicketPrompt } from "../components/PremiumTicketPrompt";
import { useEffect } from "react";
import type { Video } from "../shared/types";

const imgIcon = "https://www.figma.com/api/mcp/asset/33c46e35-6d17-49ff-9d29-3f9affc5c19a";

export function VideoDetailPage() {
	const { videoId } = useParams<{ videoId: string }>();
	const [video, setVideo] = useState<Video | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [hasPremiumTicket] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// モックデータのみを使用（バックエンドAPI呼び出しを無効化）
		setVideo({
			id: videoId || "1",
			title: "Superbon vs Masaaki Noiri - full match",
			description: "Full match between Superbon and Masaaki Noiri",
			previewBlobId: "",
			fullBlobId: "",
			previewUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
			price: 0,
		});
		setIsLoading(false);
	}, [videoId]);

	if (isLoading) {
		return (
			<div
				style={{
					backgroundColor: "#18181b",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#71717b",
					fontFamily: "'Inter', sans-serif",
				}}
			>
				読み込み中...
			</div>
		);
	}

	if (!video) {
		return (
			<div
				style={{
					backgroundColor: "#18181b",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#71717b",
					fontFamily: "'Inter', sans-serif",
				}}
			>
				動画が見つかりませんでした
			</div>
		);
	}

	const handlePreviewPlay = () => {
		setIsPlaying(true);
	};

	const handleFullVersionPlay = () => {
		if (hasPremiumTicket) {
			// 完全版を再生する処理
			setIsPlaying(true);
		}
	};

	// 動画タイトルから情報を抽出
	const extractFighters = (title: string): string => {
		const match = title.match(/^(.+?)\s*-\s*(.+)$/);
		return match ? match[1].trim() : title;
	};

	const fighters = extractFighters(video.title);

	return (
		<div
			style={{
				backgroundColor: "#18181b",
				width: "100%",
				minHeight: "100%",
				padding: "32px",
				boxSizing: "border-box",
			}}
		>
			{/* ビデオプレイヤーセクション */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "24px",
					width: "100%",
					maxWidth: "736px",
				}}
			>
				{/* ビデオプレイヤー */}
				<VideoPlayer
					videoUrl={hasPremiumTicket ? undefined : video.previewUrl}
					isPlaying={isPlaying}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
				/>

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
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "8px",
							padding: "0 16px",
						}}
					>
						<img
							alt="再生"
							src={imgIcon}
							style={{
								width: "16px",
								height: "16px",
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
			<div
				style={{
					marginTop: "24px",
					width: "100%",
					maxWidth: "672px",
				}}
			>
				<PremiumTicketPrompt hasPremiumTicket={hasPremiumTicket} />
			</div>

			{/* 動画詳細情報セクション */}
			<div
				style={{
					backgroundColor: "#09090b",
					border: "1px solid #27272a",
					borderRadius: "10px",
					padding: "25px",
					marginTop: "24px",
					width: "100%",
					maxWidth: "672px",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
				}}
			>
				{/* タイトルとリアクション */}
				<VideoTitleSection
					title={video.title}
					hasPremiumTicket={hasPremiumTicket}
				/>

				{/* 動画概要 */}
				<VideoInfo
					uploadDate="2024.01.15"
					athletes={fighters}
					venue="Ariake Arena"
					duration="1:50:00"
					blobId={video.fullBlobId || "xFp9kLmN3qW8rT2vY7sH4jK6gD1aE5cB"}
					walruscanUrl="https://walruscan.com/testnet"
				/>

				{/* コメントフォーム */}
				<CommentForm />
			</div>
		</div>
	);
}

