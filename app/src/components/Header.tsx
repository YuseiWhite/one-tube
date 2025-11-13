import { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';

const useNewApi = !!import.meta.env.VITE_API_BASE_URL;

export default function Header() {
  const [health, setHealth] = useState<{status?: string; rpc?: 'ok'|'down'}>({});

  useEffect(() => {
    let alive = true;
    if (useNewApi) {
      getHealth().then(h => { if (alive) setHealth(h); }).catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  return (
    <div className='header container'>
      <div className='row' style={{gap:12}}>
        <h1 style={{margin:0, fontSize:20}}>OneTube</h1>
        <span className='kv'>NFT-Gated Video</span>
      </div>
      <div className='row' style={{gap:12}}>
        <div className='badge' role='alert' aria-label='テストネット警告'>
          ⚠️ Sui devnetでテスト中です。これは実際のSUIではありません
        </div>
        <div className='health'>
          <span className={`dot ${health.status==='ok' ? 'ok' : ''} ${health.rpc==='down' ? 'down':''}`} />
          <span>{useNewApi ? (health.status==='ok' ? 'API OK' : 'API ...') : 'Mock API'}</span>
        </div>
      </div>
    </div>
  );
}

