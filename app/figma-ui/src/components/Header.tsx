import { Button } from './ui/button';

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
          {/* ネットワークバッジ */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400">Sui devnet</span>
          </div>

          {/* ウォレット接続 */}
          {isWalletConnected ? (
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2">
                <span className="text-zinc-400">0x...</span>
                <span className="text-white">{walletAddress.slice(-4)}</span>
              </div>
              <Button
                variant="outline"
                onClick={onDisconnectWallet}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={onConnectWallet}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
