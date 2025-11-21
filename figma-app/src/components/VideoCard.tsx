import { Ticket } from 'lucide-react';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { figma } from '@figma/code-connect';

interface Video {
  id: string;
  ticketId: string;
  title: string;
  thumbnail: string;
  date: string;
  fighters: string;
  duration: string;
  venue: string;
}

interface VideoCardProps {
  video: Video;
  isOwned: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function VideoCard({ video, isOwned, isSelected, onClick }: VideoCardProps) {
  // 選手名をvs形式に変換
  const formatFighters = (fighters: string) => {
    const fighterArray = fighters.split(', ');
    return fighterArray.join(' vs ');
  };

  // 日付をuploaded yyyy.mm.dd to Walrus形式に変換
  const formatDate = (date: string) => {
    return `uploaded ${date} to Walrus`;
  };

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
          alt={`${video.title} - ${formatFighters(video.fighters)}`}
          className={`w-full h-full object-cover ${!isOwned ? 'grayscale' : ''}`}
        />
        {/* 再生時間バッジ */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs">
          {isOwned ? video.duration : '10s'}
        </div>
        {/* 所有状態アイコン - 虹色 */}
        <div className="absolute top-2 left-2">
          <Ticket
            className={`w-10 h-10 ${
              isOwned 
                ? 'text-transparent' 
                : 'text-zinc-600'
            }`}
            fill={isOwned ? 'url(#rainbow-gradient)' : 'none'}
            style={isOwned ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } : {}}
          />
          {/* SVG gradient definition for rainbow effect */}
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                <stop offset="25%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#f093fb', stopOpacity: 1 }} />
                <stop offset="75%" style={{ stopColor: '#4facfe', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#00f2fe', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>
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
        <p className="text-zinc-500 text-xs">{formatDate(video.date)}</p>
        <p className="text-zinc-600 text-xs">{formatFighters(video.fighters)}</p>
      </div>
    </button>
  );
}

// Figma Code Connect
figma.connect(VideoCard, {
  props: {
    isOwned: figma.boolean("Owned"),
    isSelected: figma.boolean("Selected"),
    video: figma.instance("Video Data"),
  },
  example: (props) => (
    <VideoCard
      {...props}
      video={props.video || {
        id: 'video-1',
        ticketId: 'ticket-1',
        title: 'Video Title',
        thumbnail: '',
        date: '2024.01.01',
        fighters: 'Fighter 1, Fighter 2',
        duration: '10:00',
        venue: 'Venue',
      }}
      onClick={() => {}}
    />
  ),
});
