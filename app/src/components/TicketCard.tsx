import { useState } from "react";
import type { TicketData } from "../types/ticket";

// チケットカードコンポーネント
export function TicketCard({ ticket }: { ticket: TicketData }) {
	const [isHovered, setIsHovered] = useState(false);
	const [isPremiumButtonHovered, setIsPremiumButtonHovered] = useState(false);
	const [isRegularButtonHovered, setIsRegularButtonHovered] = useState(false);
	const [leftImageError, setLeftImageError] = useState(false);
	const [rightImageError, setRightImageError] = useState(false);
	
	const isAvailable = ticket.isAvailable;
	const isPremiumOwned = ticket.isPremiumOwned || false;
	
	// ボタンの有効/無効状態
	const isPremiumButtonDisabled = !isAvailable || isPremiumOwned;
	const isRegularButtonDisabled = !isAvailable || isPremiumOwned;
	
	// ボタンのスタイル
	const premiumButtonStyle = isPremiumOwned
		? {
				backgroundColor: "#3f3f46",
				color: "#71717b",
				border: "none",
				cursor: "not-allowed",
				opacity: 0.6,
				transition: "all 0.2s ease",
			}
		: isAvailable
			? {
					backgroundColor: isPremiumButtonHovered ? "#000000" : "#fdc700",
					color: isPremiumButtonHovered ? "#fdc700" : "#000000",
					border: isPremiumButtonHovered ? "1px solid #fdc700" : "none",
					cursor: "pointer",
					opacity: 1,
					transition: "all 0.2s ease",
				}
			: {
					backgroundColor: "#fdc700",
					color: "#000000",
					border: "none",
					cursor: "not-allowed",
					opacity: 0.5,
					transition: "all 0.2s ease",
				};
	
	const regularButtonStyle = isPremiumOwned
		? {
				backgroundColor: "#3f3f46",
				border: "1px solid #3f3f46",
				color: "#71717b",
				cursor: "not-allowed",
				opacity: 0.6,
				transition: "all 0.2s ease",
			}
		: isAvailable
			? {
					backgroundColor: isRegularButtonHovered ? "#000000" : "#ffffff",
					border: isRegularButtonHovered ? "1px solid #fdc700" : "1px solid #3f3f46",
					color: isRegularButtonHovered ? "#fdc700" : "#9f9fa9",
					cursor: "pointer",
					opacity: 1,
					transition: "all 0.2s ease",
				}
			: {
					backgroundColor: "#ffffff",
					border: "1px solid #3f3f46",
					color: "#9f9fa9",
					cursor: "not-allowed",
					opacity: 0.5,
					transition: "all 0.2s ease",
				};

	return (
		<div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: "#09090b", // zinc-950
				border: isHovered ? "1px solid #fdc700" : "1px solid #27272a", // ホバー時に黄色の縁
				borderRadius: "10px",
				position: "relative",
				height: "612px",
				overflow: "hidden",
				width: "100%",
				transform: isHovered ? "translateY(-2px)" : "translateY(0)",
				boxShadow: isHovered ? "0 10px 25px rgba(0, 0, 0, 0.3)" : "none",
				transition: "all 0.2s ease",
			}}
		>
			{/* 黄色のヘッダーバー */}
			<div
				style={{
					backgroundColor: "#fdc700",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					height: "40px",
					alignItems: "flex-start",
					left: "1px",
					paddingTop: "8px",
					paddingLeft: "16px",
					paddingRight: "16px",
					paddingBottom: 0,
					top: "1px",
					width: "334px",
					position: "absolute",
				}}
			>
				<div
					style={{
						height: "24px",
						overflow: "hidden",
						position: "relative",
						flexShrink: 0,
						width: "100%",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: "#000000",
							letterSpacing: "0.4875px",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "-0.5px",
							whiteSpace: "pre-wrap",
							width: "357px",
						}}
					>
						{ticket.eventTitle}
					</p>
				</div>
			</div>

			{/* 画像セクション */}
			<div
				style={{
					position: "absolute",
					height: "228px",
					left: "1px",
					top: "41px",
					width: "334px",
				}}
			>
				<div
					style={{
						position: "absolute",
						boxSizing: "border-box",
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "8px",
						height: "228px",
						left: 0,
						padding: "16px",
						top: 0,
						width: "334px",
					}}
				>
					{/* 左側の画像 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							overflow: "hidden",
							position: "relative",
							borderRadius: "10px",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								height: "196px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
								backgroundColor: "#18181b",
							}}
						>
							{!leftImageError ? (
								<img
									alt={ticket.fighter1}
									src={ticket.leftImageUrl}
									onError={() => setLeftImageError(true)}
									style={{
										position: "absolute",
										inset: 0,
										maxWidth: "none",
										objectFit: "cover",
										objectPosition: "50% 20%", // 顔写真がより見やすくなるように調整
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
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#71717b",
										fontSize: "12px",
										fontFamily: "'Inter', sans-serif",
									}}
								>
									{ticket.fighter1}
								</div>
							)}
						</div>
					</div>
					{/* 右側の画像 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							overflow: "hidden",
							position: "relative",
							borderRadius: "10px",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								height: "196px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
								backgroundColor: "#18181b",
							}}
						>
							{!rightImageError ? (
								<img
									alt={ticket.fighter2}
									src={ticket.rightImageUrl}
									onError={() => setRightImageError(true)}
									style={{
										position: "absolute",
										inset: 0,
										maxWidth: "none",
										objectFit: "cover",
										objectPosition: "50% 20%", // 顔写真がより見やすくなるように調整
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
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#71717b",
										fontSize: "12px",
										fontFamily: "'Inter', sans-serif",
									}}
								>
									{ticket.fighter2}
								</div>
							)}
						</div>
					</div>
				</div>
				{/* NOT OWNED / OWNED バッジ */}
				{!isPremiumOwned && (
					<div
						style={{
							position: "absolute",
							backgroundColor: "rgba(24, 24, 27, 0.8)",
							border: "1px solid #3f3f46",
							height: "22px",
							left: "229.18px",
							borderRadius: "8px",
							top: "14.5px",
							width: "92.82px",
						}}
					>
						<div
							style={{
								height: "22px",
								overflow: "hidden",
								position: "relative",
								borderRadius: "inherit",
								width: "92.82px",
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
								NOT OWNED
							</p>
						</div>
					</div>
				)}
				{isPremiumOwned && (
					<div
						style={{
							position: "absolute",
							backgroundColor: "rgba(24, 24, 27, 0.8)",
							border: "1px solid #3f3f46",
							height: "22px",
							left: "229.18px",
							borderRadius: "8px",
							top: "14.5px",
							width: "92.82px",
						}}
					>
						<div
							style={{
								height: "22px",
								overflow: "hidden",
								position: "relative",
								borderRadius: "inherit",
								width: "92.82px",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "12px",
									fontWeight: 500,
									lineHeight: "16px",
									color: "#fdc700",
									margin: 0,
									position: "absolute",
									left: "9px",
									top: "4px",
								}}
							>
								OWNED
							</p>
						</div>
					</div>
				)}
			</div>

			{/* コンテンツセクション */}
			<div
				style={{
					position: "absolute",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					height: "342px",
					alignItems: "flex-start",
					left: "1px",
					paddingLeft: "16px",
					paddingRight: 0,
					paddingTop: "16px",
					paddingBottom: "16px",
					top: "269px",
					width: "334px",
				}}
			>
				{/* ファイター情報 */}
				<div
					style={{
						height: "78px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							height: "78px",
							alignItems: "flex-start",
							position: "relative",
							width: "302px",
						}}
					>
						<div
							style={{
								height: "54px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "18px",
									fontWeight: 500,
									lineHeight: "27px",
									color: "#fdc700",
									letterSpacing: "0.0105px",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "0.5px",
									whiteSpace: "pre-wrap",
									width: "269px",
								}}
							>
								{ticket.fighter1} vs {ticket.fighter2}
							</p>
						</div>
						<div
							style={{
								height: "24px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "16px",
									fontWeight: 400,
									lineHeight: "24px",
									color: "#9f9fa9",
									letterSpacing: "-0.3125px",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "-0.5px",
								}}
							>
								{ticket.location}
							</p>
						</div>
					</div>
				</div>

				{/* チケット価格情報 */}
				<div
					style={{
						height: "56px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							height: "56px",
							alignItems: "flex-start",
							paddingLeft: "8px",
							paddingRight: "8px",
							paddingTop: 0,
							paddingBottom: 0,
							position: "relative",
							width: "302px",
						}}
					>
						{/* 物理チケット */}
						<div
							style={{
								display: "flex",
								height: "24px",
								alignItems: "flex-start",
								justifyContent: "space-between",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "100.438px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#71717b",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									物理チケット:
								</p>
							</div>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "69.219px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#d4d4d8",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									{ticket.physicalTicketPrice}
								</p>
							</div>
						</div>
						{/* プレミアム */}
						<div
							style={{
								display: "flex",
								height: "24px",
								alignItems: "flex-start",
								justifyContent: "space-between",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "82.68px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#71717b",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									プレミアム:
								</p>
							</div>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "173.672px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#d4d4d8",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
										whiteSpace: "nowrap",
									}}
								>
									{ticket.premiumPrice}（{ticket.premiumFee}）
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 残りチケット数 */}
				<div
					style={{
						height: "24px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: ticket.remainingTickets === "TICKETS NOT AVAILABLE" ? "#ef4444" : "#71717b",
							textAlign: "center",
							letterSpacing: "-0.3125px",
							margin: 0,
							whiteSpace: "nowrap",
						}}
					>
						{ticket.remainingTickets}
					</p>
				</div>

				{/* スペーサー */}
				<div
					style={{
						flex: "1 0 0",
						minHeight: "1px",
						minWidth: "1px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				/>

				{/* ボタンセクション */}
				<div
					style={{
						height: "80px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							height: "80px",
							alignItems: "flex-start",
							position: "relative",
							width: "302px",
						}}
					>
						{/* BUY PREMIUM TICKET / OWNED ボタン */}
						<button
							disabled={isPremiumButtonDisabled}
							onMouseEnter={() => setIsPremiumButtonHovered(true)}
							onMouseLeave={() => setIsPremiumButtonHovered(false)}
							style={{
								backgroundColor: premiumButtonStyle.backgroundColor,
								height: "36px",
								borderRadius: "8px",
								border: premiumButtonStyle.border,
								width: "100%",
								position: "relative",
								cursor: premiumButtonStyle.cursor,
								opacity: premiumButtonStyle.opacity,
								flexShrink: 0,
								transition: premiumButtonStyle.transition,
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "20px",
									color: premiumButtonStyle.color,
									textAlign: "center",
									letterSpacing: "-0.1504px",
									margin: 0,
									position: "absolute",
									left: "50%",
									top: "8.5px",
									transform: "translateX(-50%)",
									whiteSpace: "nowrap",
								}}
							>
								{isPremiumOwned ? "OWNED" : "BUY PREMIUM TICKET"}
							</p>
						</button>
						{/* BUY TICKET ボタン */}
						<button
							disabled={isRegularButtonDisabled}
							onMouseEnter={() => setIsRegularButtonHovered(true)}
							onMouseLeave={() => setIsRegularButtonHovered(false)}
							style={{
								backgroundColor: regularButtonStyle.backgroundColor,
								border: regularButtonStyle.border,
								height: "36px",
								borderRadius: "8px",
								width: "100%",
								position: "relative",
								cursor: regularButtonStyle.cursor,
								opacity: regularButtonStyle.opacity,
								flexShrink: 0,
								transition: regularButtonStyle.transition,
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "20px",
									color: regularButtonStyle.color,
									textAlign: "center",
									letterSpacing: "-0.1504px",
									margin: 0,
									position: "absolute",
									left: "50%",
									top: "8.5px",
									transform: "translateX(-50%)",
									whiteSpace: "nowrap",
								}}
							>
								BUY TICKET
							</p>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

