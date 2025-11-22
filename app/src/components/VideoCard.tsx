import { useState } from "react";
import type { Video } from "../shared/types";
import { TicketIcon } from "./TicketIcon";

interface VideoCardProps {
	video: Video;
	isSelected?: boolean;
	onClick?: () => void;
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

// 動画タイトルからアップロード日を生成（モック）
function getUploadDate(video: Video): string {
	// 実際の実装では、videoオブジェクトにuploadDateフィールドを追加するか、
	// メタデータから取得する必要があります
	// ここではモックデータとして使用
	const mockDates: Record<string, string> = {
		"Superbon vs Masaaki Noiri - full match": "2024.01.15",
		"Superbon vs Masaaki Noiri - KO Scene": "2024.01.15",
		"Rodtang vs Prajanchai - Highlights": "2024.02.20",
		"Tawanchai vs Nattawut - Championship Round": "2024.03.10",
	};
	return mockDates[video.title] || "2024.01.01";
}

// サムネイル画像URLを取得（モック）
function getThumbnailUrl(video: Video): string {
	// 実際の実装では、videoオブジェクトにthumbnailUrlフィールドを追加するか、
	// メタデータから取得する必要があります
	// ここではFigmaから取得した画像URLを使用
	const mockThumbnails: Record<string, string> = {
		"Superbon vs Masaaki Noiri - full match": "https://www.figma.com/api/mcp/asset/6638386c-6fa0-48de-8848-55effd26058a",
		"Superbon vs Masaaki Noiri - KO Scene": "https://www.figma.com/api/mcp/asset/2a71a307-7710-4393-9b01-f8f71bc14dac",
		"Rodtang vs Prajanchai - Highlights": "https://www.figma.com/api/mcp/asset/cab61810-9763-401b-8781-bfb5f521e2da",
		"Tawanchai vs Nattawut - Championship Round": "https://www.figma.com/api/mcp/asset/47e85b42-0776-49aa-a8d1-30d9f51c897d",
	};
	return mockThumbnails[video.title] || "";
}

// プレミアムチケット所有状態を判定（モック）
function isPremiumOwned(video: Video): boolean {
	// 実際の実装では、ユーザーのNFT所有状態を確認する必要があります
	// ここでは最初のカードのみ所有状態とします
	return video.id === "1" || false;
}

export function VideoCard({ video, isSelected = false, onClick }: VideoCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const thumbnailUrl = getThumbnailUrl(video);
	const fighters = extractFightersFromTitle(video.title);
	const uploadDate = getUploadDate(video);
	const hasPremiumTicket = isPremiumOwned(video);

	return (
		<div
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: "#18181b",
				borderRadius: "10px",
				height: "auto",
				overflow: "hidden",
				position: "relative",
				width: "100%",
				maxWidth: "351px",
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

				{/* PREVIEW ONLYバッジ（右上） */}
				<div
					style={{
						position: "absolute",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						border: "1px solid #52525c",
						borderRadius: "8px",
						height: "22px",
						right: "8px",
						top: "10.5px",
						width: "107.234px",
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
							position: "absolute",
							left: "8px",
							top: "5px",
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
						}}
					>
						{fighters}
					</p>
				</div>
			</div>
		</div>
	);
}
