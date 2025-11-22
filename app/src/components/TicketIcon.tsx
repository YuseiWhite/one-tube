// チケットアイコンコンポーネント
// プレミアムチケット所有時は虹色になる

const imgVector = "https://www.figma.com/api/mcp/asset/f6e2b09b-c861-4eb1-b7de-4b571ad666a4";
const imgVector1 = "https://www.figma.com/api/mcp/asset/2d495240-73f8-4673-a113-b27dd6972e62";

interface TicketIconProps {
	isPremium?: boolean;
}

export function TicketIcon({ isPremium = false }: TicketIconProps) {
	return (
		<div
			style={{
				position: "relative",
				width: "40px",
				height: "40px",
				overflow: "hidden",
			}}
		>
			{/* ベースのVector */}
			<div
				style={{
					position: "absolute",
					inset: "20.83% 8.33%",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: "-7.14% -5%",
					}}
				>
					<img
						alt=""
						src={imgVector}
						style={{
							width: "100%",
							height: "100%",
							display: "block",
							filter: isPremium
								? "brightness(1.2) saturate(1.5) hue-rotate(0deg)"
								: "none",
						}}
					/>
				</div>
			</div>

			{/* 上部のVector */}
			<div
				style={{
					position: "absolute",
					inset: "20.83% 45.83% 70.83% 54.17%",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: "-50% -1.67px",
					}}
				>
					<img
						alt=""
						src={imgVector1}
						style={{
							width: "100%",
							height: "100%",
							display: "block",
							filter: isPremium
								? "brightness(1.2) saturate(1.5) hue-rotate(0deg)"
								: "none",
						}}
					/>
				</div>
			</div>

			{/* 下部のVector */}
			<div
				style={{
					position: "absolute",
					inset: "70.83% 45.83% 20.83% 54.17%",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: "-50% -1.67px",
					}}
				>
					<img
						alt=""
						src={imgVector1}
						style={{
							width: "100%",
							height: "100%",
							display: "block",
							filter: isPremium
								? "brightness(1.2) saturate(1.5) hue-rotate(0deg)"
								: "none",
						}}
					/>
				</div>
			</div>

			{/* 中央のVector */}
			<div
				style={{
					position: "absolute",
					inset: "45.83% 45.83% 45.83% 54.17%",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: "-50% -1.67px",
					}}
				>
					<img
						alt=""
						src={imgVector1}
						style={{
							width: "100%",
							height: "100%",
							display: "block",
							filter: isPremium
								? "brightness(1.2) saturate(1.5) hue-rotate(0deg)"
								: "none",
						}}
					/>
				</div>
			</div>
		</div>
	);
}

