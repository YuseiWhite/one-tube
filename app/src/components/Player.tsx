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

  useEffect(()=>{
    if (fullUrl && ref.current) {
      ref.current.play().catch(()=>{});
    }
  }, [fullUrl, ref]);

  return (
    <div className='card'>
      <div className='row' style={{marginBottom:10}}>
        <h3 style={{margin:0}}>プレイヤー</h3>
      </div>
      {sessionExpired && (
        <div className='card' style={{background:'#1e1a0c', borderColor:'#3a3113', marginBottom:12}}>
          <div>⚠️ セッションが期限切れになりました。もう一度視聴を押してください</div>
        </div>
      )}
      <video className='video' ref={ref} controls src={fullUrl || previewUrl} />
    </div>
  );
}

