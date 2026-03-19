import React from 'react';
import { FONT, COLOR, CANVAS } from './shared';
import { AccentRule } from './shared/AccentRule';
import { BrandMark } from './shared/BrandMark';
import type { TripSegment } from '../../types';

interface StampCollectionPageProps {
  cities: TripSegment[];
  stamps: string[];
}

export const StampCollectionPage = React.forwardRef<HTMLDivElement, StampCollectionPageProps>(
  ({ cities, stamps }, ref) => {
    const totalStops = cities.reduce((sum, c) => sum + c.plannedStops.length + 1, 0);
    const collected = stamps.length;

    return (
      <div
        ref={ref}
        style={{
          width: `${CANVAS.story.width}px`,
          height: `${CANVAS.story.height}px`,
          backgroundColor: '#1a2530',
          fontFamily: FONT.body,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 64px',
        }}
      >
        {/* Header */}
        <div
          style={{
            paddingTop: '80px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          {/* Passport seal */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: `2px solid ${COLOR.amber}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: '28px',
                fontWeight: 700,
                color: COLOR.amber,
              }}
            >
              ITA
            </span>
          </div>

          <span
            style={{
              fontFamily: FONT.body,
              fontSize: '12px',
              color: COLOR.amber,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Passaporto
          </span>

          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: '52px',
              fontWeight: 700,
              color: '#f0ede8',
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              margin: '0 0 24px 0',
            }}
          >
            Our Grand Tour
          </h1>

          {/* Summary line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: '16px',
                color: '#8c8680',
                letterSpacing: '0.08em',
              }}
            >
              {collected} stamps collected
            </span>
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: COLOR.amber,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: '16px',
                color: '#8c8680',
                letterSpacing: '0.08em',
              }}
            >
              {totalStops} total
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', marginTop: '32px', marginBottom: '32px' }}>
          <AccentRule color={COLOR.amber} />
        </div>

        {/* City rows */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flex: 1,
            alignContent: 'start',
          }}
        >
          {cities.map((city, dayIdx) => {
            const cityStamped = stamps.includes(city.id);
            const stopsStamped = city.plannedStops.filter((_, i) =>
              stamps.includes(`${city.id}_${i}`),
            ).length;
            const total = city.plannedStops.length + 1;
            const dayCollected = (cityStamped ? 1 : 0) + stopsStamped;

            return (
              <div
                key={city.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  backgroundColor: dayCollected > 0 ? 'rgba(25,79,76,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${dayCollected > 0 ? COLOR.teal + '40' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Day badge */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: dayCollected === total ? COLOR.teal : dayCollected > 0 ? COLOR.teal + '40' : 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: dayCollected === total ? 'none' : `1px solid ${COLOR.teal}30`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT.body,
                        fontSize: '16px',
                        fontWeight: 700,
                        color: dayCollected > 0 ? COLOR.warmWhite : '#8c8680',
                      }}
                    >
                      {dayIdx + 1}
                    </span>
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: FONT.display,
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#f0ede8',
                        margin: 0,
                        lineHeight: '1.2',
                      }}
                    >
                      {city.location}
                    </p>
                    <p
                      style={{
                        fontFamily: FONT.body,
                        fontSize: '12px',
                        color: '#8c8680',
                        letterSpacing: '0.06em',
                        margin: '2px 0 0 0',
                      }}
                    >
                      {city.plannedStops.length} stops
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: FONT.body,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: dayCollected === total ? COLOR.teal : dayCollected > 0 ? COLOR.warmWhiteDim : '#8c8680',
                    }}
                  >
                    {dayCollected}/{total}
                  </span>
                  {dayCollected === total && (
                    <span
                      style={{
                        fontFamily: FONT.body,
                        fontSize: '10px',
                        color: COLOR.amber,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        border: `1px solid ${COLOR.amber}60`,
                        borderRadius: '3px',
                        padding: '3px 8px',
                        fontWeight: 600,
                      }}
                    >
                      Visto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            paddingBottom: '64px',
            paddingTop: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
          }}
        >
          <AccentRule color={COLOR.amber} />
          <BrandMark size="lg" />
        </div>
      </div>
    );
  },
);

StampCollectionPage.displayName = 'StampCollectionPage';
