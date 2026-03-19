import React from 'react';
import { COLOR } from './tokens';

interface AccentRuleProps {
  color?: string;
  thick?: boolean;
}

export function AccentRule({ color = COLOR.teal, thick = false }: AccentRuleProps) {
  return (
    <div
      style={{
        width: '100%',
        height: thick ? '2px' : '1px',
        background: `linear-gradient(to right, transparent, ${color}, transparent)`,
      }}
    />
  );
}
