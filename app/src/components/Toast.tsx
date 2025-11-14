import { useEffect } from 'react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 50,
      background: '#1f2937', color: '#e5e7eb',
      border: '1px solid #374151', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
    }}>
      {message}
    </div>
  );
}

