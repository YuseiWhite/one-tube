const img = "https://www.figma.com/api/mcp/asset/2839efea-21f5-432a-a410-f8e4af806ad6";
const img1 = "https://www.figma.com/api/mcp/asset/a97a2a2d-5547-4837-8539-f43b64c6b891";

interface VideoTitleSectionProps {
	title: string;
	likeCount?: number;
	premiumLikeCount?: number;
	onLike?: () => void;
	onPremiumLike?: () => void;
	hasPremiumTicket?: boolean;
}

export function VideoTitleSection({
	title,
	likeCount = 123,
	premiumLikeCount = 45,
	onLike,
	onPremiumLike,
	hasPremiumTicket = false,
}: VideoTitleSectionProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "space-between",
				width: "100%",
			}}
		>
			{/* タイトル */}
			<div
				style={{
					flex: "1 0 0",
					minHeight: "1px",
					minWidth: "1px",
					position: "relative",
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
					{title}
				</p>
			</div>

			{/* リアクション */}
			<div
				style={{
					height: "44px",
					position: "relative",
					width: "64px",
				}}
			>
				{/* 通常いいね */}
				<div
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						width: "24px",
						height: "44px",
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						alignItems: "center",
						cursor: "pointer",
					}}
					onClick={onLike}
				>
					<div
						style={{
							width: "24px",
							height: "24px",
							position: "relative",
						}}
					>
						<img
							alt="いいね"
							src={img}
							style={{
								width: "100%",
								height: "100%",
								display: "block",
							}}
						/>
					</div>
					<div
						style={{
							height: "16px",
							position: "relative",
							width: "20.336px",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "16px",
								color: "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "50%",
								top: "1px",
								transform: "translateX(-50%)",
								textAlign: "center",
							}}
						>
							{likeCount}
						</p>
					</div>
				</div>

				{/* プレミアムいいね */}
				<div
					style={{
						position: "absolute",
						left: "40px",
						top: 0,
						width: "24px",
						height: "44px",
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						alignItems: "center",
						cursor: hasPremiumTicket ? "pointer" : "not-allowed",
						opacity: hasPremiumTicket ? 1 : 0.5,
					}}
					onClick={hasPremiumTicket ? onPremiumLike : undefined}
				>
					<div
						style={{
							width: "24px",
							height: "24px",
							position: "relative",
						}}
					>
						<img
							alt="プレミアムいいね"
							src={img1}
							style={{
								width: "100%",
								height: "100%",
								display: "block",
							}}
						/>
					</div>
					<div
						style={{
							height: "16px",
							position: "relative",
							width: "15.141px",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "12px",
								fontWeight: 400,
								lineHeight: "16px",
								color: "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "50%",
								top: "1px",
								transform: "translateX(-50%)",
								textAlign: "center",
							}}
						>
							{premiumLikeCount}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

