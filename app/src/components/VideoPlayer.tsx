import { useState, useRef, useEffect } from "react";

const imgIcon1 = "https://www.figma.com/api/mcp/asset/4249c691-2076-4169-80ba-9469d6a9711d";
const imgIcon2 = "https://www.figma.com/api/mcp/asset/42946832-ad35-436b-85a7-45da3e2e4aac";
const imgIcon3 = "https://www.figma.com/api/mcp/asset/113e365d-0357-443a-a3ee-6848b6acb6f5";
const imgIcon4 = "https://www.figma.com/api/mcp/asset/9e3016c4-dc10-44ba-b00d-52cf3d119453";
const imgIcon5 = "https://www.figma.com/api/mcp/asset/f00f9fb7-27c5-49cd-80d6-33e308643986";

interface VideoPlayerProps {
	videoUrl?: string;
	isPlaying?: boolean;
	onPlay?: () => void;
	onPause?: () => void;
}

export function VideoPlayer({ videoUrl, isPlaying = false, onPlay, onPause }: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isVideoPlaying, setIsVideoPlaying] = useState(false);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const updateTime = () => setCurrentTime(video.currentTime);
		const updateDuration = () => setDuration(video.duration);

		video.addEventListener("timeupdate", updateTime);
		video.addEventListener("loadedmetadata", updateDuration);

		return () => {
			video.removeEventListener("timeupdate", updateTime);
			video.removeEventListener("loadedmetadata", updateDuration);
		};
	}, []);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.play();
			setIsVideoPlaying(true);
		} else {
			video.pause();
			setIsVideoPlaying(false);
		}
	}, [isPlaying]);

	const togglePlay = () => {
		const video = videoRef.current;
		if (!video) return;

		if (isVideoPlaying) {
			video.pause();
			setIsVideoPlaying(false);
			onPause?.();
		} else {
			video.play();
			setIsVideoPlaying(true);
			onPlay?.();
		}
	};

	const formatTime = (seconds: number): string => {
		if (isNaN(seconds)) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<div
			style={{
				backgroundColor: "#000000",
				borderRadius: "10px",
				height: "378px",
				position: "relative",
				width: "100%",
				overflow: "hidden",
			}}
		>
			{/* 動画要素 */}
			{videoUrl ? (
				<video
					ref={videoRef}
					src={videoUrl}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "contain",
					}}
				/>
			) : (
				<div
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						backgroundColor: "#000000",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#71717b",
						fontFamily: "'Inter', sans-serif",
						fontSize: "14px",
					}}
				>
					動画を読み込み中...
				</div>
			)}

			{/* コントロールバー（下部グラデーションオーバーレイ） */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)",
					padding: "16px",
					paddingTop: "16px",
					display: "flex",
					flexDirection: "column",
					gap: "12px",
				}}
			>
				{/* プログレスバー */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						width: "100%",
					}}
				>
					{/* プログレスバー本体 */}
					<div
						style={{
							backgroundColor: "#3f3f47",
							borderRadius: "16777200px",
							height: "4px",
							width: "100%",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								backgroundColor: "#fdc700",
								height: "100%",
								width: `${progress}%`,
								transition: "width 0.1s linear",
							}}
						/>
					</div>

					{/* 時間表示 */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							width: "100%",
						}}
					>
						<div
							style={{
								height: "24px",
								position: "relative",
								width: "33.734px",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "16px",
									fontWeight: 400,
									lineHeight: "24px",
									color: "#9f9fa9",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "-0.5px",
									letterSpacing: "-0.3125px",
								}}
							>
								{formatTime(currentTime)}
							</p>
						</div>
						<div
							style={{
								height: "24px",
								position: "relative",
								width: "33.734px",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "16px",
									fontWeight: 400,
									lineHeight: "24px",
									color: "#9f9fa9",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "-0.5px",
									letterSpacing: "-0.3125px",
								}}
							>
								{formatTime(duration)}
							</p>
						</div>
					</div>
				</div>

				{/* コントロールボタン */}
				<div
					style={{
						display: "flex",
						gap: "16px",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
					}}
				>
					{/* 巻き戻し */}
					<button
						style={{
							backgroundColor: "transparent",
							border: "none",
							borderRadius: "8px",
							width: "36px",
							height: "36px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							padding: 0,
						}}
					>
						<img
							alt="巻き戻し"
							src={imgIcon1}
							style={{
								width: "16px",
								height: "16px",
							}}
						/>
					</button>

					{/* 再生/一時停止 */}
					<button
						onClick={togglePlay}
						style={{
							backgroundColor: "transparent",
							border: "none",
							borderRadius: "8px",
							width: "48px",
							height: "48px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							padding: 0,
						}}
					>
						{isVideoPlaying ? (
							// 一時停止アイコン（2本の縦線）
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect x="4" y="2" width="3" height="12" fill="#ffffff" />
								<rect x="9" y="2" width="3" height="12" fill="#ffffff" />
							</svg>
						) : (
							// 再生アイコン（三角形）
							<img
								alt="再生"
								src={imgIcon2}
								style={{
									width: "16px",
									height: "16px",
								}}
							/>
						)}
					</button>

					{/* 早送り */}
					<button
						style={{
							backgroundColor: "transparent",
							border: "none",
							borderRadius: "8px",
							width: "36px",
							height: "36px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							padding: 0,
						}}
					>
						<img
							alt="早送り"
							src={imgIcon3}
							style={{
								width: "16px",
								height: "16px",
							}}
						/>
					</button>

					{/* 音量 */}
					<button
						style={{
							backgroundColor: "transparent",
							border: "none",
							borderRadius: "8px",
							width: "36px",
							height: "36px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							padding: 0,
						}}
					>
						<img
							alt="音量"
							src={imgIcon4}
							style={{
								width: "16px",
								height: "16px",
							}}
						/>
					</button>

					{/* フルスクリーン */}
					<button
						style={{
							backgroundColor: "transparent",
							border: "none",
							borderRadius: "8px",
							width: "36px",
							height: "36px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							padding: 0,
						}}
					>
						<img
							alt="フルスクリーン"
							src={imgIcon5}
							style={{
								width: "16px",
								height: "16px",
							}}
						/>
					</button>
				</div>
			</div>
		</div>
	);
}

