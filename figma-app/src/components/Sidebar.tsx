import { Ticket, Play } from 'lucide-react';
import { figma } from '@figma/code-connect';

interface SidebarProps {
  activePage: 'tickets' | 'videos';
  onPageChange: (page: 'tickets' | 'videos') => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-80 bg-zinc-950 border-r border-zinc-800 min-h-[calc(100vh-120px)]">
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

      {/* プレミアムチケット説明 - 常時表示 */}
      <div className="px-4 pb-4">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
          <h3 className="text-yellow-400 text-sm mb-3">
            プレミアムチケットについて
          </h3>
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs leading-relaxed">
              プレミアムチケットを購入すると、1ヶ月間、過去試合が見放題！！！！
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              購入されたプレミアムチケットの70%相当額はプラットフォームを通して選手に支払われます！
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              好きな選手を応援しよう！
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Figma Code Connect
figma.connect(Sidebar, {
  props: {
    activePage: figma.enum("Active Page", {
      tickets: "tickets",
      videos: "videos",
    }),
  },
  example: (props) => (
    <Sidebar
      {...props}
      onPageChange={() => {}}
    />
  ),
});
