import React from 'react';
import { FONT, COLOR } from './tokens';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 14, md: 18, lg: 24 } as const;

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const fontSize = SIZES[size];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          fontStyle: 'italic',
          color: COLOR.teal,
          letterSpacing: '-0.02em',
        }}
      >
        Grand Tour
      </span>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: `${Math.round(fontSize * 0.4)}px`,
          color: COLOR.slateDim,
          letterSpacing: '0.3em',
          textTransform: 'uppercase' as const,
          fontWeight: 600,
        }}
      >
        Italy 2026
      </span>
    </div>
  );
}
