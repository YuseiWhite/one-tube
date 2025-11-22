import { TicketCard } from "../components/TicketCard";
import type { TicketData } from "../types/ticket";

const REFRESH_ICON_URL = "https://www.figma.com/api/mcp/asset/3c0bd1f0-ca2b-4059-b9ed-c0b49ef0e814";

// 選手名からローカル画像パスを生成する関数
// app/public/assets フォルダ内の画像ファイルを使用
function getFighterImageUrl(fighterName: string): string {
	// 選手名から画像ファイル名へのマッピング
	const nameMapping: Record<string, string> = {
		"Fabricio Andrade": "Fabricio_Andrade.png",
		"Enkh-Orgil Baatarkhuu": "Enkh-Orgil.png",
		"Tawanchai PK Saenchai": "Tawanchai.png",
		"Liu Mengyang": "Liu_Mengyang.png",
		"Zhang Peimian": "Zhang_Peimian.png",
		// その他の選手については、利用可能な画像がない場合は generic_male.png をフォールバックとして使用
	};
	
	// マッピングに存在する場合はその画像を使用、存在しない場合は generic_male.png を使用
	const imageFileName = nameMapping[fighterName] || "generic_male.png";
	
	// パブリックフォルダ内の画像パスを返す
	return `/assets/${imageFileName}`;
}

// 12個のイベントデータ
const TICKET_DATA: TicketData[] = [
	{
		id: "1",
		eventTitle: "ONE Fight Night 38: Andrade vs. Baat",
		fighter1: "Fabricio Andrade",
		fighter2: "Enkh-Orgil Baatarkhuu",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り10/10 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Fabricio Andrade"),
		rightImageUrl: getFighterImageUrl("Enkh-Orgil Baatarkhuu"),
	},
	{
		id: "2",
		eventTitle: "ONE 173: Superbon vs. Noiri",
		fighter1: "Superbon",
		fighter2: "Masaaki Noiri",
		location: "Ariake Arena, Tokyo",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り8/15 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Superbon"),
		rightImageUrl: getFighterImageUrl("Masaaki Noiri"),
	},
	{
		id: "3",
		eventTitle: "ONE Friday Fights 137: Tawanchai vs.",
		fighter1: "Tawanchai PK Saenchai",
		fighter2: "Liu Mengyang",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false,
		leftImageUrl: getFighterImageUrl("Tawanchai PK Saenchai"),
		rightImageUrl: getFighterImageUrl("Liu Mengyang"),
	},
	{
		id: "4",
		eventTitle: "ONE Fight Night 39: Rodtang vs.",
		fighter1: "Rodtang",
		fighter2: "Jonathan Haggerty",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り5/10 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Rodtang"),
		rightImageUrl: getFighterImageUrl("Jonathan Haggerty"),
	},
	{
		id: "5",
		eventTitle: "ONE 174: Malykhin vs. Reug Reug",
		fighter1: "Anatoly Malykhin",
		fighter2: "Reug Reug",
		location: "Singapore Indoor Stadium",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り12/12 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Anatoly Malykhin"),
		rightImageUrl: getFighterImageUrl("Reug Reug"),
	},
	{
		id: "6",
		eventTitle: "ONE Friday Fights 138: Prajanchai vs.",
		fighter1: "Prajanchai",
		fighter2: "Superlek",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false,
		leftImageUrl: getFighterImageUrl("Prajanchai"),
		rightImageUrl: getFighterImageUrl("Superlek"),
	},
	{
		id: "7",
		eventTitle: "ONE 175: Zhang vs. Eersel",
		fighter1: "Zhang Peimian",
		fighter2: "Regian Eersel",
		location: "Ariake Arena, Tokyo",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り7/10 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Zhang Peimian"),
		rightImageUrl: getFighterImageUrl("Regian Eersel"),
	},
	{
		id: "8",
		eventTitle: "ONE Fight Night 40: Moraes vs. Johns",
		fighter1: "Adriano Moraes",
		fighter2: "Demetrious Johnson",
		location: "Impact Arena, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り15/15 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Adriano Moraes"),
		rightImageUrl: getFighterImageUrl("Demetrious Johnson"),
	},
	{
		id: "9",
		eventTitle: "ONE 176: Nong-O vs. Felipe",
		fighter1: "Nong-O Hama",
		fighter2: "Felipe Lobo",
		location: "Singapore Indoor Stadium",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り3/10 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Nong-O Hama"),
		rightImageUrl: getFighterImageUrl("Felipe Lobo"),
	},
	{
		id: "10",
		eventTitle: "ONE Friday Fights 139: Petchtanong v",
		fighter1: "Petchtanong",
		fighter2: "Zakaria El Jamari",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false,
		leftImageUrl: getFighterImageUrl("Petchtanong"),
		rightImageUrl: getFighterImageUrl("Zakaria El Jamari"),
	},
	{
		id: "11",
		eventTitle: "ONE 177: Ok vs. Lee",
		fighter1: "Ok Rae Yoon",
		fighter2: "Christian Lee",
		location: "Singapore Indoor Stadium",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り6/10 チケット",
		isAvailable: true,
		leftImageUrl: getFighterImageUrl("Ok Rae Yoon"),
		rightImageUrl: getFighterImageUrl("Christian Lee"),
	},
	{
		id: "12",
		eventTitle: "ONE Fight Night 41: Stamp vs. Ham",
		fighter1: "Stamp Fairtex",
		fighter2: "Ham Seo Hee",
		location: "Impact Arena, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "手数料無料",
		remainingTickets: "残り9/12 チケット",
		isAvailable: true,
		isPremiumOwned: true, // サンプル: 購入済みチケット
		leftImageUrl: getFighterImageUrl("Stamp Fairtex"),
		rightImageUrl: getFighterImageUrl("Ham Seo Hee"),
	},
];

export function TicketsPage() {
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
				{TICKET_DATA.map((ticket) => (
					<TicketCard key={ticket.id} ticket={ticket} />
				))}
			</div>
		</div>
	);
}

