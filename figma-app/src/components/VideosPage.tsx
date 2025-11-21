import { useState } from 'react';
import { VideoCard } from './VideoCard';
import { VideoPlayer } from './VideoPlayer';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { motion } from 'motion/react';
import { figma } from '@figma/code-connect';

interface VideosPageProps {
  isWalletConnected: boolean;
  ownedTickets: string[];
}

// モック動画データ
const videos = [
  {
    id: 'video-1',
    ticketId: 'ticket-1',
    title: 'Superbon vs Masaaki Noiri - full match',
    thumbnail: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024.01.15',
    fighters: 'Superbon, Masaaki Noiri',
    venue: 'Ariake Arena',
    duration: '1:50:00',
    blobId: 'xFp9kLmN3qW8rT2vY7sH4jK6gD1aE5cB',
  },
  {
    id: 'video-2',
    ticketId: 'ticket-1',
    title: 'Superbon vs Masaaki Noiri - KO Scene',
    thumbnail: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNjMxMjE3MDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024.01.15',
    fighters: 'Superbon, Masaaki Noiri',
    venue: 'Ariake Arena',
    duration: '0:15',
    blobId: 'qW8rT2vY7sH4jK6gD1aE5cBxFp9kLmN3',
  },
  {
    id: 'video-3',
    ticketId: 'ticket-2',
    title: 'Rodtang vs Prajanchai - Highlights',
    thumbnail: 'https://images.unsplash.com/photo-1620123449238-abaeff62d48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtbWElMjBmaWdodCUyMGFjdGlvbnxlbnwxfHx8fDE3NjMxMjE3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024.02.20',
    fighters: 'Rodtang, Prajanchai',
    venue: 'Impact Arena',
    duration: '0:45',
    blobId: 'mN3qW8rT2vY7sH4jK6gD1aE5cBxFp9kL',
  },
  {
    id: 'video-4',
    ticketId: 'ticket-3',
    title: 'Tawanchai vs Nattawut - Championship Round',
    thumbnail: 'https://images.unsplash.com/photo-1681203888755-bd61fe3558eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21iYXQlMjBzcG9ydHN8ZW58MXx8fHwxNzYzMTIxNzYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024.03.10',
    fighters: 'Tawanchai, Nattawut',
    venue: 'Singapore Indoor Stadium',
    duration: '1:20',
    blobId: 'rT2vY7sH4jK6gD1aE5cBxFp9kLmN3qW8',
  },
];

