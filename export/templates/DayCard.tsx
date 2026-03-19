import React from 'react';
import { FONT, COLOR, CANVAS } from './shared';
import { AccentRule } from './shared/AccentRule';
import { BrandMark } from './shared/BrandMark';
import { BackgroundLayer } from './shared/BackgroundLayer';
import { InsetFrame } from './shared/InsetFrame';

interface DayCardProps {
  dayNumber: number;
  title: string;
  location: string;
  milestone: string;
  backgroundUrl?: string;
  weather?: { temp: string; description: string };
  stampsCollected?: number;
  totalStops?: number;
  isAnniversary?: boolean;
}

const Z2: React.CSSProperties = { position: 'relative', zIndex: 2 };

export const DayCard = React.forwardRef<HTMLDivElement, DayCardProps>(
  (
    {
      dayNumber,
      title,
      location,
      milestone,
      backgroundUrl,
      weather,
      stampsCollected = 0,
      totalStops = 0,
      isAnniversary = false,
    },
    ref,
  ) => {
    const accentColor = isAnniversary ? COLOR.rust : COLOR.teal;

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
        }}
      >
        <BackgroundLayer url={backgroundUrl} gradient="strong" />
        <InsetFrame />

        {/* Top label */}
        <div style={{ padding: '72px 80px 0', ...Z2 }}>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize: '13px',
              color: accentColor,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {isAnniversary ? 'Anniversary Day' : `Day ${dayNumber}`}
          </p>
        </div>

        {/* Bottom content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 80px',
            ...Z2,
          }}
        >
          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: '88px',
              fontWeight: 700,
              color: COLOR.warmWhite,
              lineHeight: '0.95',
              letterSpacing: '-0.03em',
              margin: '0 0 16px 0',
            }}
          >
            {location}
          </h1>

          <p
            style={{
              fontFamily: FONT.body,
              fontSize: '20px',
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '32px',
            }}
          >
            {title.split(': ')[1] || title}
          </p>

          <p
            style={{
              fontFamily: FONT.display,
              fontStyle: 'italic',
              fontSize: '22px',
              color: COLOR.warmWhiteDim,
              lineHeight: '1.5',
              maxWidth: '800px',
              marginBottom: '32px',
            }}
          >
            &ldquo;{milestone}&rdquo;
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '16px',
            }}
          >
            {weather && (
              <span
                style={{
                  fontFamily: FONT.body,
                  fontSize: '15px',
                  color: COLOR.warmWhiteFaint,
                  letterSpacing: '0.08em',
                }}
              >
                {weather.temp} · {weather.description}
              </span>
            )}
            {stampsCollected > 0 && (
              <>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT.body,
                    fontSize: '15px',
                    color: COLOR.warmWhiteFaint,
                    letterSpacing: '0.08em',
                  }}
                >
                  {stampsCollected}/{totalStops} stamps
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '48px 80px 64px', ...Z2 }}>
          <AccentRule color={accentColor} />
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <BrandMark size="md" />
          </div>
        </div>
      </div>
    );
  },
);

DayCard.displayName = 'DayCard';
