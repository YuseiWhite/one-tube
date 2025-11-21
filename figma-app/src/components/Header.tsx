import { Button } from './ui/button';
import { useState } from 'react';
import { figma } from '@figma/code-connect';

interface HeaderProps {
  isWalletConnected: boolean;
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export function Header({
  isWalletConnected,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'devnet' | 'testnet' | 'mainnet'>('devnet');

  return (
    <header className="bg-black border-b border-zinc-800 px-8 py-4">
      <div className="flex items-center justify-between max-w-[1440px] mx-auto">
        {/* ロゴエリア */}
        <div>
          <h1 className="tracking-wider text-yellow-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
            ONETUBE
          </h1>
          <p className="text-zinc-500 tracking-wide">
            Premium Fight Archive
          </p>
        </div>

        {/* 右側：ネットワーク＋ウォレット */}
        <div className="flex items-center gap-4">
          {/* ネットワーク選択（3つのピルボタン） */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            {/* Sui devnet */}
            <button
              onClick={() => setSelectedNetwork('devnet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                selectedNetwork === 'devnet'
                  ? 'bg-zinc-700 text-green-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {selectedNetwork === 'devnet' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              <span className="text-sm">Sui devnet</span>
            </button>

            {/* Sui testnet（利用不可） */}
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-full text-red-500/50 border border-red-500/20 cursor-not-allowed opacity-50"
            >
              <span className="text-sm">Sui testnet</span>
            </button>

            {/* Sui mainnet（利用不可） */}
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-full text-red-500/50 border border-red-500/20 cursor-not-allowed opacity-50"
            >
              <span className="text-sm">Sui mainnet</span>
            </button>
          </div>

          {/* ウォレット接続 */}
          {isWalletConnected ? (
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2">
                <span className="text-white">0x5555...5555</span>
              </div>
              <Button
                variant="outline"
                onClick={onDisconnectWallet}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              onClick={onConnectWallet}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              ログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Figma Code Connect
figma.connect(Header, {
  props: {
    isWalletConnected: figma.boolean("Wallet Connected"),
    walletAddress: figma.string("Wallet Address"),
  },
  example: (props) => (
    <Header
      {...props}
      onConnectWallet={() => {}}
      onDisconnectWallet={() => {}}
    />
  ),
});