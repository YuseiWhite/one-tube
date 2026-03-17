import { useState } from "react";

const img = "https://www.figma.com/api/mcp/asset/2839efea-21f5-432a-a410-f8e4af806ad6";
const img1 = "https://www.figma.com/api/mcp/asset/a97a2a2d-5547-4837-8539-f43b64c6b891";

// 弾むアニメーションのスタイル
const bounceAnimation = `
	@keyframes bounceLike {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.4);
		}
		70% {
			transform: scale(0.95);
		}
		100% {
			transform: scale(1);
		}
	}
`;

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
	const [isLiked, setIsLiked] = useState(false);
	const [isPremiumLiked, setIsPremiumLiked] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [isPremiumAnimating, setIsPremiumAnimating] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const handleLikeClick = () => {
		if (!isAnimating) {
			setIsAnimating(true);
			setIsLiked(!isLiked);
			onLike?.();
			setTimeout(() => setIsAnimating(false), 400);
		}
	};

	const handlePremiumLikeClick = () => {
		if (hasPremiumTicket && !isPremiumAnimating) {
			setIsPremiumAnimating(true);
			setIsPremiumLiked(!isPremiumLiked);
			onPremiumLike?.();
			setTimeout(() => setIsPremiumAnimating(false), 400);
		}
	};
	return (
		<>
			<style>{bounceAnimation}</style>
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
					onClick={handleLikeClick}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div
						style={{
							width: "24px",
							height: "24px",
							position: "relative",
							animation: isAnimating ? "bounceLike 0.4s ease-out" : "none",
						}}
					>
						{isLiked ? (
							// 赤く塗りつぶされたハート
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
									fill="#ef4444"
								/>
							</svg>
						) : isHovered ? (
							// ホバー時：赤い線のハート
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
									stroke="#ef4444"
									strokeWidth="1.5"
									fill="none"
								/>
							</svg>
						) : (
							<img
								alt="Like"
								src={img}
								style={{
									width: "100%",
									height: "100%",
									display: "block",
								}}
							/>
						)}
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
								color: isLiked ? "#ef4444" : "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "50%",
								top: "1px",
								transform: "translateX(-50%)",
								textAlign: "center",
								transition: "color 0.2s ease",
							}}
						>
							{isLiked ? likeCount + 1 : likeCount}
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
					onClick={handlePremiumLikeClick}
				>
					<div
						style={{
							width: "24px",
							height: "24px",
							position: "relative",
							animation: isPremiumAnimating ? "bounceLike 0.4s ease-out" : "none",
						}}
					>
						{isPremiumLiked ? (
							// 虹色のハート
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<defs>
									<linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
										<stop offset="0%" stopColor="#ff0000" />
										<stop offset="16.66%" stopColor="#ff7f00" />
										<stop offset="33.33%" stopColor="#ffff00" />
										<stop offset="50%" stopColor="#00ff00" />
										<stop offset="66.66%" stopColor="#0000ff" />
										<stop offset="83.33%" stopColor="#4b0082" />
										<stop offset="100%" stopColor="#9400d3" />
									</linearGradient>
								</defs>
								<path
									d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
									fill="url(#rainbowGradient)"
								/>
							</svg>
						) : (
							<img
								alt="Premium Like"
								src={img1}
								style={{
									width: "100%",
									height: "100%",
									display: "block",
								}}
							/>
						)}
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
								color: isPremiumLiked ? "#fdc700" : "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "50%",
								top: "1px",
								transform: "translateX(-50%)",
								textAlign: "center",
								transition: "color 0.2s ease",
							}}
						>
							{isPremiumLiked ? premiumLikeCount + 1 : premiumLikeCount}
						</p>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}

