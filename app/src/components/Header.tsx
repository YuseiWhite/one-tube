import { useEffect, useState } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { getHealth } from '../lib/api';

const useNewApi = !!import.meta.env.VITE_API_BASE_URL;

type HeaderProps = {
  shortAddress: string | null;
};

export default function Header({ shortAddress }: HeaderProps) {
  const [apiStatus, setApiStatus] = useState<'ok' | 'loading' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    if (useNewApi) {
      getHealth()
        .then((h) => {
          if (!alive) return;
          setApiStatus(h.status === 'ok' ? 'ok' : 'error');
        })
        .catch(() => {
          if (!alive) return;
          setApiStatus('error');
        });
    } else {
      setApiStatus('ok');
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className="onetube-header">
      {/* Figma参照: figma-ui/src/components/Header.tsx */}
      <div className="onetube-header__brand">
        <p className="onetube-header__logo">ONETUBE</p>
        <p className="onetube-header__subtitle">Premium Fight Archive</p>
      </div>
      <div className="onetube-header__actions">
        <div className="onetube-network">
          <span className="onetube-network__dot" />
          <span className="onetube-network__label">Sui devnet</span>
        </div>
        <div className="onetube-health">
          <span className={`onetube-health__dot onetube-health__dot--${apiStatus}`} />
          <span>{useNewApi ? (apiStatus === 'ok' ? 'API OK' : 'API ...') : 'Mock API'}</span>
        </div>
        {shortAddress && <span className="onetube-wallet">0x...{shortAddress}</span>}
        <ConnectButton className="onetube-connect" connectText="Connect Wallet" />
      </div>
    </header>
  );
}
