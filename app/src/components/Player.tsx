import { useEffect, useRef } from 'react';

type Props = {
  previewUrl?: string;
  fullUrl?: string;
  sessionExpired?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
};

export default function Player({ previewUrl, fullUrl, sessionExpired, videoRef }: Props) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || internalRef;

  useEffect(() => {
    if (fullUrl && ref.current) {
      ref.current.play().catch(() => undefined);
    }
  }, [fullUrl, ref]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-black/60">
      <div className="relative aspect-video bg-zinc-950">
        {sessionExpired && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 text-center px-6">
            <p className="text-sm font-semibold tracking-wide text-yellow-300">SESSION EXPIRED</p>
            <p className="text-xs text-zinc-300">「完全版を視聴」から新しいセッションを開始してください。</p>
          </div>
        )}
        <video
          className={`h-full w-full object-cover ${sessionExpired ? 'opacity-40' : 'opacity-100'}`}
          ref={ref}
          controls
          src={fullUrl || previewUrl}
        />
      </div>
    </div>
  );
}