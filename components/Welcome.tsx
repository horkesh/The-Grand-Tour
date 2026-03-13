import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const Welcome: React.FC = () => {
  const { hasSeenWelcome, setHasSeenWelcome } = useStore();

  if (hasSeenWelcome) return null;

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#194f4c] overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
          className="relative text-center text-white px-8 max-w-lg"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
            className="text-6xl mb-8"
          >
            ❤️
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-white/60 text-xs uppercase tracking-[0.4em] font-bold mb-4"
          >
            May 2 – 9, 2026
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="font-serif text-4xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Our Grand Tour
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="space-y-4 mb-10"
          >
            <p className="font-serif text-lg lg:text-xl italic text-white/90 leading-relaxed">
              Twenty years of us, celebrated across the rolling hills of Tuscany and the ancient stones of Umbria.
            </p>
            <p className="text-white/50 text-sm">
              8 days · 5 regions · 1 love story
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
            onClick={setHasSeenWelcome}
            className="px-10 py-4 bg-white text-[#194f4c] font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform shadow-2xl"
          >
            Begin Our Journey
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="mt-8 text-white/30 text-[10px] uppercase tracking-[0.3em]"
          >
            A gift, with love
          </motion.p>
        </motion.div>
      </motion.div>
  );
};

export default Welcome;
