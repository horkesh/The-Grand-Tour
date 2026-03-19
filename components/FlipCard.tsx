import React from 'react';

interface FlipCardProps {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const FlipCard: React.FC<FlipCardProps> = ({ flipped, front, back, className = '', onClick }) => {
  return (
    <div
      className={`flip-card-container ${className}`}
      onClick={onClick}
      style={{ perspective: '1000px' }}
    >
      <div
        className="flip-card-inner"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {front}
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
