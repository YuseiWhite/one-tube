import { useState } from "react";
import { TicketCard } from "../components/TicketCard";
import { MOCK_TICKETS, type MockTicket } from "../mocks/tickets";

const REFRESH_ICON_URL = "https://www.figma.com/api/mcp/asset/3c0bd1f0-ca2b-4059-b9ed-c0b49ef0e814";

export function TicketsPage() {
	const [tickets, setTickets] = useState<MockTicket[]>(MOCK_TICKETS);
	const [purchasing, setPurchasing] = useState<string | null>(null);

	// リフレッシュボタン（モック: 初期状態に戻す）
	const handleRefresh = () => {
		setTickets(MOCK_TICKETS);
	};

	// 購入処理（完全にローカル状態のみ）
	const handlePurchase = async (ticketId: string) => {
		setPurchasing(ticketId);

		// 購入処理をシミュレート（500msの遅延）
		await new Promise((resolve) => setTimeout(resolve, 500));

		// チケットの所有状態を更新
		setTickets((prevTickets) =>
			prevTickets.map((ticket) =>
				ticket.id === ticketId
					? { ...ticket, isPremiumOwned: true }
					: ticket
			)
		);

		// localStorageに購入済みチケットIDを保存（VideosPageで参照）
		const ownedTickets = JSON.parse(localStorage.getItem("ownedTickets") || "[]");
		if (!ownedTickets.includes(ticketId)) {
			ownedTickets.push(ticketId);
			localStorage.setItem("ownedTickets", JSON.stringify(ownedTickets));
		}

		setPurchasing(null);
		alert("購入が完了しました！");
	};

	return (
		<div
			style={{
				backgroundColor: "#18181b",
				display: "flex",
				flexDirection: "column",
				gap: "24px",
				paddingTop: "32px",
				paddingLeft: "32px",
				paddingRight: "32px",
				paddingBottom: "32px",
				width: "100%",
				minHeight: "100%",
				boxSizing: "border-box",
			}}
		>
			{/* ヘッダー部分 */}
			<div
				style={{
					display: "flex",
					height: "32px",
					alignItems: "center",
					justifyContent: "space-between",
					width: "100%",
				}}
			>
				{/* AVAILABLE TICKETS 見出し */}
				<div
					style={{
						height: "24px",
						position: "relative",
						flexShrink: 0,
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: "#fdc700",
							letterSpacing: "0.0875px",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "-0.5px",
							whiteSpace: "nowrap",
						}}
					>
						AVAILABLE TICKETS
					</p>
				</div>

				{/* リフレッシュボタン */}
				<button
					onClick={handleRefresh}
					style={{
						backgroundColor: "#ffffff",
						border: "1px solid #3f3f46",
						borderRadius: "8px",
						height: "32px",
						width: "116px",
						minWidth: "116px",
						position: "relative",
						cursor: "pointer",
						flexShrink: 0,
						boxSizing: "border-box",
					}}
				>
					{/* アイコン */}
					<div
						style={{
							width: "16px",
							height: "16px",
							position: "absolute",
							left: "11px",
							top: "8px",
						}}
					>
						<img
							src={REFRESH_ICON_URL}
							alt="Refresh"
							style={{
								width: "100%",
								height: "100%",
								display: "block",
							}}
						/>
					</div>
					{/* テキスト */}
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
							fontSize: "14px",
							fontWeight: 500,
							lineHeight: "20px",
							color: "#0a0a0a",
							letterSpacing: "-0.1504px",
							margin: 0,
							position: "absolute",
							left: "70px",
							top: "6.5px",
							transform: "translateX(-50%)",
							whiteSpace: "nowrap",
						}}
					>
						在庫を更新
					</p>
				</button>
			</div>

			{/* チケットグリッドコンテナ */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "24px",
					width: "100%",
				}}
			>
				{tickets.map((ticket) => (
					<TicketCard
						key={ticket.id}
						ticket={ticket}
						onPurchase={() => handlePurchase(ticket.id)}
						isPurchasing={purchasing === ticket.id}
					/>
				))}
			</div>
		</div>
	);
}
