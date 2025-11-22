interface VideoInfoProps {
	uploadDate?: string;
	athletes?: string;
	venue?: string;
	duration?: string;
	blobId?: string;
	walruscanUrl?: string;
}

export function VideoInfo({
	uploadDate = "2024.01.15",
	athletes = "Superbon vs Masaaki Noiri",
	venue = "Ariake Arena",
	duration = "1:50:00",
	blobId = "xFp9kLmN3qW8rT2vY7sH4jK6gD1aE5cB",
	walruscanUrl = "https://walruscan.com/testnet",
}: VideoInfoProps) {
	return (
		<div
			style={{
				height: "176px",
				position: "relative",
				width: "100%",
			}}
		>
			{/* アップロード日 */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					height: "24px",
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
						margin: 0,
						position: "absolute",
						left: 0,
						top: "-0.5px",
						letterSpacing: "-0.3125px",
					}}
				>
					📅 uploaded {uploadDate} to Walrus
				</p>
			</div>

			{/* アスリート */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: "32px",
					height: "24px",
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
						margin: 0,
						position: "absolute",
						left: 0,
						top: "-0.5px",
						letterSpacing: "-0.3125px",
					}}
				>
					🥊 Athletes: {athletes}
				</p>
			</div>

			{/* 会場 */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: "64px",
					height: "24px",
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
						margin: 0,
						position: "absolute",
						left: 0,
						top: "-0.5px",
						letterSpacing: "-0.3125px",
					}}
				>
					🏟 {venue}
				</p>
			</div>

			{/* 時間 */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: "96px",
					height: "24px",
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
						margin: 0,
						position: "absolute",
						left: 0,
						top: "-0.5px",
						letterSpacing: "-0.3125px",
					}}
				>
					⏱ {duration}
				</p>
			</div>

			{/* Blob ID */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: "128px",
					height: "16px",
					width: "100%",
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
						left: 0,
						top: "1px",
					}}
				>
					blob id: {blobId}
				</p>
			</div>

			{/* Walruscanリンク */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: "154.5px",
					height: "19px",
					width: "100%",
				}}
			>
				<a
					href={walruscanUrl}
					target="_blank"
					rel="noopener noreferrer"
					style={{
						fontFamily: "'Inter', sans-serif",
						fontSize: "16px",
						fontWeight: 400,
						lineHeight: "24px",
						color: "#fdc700",
						textDecoration: "underline",
						textUnderlinePosition: "from-font",
						letterSpacing: "-0.3125px",
					}}
				>
					Walruscan: {walruscanUrl}
				</a>
			</div>
		</div>
	);
}

