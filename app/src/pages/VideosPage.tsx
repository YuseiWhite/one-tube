import { useState, useEffect } from "react";
import { VideoCard } from "../components/VideoCard";
import { getListings } from "../lib/api";
import type { Video } from "../shared/types";

export function VideosPage() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

	useEffect(() => {
		async function fetchVideos() {
			try {
				const listings = await getListings();
				setVideos(listings);
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
			previewUrl: undefined,
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

	return (
		<div
			style={{
				backgroundColor: "#18181b",
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				padding: "16px",
				paddingTop: "16px",
				width: "100%",
				minHeight: "100%",
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
	);
}

