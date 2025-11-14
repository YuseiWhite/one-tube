import { useEffect, useRef, useState, useCallback } from 'react';
import './styles/app.css';
import Header from './components/Header';
import Player from './components/Player';
import { Toast } from './components/Toast';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

// Legacy mock API
import { watch, purchaseSmart } from './lib/api';
// New API (Issue #009)
import { getListings, createWatchSession, getVideoUrl } from './lib/api';

type VideoData = {
  id: string; title: string; thumbnail: string; previewUrl: string;
  date: string; athletes: string[];
};

const useNewApi = !!(import.meta as any).env?.VITE_API_BASE_URL;

type Listing = { listingId: string; objectId: string; price: number };

export default function App() {
  // ページ切り替え: 'tickets' = チケット購入, 'video' = 動画視聴
  const [page, setPage] = useState<'tickets' | 'video'>('tickets');
  
  // tabs: 'list' | 'owned' | 'debug'
  const [tab, setTab] = useState<'list'|'owned'|'debug'>('list');

  // mock videos.json (複数アイテム + 選択中)
  const [items, setItems] = useState<VideoData[]>([]);
  const [selected, setSelected] = useState<VideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState('');

  // 在庫管理（MVP: ダミー）
  const [stock, setStock] = useState<number | null>(null);

  // listings (new api)
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // 在庫管理（実API対応）
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // purchase state
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [txDigest, setTxDigest] = useState('');

  // player state
  const [fullUrl, setFullUrl] = useState<string | undefined>(undefined);
  const [fullVideoUrl, setFullVideoUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const sessionTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(()=>setToast(null), 3200);
  };

  // logs
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Wallet connection
  const account = useCurrentAccount();
  const shortAddress =
    account?.address ? `0x...${account.address.slice(-4)}` : null;

  useEffect(() => {
    return () => { if (sessionTimer.current) window.clearTimeout(sessionTimer.current); };
  }, []);

  // セッション期限切れ監視
  useEffect(() => {
    if (sessionExpiresAt === null) return;
    
    const checkInterval = setInterval(() => {
      if (Date.now() >= sessionExpiresAt) {
        setSessionExpired(true);
        addLog('セッション期限切れを検知');
        // 動画を一時停止
        if (videoRef.current) {
          videoRef.current.pause();
        }
        clearInterval(checkInterval);
      }
    }, 1000); // 1秒ごとにチェック
    
    return () => clearInterval(checkInterval);
  }, [sessionExpiresAt]);

  // キーボード操作: Space/P（再生/一時停止）、←/→（1秒シーク）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // 入力フィールドにフォーカスがある場合はスキップ
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'p':
        case 'P':
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
            addLog('keyboard: play');
          } else {
            videoRef.current.pause();
            addLog('keyboard: pause');
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1);
          addLog(`keyboard: seek -1s (${Math.floor(videoRef.current.currentTime)}s)`);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + 1
          );
          addLog(`keyboard: seek +1s (${Math.floor(videoRef.current.currentTime)}s)`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // load mock videos.json (for preview + mock flow)
  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch('/src/assets/videos.json');
        if (!r.ok) throw new Error('Failed to load videos.json');
        const arr: VideoData[] = await r.json();
        setItems(arr);
        setSelected(arr[0] ?? null);
        // ダミー在庫設定（MVP）
        setStock(3);
        addLog(`動画データ読み込み完了: ${arr.length}件`);
      } catch (e) {
        setVideoLoadError('動画データの読み込みに失敗しました');
        addLog('動画データ読み込み失敗');
      } finally {
        setLoadingVideo(false);
      }
    };
    run();
  }, []);

  // load listings if new api
  useEffect(() => {
    if (!useNewApi) return;
    setLoadingListings(true);
    getListings()
      .then(list => setListings(list))
      .catch(()=>{})
      .finally(()=> setLoadingListings(false));
  }, []);

  // 在庫取得関数
  const loadInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const listings = await getListings();
      setInventoryCount(listings.length);
      addLog(`在庫情報を取得: ${listings.length}件`);
    } catch (err) {
      console.error("Failed to load inventory", err);
      setInventoryError("在庫情報を取得できませんでした");
      setInventoryCount(null);
      addLog('在庫情報の取得に失敗');
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  // 初回マウント時に在庫情報を取得
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // purchase
  const handlePurchase = async () => {
    setPurchasing(true); setPurchaseError(''); setTxDigest('');
    
    // ステップ1: 処理開始
    showToast('処理中…');
    addLog('purchase: start');
    
    try {
      // ステップ2: 送信中（擬似的に遅延）
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('送信中…');
      addLog('purchase: sending transaction');
      
      // 現状は listingId 固定のモック呼び出し
      // 将来: 本API購入に切替する場合はここに分岐
      const result = await purchaseSmart('listing-superbon-noiri-ko');
      
      // ステップ3: 確認中（擬似的に遅延）
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('確認中…');
      addLog('purchase: confirming');
      
      if (result.success) {
        const digest = result.txDigest || '0xmock_tx';
        setOwned(true);
        setTxDigest(digest);
        // 在庫を1つ減らす（MVP: ダミー）
        if (stock !== null && stock > 0) {
          setStock(stock - 1);
        }
        // ステップ4: 成功
        addLog(`purchase: success, tx=${digest}, 残り在庫: ${(stock || 0) - 1}`);
        showToast('✅ 購入が完了しました');
        // 在庫情報を更新
        loadInventory();
      } else {
        const errMsg = result.message || '購入に失敗しました';
        setPurchaseError(errMsg);
        addLog(`purchase: error=${errMsg}`);
        showToast(`❌ 購入に失敗しました: ${errMsg}`);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'サーバーエラーが発生しました';
      setPurchaseError(errMsg);
      addLog(`purchase: error=${errMsg}`);
      showToast(`❌ 購入に失敗しました: ${errMsg}`);
    } finally {
      setPurchasing(false);
    }
  };

  // watch full
  const handleWatch = async () => {
    // ウォレット未接続または購入前のチェック
    if (!account?.address) {
      showToast('❌ ウォレットを接続してください');
      addLog('watch: error - ウォレット未接続');
      return;
    }
    
    if (!owned) {
      showToast('❌ チケットを購入してください');
      addLog('watch: error - チケット未購入');
      return;
    }
    
    setWatchLoading(true);
    setSessionExpired(false);
    showToast('セッション生成中…');
    addLog('watch: start');
    
    try {
      if (!useNewApi) {
        const result = await watch('superbon-noiri-ko');
        if (result.success && result.videoUrl) {
          setFullUrl(result.videoUrl);
          setFullVideoUrl(result.videoUrl);
          setSessionToken(result.sessionToken ?? null);
          
          // expiresAt を計算（現在時刻 + TTL）
          const ttl = result.expiresInSec ?? 30;
          const expiresAt = Date.now() + (ttl * 1000);
          setSessionExpiresAt(expiresAt);
          
          addLog(`watch: url=${result.videoUrl.slice(0, 30)}..., ttl=${ttl}s`);
          addLog('視聴セッションを開始しました');
          showToast('✅ 視聴を開始します');
          
          if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
          sessionTimer.current = window.setTimeout(()=>{
            setSessionExpired(true);
            showToast('⚠️ セッションが期限切れになりました');
            addLog('watch: expired');
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }, ttl * 1000);
        } else {
          const errMsg = result.message || 'URL取得失敗';
          addLog(`watch: error - ${errMsg}`);
          showToast(`❌ 動画URLの取得に失敗: ${errMsg}`);
          // エラー時はクリア
          setFullVideoUrl(null);
          setSessionToken(null);
          setSessionExpiresAt(null);
        }
      } else {
        // 本API: セッション作成 → videoURL取得
        const session = await createWatchSession('superbon-noiri-ko');
        if (!session?.sessionToken) {
          addLog('watch: error - セッション作成失敗');
          showToast('❌ セッション作成に失敗');
          // エラー時はクリア
          setFullVideoUrl(null);
          setSessionToken(null);
          setSessionExpiresAt(null);
          return;
        }
        addLog(`watch: session token=${session.sessionToken.slice(0,8)}...`);
        
        const video = await getVideoUrl('superbon-noiri-ko', session.sessionToken);
        if (!video?.videoUrl) {
          addLog('watch: error - 動画URL取得失敗');
          showToast('❌ 動画URL取得に失敗');
          // エラー時はクリア
          setFullVideoUrl(null);
          setSessionToken(null);
          setSessionExpiresAt(null);
          return;
        }
        
        setFullUrl(video.videoUrl);
        setFullVideoUrl(video.videoUrl);
        setSessionToken(session.sessionToken);
        
        // expiresAt を計算
        const ttl = session.expiresInSec ?? 30;
        const expiresAt = Date.now() + (ttl * 1000);
        setSessionExpiresAt(expiresAt);
        
        addLog(`watch: url=${video.videoUrl.slice(0, 30)}..., ttl=${ttl}s`);
        addLog('視聴セッションを開始しました');
        showToast('✅ 視聴を開始します');
        
        if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
        sessionTimer.current = window.setTimeout(()=>{
          setSessionExpired(true);
          showToast('⚠️ セッションが期限切れになりました');
          addLog('watch: expired');
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }, ttl * 1000);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '再生準備に失敗';
      addLog(`watch: error - ${errMsg}`);
      showToast('❌ 再生準備に失敗しました');
      // エラー時はクリア
      setFullVideoUrl(null);
      setSessionToken(null);
      setSessionExpiresAt(null);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleRetryWatch = () => {
    addLog('watch: retry requested');
    showToast('再取得中…');
    handleWatch();
  };

  // UI
	return (
    <div style={{ background: '#0f0f0f', color: '#eaeaea', minHeight: '100vh' }}>
      {/* Wallet Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#050509',
          borderBottom: '1px solid #222',
          marginBottom: '16px',
        }}
      >
        {/* 左側: ロゴテキスト */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            OneTube
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#aaa',
            }}
          >
            Premium Fight Archive
          </span>
        </div>

        {/* 右側: ネットワーク + アドレス + ConnectButton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Network badge */}
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#122a1a',
              color: '#4ade80',
              fontSize: '12px',
              border: '1px solid #14532d',
            }}
          >
            ● Sui devnet
          </span>

          {/* Address (connected only) */}
          {shortAddress && (
            <span
              style={{
                fontSize: '12px',
                color: '#ddd',
                padding: '4px 8px',
                borderRadius: '999px',
                backgroundColor: '#111',
                border: '1px solid #333',
              }}
            >
              {shortAddress}
            </span>
          )}

          {/* ConnectButton */}
          <ConnectButton
            connectText="ウォレット接続"
            className="onetube-connect-button"
            aria-label="Sui Walletを接続"
          />
        </div>
      </header>

      <Header />
      
      {/* ページ切り替えタブ：チケット購入 / 動画視聴 */}
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 8px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage('tickets')}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #333',
              background: page === 'tickets' ? '#facc15' : '#111',
              color: page === 'tickets' ? '#000' : '#e5e7eb',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🎟 チケット購入
          </button>
          <button
            onClick={() => setPage('video')}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #333',
              background: page === 'video' ? '#facc15' : '#111',
              color: page === 'video' ? '#000' : '#e5e7eb',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ▶ 動画視聴
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 24 }}>
        {page === 'tickets' ? (
          <TicketPage
            tab={tab}
            setTab={setTab}
            items={items}
            selected={selected}
            setSelected={setSelected}
            loadingVideo={loadingVideo}
            videoLoadError={videoLoadError}
            owned={owned}
            purchasing={purchasing}
            purchaseError={purchaseError}
            txDigest={txDigest}
            inventoryCount={inventoryCount}
            inventoryLoading={inventoryLoading}
            inventoryError={inventoryError}
            onPurchase={handlePurchase}
            onReloadInventory={loadInventory}
            addLog={addLog}
          />
        ) : (
          <VideoPage
            selected={selected}
            previewUrl={selected?.previewUrl ?? null}
            fullUrl={fullUrl ?? null}
            sessionExpired={sessionExpired}
            watchLoading={watchLoading}
            onWatch={handleWatch}
            onRetryWatch={handleRetryWatch}
            logs={logs}
            videoRef={videoRef}
            owned={owned}
          />
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============================
// TicketPage コンポーネント
// ============================

type TicketPageProps = {
  tab: 'list' | 'owned' | 'debug';
  setTab: (t: 'list' | 'owned' | 'debug') => void;
  items: VideoData[];
  selected: VideoData | null;
  setSelected: (v: VideoData | null) => void;
  loadingVideo: boolean;
  videoLoadError: string;
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

function TicketPage(props: TicketPageProps) {
  const {
    tab,
    setTab,
    items,
    selected,
    setSelected,
    loadingVideo,
    videoLoadError,
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
  } = props;

  const isSoldOut = inventoryCount === 0;

  return (
    <div className='onetube-ticket-page'>
      {/* 上部ラベル "TICKETS" */}
      <div className='onetube-ticket-header'>
        <span className='onetube-ticket-header-label'>TICKETS</span>
      </div>

      {/* ONE 公式風 タブ（一覧 / マイアクセス / デバッグ） */}
      <div className='onetube-ticket-tabs'>
        <button
          className={`onetube-ticket-tab ${tab === 'list' ? 'active' : ''}`}
          onClick={() => setTab('list')}
        >
          一覧
        </button>
        <button
          className={`onetube-ticket-tab ${tab === 'owned' ? 'active' : ''}`}
          onClick={() => setTab('owned')}
        >
          マイアクセス
        </button>
        <button
          className={`onetube-ticket-tab ${tab === 'debug' ? 'active' : ''}`}
          onClick={() => setTab('debug')}
        >
          デバッグ
        </button>
      </div>

      {/* メインカードエリア */}
      <div className='onetube-ticket-main'>
        {/* 左側：選択中イベントの ONE 公式風カード */}
        <div className='onetube-ticket-card-wrapper'>
          <article className='onetube-ticket-card'>
            {/* 黄色バー */}
            <header className='onetube-ticket-card-header'>
              <span className='onetube-ticket-card-header-text'>
                {selected?.title || 'ONE 173: SUPERBON VS. NOIRI'}
              </span>
            </header>

            {/* 中央：サムネ + VS 表記（ざっくりで OK） */}
            <div className='onetube-ticket-card-body'>
              <div className='onetube-ticket-card-thumb'>
                {selected && (
                  <>
                    <img
                      src={selected.thumbnail}
                      alt={`${selected.title} - ${selected.athletes.join(', ')}`}
                      style={{
                        filter: owned ? 'none' : 'grayscale(100%)',
                        opacity: owned ? 1 : 0.7,
                      }}
                    />
                    {owned && (
                      <div className='ownership-badge owned'>
                        ✅ 保有中
                      </div>
                    )}
                    {!owned && (
                      <div className='ownership-badge locked'>
                        🔒 未購入
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className='onetube-ticket-card-meta'>
                <div className='onetube-ticket-card-meta-row onetube-ticket-card-vs'>
                  <span className='name'>
                    {selected?.athletes[0] ?? 'Superbon'}
                  </span>
                  <span className='vs'>VS</span>
                  <span className='name'>
                    {selected?.athletes[1] ?? 'Masaaki Noiri'}
                  </span>
                </div>
                <div className='onetube-ticket-card-meta-row'>
                  <span className='label'>DATE</span>
                  <span className='value'>{selected?.date ?? '2024-01-15'}</span>
                </div>
                <div className='onetube-ticket-card-meta-row'>
                  <span className='label'>VENUE</span>
                  <span className='value'>Ariake Arena, Tokyo</span>
                </div>
              </div>
            </div>

            {/* 下部：価格 + 在庫 + BUY ボタン */}
            <footer className='onetube-ticket-card-footer'>
              <div className='onetube-ticket-price-block'>
                <div className='row'>
                  <span className='label'>物理チケット</span>
                  <span className='value'>¥20,000 〜 ¥558,000</span>
                </div>
                <div className='row'>
                  <span className='label'>プレミアム追加</span>
                  <span className='value'>+¥5,000</span>
                </div>
                <div className='divider' />
                <div className='row emphasis'>
                  <span className='label'>実購入価格</span>
                  <span className='value'>0.5 SUI</span>
                </div>
              </div>

              <div className='onetube-ticket-stock-block'>
                {inventoryLoading && (
                  <div className='stock-row muted'>在庫情報を読み込み中...</div>
                )}
                {!inventoryLoading && inventoryError && (
                  <div className='stock-row error'>{inventoryError}</div>
                )}
                {!inventoryLoading && !inventoryError && (
                  <>
                    {inventoryCount === 0 && (
                      <div className='stock-row error'>
                        Sold Out：現在販売中のチケットNFTはありません
                      </div>
                    )}
                    {inventoryCount !== null && inventoryCount > 0 && (
                      <div className='stock-row'>
                        残り <strong>{inventoryCount}</strong> チケットNFT
                      </div>
                    )}
                    {inventoryCount === null && (
                      <div className='stock-row muted'>在庫情報は未取得です</div>
                    )}
                  </>
                )}

                <div className='stock-actions'>
                  <button
                    type='button'
                    className='onetube-btn-outline'
                    onClick={onReloadInventory}
                    disabled={inventoryLoading}
                    aria-label='在庫情報を再読み込み'
                  >
                    在庫を更新
                  </button>

                  <button
                    type='button'
                    className='onetube-btn-primary'
                    onClick={onPurchase}
                    disabled={owned || purchasing || isSoldOut}
                    aria-label={
                      isSoldOut
                        ? 'Sold Out'
                        : owned
                        ? '購入済み'
                        : 'クリックしてプレミアムチケットを購入'
                    }
                  >
                    {isSoldOut
                      ? 'Sold Out'
                      : owned
                      ? '購入済み'
                      : purchasing
                      ? '購入中...'
                      : 'BUY TICKET'}
                  </button>
                </div>

                {purchaseError && (
                  <div className='stock-row error-inline'>❌ {purchaseError}</div>
                )}

                {owned && txDigest && (
                  <div className='stock-row success'>
                    ✅ 購入完了（Tx:{' '}
                    <code className='tx-code'>{txDigest}</code>）
                  </div>
                )}
              </div>
            </footer>
          </article>
        </div>

        {/* 右側：出品中の動画一覧（ONE の SHOW MORE の横に出てくるカード群イメージ） */}
        <div className='onetube-ticket-side'>
          <h3 className='onetube-ticket-side-title'>出品中の動画</h3>

          {loadingVideo && (
            <div className='onetube-ticket-side-info'>読み込み中...</div>
          )}
          {videoLoadError && (
            <div className='onetube-ticket-side-info error'>
              ❌ {videoLoadError}
            </div>
          )}

          <div className='onetube-ticket-side-grid'>
            {items.map((v) => (
              <button
                key={v.id}
                className={`onetube-ticket-side-card ${
                  selected?.id === v.id ? 'active' : ''
                } ${!owned ? 'locked' : ''}`}
                onClick={() => {
                  setSelected(v);
                  addLog(`動画選択: ${v.title}`);
                }}
                aria-label={`動画を選択: ${v.title}`}
              >
                <div className='thumbnail-wrapper'>
                  <img
                    src={v.thumbnail}
                    alt={`${v.title} - ${v.athletes.join(', ')}`}
                    style={{
                      filter: owned ? 'none' : 'grayscale(100%)',
                      opacity: owned ? 1 : 0.6,
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility =
                        'hidden';
                    }}
                  />
                  {!owned && (
                    <div className='lock-badge'>
                      🔒 未購入
                    </div>
                  )}
                </div>
                <div className='title'>{v.title}</div>
                <div className='meta'>{v.date}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// VideoPage コンポーネント
// ============================

type VideoPageProps = {
  selected: VideoData | null;
  previewUrl: string | null;
  fullUrl: string | null;
  sessionExpired: boolean;
  watchLoading: boolean;
  onWatch: () => void;
  onRetryWatch: () => void;
  logs: string[];
  owned: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
};

function VideoPage(props: VideoPageProps) {
  const {
    selected,
    previewUrl,
    fullUrl,
    sessionExpired,
    watchLoading,
    onWatch,
    onRetryWatch,
    logs,
    owned,
    videoRef,
  } = props;

  return (
    <div className='onetube-video-page'>
      <div className='onetube-video-layout'>
        {/* 左：YouTube 風プレイヤー＋タイトル＋メタ情報 */}
        <div className='onetube-video-main'>
          <div className='onetube-video-player'>
            <Player
              previewUrl={previewUrl ?? undefined}
              fullUrl={fullUrl ?? undefined}
              sessionExpired={sessionExpired}
              videoRef={videoRef}
            />
          </div>

          <h1 className='onetube-video-title'>
            {selected?.title ?? 'Premium Fight Highlight'}
          </h1>

          <div className='onetube-video-meta'>
            <span>{selected?.date ?? '2024-01-15'}</span>
            {selected?.athletes && selected.athletes.length > 0 && (
              <span> • {selected.athletes.join(' vs ')}</span>
            )}
          </div>

          <div className='onetube-video-description'>
            <p>
              この動画は OneTube のデモコンテンツです。プレミアムチケット NFT
              を保有している場合、完全版を視聴できます。
            </p>
            <p className='note'>
              ※ 本番環境では 4K・マルチアングル配信や、選手ごとの追加コンテンツが利用可能になります。
            </p>
          </div>
        </div>

        {/* 右：サイドパネル（視聴ボタン + セッション状態 + ログ） */}
        <aside className='onetube-video-side'>
          <div className='onetube-video-side-card'>
            <h2>視聴コントロール</h2>
            <p className='status'>
              プレミアムチケット:{' '}
              <strong>{owned ? '保有中 ✅' : '未保有 ❌'}</strong>
            </p>

            <button
              className='onetube-btn-primary full'
              onClick={onWatch}
              disabled={watchLoading || !owned}
              aria-label='完全版を視聴'
            >
              {watchLoading
                ? 'セッション生成中...'
                : owned
                ? '完全版を視聴'
                : 'チケット未保有'}
            </button>

            {sessionExpired && (
              <button
                className='onetube-btn-secondary full'
                onClick={onRetryWatch}
                disabled={watchLoading}
              >
                もう一度視聴
              </button>
            )}

            {sessionExpired && fullUrl && (
              <div className='session-alert' role='alert'>
                <div className='title'>⚠️ セッション期限切れ</div>
                <div className='body'>
                  セッションが期限切れになりました。もう一度視聴ボタンから新しいキーを取得してください。
                </div>
              </div>
            )}
          </div>

          <div className='onetube-video-side-card logs'>
            <h2>ログ</h2>
            <div className='log-list'>
              {logs.length === 0 && (
                <div className='log-empty'>まだログはありません。</div>
              )}
              {logs.map((line, idx) => (
                <div className='log-line' key={idx}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
