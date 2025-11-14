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
  videoRef: React.RefObject<HTMLVideoElement>;
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
    return (
      <div className="videos-page">
        <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>
          動画データを読み込み中...
        </p>
      </div>
    );
  }

  if (videoLoadError) {
    return (
      <div className="videos-page">
        <p style={{ color: '#f87171', textAlign: 'center', marginTop: 60 }}>
          ❌ {videoLoadError}
        </p>
      </div>
    );
  }

  return (
    <div className="videos-page">
      {/* 左側: 動画一覧 */}
      <aside className="videos-list">
        <h3 className="videos-list-title">動画アーカイブ</h3>
        <div className="videos-list-grid">
          {items.map((v) => {
            const isSelected = selected?.id === v.id;
            return (
              <button
                key={v.id}
                className={`video-list-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelected(v);
                  addLog(`動画選択: ${v.title}`);
                }}
                aria-label={`動画を選択: ${v.title}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                <div className="video-list-thumbnail">
                  <img
                    src={v.thumbnail}
                    alt={`${v.title} - ${v.athletes.join(', ')}`}
                    style={{
                      filter: owned ? 'none' : 'grayscale(100%)',
                      opacity: owned ? 1 : 0.6,
                    }}
                  />
                  {/* プレビューラベル */}
                  <span className="video-preview-label">PREVIEW</span>
                  {/* 保有状態アイコン */}
                  {owned ? (
                    <span className="video-ownership-icon owned" aria-label="保有済み">
                      🎟
                    </span>
                  ) : (
                    <span className="video-ownership-icon locked" aria-label="未保有">
                      🔒
                    </span>
                  )}
                </div>
                <div className="video-list-info">
                  <div className="video-list-title">{v.title}</div>
                  <div className="video-list-meta">
                    <span>{v.date}</span>
                    <span>{v.athletes.join(' vs ')}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 右側: プレイヤー + 詳細 */}
      <div className="videos-player-area">
        {selected ? (
          <>
            {/* プレイヤー */}
            <div className="videos-player-container">
              <Player
                previewUrl={selected.previewUrl}
                fullUrl={fullUrl}
                sessionExpired={sessionExpired}
                videoRef={videoRef}
              />
            </div>

            {/* 詳細情報 */}
            <div className="videos-details">
              <h2 className="videos-details-title">{selected.title}</h2>
              <div className="videos-details-meta">
                <span className="videos-details-date">{selected.date}</span>
                <span className="videos-details-athletes">
                  {selected.athletes.join(' vs ')}
                </span>
              </div>

              {/* アクションボタン */}
              <div className="videos-actions">
                {/* プレビュー再生ボタン */}
                <button
                  className="videos-action-button preview"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.src = selected.previewUrl;
                      videoRef.current.load();
                      videoRef.current.play();
                      addLog('プレビュー再生開始');
                    }
                  }}
                  aria-label="プレビューを再生（10秒）"
                >
                  ▶ プレビューを再生（10秒）
                </button>

                {/* 完全版視聴ボタン */}
                <button
                  className="videos-action-button full"
                  onClick={onWatch}
                  disabled={!account || !owned || watchLoading}
                  aria-label={
                    !account
                      ? 'ウォレットを接続してください'
                      : !owned
                      ? 'チケットを購入してください'
                      : watchLoading
                      ? '読み込み中...'
                      : '完全版を視聴'
                  }
                >
                  {watchLoading
                    ? '⏳ 読み込み中...'
                    : !account
                    ? '🔒 ウォレット未接続'
                    : !owned
                    ? '🔒 チケット未購入'
                    : '🎬 完全版を視聴'}
                </button>

                {/* ヘルプテキスト */}
                {!account && (
                  <p className="videos-action-hint">
                    💡 完全版を視聴するには、まずウォレットを接続してください。
                  </p>
                )}
                {account && !owned && (
                  <p className="videos-action-hint">
                    💡 完全版を視聴するには、「TICKETS」タブでNFTチケットを購入してください。
                  </p>
                )}
              </div>

              {/* セッション期限切れUI */}
              {sessionExpired && (
                <div className="videos-session-expired" role="alert">
                  <p className="session-expired-text">
                    ⏰ <strong>セッション期限切れ</strong>
                  </p>
                  <p className="session-expired-description">
                    視聴セッションの有効期限が切れました。もう一度視聴ボタンを押してください。
                  </p>
                  <button
                    className="session-retry-button"
                    onClick={onRetryWatch}
                    aria-label="もう一度視聴"
                  >
                    🔄 もう一度視聴
                  </button>
                </div>
              )}

              {/* キーボードショートカットヘルプ */}
              <div className="videos-keyboard-help">
                <h4 className="keyboard-help-title">キーボード操作</h4>
                <ul className="keyboard-help-list">
                  <li>
                    <kbd>Space</kbd> / <kbd>P</kbd>: 再生 / 一時停止
                  </li>
                  <li>
                    <kbd>←</kbd> / <kbd>→</kbd>: 1秒シーク
                  </li>
                </ul>
              </div>

              {/* ログパネル（デバッグ用） */}
              <div className="videos-logs">
                <LogPanel logs={logs} />
              </div>
            </div>
          </>
        ) : (
          <div className="videos-no-selection">
            <p>左側から動画を選択してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}

