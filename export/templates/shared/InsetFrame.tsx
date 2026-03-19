import React from 'react';
import { COLOR } from './tokens';

export function InsetFrame() {
  const inset = 24;
  const strip = {
    backgroundColor: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    pointerEvents: 'none' as const,
    zIndex: 3,
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: inset, ...strip }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: inset, ...strip }} />
      <div style={{ position: 'absolute', top: inset, bottom: inset, left: 0, width: inset, ...strip }} />
      <div style={{ position: 'absolute', top: inset, bottom: inset, right: 0, width: inset, ...strip }} />
      <div
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          border: `1.5px solid ${COLOR.teal}40`,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />
    </>
  );
}