export function VideosPage({ isWalletConnected, ownedTickets }: VideosPageProps) {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [regularLikes, setRegularLikes] = useState(123);
  const [premiumLikes, setPremiumLikes] = useState(45);
  const [isRegularLiked, setIsRegularLiked] = useState(false);
  const [isPremiumLiked, setIsPremiumLiked] = useState(false);
  const [comment, setComment] = useState('');

  const isVideoOwned = ownedTickets.includes(selectedVideo.ticketId);

  const handleRegularLike = () => {
    if (isRegularLiked) {
      setRegularLikes(regularLikes - 1);
      setIsRegularLiked(false);
    } else {
      setRegularLikes(regularLikes + 1);
      setIsRegularLiked(true);
    }
  };

  const handlePremiumLike = () => {
    if (isPremiumLiked) {
      setPremiumLikes(premiumLikes - 1);
      setIsPremiumLiked(false);
    } else {
      setPremiumLikes(premiumLikes + 1);
      setIsPremiumLiked(true);
    }
  };

  const handleCommentSubmit = () => {
    // ダミー処理
    console.log('Comment submitted:', comment);
    setComment('');
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* 左側：動画一覧 */}
      <div className="w-96 border-r border-zinc-800 overflow-y-auto bg-zinc-950">
        <div className="p-4">
          <h2 className="tracking-wide text-yellow-400 mb-4">FIGHT ARCHIVE</h2>
          <div className="space-y-3">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isOwned={ownedTickets.includes(video.ticketId)}
                isSelected={selectedVideo.id === video.id}
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 右側：動画プレイヤー */}
      <div className="flex-1 overflow-y-auto">
        <VideoPlayer
          video={selectedVideo}
          isOwned={isVideoOwned}
          isWalletConnected={isWalletConnected}
        />

        {/* プレミアムチケット案内（説明テキストを統合） */}
        {!isVideoOwned && (
          <div className="px-8 mt-4">
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
              <p className="text-yellow-400 mb-2">
                💡 プレミアムチケットが必要です
              </p>
              <div className="text-zinc-300 text-sm space-y-1">
                <p>プレミアムチケットを持っていない場合、10秒間のプレビュー動画のみ視聴できます。</p>
                <p>好きな試合のチケットを購入すると、完全版を視聴できます。</p>
              </div>
            </div>
          </div>
        )}

        {/* 動画情報セクション */}
        <div className="px-8 py-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            {/* タイトルといいねUI */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-yellow-400 tracking-wide flex-1">{selectedVideo.title}</h3>
              <div className="flex gap-4 ml-4">
                {/* 通常のLikeハート */}
                <button
                  onClick={handleRegularLike}
                  className="flex flex-col items-center gap-1 group"
                >
                  <motion.div
                    key={isRegularLiked ? 'liked' : 'default'}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2
                    }}
                  >
                    <Heart
                      className={`w-6 h-6 transition-colors ${
                        isRegularLiked
                          ? 'fill-red-500 text-red-500'
                          : 'text-zinc-500 group-hover:text-red-400'
                      }`}
                    />
                  </motion.div>
                  <span className="text-zinc-400 text-xs">{regularLikes}</span>
                </button>

                {/* プレミアム専用ハート（虹色） */}
                <button
                  onClick={handlePremiumLike}
                  className="flex flex-col items-center gap-1 group relative"
                >
                  {/* SVG gradient definition for rainbow effect */}
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <linearGradient id="rainbow-gradient-premium" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                        <stop offset="25%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#f093fb', stopOpacity: 1 }} />
                        <stop offset="75%" style={{ stopColor: '#4facfe', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#00f2fe', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <motion.div
                    key={isPremiumLiked ? 'premium-liked' : 'premium-default'}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2
                    }}
                  >
                    {isPremiumLiked ? (
                      // アクティブ状態：虹色で塗りつぶし
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="url(#rainbow-gradient-premium)"
                        className="transition-all"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ) : (
                      // 非アクティブ状態：虹色のアウトライン
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="url(#rainbow-gradient-premium)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    )}
                  </motion.div>
                  
                  <span className="text-zinc-400 text-xs">{premiumLikes}</span>
                </button>
              </div>
            </div>

            {/* 動画詳細情報 */}
            <div className="space-y-2 text-zinc-400 mb-4">
              <p>📅 uploaded {selectedVideo.date} to Walrus</p>
              <p>🥊 Athletes: {selectedVideo.fighters.split(', ').join(' vs ')}</p>
              <p>🏟 {selectedVideo.venue}</p>
              <p>⏱ {selectedVideo.duration}</p>
              <p className="font-mono text-xs">blob id: {selectedVideo.blobId}</p>
              <p>
                <a
                  href="https://walruscan.com/testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Walruscan: https://walruscan.com/testnet
                </a>
              </p>
            </div>

            {/* コメント欄 */}
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <h4 className="text-white mb-3">Comments</h4>
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  送信
                </Button>
                <p className="text-zinc-500 text-xs">※ コメント機能は開発中です</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Figma Code Connect
figma.connect(VideosPage, {
  props: {
    isWalletConnected: figma.boolean("Wallet Connected"),
    ownedTickets: figma.instance("Owned Tickets"),
  },
  example: (props) => (
    <VideosPage
      {...props}
      ownedTickets={props.ownedTickets || []}
    />
  ),
});