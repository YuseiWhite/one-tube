// チケットデータの型定義
export interface TicketData {
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
	isPremiumOwned?: boolean; // プレミアムチケット購入済みかどうか
	leftImageUrl: string;
	rightImageUrl: string;
}

