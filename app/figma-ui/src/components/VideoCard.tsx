import { Ticket } from 'lucide-react';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Video {
  id: string;
  ticketId: string;
  title: string;
  thumbnail: string;
  date: string;
  fighters: string;
  duration: string;
}

interface VideoCardProps {
  video: Video;
  isOwned: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function VideoCard({ video, isOwned, isSelected, onClick }: VideoCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-zinc-900 rounded-lg overflow-hidden transition-all hover:bg-zinc-800 ${
        isSelected ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* サムネイル */}
      <div className="relative aspect-video">
        <ImageWithFallback
          src={video.thumbnail}
          alt={`${video.title} - ${video.fighters}`}
          className={`w-full h-full object-cover ${!isOwned ? 'grayscale' : ''}`}
        />
        {/* 再生時間バッジ */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white">
          {isOwned ? video.duration : 'PREVIEW 10s'}
        </div>
        {/* 所有状態アイコン */}
        <div className="absolute top-2 left-2">
          <Ticket
            className={`w-5 h-5 ${isOwned ? 'text-yellow-400' : 'text-zinc-600'}`}
            fill={isOwned ? 'currentColor' : 'none'}
          />
        </div>
        {/* PREVIEW ONLYラベル */}
        {!isOwned && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-black/80 border-zinc-600 text-zinc-400">
              PREVIEW ONLY
            </Badge>
          </div>
        )}
      </div>

      {/* 詳細情報 */}
      <div className="p-3 space-y-1">
        <h4 className="text-white line-clamp-2">{video.title}</h4>
        <p className="text-zinc-500">{video.date}</p>
        <p className="text-zinc-600">{video.fighters}</p>
      </div>
    </button>
  );
}
