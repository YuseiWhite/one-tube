import { useState } from "react";

export function CommentForm() {
	const [comment, setComment] = useState("");

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				width: "100%",
				paddingTop: "17px",
				borderTop: "1px solid #27272a",
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
					}}
				>
					Comments
				</p>
			</div>

			{/* コメント入力エリア */}
			<div
				style={{
					height: "176px",
					position: "relative",
					width: "100%",
				}}
			>
				{/* テキストエリア */}
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Enter your comment..."
					style={{
						backgroundColor: "#18181b",
						border: "1px solid #3f3f46",
						borderRadius: "8px",
						width: "100%",
						height: "100px",
						padding: "8px 12px",
						fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
						fontSize: "14px",
						fontWeight: 400,
						lineHeight: "20px",
						color: "#ffffff",
						resize: "none",
						boxSizing: "border-box",
					}}
				/>

				{/* 送信ボタン */}
				<button
					disabled
					style={{
						position: "absolute",
						left: 0,
						top: "112px",
						backgroundColor: "#fdc700",
						opacity: 0.5,
						borderRadius: "8px",
						height: "36px",
						width: "60px",
						border: "none",
						cursor: "not-allowed",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
							fontSize: "14px",
							fontWeight: 500,
							lineHeight: "20px",
							color: "#000000",
							margin: 0,
							position: "absolute",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							textAlign: "center",
							letterSpacing: "-0.1504px",
						}}
					>
						Submit
					</p>
				</button>

				{/* 開発中メッセージ */}
				<div
					style={{
						position: "absolute",
						left: 0,
						top: "160px",
						height: "16px",
						width: "100%",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
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
						※ Comment feature is under development
					</p>
				</div>
			</div>
		</div>
	);
}

