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
    <div className="videos-player">
      <div className="videos-player__frame">
        {sessionExpired && (
          <div className="videos-player__overlay">
            <p className="videos-player__overlayTitle">SESSION EXPIRED</p>
            <p className="videos-player__overlayText">「完全版を視聴」から新しいセッションを開始してください。</p>
          </div>
        )}
        <video
          className={`videos-player__video${sessionExpired ? ' is-dimmed' : ''}`}
          ref={ref}
          controls
          src={fullUrl || previewUrl}
        />
      </div>
    </div>
  );
}