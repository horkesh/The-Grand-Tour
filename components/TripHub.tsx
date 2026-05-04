import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons, ITALIAN_CITIES } from '../constants';
import { useStore } from '../store';
import { useCountdown } from '../hooks/useCountdown';

interface HubCard {
  path: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string; // tailwind bg class
  accent?: string; // optional accent text
}

const TripHub: React.FC = () => {
  const navigate = useNavigate();
  const { stamps, lastViewedDay } = useStore();
  const { days } = useCountdown();

  const totalStamps = ITALIAN_CITIES.length + ITALIAN_CITIES.reduce((s, c) => s + c.plannedStops.length, 0);

  const cards: HubCard[] = [
    { path: '/countdown', label: 'Countdown', subtitle: `${days} days to go`, icon: <Icons.Journal />, color: 'bg-[#194f4c]' },
    { path: '/list', label: 'Full Itinerary', subtitle: '8 days across Italy', icon: <Icons.Route />, color: 'bg-[#194f4c]' },
    { path: `/day/${lastViewedDay}`, label: 'Day Journal', subtitle: 'Your daily diary', icon: <Icons.Journal />, color: 'bg-[#194f4c]' },
    { path: '/reveals', label: 'Daily Reveals', subtitle: 'Unlock daily surprises', icon: <Icons.Calendar />, color: 'bg-slate-700' },
    { path: '/chat', label: 'AI Concierge', subtitle: 'Ask anything about Italy', icon: <Icons.Chat />, color: 'bg-[#ac3d29]' },
    { path: '/story', label: 'Our Story', subtitle: 'The journey so far', icon: <Icons.Story />, color: 'bg-[#ac3d29]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">May 2 – 9, 2026</p>
          <h2 className="font-serif text-3xl font-bold text-[#194f4c] dark:text-white">The Trip</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{stamps.length}/{totalStamps} stamps collected</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.button
              key={card.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(card.path)}
              className={`${card.color} rounded-2xl p-5 text-left text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                {card.icon}
              </div>
              <h3 className="font-bold text-sm">{card.label}</h3>
              <p className="text-[10px] text-white/60 mt-0.5">{card.subtitle}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TripHub;
