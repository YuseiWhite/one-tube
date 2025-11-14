import type { CSSProperties } from 'react';

const SUPERBON_IMAGES = [
  'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542720046-1e772598ea39?auto=format&fit=crop&w=800&q=80',
];

const RODTANG_IMAGES = [
  'https://images.unsplash.com/photo-1637055667163-ad033183b329?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1601039834001-7d32a613c60d?auto=format&fit=crop&w=800&q=80',
];

const TAWANCHAI_IMAGES = [
  'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1681203888755-bd61fe3558eb?auto=format&fit=crop&w=800&q=80',
];

type TicketsPageProps = {
  selected: {
    id: string;
    title: string;
    thumbnail: string;
    date: string;
    athletes: string[];
  } | null;
  owned: boolean;
  purchasing: boolean;
  purchaseError: string;
  txDigest: string;
  inventoryCount: number | null;
  inventoryLoading: boolean;
  inventoryError: string | null;
  onPurchase: () => void;
  onReloadInventory: () => void;
  addLog: (msg: string) => void;
};

type ReferenceTicket = {
  id: string;
  eventTitle: string;
  matchTitle: string;
  venue: string;
  physicalPrice: string;
  premiumAddOn: string;
  suiPrice: string;
  stockLabel: string;
  soldOut: boolean;
  imageUrls: string[];
  isPrimary?: boolean;
  owned?: boolean;
};

