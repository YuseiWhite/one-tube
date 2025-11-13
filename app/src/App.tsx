import { useEffect, useRef, useState } from 'react';
import './styles/app.css';
import Header from './components/Header';
import VideoCard from './components/VideoCard';
import Player from './components/Player';

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

  // mock videos.json
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState('');

  // listings (new api)
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // purchase state
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [txDigest, setTxDigest] = useState('');

  // player state
  const [fullUrl, setFullUrl] = useState<string | undefined>(undefined);
  const [sessionExpired, setSessionExpired] = useState(false);
  const sessionTimer = useRef<number | null>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(()=>setToast(null), 3200);
  };

  useEffect(() => {
    return () => { if (sessionTimer.current) window.clearTimeout(sessionTimer.current); };
  }, []);

  // load mock videos.json (for preview + mock flow)
  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch('/src/assets/videos.json');
        if (!r.ok) throw new Error('Failed to load videos.json');
        const arr: VideoData[] = await r.json();
        setVideoData(arr[0] ?? null);
      } catch (e) {
        setVideoLoadError('動画データの読み込みに失敗しました');
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
    setPurchasing(true); setTxDigest('');
    try {
      // 現状は listingId 固定のモック呼び出し
      // 将来: 本API購入に切替する場合はここに分岐
      const result = await purchaseSmart('listing-superbon-noiri-ko');
      if (result.success) {
        setOwned(true);
        setTxDigest(result.txDigest || '');
        showToast('✅ 購入が完了しました');
      } else {
        showToast('❌ 購入に失敗しました');
      }
    } catch (e) {
      showToast('❌ サーバーエラー');
    } finally {
      setPurchasing(false);
    }
  };

  // watch full
  const handleWatch = async () => {
    setSessionExpired(false);
    try {
      if (!useNewApi) {
        const result = await watch('superbon-noiri-ko');
        if (result.success && result.videoUrl) {
          setFullUrl(result.videoUrl);
          const ms = (result.expiresInSec ?? 30) * 1000;
          if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
          sessionTimer.current = window.setTimeout(()=>{
            setSessionExpired(true);
          }, ms);
        } else {
          showToast('❌ 動画URLの取得に失敗（モック）');
        }
      } else {
        // 本API: セッション作成 → videoURL取得
        const session = await createWatchSession('superbon-noiri-ko');
        if (!session?.sessionToken) {
          showToast('❌ セッション作成に失敗');
          return;
        }
        const video = await getVideoUrl('superbon-noiri-ko', session.sessionToken);
        if (!video?.videoUrl) {
          showToast('❌ 動画URL取得に失敗');
          return;
        }
        setFullUrl(video.videoUrl);
        const expires = session.expiresInSec ?? 30;
        if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
        sessionTimer.current = window.setTimeout(()=>{
          setSessionExpired(true);
        }, expires * 1000);
      }
    } catch {
      showToast('❌ 再生準備に失敗しました');
    }
  };

  const handleRetryWatch = () => handleWatch();

  // UI
  return (
    <>
      <Header />
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
                            thumb={videoData?.thumbnail}
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
                    {videoData && (
                      <div className='grid' style={{marginTop:12}}>
                        <VideoCard
                          title={videoData.title}
                          thumb={videoData.thumbnail}
                          priceLabel={'0.5 SUI'}
                          onPurchase={handlePurchase}
                          disabled={purchasing}
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

          {/* Player */}
          <Player
            previewUrl={videoData?.previewUrl}
            fullUrl={fullUrl}
            sessionExpired={sessionExpired}
          />

          {/* Controls */}
          <div className='row'>
            {!owned && (
              <button className='btn primary' onClick={handlePurchase} disabled={purchasing}>
                {purchasing ? '購入中…' : '購入する'}
              </button>
            )}
            <div style={{flex:1}} />
            <button className='btn success' onClick={handleWatch} disabled={!owned}>
              完全版を視聴
            </button>
            {sessionExpired && (
              <button className='btn warn' onClick={handleRetryWatch}>
                もう一度視聴
              </button>
            )}
          </div>
        </main>
      </div>

      {toast && <div className='toast'>{toast}</div>}
    </>
  );
}
