import type { RefObject } from 'react';
import Player from '../components/Player';
import { LogPanel } from '../components/LogPanel';

type VideoData = {
  id: string;
  title: string;
  thumbnail: string;
  previewUrl: string;
  date: string;
  athletes: string[];
};

type VideosPageProps = {
  items: VideoData[];
  selected: VideoData | null;
  setSelected: (v: VideoData) => void;
  loadingVideo: boolean;
  videoLoadError: string;
  owned: boolean;
  fullUrl?: string;
  sessionExpired: boolean;
  watchLoading: boolean;
  onWatch: () => void;
  onRetryWatch: () => void;
  logs: string[];
  videoRef: RefObject<HTMLVideoElement>;
  account: { address: string } | null;
  addLog: (msg: string) => void;
};

export default function VideosPage({
  items,
  selected,
  setSelected,
  loadingVideo,
  videoLoadError,
  owned,
  fullUrl,
  sessionExpired,
  watchLoading,
  onWatch,
  onRetryWatch,
  logs,
  videoRef,
  account,
  addLog,
}: VideosPageProps) {
  if (loadingVideo) {
    return <div className="page-placeholder">動画データを読み込み中...</div>;
  }

  if (videoLoadError) {
    return <div className="page-placeholder page-placeholder--error">❌ {videoLoadError}</div>;
  }

  if (!selected) {
    return <div className="page-placeholder">左側のアーカイブから動画を選択してください。</div>;
  }

  const formattedDate = selected.date
    ? new Date(selected.date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '日付未定';

  const handleSelectVideo = (video: VideoData) => {
    setSelected(video);
    addLog(`動画選択: ${video.title}`);
  };

  const handlePreviewPlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.src = selected.previewUrl;
    videoRef.current.currentTime = 0;
    videoRef.current.load();
    videoRef.current.play().catch(() => undefined);
    addLog('プレビュー再生開始 (10s)');
  };

  const watchButtonLabel = watchLoading
    ? '読み込み中…'
    : !account
    ? 'ウォレットを接続'
    : !owned
    ? 'チケットを購入'
    : '完全版を視聴';

  const watchButtonDisabled = watchLoading || !account || !owned;

  return (
    <div className="videos-page">
      {/* Figma参照: figma-ui/src/components/VideosPage.tsx */}
      <aside className="videos-rail">
        <p className="videos-rail__title">FIGHT ARCHIVE</p>
        <div className="videos-list">
          {items.map((video) => {
            const isSelected = video.id === selected.id;
            const classes = ['video-item'];
            if (isSelected) classes.push('video-item--active');
            if (!owned) classes.push('video-item--locked');
            return (
              <button type="button" key={video.id} className={classes.join(' ')} onClick={() => handleSelectVideo(video)}>
                <div className="video-item__thumb">
                  <img src={video.thumbnail} alt={`${video.title} - ${video.athletes.join(', ')}`} loading="lazy" />
                  {!owned && <span className="video-item__badge">PREVIEW ONLY</span>}
                  <span className="video-item__duration">{owned ? 'FULL ACCESS' : 'PREVIEW 10s'}</span>
                </div>
                <div className="video-item__info">
                  <p className="video-item__title">{video.title}</p>
                  <p className="video-item__meta">{new Date(video.date).toLocaleDateString('ja-JP')}</p>
                  <p className="video-item__meta">{video.athletes.join(', ')}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="videos-main">
        <section className="videos-player-shell">
          <Player previewUrl={selected.previewUrl} fullUrl={fullUrl} sessionExpired={sessionExpired} videoRef={videoRef} />
        </section>

        <section className="videos-layout">
          <div className="videos-column">
            <div className="videos-panel videos-panel--primary">
              <p className="videos-panel__eyebrow">PREMIUM ARCHIVE</p>
              <h2 className="videos-panel__title">{selected.title}</h2>
              <div className="videos-panel__meta">
                <span>📅 {formattedDate}</span>
                <span>🥊 {selected.athletes.join(', ')}</span>
              </div>

              <div className="videos-actions">
                <button type="button" className="videos-actions__btn videos-actions__btn--ghost" onClick={handlePreviewPlay}>
                  ▶ プレビュー再生（10秒）
                </button>
                <button
                  type="button"
                  className="videos-actions__btn videos-actions__btn--primary"
                  onClick={onWatch}
                  disabled={watchButtonDisabled}
                >
                  {watchButtonLabel}
                </button>
              </div>

              {!account && <p className="videos-hint">💡 完全版を視聴するには、まずウォレットを接続してください。</p>}
              {account && !owned && <p className="videos-hint">💡 「TICKETS」タブでNFTチケットを購入すると完全版が解放されます。</p>}

              {sessionExpired && (
                <div className="videos-alert">
                  <div>
                    <p className="videos-alert__title">⏰ セッション期限切れ</p>
                    <p className="videos-alert__text">視聴セッションの有効期限が切れました。もう一度視聴ボタンで新しいキーを取得してください。</p>
                  </div>
                  <button type="button" className="videos-alert__cta" onClick={onRetryWatch}>
                    🔄 もう一度視聴
                  </button>
                </div>
              )}
            </div>

            <div className="videos-panel videos-panel--log">
              <LogPanel logs={logs} />
            </div>
          </div>

          <div className="videos-column videos-column--side">
            <div className="videos-panel videos-panel--text">
              <p>プレミアムチケットを持っていない場合、10秒間のプレビュー動画しか視聴できません。</p>
              <p>好きな試合のプレミアムチケットを購入すると、完全版を視聴することができます。</p>
            </div>
            <div className="videos-panel videos-panel--text">
              <p className="videos-panel__eyebrow">Superbon vs Masaaki Noiri - full match</p>
              <ul className="videos-panel__details">
                <li>📅 開催日: 2024年1月15日</li>
                <li>🥊 選手: Superbon, Masaaki Noiri</li>
                <li>会場: 有明アリーナ</li>
                <li>⏱️ 時間: 1:50:00</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

