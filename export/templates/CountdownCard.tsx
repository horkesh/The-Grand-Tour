import React from 'react';
import { FONT, COLOR, CANVAS } from './shared';
import { AccentRule } from './shared/AccentRule';
import { BrandMark } from './shared/BrandMark';
import { BackgroundLayer } from './shared/BackgroundLayer';
import { InsetFrame } from './shared/InsetFrame';

interface CountdownCardProps {
  daysUntil: number;
  cityName?: string;
  backgroundUrl?: string;
}

const Z2: React.CSSProperties = { position: 'relative', zIndex: 2 };

export const CountdownCard = React.forwardRef<HTMLDivElement, CountdownCardProps>(
  ({ daysUntil, cityName, backgroundUrl }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: `${CANVAS.portrait.width}px`,
          height: `${CANVAS.portrait.height}px`,
          backgroundColor: COLOR.dark,
          fontFamily: FONT.body,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '80px',
          boxSizing: 'border-box',
        }}
      >
        <BackgroundLayer url={backgroundUrl} gradient="strong" />
        <InsetFrame />

        <p
          style={{
            fontFamily: FONT.body,
            fontSize: '13px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: COLOR.warmWhite,
            marginBottom: '16px',
            textAlign: 'center',
            ...Z2,
          }}
        >
          Until Our Grand Tour
        </p>

        <p
          style={{
            fontFamily: FONT.display,
            fontSize: '180px',
            lineHeight: '0.9',
            color: COLOR.teal,
            textAlign: 'center',
            marginBottom: '8px',
            fontWeight: 400,
            textShadow: `0 0 60px ${COLOR.teal}50`,
            ...Z2,
          }}
        >
          {Math.abs(daysUntil)}
        </p>

        <p
          style={{
            fontFamily: FONT.body,
            fontSize: '20px',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: COLOR.warmWhiteDim,
            marginBottom: '48px',
            textAlign: 'center',
            ...Z2,
          }}
        >
          {Math.abs(daysUntil) === 1 ? 'Day' : 'Days'}
        </p>

        <div style={{ width: '200px', marginBottom: '48px', ...Z2 }}>
          <AccentRule color={COLOR.teal} />
        </div>

        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: '52px',
            color: COLOR.warmWhite,
            textAlign: 'center',
            lineHeight: '1.2',
            marginBottom: '16px',
            fontWeight: 400,
            fontStyle: 'italic',
            ...Z2,
          }}
        >
          Italy Awaits
        </h1>

        <p
          style={{
            fontFamily: FONT.body,
            fontSize: '20px',
            color: COLOR.warmWhiteDim,
            textAlign: 'center',
            marginBottom: '8px',
            ...Z2,
          }}
        >
          May 2 – 9, 2026
        </p>

        {cityName && (
          <p
            style={{
              fontFamily: FONT.body,
              fontSize: '16px',
              color: COLOR.rust,
              textAlign: 'center',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '80px',
              ...Z2,
            }}
          >
            Starting in {cityName}
          </p>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 2,
          }}
        >
          <AccentRule color={COLOR.teal} />
          <BrandMark size="md" />
        </div>
      </div>
    );
  },
);

CountdownCard.displayName = 'CountdownCard';
