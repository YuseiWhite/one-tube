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
  stockMessage: string;
  soldOut: boolean;
  soldOutMessage?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  isOwned: boolean;
  onPurchase: (ticketId: string) => void;
  onBuyStandard?: (ticketId: string) => void;
}

export function TicketCard({ ticket, isOwned, onPurchase, onBuyStandard }: TicketCardProps) {
  return (
    <div
      className={`bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden transition-all hover:border-yellow-400/50 ${
        ticket.soldOut ? 'opacity-60' : ''
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

      <div className="p-4 space-y-4">
        {/* 試合名 */}
        <div>
          <h3 className="text-yellow-400 tracking-wide">
            {ticket.fighter1} vs {ticket.fighter2}
          </h3>
          <p className="text-zinc-400">{ticket.venue}</p>
        </div>

        {/* 価格ボックス */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-400">物理チケット:</span>
            <span className="text-zinc-300">{ticket.physicalPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">プレミアム:</span>
            <span className="text-zinc-300">{ticket.premiumAdd}</span>
          </div>
        </div>

        {/* 在庫表示 */}
        {ticket.soldOut ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-center">
            <span className="text-red-400 tracking-wider">
              {ticket.soldOutMessage || 'TICKETS NOT AVAILABLE'}
            </span>
          </div>
        ) : (
          <div className="text-zinc-400 text-center">
            {ticket.stockMessage}
          </div>
        )}

        {/* 購入ボタン */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:flex-[1.1] bg-black hover:bg-zinc-900 text-yellow-400 border border-yellow-400 hover:border-yellow-300"
            disabled={ticket.soldOut || isOwned}
            onClick={() => onPurchase(ticket.id)}
          >
            {isOwned ? '購入済み' : ticket.soldOut ? 'TICKETS NOT AVAILABLE' : 'BUY PREMIUM TICKET'}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:flex-[0.9] border-zinc-700 text-zinc-300 hover:text-white"
            disabled={ticket.soldOut}
            onClick={() => onBuyStandard?.(ticket.id)}
          >
            BUY TICKET
          </Button>
        </div>
      </div>
    </div>
  );
}
