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
  // MVP用：実際には1枚のチケットのみ
  // 将来的には複数listing対応も可能
  
  if (!selected) {
    return (
      <div className="tickets-page">
        <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>
          動画データを読み込み中...
        </p>
      </div>
    );
  }

  // 価格情報（仕様書より）
  const physicalPrice = '¥20,000〜¥558,000';
  const premiumAddOn = '+¥5,000';
  const actualPrice = '0.5 SUI';

  // 在庫判定
  const isSoldOut = inventoryCount === 0;

  return (
    <div className="tickets-page">
      {/* ページタイトル */}
      <div className="tickets-page-header">
        <h2 className="tickets-page-title">チケット購入</h2>
        <p className="tickets-page-description">
          NFTチケットを購入すると、対戦の完全版映像を視聴できます。
        </p>
      </div>

      {/* メインカードコンテナ（ONE公式風） */}
      <div className="ticket-card-container">
        {/* イエローバー */}
        <div className="ticket-card-header">
          <div className="ticket-card-title">{selected.title}</div>
        </div>

        {/* カード本体 */}
        <div className="ticket-card-body">
          {/* 左側: サムネイル */}
          <div className="ticket-card-thumbnail">
            <img
              src={selected.thumbnail}
              alt={`${selected.title} - ${selected.athletes.join(', ')}`}
              style={{
                filter: owned ? 'none' : 'grayscale(80%)',
                opacity: owned ? 1 : 0.8,
              }}
            />
            {/* 保有状態バッジ */}
            {owned && (
              <div className="ticket-card-badge owned" aria-label="NFTチケット保有済み">
                ✅ OWNED
              </div>
            )}
            {!owned && (
              <div className="ticket-card-badge not-owned" aria-label="NFTチケット未保有">
                🔒 NOT OWNED
              </div>
            )}
          </div>

          {/* 右側: 詳細情報 + 購入 */}
          <div className="ticket-card-info">
            {/* イベント情報 */}
            <div className="ticket-info-section">
              <h3 className="ticket-info-heading">対戦情報</h3>
              <div className="ticket-info-row">
                <span className="ticket-info-label">日時:</span>
                <span className="ticket-info-value">{selected.date}</span>
              </div>
              <div className="ticket-info-row">
                <span className="ticket-info-label">選手:</span>
                <span className="ticket-info-value">{selected.athletes.join(' vs ')}</span>
              </div>
            </div>

            {/* 価格情報 */}
            <div className="ticket-info-section">
              <h3 className="ticket-info-heading">料金</h3>
              <div className="ticket-price-block">
                <div className="ticket-price-row">
                  <span className="ticket-price-label">物理チケット:</span>
                  <span className="ticket-price-value secondary">{physicalPrice}</span>
                </div>
                <div className="ticket-price-row">
                  <span className="ticket-price-label">プレミアム追加:</span>
                  <span className="ticket-price-value secondary">{premiumAddOn}</span>
                </div>
                <div className="ticket-price-row highlight">
                  <span className="ticket-price-label">実購入価格:</span>
                  <span className="ticket-price-value primary">{actualPrice}</span>
                </div>
              </div>
            </div>

            {/* 在庫情報 */}
            <div className="ticket-info-section">
              <div className="ticket-stock-header">
                <h3 className="ticket-info-heading">在庫状況</h3>
                <button
                  className="ticket-stock-reload"
                  onClick={onReloadInventory}
                  disabled={inventoryLoading}
                  aria-label="在庫情報を更新"
                >
                  {inventoryLoading ? '🔄 更新中...' : '🔄 更新'}
                </button>
              </div>
              {inventoryError ? (
                <p className="ticket-stock-error">{inventoryError}</p>
              ) : (
                <div className="ticket-stock-status">
                  {isSoldOut ? (
                    <span className="ticket-stock-text sold-out">
                      <strong>Sold Out</strong> - 在庫なし
                    </span>
                  ) : (
                    <span className="ticket-stock-text available">
                      残り <strong>{inventoryCount ?? '?'}</strong> チケットNFT
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 購入ボタンエリア */}
            <div className="ticket-purchase-section">
              {!owned && (
                <button
                  className="ticket-purchase-button"
                  onClick={onPurchase}
                  disabled={purchasing || isSoldOut}
                  aria-label={
                    isSoldOut
                      ? '在庫切れのため購入できません'
                      : purchasing
                      ? '購入処理中...'
                      : 'NFTチケットを購入'
                  }
                >
                  {purchasing
                    ? '⏳ 購入処理中...'
                    : isSoldOut
                    ? '❌ Sold Out'
                    : '💳 購入する'}
                </button>
              )}
              {owned && (
                <div className="ticket-owned-message">
                  ✅ 購入済みです。「VIDEOS」タブから視聴できます。
                </div>
              )}
              {purchaseError && (
                <p className="ticket-purchase-error" role="alert">
                  ❌ {purchaseError}
                </p>
              )}
              {txDigest && (
                <p className="ticket-purchase-success">
                  ✅ トランザクション: <code>{txDigest.slice(0, 10)}...</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 補足情報 */}
      <div className="tickets-page-footer">
        <p className="tickets-note">
          💡 <strong>Note:</strong> このプロトタイプではモックAPIを使用しています。実際のSuiトランザクションは発生しません。
        </p>
      </div>
    </div>
  );
}

