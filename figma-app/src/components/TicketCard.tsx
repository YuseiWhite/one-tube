import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Ticket {
  id: string;
  eventTitle: string;
  fighter1: string;
  fighter2: string;
  fighter1Image: string;
  fighter2Image: string;
  venue: string;
  physicalPrice: string;
  premiumAdd: string;
  stock: number;
  totalStock: number;
  soldOut: boolean;
  ticketsNotAvailable: boolean;
}

interface TicketCardProps {
  ticket: Ticket;
  isOwned: boolean;
  onPurchase: (ticketId: string, isPremium: boolean) => void;
}

export function TicketCard({ ticket, isOwned, onPurchase }: TicketCardProps) {
  return (
    <div
      className={`bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden transition-all hover:border-yellow-400/50 flex flex-col ${
        ticket.ticketsNotAvailable ? 'opacity-60' : ''
      }`}
    >
      {/* タイトルバー */}
      <div className="bg-yellow-400 text-black px-4 py-2">
        <p className="tracking-wider truncate">{ticket.eventTitle}</p>
      </div>

      {/* 所有状態バッジ */}
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          {isOwned ? (
            <Badge className="bg-yellow-400 text-black hover:bg-yellow-500">
              OWNED
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-900/80 border-zinc-700 text-zinc-400">
              NOT OWNED
            </Badge>
          )}
        </div>

        {/* 選手サムネイル */}
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="aspect-[3/4] rounded-lg overflow-hidden">
            <ImageWithFallback
              src={ticket.fighter1Image}
              alt={`${ticket.fighter1} fighter`}
              className={`w-full h-full object-cover ${!isOwned ? 'grayscale' : ''}`}
            />
          </div>
          <div className="aspect-[3/4] rounded-lg overflow-hidden">
            <ImageWithFallback
              src={ticket.fighter2Image}
              alt={`${ticket.fighter2} fighter`}
              className={`w-full h-full object-cover ${!isOwned ? 'grayscale' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col">
        {/* 試合名 */}
        <div>
          <h3 className="text-yellow-400 tracking-wide">
            {ticket.fighter1} vs {ticket.fighter2}
          </h3>
          <p className="text-zinc-400">{ticket.venue}</p>
        </div>

        {/* 価格ボックス */}
        <div className="space-y-2 px-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">物理チケット:</span>
            <span className="text-zinc-300">{ticket.physicalPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 whitespace-nowrap">プレミアム:</span>
            <span className="text-zinc-300">{ticket.premiumAdd}</span>
          </div>
        </div>

        {/* 在庫表示 */}
        {ticket.ticketsNotAvailable ? (
          <div className="px-2 py-1 text-center">
            <span className="text-red-400 tracking-wider">TICKETS NOT AVAILABLE</span>
          </div>
        ) : (
          <div className="text-zinc-500 text-center">
            残り {ticket.stock} / {ticket.totalStock} チケット
          </div>
        )}

        {/* スペーサー：ボタンを最下部に押し出す */}
        <div className="flex-1"></div>

        {/* 購入ボタン - 縦並び、カード最下部に配置 */}
        <div className="space-y-2">
          <Button
            className="w-full bg-yellow-400 hover:bg-black text-black hover:text-yellow-400 border-0 hover:border hover:border-yellow-400 transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            disabled={ticket.ticketsNotAvailable || isOwned}
            onClick={() => onPurchase(ticket.id, true)}
          >
            {isOwned ? '購入済み' : 'BUY PREMIUM TICKET'}
          </Button>

          <Button
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 transition-all"
            disabled={ticket.ticketsNotAvailable}
            onClick={() => onPurchase(ticket.id, false)}
          >
            BUY TICKET
          </Button>
        </div>
      </div>
    </div>
  );
}