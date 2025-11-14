import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TicketsPage } from './components/TicketsPage';
import { VideosPage } from './components/VideosPage';
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  const [activePage, setActivePage] = useState<'tickets' | 'videos'>('tickets');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [ownedTickets, setOwnedTickets] = useState<string[]>([]);

  const handleConnectWallet = () => {
    // モック接続
    setIsWalletConnected(true);
    setWalletAddress('0x' + Math.random().toString(36).substring(2, 6).toUpperCase());
    // デモ用: 一部のチケットを所有していることにする
    setOwnedTickets(['ticket-1']);
  };

  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setOwnedTickets([]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Devnet警告バナー */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-2">
        <p className="text-center">
          <span className="text-yellow-400">⚠️</span> Sui devnet でテスト中です。これは実際の SUI ではありません。
        </p>
      </div>

      <Header
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      <div className="flex">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />

        <main className="flex-1 bg-zinc-900 min-h-[calc(100vh-120px)]">
          {activePage === 'tickets' ? (
            <TicketsPage
              isWalletConnected={isWalletConnected}
              ownedTickets={ownedTickets}
              onTicketPurchased={(ticketId) => setOwnedTickets([...ownedTickets, ticketId])}
            />
          ) : (
            <VideosPage
              isWalletConnected={isWalletConnected}
              ownedTickets={ownedTickets}
            />
          )}
        </main>
      </div>

      <Toaster position="top-right" theme="dark" />
    </div>
  );
}
