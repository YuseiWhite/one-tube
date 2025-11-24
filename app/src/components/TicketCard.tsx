import { useState } from "react";
import type { MockTicket } from "../mocks/tickets";

/**
 * チケットカードコンポーネント（レスポンシブ対応版）
 *
 * レイアウト方針:
 * - position: absolute を極力削除し、flexbox ベースに変更
 * - 固定幅 (334px) を削除し、親コンテナに合わせて width: 100%
 * - 画面幅に応じて自然に縮小・拡大
 *
 * ブレークポイント対応:
 * - モバイル（〜767px）: 1カラム
 * - タブレット（768〜1199px）: 2カラム
 * - PC（1200px〜）: 3カラム
 */
export function TicketCard({
	ticket,
	onPurchase,
	isPurchasing = false,
}: {
	ticket: MockTicket;
	onPurchase?: () => void;
	isPurchasing?: boolean;
}) {
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
				border: isHovered ? "1px solid #fdc700" : "1px solid #27272a",
				borderRadius: "10px",
				overflow: "hidden",
				width: "100%", // 親コンテナの幅に合わせる
				display: "flex",
				flexDirection: "column",
				transform: isHovered ? "translateY(-2px)" : "translateY(0)",
				boxShadow: isHovered ? "0 10px 25px rgba(0, 0, 0, 0.3)" : "none",
				transition: "all 0.2s ease",
			}}
		>
			{/* 黄色のヘッダーバー */}
			<div
				style={{
					backgroundColor: "#fdc700",
					padding: "8px 16px",
					minHeight: "40px",
					display: "flex",
					alignItems: "center",
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
						width: "100%",
						wordBreak: "break-word", // 長いテキストを折り返す
					}}
				>
					{ticket.eventTitle}
				</p>
			</div>

			{/* 画像セクション */}
			<div
				style={{
					position: "relative",
					padding: "16px",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "8px",
					}}
				>
					{/* 左側の画像 */}
					<div
						style={{
							position: "relative",
							width: "100%",
							paddingTop: "130%", // アスペクト比を維持（約 1:1.3）
							borderRadius: "10px",
							overflow: "hidden",
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
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
									objectPosition: "50% 20%",
									filter: isPremiumOwned ? "none" : "grayscale(100%)",
									opacity: isPremiumOwned ? 1 : 0.7,
									transition: "filter 0.3s ease, opacity 0.3s ease",
								}}
							/>
						) : (
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#71717b",
									fontSize: "12px",
									fontFamily: "'Inter', sans-serif",
									textAlign: "center",
									padding: "8px",
								}}
							>
								{ticket.fighter1}
							</div>
						)}
					</div>

					{/* 右側の画像 */}
					<div
						style={{
							position: "relative",
							width: "100%",
							paddingTop: "130%", // アスペクト比を維持
							borderRadius: "10px",
							overflow: "hidden",
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
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
									objectPosition: "50% 20%",
									filter: isPremiumOwned ? "none" : "grayscale(100%)",
									opacity: isPremiumOwned ? 1 : 0.7,
									transition: "filter 0.3s ease, opacity 0.3s ease",
								}}
							/>
						) : (
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#71717b",
									fontSize: "12px",
									fontFamily: "'Inter', sans-serif",
									textAlign: "center",
									padding: "8px",
								}}
							>
								{ticket.fighter2}
							</div>
						)}
					</div>
				</div>

				{/* NOT OWNED / OWNED バッジ */}
				<div
					style={{
						position: "absolute",
						top: "16px",
						right: "16px",
						backgroundColor: "rgba(24, 24, 27, 0.8)",
						border: "1px solid #3f3f46",
						borderRadius: "8px",
						padding: "3px 9px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "12px",
							fontWeight: 500,
							lineHeight: "16px",
							color: isPremiumOwned ? "#fdc700" : "#9f9fa9",
							margin: 0,
							whiteSpace: "nowrap",
						}}
					>
						{isPremiumOwned ? "OWNED" : "NOT OWNED"}
					</p>
				</div>
			</div>

			{/* コンテンツセクション */}
			<div
				style={{
					padding: "0 16px 16px 16px",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					flex: 1, // 残りのスペースを埋める
				}}
			>
				{/* ファイター情報 */}
				<div>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "18px",
							fontWeight: 500,
							lineHeight: "27px",
							color: "#fdc700",
							letterSpacing: "0.0105px",
							margin: "0 0 4px 0",
							wordBreak: "break-word", // 長い名前を折り返す
						}}
					>
						{ticket.fighter1} vs {ticket.fighter2}
					</p>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: "#9f9fa9",
							letterSpacing: "-0.3125px",
							margin: 0,
						}}
					>
						{ticket.location}
					</p>
				</div>

				{/* チケット価格情報 */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						padding: "0 8px",
					}}
				>
					{/* 物理チケット */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
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
							}}
						>
							物理チケット:
						</p>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								color: "#d4d4d8",
								letterSpacing: "-0.3125px",
								margin: 0,
								whiteSpace: "nowrap",
							}}
						>
							{ticket.physicalTicketPrice}
						</p>
					</div>
					{/* プレミアム */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap", // 長いテキストの場合は折り返す
							gap: "4px",
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
							}}
						>
							プレミアム:
						</p>
						<p
							style={{
								fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								color: "#d4d4d8",
								letterSpacing: "-0.3125px",
								margin: 0,
								whiteSpace: "nowrap",
							}}
						>
							{ticket.premiumPrice}（{ticket.premiumFee}）
						</p>
					</div>
				</div>

				{/* 残りチケット数 */}
				<div
					style={{
						display: "flex",
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

				{/* スペーサー（ボタンを下に押し下げる） */}
				<div style={{ flex: 1, minHeight: "8px" }} />

				{/* ボタンセクション */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "8px",
					}}
				>
					{/* BUY PREMIUM TICKET / OWNED ボタン */}
					<button
						onClick={() => onPurchase && onPurchase()}
						disabled={isPremiumButtonDisabled || isPurchasing}
						onMouseEnter={() => setIsPremiumButtonHovered(true)}
						onMouseLeave={() => setIsPremiumButtonHovered(false)}
						style={{
							backgroundColor: premiumButtonStyle.backgroundColor,
							height: "36px",
							borderRadius: "8px",
							border: premiumButtonStyle.border,
							width: "100%",
							cursor: isPurchasing ? "wait" : premiumButtonStyle.cursor,
							opacity: isPurchasing ? 0.6 : premiumButtonStyle.opacity,
							transition: premiumButtonStyle.transition,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
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
								whiteSpace: "nowrap",
							}}
						>
							{isPurchasing ? "購入中..." : isPremiumOwned ? "OWNED" : "BUY PREMIUM TICKET"}
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
							cursor: regularButtonStyle.cursor,
							opacity: regularButtonStyle.opacity,
							transition: regularButtonStyle.transition,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
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
								whiteSpace: "nowrap",
							}}
						>
							BUY TICKET
						</p>
					</button>
				</div>
			</div>
		</div>
	);
}
