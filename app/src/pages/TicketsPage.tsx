import { TicketCard } from "../components/TicketCard";
import type { TicketData } from "../types/ticket";

const REFRESH_ICON_URL = "https://www.figma.com/api/mcp/asset/3c0bd1f0-ca2b-4059-b9ed-c0b49ef0e814";

// 選手名から画像URLを生成する関数
// ONE Championshipのサイト (https://www.onefc.com/tickets/) から取得可能
function getFighterImageUrl(fighterName: string): string {
	// 選手名をスラッグに変換
	// 実際のONE Championshipのサイト構造に合わせて調整が必要な場合があります
	const nameMapping: Record<string, string> = {
		"Fabricio Andrade": "fabricio-andrade",
		"Enkh-Orgil Baatarkhuu": "enkh-orgil-baatarkhuu",
		"Superbon": "superbon",
		"Masaaki Noiri": "masaaki-noiri",
		"Tawanchai PK Saenchai": "tawanchai",
		"Liu Mengyang": "liu-mengyang",
		"Rodtang": "rodtang-jitmuangnon",
		"Jonathan Haggerty": "jonathan-haggerty",
		"Anatoly Malykhin": "anatoly-malykhin",
		"Reug Reug": "reug-reug",
		"Prajanchai": "prajanchai",
		"Superlek": "superlek-kiatmoo9",
		"Zhang Peimian": "zhang-peimian",
		"Regian Eersel": "regian-eersel",
		"Adriano Moraes": "adriano-moraes",
		"Demetrious Johnson": "demetrious-johnson",
		"Nong-O Hama": "nong-o",
		"Felipe Lobo": "felipe-lobo",
		"Petchtanong": "petchtanong-petkruathong",
		"Zakaria El Jamari": "zakaria-el-jamari",
		"Ok Rae Yoon": "ok-rae-yoon",
		"Christian Lee": "christian-lee",
		"Stamp Fairtex": "stamp-fairtex",
		"Ham Seo Hee": "ham-seo-hee",
	};
	
	const slug = nameMapping[fighterName] || fighterName
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/\./g, "")
		.replace(/\'/g, "")
		.replace(/pk\s+/gi, "")
		.replace(/\s+/g, "-");
	
	// ONE Championshipのサイトから取得可能な画像URL
	// 実際のURLパターンはサイト構造に依存します
	return `https://www.onefc.com/wp-content/uploads/athletes/${slug}.jpg`;
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

