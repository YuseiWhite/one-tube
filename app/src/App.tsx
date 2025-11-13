import { useEffect, useRef, useState } from 'react';
import './styles/app.css';
import Header from './components/Header';
import VideoCard from './components/VideoCard';
import Player from './components/Player';
import { Toast } from './components/Toast';
import { LogPanel } from './components/LogPanel';

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

  // purchase state
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [txDigest, setTxDigest] = useState('');

  // player state
  const [fullUrl, setFullUrl] = useState<string | undefined>(undefined);
  const [sessionExpired, setSessionExpired] = useState(false);
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

  useEffect(() => {
    return () => { if (sessionTimer.current) window.clearTimeout(sessionTimer.current); };
  }, []);

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
    setSessionExpired(false);
    showToast('セッション生成中…');
    addLog('watch: start');
    
    try {
      if (!useNewApi) {
        const result = await watch('superbon-noiri-ko');
        if (result.success && result.videoUrl) {
          setFullUrl(result.videoUrl);
          const ttl = result.expiresInSec ?? 30;
          const ms = ttl * 1000;
          addLog(`watch: url=${result.videoUrl.slice(0, 30)}..., ttl=${ttl}s`);
          showToast('✅ 視聴を開始します');
          
          if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
          sessionTimer.current = window.setTimeout(()=>{
            setSessionExpired(true);
            showToast('⚠️ セッションが期限切れになりました');
            addLog('watch: expired');
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }, ms);
        } else {
          addLog('watch: error - URL取得失敗');
          showToast('❌ 動画URLの取得に失敗（モック）');
        }
      } else {
        // 本API: セッション作成 → videoURL取得
        const session = await createWatchSession('superbon-noiri-ko');
        if (!session?.sessionToken) {
          addLog('watch: error - セッション作成失敗');
          showToast('❌ セッション作成に失敗');
          return;
        }
        addLog(`watch: session token=${session.sessionToken.slice(0,8)}...`);
        
        const video = await getVideoUrl('superbon-noiri-ko', session.sessionToken);
        if (!video?.videoUrl) {
          addLog('watch: error - 動画URL取得失敗');
          showToast('❌ 動画URL取得に失敗');
          return;
        }
        
        setFullUrl(video.videoUrl);
        const ttl = session.expiresInSec ?? 30;
        addLog(`watch: url=${video.videoUrl.slice(0, 30)}..., ttl=${ttl}s`);
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
      <Header />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 24 }}>
        <div className='container layout'>
        {/* Sidebar */}
        <aside className='sidebar'>
          <div className='tabs'>
            <div className={`tab ${tab==='list'?'active':''}`} onClick={()=>setTab('list')}>一覧</div>
            <div className={`tab ${tab==='owned'?'active':''}`} onClick={()=>setTab('owned')}>マイアクセス</div>
            <div className={`tab ${tab==='debug'?'active':''}`} onClick={()=>setTab('debug')}>デバッグ</div>
          </div>
        </aside>

        {/* Main */}
        <main className='main'>
          {/* Listings */}
          <div className='card'>
            <div className='row'>
              <h2 style={{margin:0}}>コンテンツ</h2>
              <div className='kv'>{useNewApi ? 'Backend Listings' : 'Mock Listing (videos.json)'}</div>
            </div>

            {tab==='list' && (
              <>
                {useNewApi ? (
                  <>
                    {loadingListings ? <div className='kv'>読み込み中...</div> : (
                      <div className='grid' style={{marginTop:12}}>
                        {listings.map((it, idx) => (
                          <VideoCard
                            key={idx}
                            title={`Premium Ticket ${it.objectId.slice(0,6)}…`}
                            thumb={selected?.thumbnail}
                            priceLabel={`${(it.price/1e9).toFixed(3)} SUI`}
                            onPurchase={handlePurchase}
                            disabled={purchasing}
                          />
                        ))}
                        {listings.length===0 && <div className='kv'>リスティングが見つかりません</div>}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {loadingVideo && <div className='kv'>読み込み中...</div>}
                    {videoLoadError && <div className='kv' style={{color:'var(--danger)'}}>❌ {videoLoadError}</div>}
                    {selected && (
                      <div className='grid' style={{marginTop:12}}>
                        <VideoCard
                          title={selected.title}
                          thumb={selected.thumbnail}
                          priceLabel={'0.5 SUI'}
                          onPurchase={handlePurchase}
                          disabled={purchasing || stock === 0}
                        />
                      </div>
                    )}
                  </>
                )}
            </>
            )}
            {tab==='owned' && (
              <div className='kv'>購入済み: {owned ? 'はい（視聴可能）' : 'いいえ'}</div>
            )}
            {tab==='debug' && (
              <div className='kv'>
                <div>API: {useNewApi ? '本API' : 'モック'}</div>
                <div>txDigest: {txDigest || '-'}</div>
              </div>
            )}
          </div>

          {/* 出品中の動画 */}
          {tab === 'list' && items.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: '6px 0 12px' }}>出品中の動画</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {items.map(v => (
                  <button key={v.id}
                    onClick={() => { setSelected(v); addLog(`動画選択: ${v.title}`); }}
                    style={{
                      textAlign: 'left',
                      background: selected?.id === v.id ? '#242424' : '#181818',
                      border: '1px solid #2b2b2b',
                      borderRadius: 10, padding: 10, cursor: 'pointer'
                    }}
                    aria-label={`動画を選択: ${v.title}`}>
                    <img src={v.thumbnail} alt={`${v.title} - ${v.athletes.join(', ')}`}
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#e5e7eb' }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{v.date}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player */}
          <Player
            previewUrl={selected?.previewUrl}
            fullUrl={fullUrl}
            sessionExpired={sessionExpired}
            videoRef={videoRef}
          />

          {/* Purchase Section */}
          <div className='card'>
            {/* 在庫＆再読込 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
              <span style={{ color: '#9ca3af' }}>
                {stock === null ? '在庫情報取得中…' : stock === 0 ? 'Sold Out' : `残り${stock} チケットNFT`}
              </span>
              <button onClick={() => { 
                const newStock = stock === null ? 3 : Math.max(0, stock - 1);
                setStock(newStock); 
                addLog(`在庫再読込: ${newStock}`);
              }}
                style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
                再読込
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={handlePurchase}
                disabled={owned || purchasing || stock === 0}
                style={{
                  padding: "12px 24px",
                  backgroundColor: stock === 0 ? "#6c757d" : (owned ? "#6c757d" : (purchasing ? "#ccc" : "#28a745")),
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: owned || purchasing || stock === 0 ? "not-allowed" : "pointer",
                  marginRight: "10px",
                }}
              >
                {stock === 0 ? "Sold Out" : (owned ? "購入済み" : (purchasing ? "購入中..." : "購入する"))}
              </button>

              {/* 購入エラー */}
              {purchaseError && (
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    marginLeft: "10px",
                    color: "#721c24",
                    verticalAlign: "middle",
                  }}
                >
                  ❌ {purchaseError}
                </div>
              )}
            </div>

            {/* 購入成功メッセージ */}
            {owned && txDigest && (
              <div
                style={{
                  backgroundColor: "#d4edda",
                  border: "1px solid #c3e6cb",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "16px",
                  color: "#155724",
                }}
              >
                ✅ 購入が完了しました（Tx: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "3px" }}>{txDigest}</code>）
              </div>
            )}

            {/* 開発用: 購入状態リセット */}
            <button
              onClick={() => { 
                setOwned(false); 
                setTxDigest(""); 
                setPurchaseError(""); 
                setStock(3); 
                addLog('購入状態と在庫をリセット');
              }}
              style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 4, border: "1px solid #ddd", cursor: "pointer" }}
            >
              開発用: 購入状態リセット
            </button>
          </div>

          {/* Controls */}
          <div className='row'>
            <button className='btn success' onClick={handleWatch} disabled={!owned}>
              完全版を視聴
            </button>
            {sessionExpired && (
              <button className='btn warn' onClick={handleRetryWatch}>
                もう一度視聴
              </button>
            )}
          </div>

          {/* Log Panel - 購入/視聴イベントを表示 */}
          <LogPanel logs={logs} />
        </main>
      </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
