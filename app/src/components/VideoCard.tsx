import { useState } from "react";
import type { Video } from "../shared/types";
import { TicketIcon } from "./TicketIcon";

interface VideoCardProps {
	video: Video;
	isSelected?: boolean;
	onClick?: () => void;
	hasPremiumTicket?: boolean;
}

// 動画タイトルからファイター名を抽出する関数
function extractFightersFromTitle(title: string): string {
	// "Superbon vs Masaaki Noiri - full match" のような形式から "Superbon vs Masaaki Noiri" を抽出
	const match = title.match(/^(.+?)\s*-\s*(.+)$/);
	if (match && match[1]) {
		return match[1].trim();
	}
	return title;
}

// サムネイルファイル名から日付を抽出
function getUploadDateFromThumbnail(video: Video): string {
	const thumbnailUrl = getThumbnailUrl(video);
	if (!thumbnailUrl) {
		return "2024.01.01";
	}

	// ファイル名から日付を抽出 (例: /assets/thumbnails/20251028-KiamrianAbbasov-vs-ChristianLee.png)
	const filename = thumbnailUrl.split("/").pop() || "";
	const dateMatch = filename.match(/^(\d{4})(\d{2})(\d{2})-/);
	
	if (dateMatch) {
		const year = dateMatch[1];
		const month = dateMatch[2];
		const day = dateMatch[3];
		return `${year}.${month}.${day}`;
	}
	
	return "2024.01.01";
}

// 動画タイトルからアップロード日を生成
function getUploadDate(video: Video): string {
	return getUploadDateFromThumbnail(video);
}

// サムネイルファイル名からファイター名を抽出してタイトルを生成
function generateTitleFromThumbnail(filename: string): string {
	// ファイル名から日付部分を除去 (例: 20251028-KiamrianAbbasov-vs-ChristianLee.png)
	const withoutDate = filename.replace(/^\d{8}-/, "").replace(/\.png$/, "");
	// ハイフンを " vs " に変換し、名前を整形
	const title = withoutDate.replace(/-vs-/g, " vs ").replace(/-/g, " ");
	return `${title} - full match`;
}

// サムネイル画像URLを取得
function getThumbnailUrl(video: Video): string {
	// ローカルのサムネイル画像を使用（Viteではpublicフォルダ内のファイルは/から始まるパスでアクセス可能）
	const thumbnails: Record<string, string> = {
		"1": "/assets/thumbnails/20251028-KiamrianAbbasov-vs-ChristianLee.png",
		"2": "/assets/thumbnails/20250323-Superlek-vs-Kongthoranee.png",
		"3": "/assets/thumbnails/20240906-Haggerty-vs-Mongkolpetch.png",
	};
	
	// IDで検索
	const url = thumbnails[video.id];
	if (url) {
		return url;
	}
	
	// タイトルからIDを推測（フォールバック）
	if (video.title.includes("KiamrianAbbasov") || video.title.includes("ChristianLee")) {
		return thumbnails["1"];
	}
	if (video.title.includes("Superlek") || video.title.includes("Kongthoranee")) {
		return thumbnails["2"];
	}
	if (video.title.includes("Haggerty") || video.title.includes("Mongkolpetch")) {
		return thumbnails["3"];
	}
	
	return "";
}

export function VideoCard({ video, isSelected = false, onClick, hasPremiumTicket = false }: VideoCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const thumbnailUrl = getThumbnailUrl(video);
	const fighters = extractFightersFromTitle(video.title);
	const uploadDate = getUploadDate(video);

	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	return (
		<div
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: "#18181b",
				borderRadius: "10px",
				height: "auto",
				overflow: "hidden",
				position: "relative",
				width: "351px",
				boxSizing: "border-box",
				border: "2px solid",
				borderColor: isSelected ? "#fdc700" : "#27272a",
				cursor: onClick ? "pointer" : "default",
				boxShadow: isHovered
					? "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)"
					: "none",
				transition: "box-shadow 0.3s ease, border-color 0.3s ease",
			}}
		>
			{/* サムネイル画像セクション */}
			<div
				style={{
					height: "197.438px",
					position: "relative",
					width: "100%",
				}}
			>
				{/* サムネイル画像 */}
				<div
					style={{
						height: "197.438px",
						position: "absolute",
						left: 0,
						top: 0,
						width: "100%",
					}}
				>
					{!imageError && thumbnailUrl ? (
						<img
							alt={video.title}
							src={thumbnailUrl}
							onError={() => setImageError(true)}
							style={{
								position: "absolute",
								inset: 0,
								maxWidth: "none",
								objectFit: "cover",
								objectPosition: "50% 50%",
								pointerEvents: "none",
								width: "100%",
								height: "100%",
								filter: hasPremiumTicket ? "none" : "grayscale(100%)",
								transition: "filter 0.3s ease",
							}}
						/>
					) : (
						<div
							style={{
								position: "absolute",
								inset: 0,
								backgroundColor: "#27272a",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#71717b",
								fontSize: "12px",
								fontFamily: "'Inter', sans-serif",
							}}
						>
							{video.title}
						</div>
					)}
				</div>

				{/* チケットアイコン（左上） */}
				<div
					style={{
						position: "absolute",
						left: "8px",
						top: "8px",
						width: "40px",
						height: "40px",
					}}
				>
					<TicketIcon isPremium={hasPremiumTicket} />
				</div>


				{/* 動画時間（右下） */}
				<div
					style={{
						position: "absolute",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						borderRadius: "4px",
						height: "24px",
						right: "8px",
						bottom: "8px",
						width: "35.406px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "12px",
							fontWeight: 400,
							lineHeight: "16px",
							color: "#ffffff",
							margin: 0,
							textAlign: "center",
						}}
					>
						10s
					</p>
				</div>
			</div>

			{/* タイトルと情報セクション */}
			<div
				style={{
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: "4px",
					padding: "12px",
					width: "100%",
					position: "relative",
				}}
			>
				{/* タイトル */}
				<div
					style={{
						minHeight: "24px",
						overflow: "hidden",
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
							color: "#ffffff",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "-0.5px",
							letterSpacing: "-0.3125px",
							width: "100%",
							wordWrap: "break-word",
							whiteSpace: "pre-wrap",
						}}
					>
						{video.title}
					</p>
				</div>

				{/* アップロード情報 */}
				<div
					style={{
						height: "16px",
						position: "relative",
						width: "100%",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "12px",
							fontWeight: 400,
							lineHeight: "16px",
							color: "#71717b",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "1px",
						}}
					>
						uploaded {uploadDate} to Walrus
					</p>
				</div>

				{/* ファイター名 */}
				<div
					style={{
						height: "16px",
						position: "relative",
						width: "100%",
						paddingRight: "120px",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "12px",
							fontWeight: 400,
							lineHeight: "16px",
							color: "#52525c",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "1px",
							width: "calc(100% - 120px)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{fighters}
					</p>
				</div>

				{/* PREVIEW ONLYバッジ（右下） */}
				<div
					style={{
						position: "absolute",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						border: "1px solid #52525c",
						borderRadius: "8px",
						height: "22px",
						right: "12px",
						bottom: "12px",
						width: "107.234px",
						zIndex: 1,
					}}
				>
					<div
						style={{
							height: "22px",
							overflow: "hidden",
							position: "relative",
							borderRadius: "inherit",
							width: "100%",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "12px",
								fontWeight: 500,
								lineHeight: "16px",
								color: "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "9px",
								top: "4px",
							}}
						>
							PREVIEW ONLY
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
