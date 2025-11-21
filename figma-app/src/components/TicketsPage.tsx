import { TicketCard } from './TicketCard';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { figma } from '@figma/code-connect';

interface TicketsPageProps {
  isWalletConnected: boolean;
  ownedTickets: string[];
  onTicketPurchased: (ticketId: string) => void;
}

// モックチケットデータ（12種類）
const tickets = [
  {
    id: 'ticket-1',
    eventTitle: 'ONE Fight Night 38: Andrade vs. Baatarkhuu',
    fighter1: 'Fabricio Andrade',
    fighter2: 'Enkh-Orgil Baatarkhuu',
    fighter1Image: 'https://images.unsplash.com/photo-1637055667163-ad033183b329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBmaWdodGVyfGVufDF8fHx8MTc2MzEyMTcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Lumpinee Stadium, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 10,
    totalStock: 10,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-2',
    eventTitle: 'ONE 173: Superbon vs. Noiri',
    fighter1: 'Superbon',
    fighter2: 'Masaaki Noiri',
    fighter1Image: 'https://images.unsplash.com/photo-1600347974553-27950431510a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwZmlnaHRlciUyMGFjdGlvbnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNzYzMTIxNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Ariake Arena, Tokyo',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 8,
    totalStock: 15,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-3',
    eventTitle: 'ONE Friday Fights 137: Tawanchai vs. Liu',
    fighter1: 'Tawanchai PK Saenchai',
    fighter2: 'Liu Mengyang',
    fighter1Image: 'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdWF5JTIwdGhhaSUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMTIxNzEwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1757571761677-84036e66e3ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbW1hJTIwZmlnaHRlcnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Lumpinee Stadium, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 0,
    totalStock: 12,
    soldOut: false,
    ticketsNotAvailable: true,
  },
  {
    id: 'ticket-4',
    eventTitle: 'ONE Fight Night 39: Rodtang vs. Haggerty',
    fighter1: 'Rodtang',
    fighter2: 'Jonathan Haggerty',
    fighter1Image: 'https://images.unsplash.com/photo-1620123449238-abaeff62d48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtbWElMjBmaWdodCUyMGFjdGlvbnxlbnwxfHx8fDE3NjMxMjE3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1637055667163-ad033183b329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBmaWdodGVyfGVufDF8fHx8MTc2MzEyMTcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Impact Arena, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 5,
    totalStock: 10,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-5',
    eventTitle: 'ONE 174: Malykhin vs. Reug Reug',
    fighter1: 'Anatoly Malykhin',
    fighter2: 'Reug Reug',
    fighter1Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1600347974553-27950431510a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwZmlnaHRlciUyMGFjdGlvbnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Singapore Indoor Stadium',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 12,
    totalStock: 12,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-6',
    eventTitle: 'ONE Friday Fights 138: Prajanchai vs. Superlek',
    fighter1: 'Prajanchai',
    fighter2: 'Superlek',
    fighter1Image: 'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdWF5JTIwdGhhaSUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNjMxMjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNjMxMjE3MDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Lumpinee Stadium, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 0,
    totalStock: 8,
    soldOut: false,
    ticketsNotAvailable: true,
  },
  {
    id: 'ticket-7',
    eventTitle: 'ONE 175: Zhang vs. Eersel',
    fighter1: 'Zhang Peimian',
    fighter2: 'Regian Eersel',
    fighter1Image: 'https://images.unsplash.com/photo-1757571761677-84036e66e3ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbW1hJTIwZmlnaHRlcnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1620123449238-abaeff62d48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtbWElMjBmaWdodCUyMGFjdGlvbnxlbnwxfHx8fDE3NjMxMjE3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Ariake Arena, Tokyo',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 7,
    totalStock: 10,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-8',
    eventTitle: 'ONE Fight Night 40: Moraes vs. Johnson',
    fighter1: 'Adriano Moraes',
    fighter2: 'Demetrious Johnson',
    fighter1Image: 'https://images.unsplash.com/photo-1637055667163-ad033183b329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBmaWdodGVyfGVufDF8fHx8MTc2MzEyMTcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Impact Arena, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 15,
    totalStock: 15,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-9',
    eventTitle: 'ONE 176: Nong-O vs. Felipe',
    fighter1: 'Nong-O Hama',
    fighter2: 'Felipe Lobo',
    fighter1Image: 'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdWF5JTIwdGhhaSUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNjMxMjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1600347974553-27950431510a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwZmlnaHRlciUyMGFjdGlvbnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Singapore Indoor Stadium',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 3,
    totalStock: 10,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-10',
    eventTitle: 'ONE Friday Fights 139: Petchtanong vs. Zakaria',
    fighter1: 'Petchtanong',
    fighter2: 'Zakaria El Jamari',
    fighter1Image: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNjMxMjE3MDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1757571761677-84036e66e3ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbW1hJTIwZmlnaHRlcnxlbnwxfHx8fDE3NjMzODUyODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Lumpinee Stadium, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 0,
    totalStock: 12,
    soldOut: false,
    ticketsNotAvailable: true,
  },
  {
    id: 'ticket-11',
    eventTitle: 'ONE 177: Ok vs. Lee',
    fighter1: 'Ok Rae Yoon',
    fighter2: 'Christian Lee',
    fighter1Image: 'https://images.unsplash.com/photo-1620123449238-abaeff62d48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtbWElMjBmaWdodCUyMGFjdGlvbnxlbnwxfHx8fDE3NjMxMjE3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1637055667163-ad033183b329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBmaWdodGVyfGVufDF8fHx8MTc2MzEyMTcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Singapore Indoor Stadium',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 6,
    totalStock: 10,
    soldOut: false,
    ticketsNotAvailable: false,
  },
  {
    id: 'ticket-12',
    eventTitle: 'ONE Fight Night 41: Stamp vs. Ham',
    fighter1: 'Stamp Fairtex',
    fighter2: 'Ham Seo Hee',
    fighter1Image: 'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdWF5JTIwdGhhaSUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNjMxMjE3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    fighter2Image: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    venue: 'Impact Arena, Bangkok',
    physicalPrice: '¥168,000',
    premiumAdd: '+¥5,000（手数料無料）',
    stock: 9,
    totalStock: 12,
    soldOut: false,
    ticketsNotAvailable: false,
  },
];

export function TicketsPage({ isWalletConnected, ownedTickets, onTicketPurchased }: TicketsPageProps) {
  const handleRefreshStock = () => {
    toast.info('在庫情報を更新中...');
    setTimeout(() => {
      toast.success('在庫情報を更新しました');
    }, 1000);
  };

  const handlePurchase = (ticketId: string, isPremium: boolean) => {
    if (!isWalletConnected) {
      toast.error('ウォレットを接続してください');
      return;
    }

    toast.loading('購入処理中...', { id: 'purchase' });
    setTimeout(() => {
      if (isPremium) {
        toast.success('プレミアムチケットを購入しました！', { id: 'purchase' });
        onTicketPurchased(ticketId);
      } else {
        toast.success('チケットを購入しました！', { id: 'purchase' });
      }
    }, 2000);
  };

  return (
    <div className="p-8">
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

      {/* チケットカード一覧 - 3列×4行 */}
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

// Figma Code Connect
figma.connect(TicketsPage, {
  props: {
    isWalletConnected: figma.boolean("Wallet Connected"),
    ownedTickets: figma.instance("Owned Tickets"),
  },
  example: (props) => (
    <TicketsPage
      {...props}
      ownedTickets={props.ownedTickets || []}
      onTicketPurchased={() => {}}
    />
  ),
});
