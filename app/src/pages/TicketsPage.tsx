import type { CSSProperties } from 'react';

const ANDRADE_IMAGES = [
  'https://cdn.onefc.com/wp-content/uploads/2023/10/Fabricio_Andrade-avatar-500x345-1.png',
  'https://cdn.onefc.com/wp-content/uploads/2023/04/Enkh-Orgil-Avatar-500x345-1.png',
];

const SUPERBON_IMAGES = [
  'https://cdn.onefc.com/wp-content/uploads/2024/04/Superbon-Avatar-500x345-1.png',
  'https://cdn.onefc.com/wp-content/uploads/2025/03/Maasaki_Noiri-avatar-champ-500x345-1.png',
];

const TAWANCHAI_IMAGES = [
  'https://cdn.onefc.com/wp-content/uploads/2023/10/Tawanchai-avatar-500x345-1.png',
  'https://cdn.onefc.com/wp-content/uploads/2024/12/Liu_Mengyang-Avatar-500x345-1.png',
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
  isWalletConnected: boolean;
};

type ReferenceTicket = {
  id: string;
  eventTitle: string;
  matchTitle: string;
  venue: string;
  physicalPrice: string;
  premiumAddOn: string;
  stockLabel: string;
  soldOut: boolean;
  imageUrls: string[];
  isPrimary?: boolean;
  ownedDisplay?: boolean;
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
  isWalletConnected,
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
      if (inventoryCount === 0) return 'TICKETS NOT AVAILABLE';
      return `残り ${inventoryCount} / 10 PREMIUM NFT`;
    }
    return '在庫情報を取得できません';
  })();

  const referenceTickets: ReferenceTicket[] = [
    {
      id: 'ticket-andrade',
      eventTitle: 'ONE Fight Night 38: Andrade vs. Baatarkhuu',
      matchTitle: 'Fabricio Andrade vs Enkh-Orgil Baatarkhuu',
      venue: 'Lumpinee Stadium, Bangkok',
      physicalPrice: '¥168,000',
      premiumAddOn: '+¥5,000（手数料無料）',
      stockLabel: isWalletConnected ? 'ウォレットに保存済み（デモ）' : '残り 5 / 10 PREMIUM NFT',
      soldOut: false,
      imageUrls: ANDRADE_IMAGES,
      ownedDisplay: isWalletConnected,
    },
    {
      id: selected.id,
      eventTitle: 'ONE 173: Superbon vs. Noiri',
      matchTitle: 'Superbon vs Masaaki Noiri',
      venue: 'Ariake Arena, Tokyo',
      physicalPrice: '¥168,000',
      premiumAddOn: '+¥5,000（手数料無料）',
      stockLabel: primaryStockLabel,
      soldOut: inventoryCount === 0,
      imageUrls: SUPERBON_IMAGES,
      isPrimary: true,
    },
    {
      id: 'ticket-tawanchai',
      eventTitle: 'ONE Friday Fights 137: Tawanchai vs. Liu',
      matchTitle: 'Tawanchai PK Saenchai vs Liu Mengyang',
      venue: 'Lumpinee Stadium, Bangkok',
      physicalPrice: '¥168,000',
      premiumAddOn: '+¥5,000（手数料無料）',
      stockLabel: 'TICKETS NOT AVAILABLE',
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

  const handleStandardTicket = () => {
    addLog('tickets: standard ticket CTA clicked');
    const officialUrl = 'https://www.onefc.com/tickets/';
    if (typeof window !== 'undefined') {
      window.open(officialUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const statusLabelClass = (isOwnedTicket: boolean, soldOut: boolean) => {
    if (soldOut) return 'onetube-status-label onetube-status-label--sold';
    if (isOwnedTicket) return 'onetube-status-label onetube-status-label--owned';
    return 'onetube-status-label onetube-status-label--available';
  };

  return (
    <div className="tickets-page">
      {/* Figma参照: figma-ui/src/components/TicketsPage.tsx */}
      <section className="ticket-hero" style={heroStyle}>
        <div className="ticket-hero-inner">
          <p className="ticket-hero-title">PREMIUM TICKET NFT</p>
          <p className="ticket-hero-subtitle">ONE CHAMPIONSHIP</p>
          <p className="ticket-hero-body">世界最高峰の格闘技を、プレミアムチケットNFTで体験。完全版映像と限定アーカイブを収録。</p>
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
          const isPrimaryTicket = !!ticket.isPrimary;
          const isOwnedTicket = isPrimaryTicket ? owned : !!ticket.ownedDisplay;
          const statusLabel = ticket.soldOut
            ? 'TICKETS NOT AVAILABLE'
            : isOwnedTicket
            ? 'OWNED'
            : 'NOT OWNED';
          const galleryLock = isPrimaryTicket ? !owned : !ticket.ownedDisplay;

          return (
            <article key={ticket.id} className={`ticket-card${ticket.soldOut ? ' ticket-card--disabled' : ''}`}>
              <div className="ticket-card__title onetube-accent-bar">{ticket.eventTitle}</div>
              <div className="ticket-card__status-chip">
                <span className={statusLabelClass(isOwnedTicket, ticket.soldOut)}>{statusLabel}</span>
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
                    <span>プレミアム:</span>
                    <strong>{ticket.premiumAddOn}</strong>
                  </div>
                </div>

                <div className="ticket-card__stock">
                  {ticket.soldOut ? (
                    <p className="ticket-card__stockMessage ticket-card__stockMessage--sold">
                      {ticket.stockLabel || 'TICKETS NOT AVAILABLE - 次回アナウンスをお待ちください'}
                    </p>
                  ) : (
                    <p className="ticket-card__stockMessage">{ticket.stockLabel}</p>
                  )}
                </div>

                {isPrimaryTicket ? (
                  <>
                    {isOwnedTicket ? (
                      <div className="ticket-card__notice ticket-card__notice--owned">✅ 購入済みです。「VIDEOS」タブから完全版を視聴できます。</div>
                    ) : (
                      <>
                        <div className="ticket-card__actions">
                          <button
                            type="button"
                            className="ticket-card__cta"
                            onClick={handlePurchase}
                            disabled={purchasing || ticket.soldOut}
                          >
                            {purchasing ? 'PURCHASING…' : ticket.soldOut ? 'TICKETS NOT AVAILABLE' : 'BUY PREMIUM TICKET'}
                          </button>
                          <button
                            type="button"
                            className="ticket-card__cta ticket-card__cta--secondary"
                            onClick={handleStandardTicket}
                            disabled={purchasing || ticket.soldOut}
                          >
                            BUY TICKET
                          </button>
                        </div>
                        {purchaseError && (
                          <div className="ticket-card__notice ticket-card__notice--error">❌ {purchaseError}</div>
                        )}
                        {txDigest && (
                          <div className="ticket-card__notice ticket-card__notice--success">
                            ✅ トランザクション: <code>{txDigest.slice(0, 10)}...</code>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : ticket.ownedDisplay ? (
                  <div className="ticket-card__notice ticket-card__notice--owned">✅ このイベントのNFTはウォレットに保存済みです。</div>
                ) : ticket.id === 'ticket-andrade' ? (
                  <div className="ticket-card__actions">
                    <button type="button" className="ticket-card__cta" disabled>
                      BUY PREMIUM TICKET
                    </button>
                    <button type="button" className="ticket-card__cta ticket-card__cta--secondary" disabled>
                      BUY TICKET
                    </button>
                  </div>
                ) : (
                  <button type="button" className="ticket-card__cta ticket-card__cta--disabled" disabled>
                    {ticket.soldOut ? 'TICKETS NOT AVAILABLE' : 'BUY TICKET'}
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

