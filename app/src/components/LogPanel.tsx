import React from 'react';

export function LogPanel({ logs }: { logs: string[] }) {
  if (!logs.length) return null;

  return (
    <div style={{
      background: '#111827', border: '1px solid #374151', color: '#9ca3af',
      borderRadius: 8, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#d1d5db' }}>Developer Log</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {logs.slice(-8).map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

