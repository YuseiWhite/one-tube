// モックデータ: チケット一覧
export interface MockTicket {
	id: string;
	eventTitle: string;
	fighter1: string;
	fighter2: string;
	location: string;
	physicalTicketPrice: string;
	premiumPrice: string;
	premiumFee: string;
	remainingTickets: string;
	isAvailable: boolean;
	isPremiumOwned: boolean;
	leftImageUrl: string;
	rightImageUrl: string;
	previewUrl?: string;
	fullVideoUrl?: string;
}

// 選手名からローカル画像パスを生成する関数
function getFighterImageUrl(fighterName: string): string {
	const nameMapping: Record<string, string> = {
		"Fabricio Andrade": "Fabricio_Andrade.png",
		"Enkh-Orgil Baatarkhuu": "Enkh-Orgil.png",
		"Superbon": "generic_male.png",
		"Masaaki Noiri": "generic_male.png",
		"Tawanchai PK Saenchai": "Tawanchai.png",
		"Liu Mengyang": "Liu_Mengyang.png",
		"Rodtang": "generic_male.png",
		"Jonathan Haggerty": "generic_male.png",
		"Anatoly Malykhin": "generic_male.png",
		"Reug Reug": "generic_male.png",
		"Prajanchai": "generic_male.png",
		"Superlek": "generic_male.png",
		"Zhang Peimian": "Zhang_Peimian.png",
		"Regian Eersel": "generic_male.png",
		"Adriano Moraes": "generic_male.png",
		"Demetrious Johnson": "generic_male.png",
		"Nong-O Hama": "generic_male.png",
		"Felipe Lobo": "generic_male.png",
		"Petchtanong": "generic_male.png",
		"Zakaria El Jamari": "generic_male.png",
		"Ok Rae Yoon": "generic_male.png",
		"Christian Lee": "generic_male.png",
		"Stamp Fairtex": "generic_male.png",
		"Ham Seo Hee": "generic_male.png",
	};

	const imageFileName = nameMapping[fighterName] || "generic_male.png";
	return `/assets/avatars/${imageFileName}`;
}

// 12個のモックチケットデータ
// id: 1 - 所有済み、id: 2 - 購入体験用、id: 3 - 売り切れ
export const MOCK_TICKETS: MockTicket[] = [
	// A. ログイン時に所有済みとして表示されるチケット
	{
		id: "1",
		eventTitle: "ONE Fight Night 38: Andrade vs. Baatarkhuu",
		fighter1: "Fabricio Andrade",
		fighter2: "Enkh-Orgil Baatarkhuu",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "No Fee",
		remainingTickets: "10/10 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false, // ログイン状態に応じてTicketsPageで動的に変更
		leftImageUrl: getFighterImageUrl("Fabricio Andrade"),
		rightImageUrl: getFighterImageUrl("Enkh-Orgil Baatarkhuu"),
		previewUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/videos/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
		fullVideoUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/videos/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
	},
	// B. 購入体験用
	{
		id: "2",
		eventTitle: "ONE 173: Superbon vs. Noiri",
		fighter1: "Superbon",
		fighter2: "Masaaki Noiri",
		location: "Ariake Arena, Tokyo",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "No Fee",
		remainingTickets: "8/15 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false, // 購入ボタンで所有済みに変更可能
		leftImageUrl: getFighterImageUrl("Superbon"),
		rightImageUrl: getFighterImageUrl("Masaaki Noiri"),
		previewUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/videos/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
		fullVideoUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/videos/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
	},
	// C. 売り切れ
	{
		id: "3",
		eventTitle: "ONE Friday Fights 137: Tawanchai vs. Liu",
		fighter1: "Tawanchai PK Saenchai",
		fighter2: "Liu Mengyang",
		location: "Lumpinee Stadium, Bangkok",
		physicalTicketPrice: "¥168,000",
		premiumPrice: "+¥5,000",
		premiumFee: "No Fee",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false, // 売り切れ
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "5/10 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "12/12 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "7/10 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "15/15 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "3/10 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "TICKETS NOT AVAILABLE",
		isAvailable: false,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "6/10 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
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
		premiumFee: "No Fee",
		remainingTickets: "9/12 Tickets Left",
		isAvailable: true,
		isPremiumOwned: false,
		leftImageUrl: getFighterImageUrl("Stamp Fairtex"),
		rightImageUrl: getFighterImageUrl("Ham Seo Hee"),
	},
];
