import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

interface VideoPlayerProps {
  video: Video;
  isOwned: boolean;
  isWalletConnected: boolean;
}

export function VideoPlayer({ video, isOwned, isWalletConnected }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 動画が変わったらリセット
    setIsPlaying(false);
    setCurrentTime(0);
    setSessionActive(false);
    setSessionExpired(false);
  }, [video.id]);

  const handlePlayPreview = () => {
    if (!videoRef.current) return;
    
    toast.info('プレビュー再生を開始します（10秒）');
    setIsPlaying(true);
    videoRef.current.play();
    
    // 10秒後に自動停止（プレビュー制限）
    setTimeout(() => {
      if (videoRef.current && !isOwned) {
        videoRef.current.pause();
        setIsPlaying(false);
        toast.info('プレビュー終了。完全版を視聴するにはチケットNFTが必要です。');
      }
    }, 10000);
  };

  const handlePlayFull = () => {
    if (!isWalletConnected) {
      toast.error('ウォレットを接続してください');
      return;
    }

    if (!isOwned) {
      toast.error('プレミアムチケットNFTが必要です');
      return;
    }

    toast.loading('セッションキーを取得中...', { id: 'session' });
    setTimeout(() => {
      toast.success('完全版の視聴を開始します', { id: 'session' });
      setSessionActive(true);
      setSessionExpired(false);
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 1500);
  };

  const handleSessionRetry = () => {
    handlePlayFull();
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* プレイヤーエリア */}
      <div className="bg-black rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-zinc-950">
          <video
            ref={videoRef}
            className="w-full h-full"
            poster={video.thumbnail}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          >
            {/* モック動画のため、実際のソースなし */}
            <source src="" type="video/mp4" />
          </video>

          {/* 再生コントロールオーバーレイ */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            {/* プログレスバー */}
            <div className="mb-3">
              <div className="bg-zinc-700 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-400 h-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* コントロールボタン */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSeek(-1)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20 w-12 h-12"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSeek(1)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 ml-auto"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* セッション状態表示 */}
      {sessionActive && (
        <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400">
            ✓ セッション有効 - 完全版視聴中
          </p>
        </div>
      )}

      {sessionExpired && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 mb-3">
            セッションが期限切れになりました。「もう一度視聴」を押して新しいキーを取得してください
          </p>
          <Button
            onClick={handleSessionRetry}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            もう一度視聴
          </Button>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="mt-6 flex gap-4">
        <Button
          onClick={handlePlayPreview}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          プレビュー再生
        </Button>

        <Button
          onClick={handlePlayFull}
          disabled={!isOwned}
          className={`flex-1 ${
            isOwned
              ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          完全版を視聴
        </Button>
      </div>

      {!isOwned && (
        <p className="text-zinc-500 text-center mt-3">
          プレミアムチケットNFTが必要です
        </p>
      )}

      {/* キーボード操作説明 */}
      <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
        <h4 className="text-zinc-400 mb-2">⌨️ キーボード操作</h4>
        <div className="grid grid-cols-2 gap-2 text-zinc-500">
          <div>Space / P: 再生・一時停止</div>
          <div>← / →: 1秒シーク</div>
        </div>
      </div>
    </div>
  );
}
