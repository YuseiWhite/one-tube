import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { TicketCard } from "../components/TicketCard";
import { MOCK_TICKETS, type MockTicket } from "../mocks/tickets";
import { toast } from "../lib/toast";
import "../styles/TicketsPageResponsive.css";

const REFRESH_ICON_URL = "https://www.figma.com/api/mcp/asset/3c0bd1f0-ca2b-4059-b9ed-c0b49ef0e814";

export function TicketsPage() {
	const currentAccount = useCurrentAccount();
	const isLoggedIn = !!currentAccount;
	const [tickets, setTickets] = useState<MockTicket[]>(MOCK_TICKETS);
	const [purchasing, setPurchasing] = useState<string | null>(null);

	// ログイン状態に応じてチケットの所有状態を更新
	useEffect(() => {
		setTickets((prevTickets) =>
			prevTickets.map((ticket) => {
				// ID: 1 - ログイン時に所有済みになる
				if (ticket.id === "1") {
					return { ...ticket, isPremiumOwned: isLoggedIn };
				}
				// ID: 2 - ログアウト時に未所有に戻る
				if (ticket.id === "2" && !isLoggedIn) {
					// localStorageからも削除
					const ownedTickets = JSON.parse(localStorage.getItem("ownedTickets") || "[]");
					const filteredTickets = ownedTickets.filter((id: string) => id !== "2");
					localStorage.setItem("ownedTickets", JSON.stringify(filteredTickets));
					return { ...ticket, isPremiumOwned: false };
				}
				return ticket;
			})
		);
	}, [isLoggedIn]);

	// リフレッシュボタン（モック: 初期状態に戻す）
	const handleRefresh = () => {
		setTickets(
			MOCK_TICKETS.map((ticket) => {
				// ID: 1 - ログイン状態を反映
				if (ticket.id === "1") {
					return { ...ticket, isPremiumOwned: isLoggedIn };
				}
				// ID: 2 - ログアウト時は未所有に戻す
				if (ticket.id === "2" && !isLoggedIn) {
					return { ...ticket, isPremiumOwned: false };
				}
				return ticket;
			})
		);
		// localStorageもクリア
		if (!isLoggedIn) {
			const ownedTickets = JSON.parse(localStorage.getItem("ownedTickets") || "[]");
			const filteredTickets = ownedTickets.filter((id: string) => id !== "2");
			localStorage.setItem("ownedTickets", JSON.stringify(filteredTickets));
		}
	};

	// 購入処理（完全にローカル状態のみ）
	const handlePurchase = async (ticketId: string) => {
		// ログインチェック
		if (!isLoggedIn) {
			toast.info("Please log in to purchase tickets");
			return;
		}

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
		toast.success("Purchase completed!");
	};

	return (
		<div
			className="tickets-page-container"
			style={{
				backgroundColor: "#18181b",
				display: "flex",
				flexDirection: "column",
				gap: "24px",
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
						Refresh
					</p>
				</button>
			</div>

			{/* チケットグリッドコンテナ（レスポンシブ対応）
			    - モバイル（〜767px）: 1カラム
			    - タブレット（768〜1199px）: 2カラム
			    - PC（1200px〜）: 3カラム

			    repeat(auto-fit, minmax(320px, 1fr)) により、
			    画面幅に応じて自動的にカラム数が調整されます。
			*/}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
