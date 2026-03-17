import { useNavigate } from "react-router-dom";

const TICKETS_ICON_URL = "https://www.figma.com/api/mcp/asset/2efb565f-adc6-4c76-b62c-1dcafea97d29";
const VIDEOS_ICON_URL = "https://www.figma.com/api/mcp/asset/54fcc869-881d-4b88-ad2a-0a19ee111257";

export type PageType = "tickets" | "videos";

interface SidebarProps {
	currentPage: PageType;
}

export function Sidebar({ currentPage }: SidebarProps) {
	const navigate = useNavigate();
	return (
		<div
			style={{
				backgroundColor: "#18181b",
				borderRight: "1px solid #27272a",
				width: "320px",
				height: "100%",
				minHeight: "100%",
				position: "relative",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* ナビゲーション部分 */}
			<div
				style={{
					paddingTop: "16px",
					paddingLeft: "16px",
					paddingRight: "16px",
					paddingBottom: "0",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					width: "319px",
					height: "136px",
					boxSizing: "border-box",
					position: "absolute",
					left: 0,
					top: 0,
				}}
			>
				{/* TICKETS ボタン */}
				<button
					onClick={() => navigate("/tickets")}
					onMouseEnter={(e) => {
						if (currentPage !== "tickets") {
							e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
						}
					}}
					onMouseLeave={(e) => {
						if (currentPage !== "tickets") {
							e.currentTarget.style.backgroundColor = "transparent";
						}
					}}
					style={{
						backgroundColor: currentPage === "tickets" ? "#27272a" : "transparent",
						borderLeft: currentPage === "tickets" ? "4px solid #fdc700" : "4px solid transparent",
						borderTop: "none",
						borderRight: "none",
						borderBottom: "none",
						borderRadius: "10px",
						height: "48px",
						paddingLeft: "20px",
						paddingRight: "0",
						paddingTop: "0",
						paddingBottom: "0",
						display: "flex",
						alignItems: "center",
						gap: "12px",
						cursor: "pointer",
						width: "100%",
						boxSizing: "border-box",
						transition: "background-color 0.2s ease",
					}}
				>
					<div
						style={{
							width: "20px",
							height: "20px",
							flexShrink: 0,
						}}
					>
						<img
							src={TICKETS_ICON_URL}
							alt="Tickets"
							style={{
								width: "100%",
								height: "100%",
								display: "block",
								filter: currentPage === "tickets" 
									? "brightness(0) saturate(100%) invert(84%) sepia(100%) saturate(7498%) hue-rotate(1deg) brightness(99%) contrast(99%)"
									: "brightness(0) saturate(100%) invert(62%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
								opacity: currentPage === "tickets" ? 1 : 1,
							}}
						/>
					</div>
					<span
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: currentPage === "tickets" ? "#fdc700" : "#9f9fa9",
							letterSpacing: "0.4875px",
						}}
					>
						TICKETS
					</span>
				</button>

				{/* VIDEOS ボタン */}
				<button
					onClick={() => navigate("/videos")}
					onMouseEnter={(e) => {
						if (currentPage !== "videos") {
							e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
						}
					}}
					onMouseLeave={(e) => {
						if (currentPage !== "videos") {
							e.currentTarget.style.backgroundColor = "transparent";
						}
					}}
					style={{
						backgroundColor: currentPage === "videos" ? "#27272a" : "transparent",
						borderLeft: currentPage === "videos" ? "4px solid #fdc700" : "4px solid transparent",
						borderTop: "none",
						borderRight: "none",
						borderBottom: "none",
						borderRadius: "10px",
						height: "48px",
						paddingLeft: "16px",
						paddingRight: "0",
						paddingTop: "0",
						paddingBottom: "0",
						display: "flex",
						alignItems: "center",
						gap: "12px",
						cursor: "pointer",
						width: "100%",
						boxSizing: "border-box",
						transition: "background-color 0.2s ease",
					}}
				>
					<div
						style={{
							width: "20px",
							height: "20px",
							flexShrink: 0,
						}}
					>
						<img
							src={VIDEOS_ICON_URL}
							alt="Videos"
							style={{
								width: "100%",
								height: "100%",
								display: "block",
								filter: currentPage === "videos" 
									? "brightness(0) saturate(100%) invert(84%) sepia(100%) saturate(7498%) hue-rotate(1deg) brightness(99%) contrast(99%)"
									: "brightness(0) saturate(100%) invert(62%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
								opacity: currentPage === "videos" ? 1 : 1,
							}}
						/>
					</div>
					<span
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: currentPage === "videos" ? "#fdc700" : "#9f9fa9",
							letterSpacing: "0.4875px",
						}}
					>
						VIDEOS
					</span>
				</button>
			</div>

			{/* プレミアムチケットについての説明セクション */}
			<div
				style={{
					position: "absolute",
					left: "16px",
					top: "136px",
					width: "287px",
					backgroundColor: "rgba(24, 24, 27, 0.5)",
					border: "1px solid rgba(39, 39, 42, 0.5)",
					borderRadius: "10px",
					paddingTop: "17px",
					paddingLeft: "17px",
					paddingRight: "17px",
					paddingBottom: "1px",
					display: "flex",
					flexDirection: "column",
					gap: "12px",
					boxSizing: "border-box",
				}}
			>
				{/* タイトル */}
				<div
					style={{
						height: "20px",
						position: "relative",
						width: "100%",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
							fontSize: "14px",
							fontWeight: 400,
							lineHeight: "20px",
							color: "#fdc700",
							letterSpacing: "-0.1504px",
							margin: 0,
						}}
					>
						About Premium Tickets
					</p>
				</div>

				{/* 本文 */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						width: "100%",
					}}
				>
					<div
						style={{
							minHeight: "39px",
							position: "relative",
							width: "100%",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "19.5px",
								color: "#9f9fa9",
								margin: 0,
								whiteSpace: "pre-wrap",
								width: "100%",
								wordWrap: "break-word",
							}}
						>
							Purchase a Premium Ticket to watch unlimited past matches for 1 month!
						</p>
					</div>

					<div
						style={{
							minHeight: "58.5px",
							position: "relative",
							width: "100%",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "19.5px",
								color: "#9f9fa9",
								margin: 0,
								whiteSpace: "pre-wrap",
								width: "100%",
								wordWrap: "break-word",
							}}
						>
							70% of the Premium Ticket purchase goes to the athletes through the platform!
						</p>
					</div>

					<div
						style={{
							height: "19.5px",
							position: "relative",
							width: "100%",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "19.5px",
								color: "#9f9fa9",
								margin: 0,
							}}
						>
							Support your favorite athletes!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

