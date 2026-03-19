import React from 'react';
import { FONT, COLOR, CANVAS } from './shared';
import { AccentRule } from './shared/AccentRule';
import { BrandMark } from './shared/BrandMark';

interface PostcardGridProps {
  images: Array<{
    url: string;
    cityName: string;
  }>;
}

export const PostcardGrid = React.forwardRef<HTMLDivElement, PostcardGridProps>(
  ({ images }, ref) => {
    // Show up to 9 images in a 3x3 grid
    const displayImages = images.slice(0, 9);

    return (
      <div
        ref={ref}
        style={{
          width: `${CANVAS.square.width}px`,
          height: `${CANVAS.square.height}px`,
          backgroundColor: COLOR.warmWhite,
          fontFamily: FONT.body,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: '11px',
              color: COLOR.rust,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Our Memories
          </span>
          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: '42px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: COLOR.teal,
              margin: 0,
              lineHeight: '1',
            }}
          >
            Polaroids
          </h1>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize: '13px',
              color: COLOR.slate,
              marginTop: '8px',
            }}
          >
            {images.length} {images.length === 1 ? 'memory' : 'memories'} from Italy
          </p>
        </div>

        <div style={{ width: '100%', marginBottom: '20px' }}>
          <AccentRule color={COLOR.teal} />
        </div>

        {/* Photo grid */}
        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: displayImages.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '12px',
            alignContent: 'center',
          }}
        >
          {displayImages.map((img, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                backgroundColor: '#fff',
                padding: '8px',
                paddingBottom: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                transform: `rotate(${(i % 3 - 1) * 1.5}deg)`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  backgroundColor: '#eee',
                }}
              >
                <img
                  src={img.url}
                  alt={img.cityName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  crossOrigin="anonymous"
                />
              </div>
              <p
                style={{
                  fontFamily: FONT.display,
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: COLOR.slate,
                  textAlign: 'center',
                  margin: '6px 0 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {img.cityName}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '20px',
            width: '100%',
          }}
        >
          <AccentRule color={COLOR.teal} />
          <BrandMark size="sm" />
        </div>
      </div>
    );
  },
);

PostcardGrid.displayName = 'PostcardGrid';
