import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TicketsPage } from './components/TicketsPage';
import { VideosPage } from './components/VideosPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activePage, setActivePage] = useState<'tickets' | 'videos'>('tickets');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [ownedTickets, setOwnedTickets] = useState<string[]>([]);

  const handleConnectWallet = () => {
    // モック接続
    setIsWalletConnected(true);
    setWalletAddress('0x5555...5555');
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