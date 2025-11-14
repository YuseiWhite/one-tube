import { TicketCard } from './TicketCard';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface TicketsPageProps {
  isWalletConnected: boolean;
  ownedTickets: string[];
  onTicketPurchased: (ticketId: string) => void;
}

// モックチケットデータ
const tickets = [
  {
    id: 'ticket-1',
    eventTitle: 'ONE 173: SUPERBON VS. NOIRI',
    fighter1: 'Superbon',
    fighter2: 'Masaaki Noiri',
    fighter1Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNzYzMTIxNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Ariake Arena, Tokyo',
    physicalPrice: '¥20,000 〜 ¥558,000',
    premiumAdd: '+¥5,000',
    suiPrice: '0.5 SUI',
    stock: 3,
    totalStock: 10,
    soldOut: false,
  },
  {
    id: 'ticket-2',
    eventTitle: 'ONE 172: RODTANG VS. PRAJANCHAI',
    fighter1: 'Rodtang',
    fighter2: 'Prajanchai',
    fighter1Image: 'https://images.unsplash.com/photo-1637055667163-ad033183b329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBmaWdodGVyfGVufDF8fHx8MTc2MzEyMTcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdWF5JTIwdGhhaSUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMTIxNzEwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Impact Arena, Bangkok',
    physicalPrice: '¥15,000 〜 ¥420,000',
    premiumAdd: '+¥5,000',
    suiPrice: '0.5 SUI',
    stock: 8,
    totalStock: 15,
    soldOut: false,
  },
  {
    id: 'ticket-3',
    eventTitle: 'ONE 171: TAWANCHAI VS. NATTAWUT',
    fighter1: 'Tawanchai',
    fighter2: 'Nattawut',
    fighter1Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNzYzMTIxNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Singapore Indoor Stadium',
    physicalPrice: '¥18,000 〜 ¥480,000',
    premiumAdd: '+¥5,000',
    suiPrice: '0.5 SUI',
    stock: 0,
    totalStock: 12,
    soldOut: true,
  },
];

export function TicketsPage({ isWalletConnected, ownedTickets, onTicketPurchased }: TicketsPageProps) {
  const handleRefreshStock = () => {
    toast.info('在庫情報を更新中...');
    setTimeout(() => {
      toast.success('在庫情報を更新しました');
    }, 1000);
  };

  const handlePurchase = (ticketId: string) => {
    if (!isWalletConnected) {
      toast.error('ウォレットを接続してください');
      return;
    }

    toast.loading('購入処理中...', { id: 'purchase' });
    setTimeout(() => {
      toast.success('プレミアムチケットNFTを購入しました！', { id: 'purchase' });
      onTicketPurchased(ticketId);
    }, 2000);
  };

  return (
    <div className="p-8">
      {/* ヒーローセクション */}
      <div
        className="relative mb-12 rounded-lg overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080')`,
          height: '300px',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        <div className="relative h-full flex flex-col justify-center items-center text-center px-8">
          <div className="bg-yellow-400 text-black px-6 py-2 tracking-widest mb-4">
            PREMIUM TICKET NFT
          </div>
          <h2 className="tracking-wider mb-2">
            ONE CHAMPIONSHIP
          </h2>
          <p className="text-zinc-400 max-w-2xl">
            世界最高峰の格闘技を、プレミアムチケットNFTで体験。
          </p>
        </div>
      </div>

      {/* 在庫管理UI */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="tracking-wide text-yellow-400">AVAILABLE TICKETS</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshStock}
          className="border-zinc-700 hover:bg-zinc-800 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          在庫を更新
        </Button>
      </div>

      {/* ウォレット未接続警告 */}
      {!isWalletConnected && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-400">
            ⚠️ チケットを購入するにはウォレットを接続してください
          </p>
        </div>
      )}

      {/* チケットカード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            isOwned={ownedTickets.includes(ticket.id)}
            onPurchase={handlePurchase}
          />
        ))}
      </div>
    </div>
  );
}
