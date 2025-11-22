interface PremiumTicketPromptProps {
	hasPremiumTicket?: boolean;
}

export function PremiumTicketPrompt({ hasPremiumTicket = false }: PremiumTicketPromptProps) {
	if (hasPremiumTicket) {
		return null;
	}

	return (
		<div
			style={{
				backgroundColor: "rgba(253, 199, 0, 0.1)",
				border: "1px solid rgba(253, 199, 0, 0.3)",
				borderRadius: "10px",
				padding: "17px",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				width: "100%",
				boxSizing: "border-box",
			}}
		>
			{/* タイトル */}
			<div
				style={{
					height: "24px",
					position: "relative",
					width: "100%",
				}}
			>
				<p
					style={{
						fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
						fontSize: "16px",
						fontWeight: 400,
						lineHeight: "24px",
						color: "#fdc700",
						margin: 0,
						position: "absolute",
						left: 0,
						top: "-0.5px",
						letterSpacing: "-0.3125px",
					}}
				>
					💡 プレミアムチケットが必要です
				</p>
			</div>

			{/* 説明 */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "4px",
					width: "100%",
				}}
			>
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
							color: "#d4d4d8",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "0.5px",
							letterSpacing: "-0.1504px",
						}}
					>
						プレミアムチケットを持っていない場合、10秒間のプレビュー動画のみ視聴できます。
					</p>
				</div>
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
							color: "#d4d4d8",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "0.5px",
							letterSpacing: "-0.1504px",
						}}
					>
						好きな試合のチケットを購入すると、完全版を視聴できます。
					</p>
				</div>
			</div>
		</div>
	);
}

