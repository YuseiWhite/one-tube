import { useState } from 'react';

type SidebarProps = {
  activePage: 'tickets' | 'videos';
  onChange: (page: 'tickets' | 'videos') => void;
};

const TicketIcon = () => (
  <svg className="onetube-sidebar__icon" viewBox="0 0 36 36" role="presentation" aria-hidden="true">
    <path
      d="M6 11a2 2 0 012-2h20a2 2 0 012 2v4a3 3 0 010 6v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a3 3 0 110-6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 12v12M22 12v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const VideoIcon = () => (
  <svg className="onetube-sidebar__icon" viewBox="0 0 36 36" role="presentation" aria-hidden="true">
    <circle cx="18" cy="18" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M15 13l8 5-8 5z" fill="currentColor" />
  </svg>
);

export default function Sidebar({ activePage, onChange }: SidebarProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <aside className="onetube-sidebar">
      {/* Figma参照: figma-ui/src/components/Sidebar.tsx */}
      <nav className="onetube-sidebar__nav" aria-label="Main navigation">
        <button
          type="button"
          className={`onetube-sidebar__button ${activePage === 'tickets' ? 'is-active' : ''}`}
          onClick={() => onChange('tickets')}
        >
          <TicketIcon />
          <span className="onetube-sidebar__label">TICKETS</span>
        </button>
        <button
          type="button"
          className={`onetube-sidebar__button ${activePage === 'videos' ? 'is-active' : ''}`}
          onClick={() => onChange('videos')}
        >
          <VideoIcon />
          <span className="onetube-sidebar__label">VIDEOS</span>
        </button>
      </nav>

      <div className="onetube-sidebar__info onetube-sidebar__info--compact">
        <button
          type="button"
          className={`onetube-sidebar__info-toggle${infoOpen ? ' is-open' : ''}`}
          onClick={() => setInfoOpen((prev) => !prev)}
          aria-expanded={infoOpen}
        >
          <span className="onetube-sidebar__info-title">プレミアムチケットについて</span>
          <span className="onetube-sidebar__info-icon" aria-hidden="true">
            {infoOpen ? '−' : '+'}
          </span>
        </button>
        <div className={`onetube-sidebar__info-body${infoOpen ? ' is-open' : ''}`}>
          <p>プレミアムチケットを購入すると、1ヶ月間、過去試合が見放題！！！！</p>
          <p>購入されたプレミアムチケットの70%相当額はプラットフォームを通して選手に支払われます！</p>
          <p>好きな選手を応援しよう！！！！</p>
        </div>
      </div>
    </aside>
  );
}

