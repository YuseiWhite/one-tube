import { useEffect, useRef, useState, useCallback } from 'react';
import './styles/app.css';
import { Toast } from './components/Toast';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TicketsPage from './pages/TicketsPage';
import VideosPage from './pages/VideosPage';

// New API (Issue #009)
import { getListings, createWatchSession, getVideoContent, purchaseNFT } from './lib/api';

type VideoData = {
  id: string;
  title: string;
  thumbnail: string;
  previewUrl: string;
  date: string;
  athletes: string[];
};

const useNewApi = !!(import.meta as any).env?.VITE_API_BASE_URL;
const SESSION_TTL_SECONDS = 30;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

export default function App() {
  // ページ切り替え: 'tickets' = チケット購入, 'videos' = 動画視聴
  const [activePage, setActivePage] = useState<'tickets' | 'videos'>('tickets');

  // videos-display.json (複数アイテム + 選択中)
  const [items, setItems] = useState<VideoData[]>([]);
  const [selected, setSelected] = useState<VideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState('');

  // 在庫管理（MVP: ダミー）
  const [stock, setStock] = useState<number | null>(null);

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
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionPromptVisible, setSessionPromptVisible] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const sessionTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // logs
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Wallet connection
  const account = useCurrentAccount();
  useEffect(() => {
    return () => {
      if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
    };
  }, []);

  // セッション期限切れ監視
  useEffect(() => {
    if (sessionExpiresAt === null) return;

    const checkInterval = setInterval(() => {
      if (Date.now() >= sessionExpiresAt) {
        setSessionExpired(true);
        setSessionPromptVisible(true);
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
          videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 1);
          addLog(`keyboard: seek +1s (${Math.floor(videoRef.current.currentTime)}s)`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // load videos-display.json (for preview + mock flow)
  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch('/src/assets/videos-display.json');
        if (!r.ok) throw new Error('Failed to load videos-display.json');
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

  // 在庫取得関数
  const loadInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const listings = await getListings();
      setInventoryCount(listings.length);
      addLog(`在庫情報を取得: ${listings.length}件`);
    } catch (err) {
      console.error('Failed to load inventory', err);
      setInventoryError('在庫情報を取得できませんでした');
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
    setPurchasing(true);
    setPurchaseError('');
    setTxDigest('');

    // ステップ1: 処理開始
    showToast('処理中…');
    addLog('purchase: start');

    try {
      // ステップ2: 送信中（擬似的に遅延）
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast('送信中…');
      addLog('purchase: sending transaction');

      // 現状は listingId 固定のモック呼び出し
      // 将来: 本API購入に切替する場合はここに分岐
      if (!account?.address) {
        throw new Error('ウォレットが接続されていません');
      }
      const result = await purchaseNFT({
        userAddress: account.address,
        nftId: 'listing-superbon-noiri-ko', // TODO: 選択された動画のnftIdを使用
      });

      // ステップ3: 確認中（擬似的に遅延）
      await new Promise((resolve) => setTimeout(resolve, 500));
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
        const errMsg = result.error || '購入に失敗しました';
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
    setSessionPromptVisible(false);
    showToast('セッション生成中…');
    addLog('watch: start');

    try {
      const isAbbasovLee = selected?.id === 'abbasov-lee-173';
      const videoIdForSession = isAbbasovLee ? 'abbasov-lee-173' : 'superbon-noiri-ko';

      if (!useNewApi) {
        if (isAbbasovLee) {
          const videoUrl = '/assets/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4';
          setFullUrl(videoUrl);
          addLog(`watch: direct asset url=${videoUrl}`);

          const expiresAt = Date.now() + SESSION_TTL_MS;
          setSessionExpiresAt(expiresAt);
          addLog(`視聴セッションを開始しました (local), ttl=${SESSION_TTL_SECONDS}s`);
          showToast('✅ 視聴を開始します');

          if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
          sessionTimer.current = window.setTimeout(() => {
            setSessionExpired(true);
            setSessionPromptVisible(true);
            showToast('⚠️ セッションが期限切れになりました');
            addLog('watch: expired (local)');
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }, SESSION_TTL_MS);
        } else {
          // useNewApi=false の場合、他の動画は未対応
          addLog('watch: error - この動画はローカルファイルモードでは対応していません');
          showToast('❌ この動画は視聴できません');
          setFullUrl(undefined);
          setSessionExpiresAt(null);
        }
      } else {
        // 本API: セッション作成 → videoURL取得
        if (!account?.address) {
          addLog('watch: error - ウォレット未接続');
          showToast('❌ ウォレットを接続してください');
          setFullUrl(undefined);
          setSessionExpiresAt(null);
          return;
        }

        // listingsからblobIdを取得
        const listings = await getListings();
        const listing = listings.find((v) => v.id === videoIdForSession);
        if (!listing || !listing.fullBlobId) {
          addLog('watch: error - 動画情報が見つかりません');
          showToast('❌ 動画情報が見つかりません');
          setFullUrl(undefined);
          setSessionExpiresAt(null);
          return;
        }

        const sessionResponse = await createWatchSession({
          nftId: listing.id,
          userAddress: account.address,
          blobId: listing.fullBlobId,
        });

        if (!sessionResponse?.success || !sessionResponse?.session?.sessionId) {
          addLog('watch: error - セッション作成失敗');
          showToast('❌ セッション作成に失敗');
          setFullUrl(undefined);
          setSessionExpiresAt(null);
          return;
        }

        const sessionId = sessionResponse.session.sessionId;
        addLog(`watch: session id=${sessionId.slice(0, 8)}...`);

        const videoResponse = await getVideoContent(sessionId);
        if (!videoResponse?.success || !videoResponse?.videoUrl) {
          addLog('watch: error - 動画URL取得失敗');
          showToast('❌ 動画URL取得に失敗');
          setFullUrl(undefined);
          setSessionExpiresAt(null);
          return;
        }

        setFullUrl(videoResponse.videoUrl);

        // expiresAt をセッションから取得
        const expiresAt = sessionResponse.session.expiresAt;
        setSessionExpiresAt(expiresAt);

        addLog(`watch: url=${videoResponse.videoUrl.slice(0, 30)}..., expiresAt=${new Date(expiresAt).toLocaleTimeString()}`);
        addLog('視聴セッションを開始しました');
        showToast('✅ 視聴を開始します');

        if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
        sessionTimer.current = window.setTimeout(() => {
          setSessionExpired(true);
          setSessionPromptVisible(true);
          showToast('⚠️ セッションが期限切れになりました');
          addLog('watch: expired');
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }, SESSION_TTL_MS);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '再生準備に失敗';
      addLog(`watch: error - ${errMsg}`);
      showToast('❌ 再生準備に失敗しました');
      // エラー時はクリア
      setFullUrl(undefined);
      setSessionExpiresAt(null);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleRetryWatch = () => {
    addLog('watch: retry requested');
    showToast('再取得中…');
    setSessionPromptVisible(false);
    handleWatch();
  };

  return (
    <div className="onetube-shell">
      <div className="onetube-banner">⚠️ Sui devnet でテスト中です。これは実際の SUI ではありません。</div>
      <Header address={account?.address ?? null} />
      <div className="onetube-layout">
        <Sidebar activePage={activePage} onChange={setActivePage} />
        <main className="onetube-main">
          {activePage === 'tickets' ? (
            <TicketsPage
              selected={selected}
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
              isWalletConnected={!!account}
            />
          ) : (
            <VideosPage
              items={items}
              selected={selected}
              setSelected={setSelected}
              loadingVideo={loadingVideo}
              videoLoadError={videoLoadError}
              owned={owned}
              fullUrl={fullUrl}
              sessionExpired={sessionExpired}
              sessionPromptVisible={sessionPromptVisible}
              watchLoading={watchLoading}
              onWatch={handleWatch}
              onRetryWatch={handleRetryWatch}
              logs={logs}
              videoRef={videoRef}
              account={account}
              addLog={addLog}
            />
          )}
        </main>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
