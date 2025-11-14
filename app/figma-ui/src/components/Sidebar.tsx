import { Ticket, Play } from 'lucide-react';

interface SidebarProps {
  activePage: 'tickets' | 'videos';
  onPageChange: (page: 'tickets' | 'videos') => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 min-h-[calc(100vh-120px)]">
      <nav className="p-4 space-y-2">
        <button
          onClick={() => onPageChange('tickets')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activePage === 'tickets'
              ? 'bg-zinc-800 border-l-4 border-yellow-400 text-yellow-400'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span className="tracking-wider">TICKETS</span>
        </button>

        <button
          onClick={() => onPageChange('videos')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activePage === 'videos'
              ? 'bg-zinc-800 border-l-4 border-yellow-400 text-yellow-400'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Play className="w-5 h-5" />
          <span className="tracking-wider">VIDEOS</span>
        </button>
      </nav>

      {/* 説明セクション */}
      <div className="p-4 mt-8 mx-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h3 className="text-yellow-400 tracking-wide mb-3">プレミアムチケットNFTについて</h3>
        <ul className="space-y-2 text-zinc-400">
          <li className="flex gap-2">
            <span>•</span>
            <div>
              <div>1ヶ月間、過去試合が見放題</div>
              <div className="text-zinc-600">※将来機能（MVPではメッセージのみ）</div>
            </div>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>購入時に選手 70% / ONE 25% / Platform 5% で自動分配</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
