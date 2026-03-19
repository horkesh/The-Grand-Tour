import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCountdown } from '../hooks/useCountdown';
import { ITALIAN_CITIES } from '../constants';
import { getDayOfYear } from '../utils/dateUtils';

const FACTS = [
  { city: 'Fiumicino', fact: 'Fiumicino was once the port city of Ancient Rome, called Portus.' },
  { city: 'Bagnoregio', fact: 'Civita di Bagnoregio is called "The Dying City" because its tuff cliffs erode a little more each year.' },
  { city: 'Val d\'Orcia', fact: 'The Val d\'Orcia landscape is a UNESCO World Heritage Site since 2004.' },
  { city: 'Pienza', fact: 'Pienza was redesigned in the 15th century as the "ideal city" of the Renaissance.' },
  { city: 'Saturnia', fact: 'The thermal springs at Saturnia flow at 37.5°C (99.5°F) year-round and are completely free.' },
  { city: 'Spello', fact: 'Every June, Spello\'s streets are covered in elaborate flower petal carpets for the Infiorata festival.' },
  { city: 'Via Appia', fact: 'The Appian Way was built in 312 BC and was the first Roman road to use large, flat stones for paving.' },
  { city: 'Ostia', fact: 'Ostia Antica is one of the best-preserved Roman cities, with intact mosaics, theaters, and taverns.' },
  { city: 'Tuscany', fact: 'Tuscany produces over 250 million liters of wine each year, including the famous Brunello di Montalcino.' },
  { city: 'Orvieto', fact: 'The Pozzo di San Patrizio in Orvieto has a double-helix staircase so donkeys going down never met those going up.' },
  { city: 'San Gimignano', fact: 'San Gimignano once had 72 towers — today 14 remain, earning it the nickname "Medieval Manhattan."' },
  { city: 'Montalcino', fact: 'Brunello di Montalcino must age at least 5 years before release, with 2 years in oak barrels.' },
  { city: 'Italy', fact: 'Italy has more UNESCO World Heritage Sites than any other country in the world — 59 and counting.' },
  { city: 'Italy', fact: 'The Italian language has over 500 words just for different types of pasta.' },
];

const CountdownDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { days, hours, mins } = useCountdown();
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    setFactIndex(getDayOfYear() % FACTS.length);
  }, []);

  const fact = FACTS[factIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#194f4c] to-[#0d2f2d]"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative text-center"
        >
          <p className="text-white/40 text-xs uppercase tracking-[0.5em] font-bold mb-6">
            Our Grand Tour Begins In
          </p>

          {/* Big countdown */}
          <div className="flex items-baseline justify-center gap-8 mb-8">
            <CountdownUnit value={days} label="Days" />
            <span className="text-white/20 text-5xl font-serif">:</span>
            <CountdownUnit value={hours} label="Hours" />
            <span className="text-white/20 text-5xl font-serif">:</span>
            <CountdownUnit value={mins} label="Min" />
          </div>

          <p className="text-white/50 text-sm mb-2">May 2 – 9, 2026</p>
          <p className="text-[#ac3d29] text-xs font-bold uppercase tracking-widest">
            20th Anniversary Trip
          </p>
        </motion.div>

        {/* Divider */}
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-10" />

        {/* Daily fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-md text-center"
        >
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-3">
            Did You Know?
          </p>
          <p className="font-serif text-lg italic text-white/80 leading-relaxed mb-2">
            &ldquo;{fact.fact}&rdquo;
          </p>
          <p className="text-white/30 text-xs">{fact.city}</p>
        </motion.div>

        {/* Divider */}
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-10" />

        {/* City preview grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-4 gap-3 max-w-lg"
        >
          {ITALIAN_CITIES.map((city, i) => (
            <button
              key={city.id}
              onClick={() => navigate(`/day/${city.id}`)}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg"
            >
              <img
                src={city.image}
                alt={city.location}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-lg">{i + 1}</span>
                <span className="text-white/70 text-[8px] uppercase tracking-wider font-bold">
                  {city.location.split(' & ')[0].split(' to ')[0]}
                </span>
              </div>
            </button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => navigate('/list')}
          className="mt-10 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-widest rounded-full border border-white/20 transition-all hover:scale-105"
        >
          View Full Itinerary
        </motion.button>
      </div>
    </motion.div>
  );
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="font-serif text-7xl lg:text-9xl font-bold text-white tracking-tighter leading-none">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold mt-2">
      {label}
    </span>
  </div>
);

export default CountdownDashboard;
