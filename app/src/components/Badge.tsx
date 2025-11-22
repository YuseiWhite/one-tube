import React from 'react';

type Color = 'gray' | 'green' | 'yellow' | 'red' | 'blue';

const COLORS: Record<Color, { bg: string; fg: string }> = {
  gray:   { bg: '#2a2a2a', fg: '#bbbbbb' },
  green:  { bg: '#173d28', fg: '#6ee7b7' },
  yellow: { bg: '#3d3417', fg: '#fde68a' },
  red:    { bg: '#3f1f1f', fg: '#fca5a5' },
  blue:   { bg: '#142b3d', fg: '#93c5fd' },
};

export function Badge({ color, children }: { color: Color; children: React.ReactNode }) {
  const c = COLORS[color];
  return (
    <span style={{
      background: c.bg, color: c.fg,
      padding: '4px 8px', borderRadius: 999, fontSize: 12, lineHeight: 1
    }}>
      {children}
    </span>
  );
}

