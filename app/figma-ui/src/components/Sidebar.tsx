import { useState } from 'react';
import { Ticket, Play } from 'lucide-react';

interface SidebarProps {
  activePage: 'tickets' | 'videos';
  onPageChange: (page: 'tickets' | 'videos') => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 min-h-[calc(100vh-120px)]">
      <nav className="p-4 space-y-2">
        <button
          onClick={() => onPageChange('tickets')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
            activePage === 'tickets'
              ? 'bg-zinc-800 border-l-4 border-yellow-400 text-yellow-400'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Ticket className="w-10 h-10" />
          <span className="tracking-wider">TICKETS</span>
        </button>

        <button
          onClick={() => onPageChange('videos')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
            activePage === 'videos'
              ? 'bg-zinc-800 border-l-4 border-yellow-400 text-yellow-400'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Play className="w-10 h-10" />
          <span className="tracking-wider">VIDEOS</span>
        </button>
      </nav>

      <div className="mx-4 mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300 leading-relaxed">
        <button
          type="button"
          onClick={() => setInfoOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-yellow-400 tracking-wide text-xs"
        >
          <span>プレミアムチケットについて</span>
          <span className="text-base">{infoOpen ? '−' : '+'}</span>
        </button>
        {infoOpen && (
          <div className="mt-3 space-y-2">
            <p>プレミアムチケットを購入すると、1ヶ月間、過去試合が見放題！！！！</p>
            <p>購入されたプレミアムチケットの70%相当額はプラットフォームを通して選手に支払われます！</p>
            <p>好きな選手を応援しよう！！！！</p>
          </div>
        )}
      </div>
    </aside>
  );
}
