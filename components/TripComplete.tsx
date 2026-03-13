import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { ITALIAN_CITIES } from '../constants';

const TOTAL_CITIES = ITALIAN_CITIES.length;

const TripComplete: React.FC = () => {
  const { stamps, hasSeenTripComplete, setHasSeenTripComplete } = useStore();

  // Only count city-level stamps (not stop stamps like "day-2_3")
  const cityStamps = ITALIAN_CITIES.filter(city => stamps.includes(city.id));
  const allComplete = cityStamps.length === TOTAL_CITIES;

  if (!allComplete || hasSeenTripComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-[#194f4c]/95 backdrop-blur-md overflow-y-auto p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        className="text-center text-white max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
          className="text-7xl mb-6"
        >
          🇮🇹
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="font-serif text-4xl lg:text-5xl font-bold mb-4 leading-tight"
        >
          Our Grand Tour
          <br />
          <span className="text-white/60 text-2xl lg:text-3xl">Complete</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mb-8"
        >
          <p className="font-serif text-lg italic text-white/80 leading-relaxed mb-6">
            Eight days, five regions, and twenty years of love
            carried across every rolling hill and ancient stone.
          </p>

          {/* Stamp grid */}
          <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto mb-6">
            {ITALIAN_CITIES.map((city, i) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + i * 0.15, type: 'spring' }}
                className="aspect-square bg-white/10 rounded-xl flex flex-col items-center justify-center p-2 border border-white/20"
              >
                <span className="text-lg">✓</span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-white/60 mt-1 leading-tight text-center">{city.location}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-white/40 text-xs uppercase tracking-[0.3em]">
            {stamps.length} stamps collected
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.6 }}
          onClick={setHasSeenTripComplete}
          className="px-10 py-4 bg-white text-[#194f4c] font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform shadow-2xl"
        >
          Until Next Time
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
          className="mt-6 text-white/30 text-[10px] uppercase tracking-[0.3em]"
        >
          Twenty years and counting
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default TripComplete;
