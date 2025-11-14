type SidebarProps = {
  activePage: 'tickets' | 'videos';
  onChange: (page: 'tickets' | 'videos') => void;
};

export default function Sidebar({ activePage, onChange }: SidebarProps) {
  return (
    <aside className="onetube-sidebar">
      {/* Figma参照: figma-ui/src/components/Sidebar.tsx */}
      <nav className="onetube-sidebar__nav" aria-label="Main navigation">
        <button
          type="button"
          className={`onetube-sidebar__button ${activePage === 'tickets' ? 'is-active' : ''}`}
          onClick={() => onChange('tickets')}
        >
          <span className="onetube-sidebar__label">TICKETS</span>
        </button>
        <button
          type="button"
          className={`onetube-sidebar__button ${activePage === 'videos' ? 'is-active' : ''}`}
          onClick={() => onChange('videos')}
        >
          <span className="onetube-sidebar__label">VIDEOS</span>
        </button>
      </nav>

      <div className="onetube-sidebar__info">
        <p className="onetube-sidebar__info-title">プレミアムチケットNFTについて</p>
        <ul className="onetube-sidebar__info-list">
          <li>
            <span className="onetube-sidebar__bullet">•</span>
            <div>
              <div>1ヶ月間、過去試合が見放題</div>
              <div className="onetube-sidebar__caption">※将来機能（MVPではメッセージのみ）</div>
            </div>
          </li>
          <li>
            <span className="onetube-sidebar__bullet">•</span>
            <div>購入時に選手 70% / ONE 25% / Platform 5% で自動分配</div>
          </li>
        </ul>
      </div>
    </aside>
  );
}

