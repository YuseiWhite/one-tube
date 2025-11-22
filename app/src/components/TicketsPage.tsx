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

// チケットデータの型定義
interface TicketData {
	id: string;
	eventTitle: string;
	fighter1: string;
	fighter2: string;
	location: string;
	physicalTicketPrice: string;
	premiumPrice: string;
	premiumFee: string; // "手数料無料" or "手数料有料"
	remainingTickets: string; // "残りX/Y チケット" or "TICKETS NOT AVAILABLE"
	isAvailable: boolean;
	leftImageUrl: string;
	rightImageUrl: string;
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
		leftImageUrl: getFighterImageUrl("Stamp Fairtex"),
		rightImageUrl: getFighterImageUrl("Ham Seo Hee"),
	},
];

// チケットカードコンポーネント
function TicketCard({ ticket }: { ticket: TicketData }) {
	const isAvailable = ticket.isAvailable;
	const buttonOpacity = isAvailable ? 1 : 0.5;
	const buttonCursor = isAvailable ? "pointer" : "not-allowed";

	return (
		<div
			style={{
				backgroundColor: "#09090b", // zinc-950
				border: "1px solid #27272a", // zinc-800
				borderRadius: "10px",
				position: "relative",
				height: "612px",
				overflow: "hidden",
				width: "100%",
			}}
		>
			{/* 黄色のヘッダーバー */}
			<div
				style={{
					backgroundColor: "#fdc700",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					height: "40px",
					alignItems: "flex-start",
					left: "1px",
					paddingTop: "8px",
					paddingLeft: "16px",
					paddingRight: "16px",
					paddingBottom: 0,
					top: "1px",
					width: "334px",
					position: "absolute",
				}}
			>
				<div
					style={{
						height: "24px",
						overflow: "hidden",
						position: "relative",
						flexShrink: 0,
						width: "100%",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: "#000000",
							letterSpacing: "0.4875px",
							margin: 0,
							position: "absolute",
							left: 0,
							top: "-0.5px",
							whiteSpace: "pre-wrap",
							width: "357px",
						}}
					>
						{ticket.eventTitle}
					</p>
				</div>
			</div>

			{/* 画像セクション */}
			<div
				style={{
					position: "absolute",
					height: "228px",
					left: "1px",
					top: "41px",
					width: "334px",
				}}
			>
				<div
					style={{
						position: "absolute",
						boxSizing: "border-box",
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "8px",
						height: "228px",
						left: 0,
						padding: "16px",
						top: 0,
						width: "334px",
					}}
				>
					{/* 左側の画像 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							overflow: "hidden",
							position: "relative",
							borderRadius: "10px",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								height: "196px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<img
								alt=""
								src={ticket.leftImageUrl}
								style={{
									position: "absolute",
									inset: 0,
									maxWidth: "none",
									objectFit: "cover",
									objectPosition: "50% 50%",
									pointerEvents: "none",
									width: "100%",
									height: "100%",
								}}
							/>
						</div>
					</div>
					{/* 右側の画像 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							overflow: "hidden",
							position: "relative",
							borderRadius: "10px",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								height: "196px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<img
								alt=""
								src={ticket.rightImageUrl}
								style={{
									position: "absolute",
									inset: 0,
									maxWidth: "none",
									objectFit: "cover",
									objectPosition: "50% 50%",
									pointerEvents: "none",
									width: "100%",
									height: "100%",
								}}
							/>
						</div>
					</div>
				</div>
				{/* NOT OWNED バッジ */}
				<div
					style={{
						position: "absolute",
						backgroundColor: "rgba(24, 24, 27, 0.8)",
						border: "1px solid #3f3f46",
						height: "22px",
						left: "229.18px",
						borderRadius: "8px",
						top: "14.5px",
						width: "92.82px",
					}}
				>
					<div
						style={{
							height: "22px",
							overflow: "hidden",
							position: "relative",
							borderRadius: "inherit",
							width: "92.82px",
						}}
					>
						<p
							style={{
								fontFamily: "'Inter', sans-serif",
								fontSize: "12px",
								fontWeight: 500,
								lineHeight: "16px",
								color: "#9f9fa9",
								margin: 0,
								position: "absolute",
								left: "9px",
								top: "4px",
							}}
						>
							NOT OWNED
						</p>
					</div>
				</div>
			</div>

			{/* コンテンツセクション */}
			<div
				style={{
					position: "absolute",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					height: "342px",
					alignItems: "flex-start",
					left: "1px",
					paddingLeft: "16px",
					paddingRight: 0,
					paddingTop: "16px",
					paddingBottom: "16px",
					top: "269px",
					width: "334px",
				}}
			>
				{/* ファイター情報 */}
				<div
					style={{
						height: "78px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							height: "78px",
							alignItems: "flex-start",
							position: "relative",
							width: "302px",
						}}
					>
						<div
							style={{
								height: "54px",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "18px",
									fontWeight: 500,
									lineHeight: "27px",
									color: "#fdc700",
									letterSpacing: "0.0105px",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "0.5px",
									whiteSpace: "pre-wrap",
									width: "269px",
								}}
							>
								{ticket.fighter1} vs {ticket.fighter2}
							</p>
						</div>
						<div
							style={{
								height: "24px",
								position: "relative",
								flexShrink: 0,
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
									letterSpacing: "-0.3125px",
									margin: 0,
									position: "absolute",
									left: 0,
									top: "-0.5px",
								}}
							>
								{ticket.location}
							</p>
						</div>
					</div>
				</div>

				{/* チケット価格情報 */}
				<div
					style={{
						height: "56px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							height: "56px",
							alignItems: "flex-start",
							paddingLeft: "8px",
							paddingRight: "8px",
							paddingTop: 0,
							paddingBottom: 0,
							position: "relative",
							width: "302px",
						}}
					>
						{/* 物理チケット */}
						<div
							style={{
								display: "flex",
								height: "24px",
								alignItems: "flex-start",
								justifyContent: "space-between",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "100.438px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#71717b",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									物理チケット:
								</p>
							</div>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "69.219px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#d4d4d8",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									{ticket.physicalTicketPrice}
								</p>
							</div>
						</div>
						{/* プレミアム */}
						<div
							style={{
								display: "flex",
								height: "24px",
								alignItems: "flex-start",
								justifyContent: "space-between",
								position: "relative",
								flexShrink: 0,
								width: "100%",
							}}
						>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "82.68px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#71717b",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
									}}
								>
									プレミアム:
								</p>
							</div>
							<div
								style={{
									height: "24px",
									position: "relative",
									flexShrink: 0,
									width: "173.672px",
								}}
							>
								<p
									style={{
										fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
										fontSize: "16px",
										fontWeight: 400,
										lineHeight: "24px",
										color: "#d4d4d8",
										letterSpacing: "-0.3125px",
										margin: 0,
										position: "absolute",
										left: 0,
										top: "-0.5px",
										whiteSpace: "nowrap",
									}}
								>
									{ticket.premiumPrice}（{ticket.premiumFee}）
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 残りチケット数 */}
				<div
					style={{
						height: "24px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<p
						style={{
							fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
							fontSize: "16px",
							fontWeight: 400,
							lineHeight: "24px",
							color: ticket.remainingTickets === "TICKETS NOT AVAILABLE" ? "#ef4444" : "#71717b",
							textAlign: "center",
							letterSpacing: "-0.3125px",
							margin: 0,
							whiteSpace: "nowrap",
						}}
					>
						{ticket.remainingTickets}
					</p>
				</div>

				{/* スペーサー */}
				<div
					style={{
						flex: "1 0 0",
						minHeight: "1px",
						minWidth: "1px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				/>

				{/* ボタンセクション */}
				<div
					style={{
						height: "80px",
						position: "relative",
						flexShrink: 0,
						width: "302px",
					}}
				>
					<div
						style={{
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							height: "80px",
							alignItems: "flex-start",
							position: "relative",
							width: "302px",
						}}
					>
						{/* BUY PREMIUM TICKET ボタン */}
						<button
							disabled={!isAvailable}
							style={{
								backgroundColor: "#fdc700",
								height: "36px",
								borderRadius: "8px",
								border: "none",
								width: "100%",
								position: "relative",
								cursor: buttonCursor,
								opacity: buttonOpacity,
								flexShrink: 0,
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "20px",
									color: "#000000",
									textAlign: "center",
									letterSpacing: "-0.1504px",
									margin: 0,
									position: "absolute",
									left: "50%",
									top: "8.5px",
									transform: "translateX(-50%)",
									whiteSpace: "nowrap",
								}}
							>
								BUY PREMIUM TICKET
							</p>
						</button>
						{/* BUY TICKET ボタン */}
						<button
							disabled={!isAvailable}
							style={{
								backgroundColor: "#ffffff",
								border: "1px solid #3f3f46",
								height: "36px",
								borderRadius: "8px",
								width: "100%",
								position: "relative",
								cursor: buttonCursor,
								opacity: buttonOpacity,
								flexShrink: 0,
							}}
						>
							<p
								style={{
									fontFamily: "'Inter', sans-serif",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "20px",
									color: "#9f9fa9",
									textAlign: "center",
									letterSpacing: "-0.1504px",
									margin: 0,
									position: "absolute",
									left: "50%",
									top: "8.5px",
									transform: "translateX(-50%)",
									whiteSpace: "nowrap",
								}}
							>
								BUY TICKET
							</p>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

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

