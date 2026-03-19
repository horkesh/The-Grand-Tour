import React from 'react';
import { FONT, COLOR, CANVAS } from './shared';
import { AccentRule } from './shared/AccentRule';
import { BrandMark } from './shared/BrandMark';
import type { TripSegment } from '../../types';

interface TripSummaryCardProps {
  cities: TripSegment[];
  stamps: string[];
  postcardCount: number;
}

export const TripSummaryCard = React.forwardRef<HTMLDivElement, TripSummaryCardProps>(
  ({ cities, stamps, postcardCount }, ref) => {
    const totalStops = cities.reduce((sum, c) => sum + c.plannedStops.length + 1, 0);
    const cityCount = cities.length;

    // Unique locations visited (only count cities where at least the city stamp exists)
    const citiesVisited = cities.filter((c) => stamps.includes(c.id)).length;

    return (
      <div
        ref={ref}
        style={{
          width: `${CANVAS.story.width}px`,
          height: `${CANVAS.story.height}px`,
          backgroundColor: COLOR.dark,
          fontFamily: FONT.body,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 80px',
        }}
      >
        {/* Decorative background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, rgba(25,79,76,0.03) 60px, rgba(25,79,76,0.03) 61px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            paddingTop: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: '12px',
              color: COLOR.rust,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Trip Wrapped
          </span>

          <span
            style={{
              fontFamily: FONT.display,
              fontSize: '120px',
              fontWeight: 700,
              color: COLOR.teal,
              lineHeight: '1',
              letterSpacing: '-0.04em',
            }}
          >
            2026
          </span>

          <p
            style={{
              fontFamily: FONT.display,
              fontSize: '28px',
              fontStyle: 'italic',
              color: COLOR.warmWhiteDim,
              marginTop: '8px',
            }}
          >
            Our Grand Tour of Italy
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', margin: '40px 0', position: 'relative', zIndex: 1 }}>
          <AccentRule color={COLOR.teal} />
        </div>

        {/* Stats grid */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: '20px',
            marginBottom: '40px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {[
            { label: 'Days', value: cityCount },
            { label: 'Stamps', value: stamps.length },
            { label: 'Photos', value: postcardCount },
            { label: 'Cities', value: citiesVisited },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: 1,
                backgroundColor: `${COLOR.teal}15`,
                border: `1px solid ${COLOR.teal}30`,
                borderRadius: '8px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.display,
                  fontSize: '52px',
                  fontWeight: 700,
                  color: COLOR.warmWhite,
                  lineHeight: '1',
                }}
              >
                {value}
              </span>
              <span
                style={{
                  fontFamily: FONT.body,
                  fontSize: '11px',
                  color: COLOR.slate,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* City list */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {cities.map((city, i) => {
            const isVisited = stamps.includes(city.id);
            return (
              <div
                key={city.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${COLOR.teal}15`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span
                    style={{
                      fontFamily: FONT.body,
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isVisited ? COLOR.teal : '#555',
                      width: '28px',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.display,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: isVisited ? COLOR.warmWhite : '#666',
                    }}
                  >
                    {city.location}
                  </span>
                </div>
                {isVisited && (
                  <span
                    style={{
                      fontFamily: FONT.body,
                      fontSize: '10px',
                      color: COLOR.teal,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      border: `1px solid ${COLOR.teal}50`,
                      borderRadius: '3px',
                      padding: '3px 10px',
                      fontWeight: 600,
                    }}
                  >
                    Visited
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Narrative */}
        <p
          style={{
            fontFamily: FONT.display,
            fontStyle: 'italic',
            fontSize: '20px',
            color: COLOR.warmWhiteFaint,
            textAlign: 'center',
            lineHeight: '1.6',
            maxWidth: '840px',
            margin: '40px 0',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Eight days of la dolce vita. Twenty years of love.
          <br />
          Every stamp a memory, every photo a promise.
        </p>

        {/* Spacer + BrandMark */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            paddingBottom: '64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <AccentRule color={COLOR.teal} />
          <BrandMark size="lg" />
        </div>
      </div>
    );
  },
);

TripSummaryCard.displayName = 'TripSummaryCard';