export default function TicketsPage({
  selected,
  owned,
  purchasing,
  purchaseError,
  txDigest,
  inventoryCount,
  inventoryLoading,
  inventoryError,
  onPurchase,
  onReloadInventory,
  addLog,
}: TicketsPageProps) {
  if (!selected) {
    return <div className="page-placeholder">動画データを読み込み中...</div>;
  }

  const heroBackground = selected.thumbnail || SUPERBON_IMAGES[0];
  const matchTitle = selected.athletes.join(' vs ');
  const heroDate = selected.date
    ? new Date(selected.date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '日付未定';
  const heroStyle = {
    '--ticket-hero-image': `url(${heroBackground})`,
  } as CSSProperties;

  const primaryStockLabel = (() => {
    if (inventoryLoading) return '在庫情報を取得しています...';
    if (typeof inventoryCount === 'number') {
      if (inventoryCount === 0) return '在庫なし';
      return `残り ${inventoryCount} / 10 チケットNFT`;
    }
    return '在庫情報を取得できません';
  })();

  const referenceTickets: ReferenceTicket[] = [
    {
      id: selected.id,
      eventTitle: `ONE 173: ${matchTitle.toUpperCase()}`,
      matchTitle,
      venue: 'Ariake Arena, Tokyo',
      physicalPrice: '¥20,000 〜 ¥558,000',
      premiumAddOn: '+¥5,000',
      suiPrice: '0.5 SUI',
      stockLabel: primaryStockLabel,
      soldOut: inventoryCount === 0,
      imageUrls: SUPERBON_IMAGES,
      isPrimary: true,
      owned,
    },
    {
      id: 'ticket-rodtang',
      eventTitle: 'ONE 172: RODTANG VS. PRAJANCHAI',
      matchTitle: 'Rodtang vs Prajanchai',
      venue: 'Impact Arena, Bangkok',
      physicalPrice: '¥15,000 〜 ¥420,000',
      premiumAddOn: '+¥5,000',
      suiPrice: '0.5 SUI',
      stockLabel: '残り 8 / 15 チケットNFT',
      soldOut: false,
      imageUrls: RODTANG_IMAGES,
    },
    {
      id: 'ticket-tawanchai',
      eventTitle: 'ONE 171: TAWANCHAI VS. NATTAWUT',
      matchTitle: 'Tawanchai vs Nattawut',
      venue: 'Singapore Indoor Stadium',
      physicalPrice: '¥18,000 〜 ¥480,000',
      premiumAddOn: '+¥5,000',
      suiPrice: '0.5 SUI',
      stockLabel: 'SOLD OUT - 在庫なし',
      soldOut: true,
      imageUrls: TAWANCHAI_IMAGES,
    },
  ];

  const handleReload = () => {
    addLog('tickets: reload inventory requested');
    onReloadInventory();
  };

  const handlePurchase = () => {
    addLog('tickets: purchase requested');
    onPurchase();
  };

  const statusLabelClass = (ticket: ReferenceTicket) => {
    if (ticket.isPrimary && ticket.owned) return 'onetube-status-label onetube-status-label--owned';
    if (ticket.soldOut) return 'onetube-status-label onetube-status-label--sold';
    return 'onetube-status-label onetube-status-label--available';
  };

  return (
    <div className="tickets-page">
      {/* Figma参照: figma-ui/src/components/TicketsPage.tsx */}
      <section className="ticket-hero" style={heroStyle}>
        <div className="ticket-hero-inner">
          <p className="ticket-hero-title">PREMIUM TICKET NFT</p>
          <p className="ticket-hero-subtitle">ONE CHAMPIONSHIP</p>
          <p className="ticket-hero-body">世界最高峰の格闘技を、プレミアムチケットNFTで体験。完全版映像・限定アーカイブ・ガス代スポンサー対応。</p>
          <p className="ticket-hero-date">{heroDate}</p>
        </div>
      </section>

      <section className="tickets-availability">
        <div>
          <p className="tickets-availability__label">AVAILABLE TICKETS</p>
          <p className="tickets-availability__hint">在庫が無くなり次第、次回大会まで販売停止となります。</p>
        </div>
        <button type="button" className="tickets-availability__reload" onClick={handleReload} disabled={inventoryLoading}>
          {inventoryLoading ? '更新中…' : '在庫を更新'}
        </button>
      </section>

      {!owned && (
        <div className="tickets-alert tickets-alert--warn">
          ⚠️ チケットを購入するにはウォレットを接続してください。接続済みの場合はそのまま購入に進めます。
        </div>
      )}

      {inventoryError && <div className="tickets-alert tickets-alert--error">{inventoryError}</div>}

      <div className="ticket-grid">
        {referenceTickets.map((ticket) => {
          const statusLabel = ticket.isPrimary ? (ticket.owned ? 'OWNED' : 'NOT OWNED') : ticket.soldOut ? 'SOLD OUT' : 'NOT OWNED';
          const galleryLock = ticket.isPrimary && !ticket.owned;

          return (
            <article key={ticket.id} className={`ticket-card${ticket.soldOut ? ' ticket-card--disabled' : ''}`}>
              <div className="ticket-card__title onetube-accent-bar">{ticket.eventTitle}</div>
              <div className="ticket-card__status-chip">
                <span className={statusLabelClass(ticket)}>{statusLabel}</span>
              </div>

              <div className="ticket-card__gallery">
                {ticket.imageUrls.map((url, idx) => (
                  <figure key={`${ticket.id}-${idx}`} className={`ticket-card__image${galleryLock ? ' ticket-card__image--locked' : ''}`}>
                    <img src={url} alt={`${ticket.matchTitle} ${idx + 1}`} loading="lazy" />
                  </figure>
                ))}
              </div>

              <div className="ticket-card__body">
                <div className="ticket-card__meta">
                  <p className="ticket-card__match">{ticket.matchTitle}</p>
                  <p className="ticket-card__venue">{ticket.venue}</p>
                </div>

                <div className="ticket-card__price">
                  <div className="ticket-card__priceRow">
                    <span>物理チケット:</span>
                    <strong>{ticket.physicalPrice}</strong>
                  </div>
                  <div className="ticket-card__priceRow">
                    <span>プレミアム追加:</span>
                    <strong>{ticket.premiumAddOn}</strong>
                  </div>
                  <div className="ticket-card__priceRow ticket-card__priceRow--accent">
                    <span>実購入価格:</span>
                    <strong>{ticket.suiPrice}</strong>
                  </div>
                </div>

                <div className="ticket-card__stock">
                  {ticket.soldOut ? (
                    <p className="ticket-card__stockMessage ticket-card__stockMessage--sold">SOLD OUT - 次回ロットをお待ちください</p>
                  ) : (
                    <p className="ticket-card__stockMessage">{ticket.stockLabel}</p>
                  )}
                </div>

                {ticket.isPrimary ? (
                  <>
                    {ticket.owned ? (
                      <div className="ticket-card__notice ticket-card__notice--owned">✅ 購入済みです。「VIDEOS」タブから完全版を視聴できます。</div>
                    ) : (
                      <button
                        type="button"
                        className="ticket-card__cta"
                        onClick={handlePurchase}
                        disabled={purchasing || ticket.soldOut}
                      >
                        {purchasing ? 'PURCHASING…' : ticket.soldOut ? 'SOLD OUT' : 'BUY PREMIUM TICKET'}
                      </button>
                    )}

                    {!ticket.owned && !ticket.soldOut && <p className="ticket-card__helper">ガス代なし（Sponsored Tx）</p>}

                    {purchaseError && !ticket.owned && <div className="ticket-card__notice ticket-card__notice--error">❌ {purchaseError}</div>}

                    {txDigest && (
                      <div className="ticket-card__notice ticket-card__notice--success">
                        ✅ トランザクション: <code>{txDigest.slice(0, 10)}...</code>
                      </div>
                    )}
                  </>
                ) : (
                  <button type="button" className="ticket-card__cta ticket-card__cta--disabled" disabled>
                    {ticket.soldOut ? 'SOLD OUT' : 'COMING SOON'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="tickets-footnote">ℹ️ このプレビューではモックAPI/トランザクションを使用しています。本番環境ではSui本番ネットワークでの決済・映像配信に接続されます。</p>
    </div>
  );
}

