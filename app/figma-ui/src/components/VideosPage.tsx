import { useState } from 'react';
import { VideoCard } from './VideoCard';
import { VideoPlayer } from './VideoPlayer';

interface VideosPageProps {
  isWalletConnected: boolean;
  ownedTickets: string[];
}

// モック動画データ
const videos = [
  {
    id: 'video-1',
    ticketId: 'ticket-1',
    title: 'Superbon vs Masaaki Noiri - KO Scene',
    thumbnail: 'https://images.unsplash.com/photo-1602827114696-738d7ee10b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJ0aWFsJTIwYXJ0cyUyMGZpZ2h0ZXJ8ZW58MXx8fHwxNzYzMDU2MTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月15日',
    fighters: 'Superbon, Masaaki Noiri',
    duration: '10s',
  },
  {
    id: 'video-2',
    ticketId: 'ticket-1',
    title: 'Superbon vs Masaaki Noiri - Full Fight',
    thumbnail: 'https://images.unsplash.com/photo-1542720046-1e772598ea39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWNrYm94aW5nJTIwbWF0Y2h8ZW58MXx8fHwxNzYzMTIxNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月15日',
    fighters: 'Superbon, Masaaki Noiri',
    duration: '15:30',
  },
  {
    id: 'video-3',
    ticketId: 'ticket-2',
    title: 'Rodtang vs Prajanchai - Highlights',
    thumbnail: 'https://images.unsplash.com/photo-1620123449238-abaeff62d48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtbWElMjBmaWdodCUyMGFjdGlvbnxlbnwxfHx8fDE3NjMxMjE3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年2月20日',
    fighters: 'Rodtang, Prajanchai',
    duration: '8:45',
  },
  {
    id: 'video-4',
    ticketId: 'ticket-3',
    title: 'Tawanchai vs Nattawut - Championship Round',
    thumbnail: 'https://images.unsplash.com/photo-1681203888755-bd61fe3558eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21iYXQlMjBzcG9ydHN8ZW58MXx8fHwxNzYzMTIxNzYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年3月10日',
    fighters: 'Tawanchai, Nattawut',
    duration: '12:20',
  },
];

export function VideosPage({ isWalletConnected, ownedTickets }: VideosPageProps) {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);

  const isVideoOwned = ownedTickets.includes(selectedVideo.ticketId);

  return (
    <div className="flex h-[calc(100vh-120px)]">
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

        {/* 動画説明セクション */}
        <div className="p-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-yellow-400 tracking-wide mb-3">{selectedVideo.title}</h3>
            <div className="space-y-2 text-zinc-400">
              <p>📅 開催日: {selectedVideo.date}</p>
              <p>🥊 選手: {selectedVideo.fighters}</p>
              <p>⏱️ 再生時間: {selectedVideo.duration}</p>
            </div>

            {!isVideoOwned && (
              <div className="mt-6 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
                <p className="text-yellow-400">
                  💡 完全版を視聴するには、対応するプレミアムチケットNFTが必要です。
                </p>
              </div>
            )}
          </div>

          {/* モック注記 */}
          <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500">
              ℹ️ 動画はモックデモです。本番環境では 4K・マルチアングルが利用可能になります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
