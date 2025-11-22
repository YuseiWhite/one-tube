import { useEffect, useState } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { checkHealth } from '../lib/api';
import logoSrc from '../assets/onetube-logo.png';

const useNewApi = !!import.meta.env.VITE_API_BASE_URL;

type HeaderProps = {
  address: string | null;
};

const formatAddress = (address: string) => {
  if (address.length <= 10) return address;
  const prefix = address.slice(0, 6);
  const suffix = address.slice(-4);
  return `${prefix}...${suffix}`;
};

export default function Header({ address }: HeaderProps) {
  const [apiStatus, setApiStatus] = useState<'ok' | 'loading' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    if (useNewApi) {
      checkHealth()
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
        <img src={logoSrc} alt="ONETUBE" className="onetube-header__logoImage" />
      </div>
      <div className="onetube-header__actions">
        <div className="onetube-network">
          <span className="onetube-network__dot" />
          <span className="onetube-network__label">Sui devnet</span>
        </div>
        {useNewApi && (
          <div className="onetube-health">
            <span className={`onetube-health__dot onetube-health__dot--${apiStatus}`} />
            <span>{apiStatus === 'ok' ? 'API OK' : 'API ...'}</span>
          </div>
        )}
        {address && <span className="onetube-wallet">{formatAddress(address)}</span>}
        <ConnectButton className="onetube-connect" connectText="Connect Wallet" />
      </div>
    </header>
  );
}
