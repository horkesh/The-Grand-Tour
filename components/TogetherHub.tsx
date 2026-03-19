import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';
import { useStore } from '../store';
import UserAvatar from './UserAvatar';

const TogetherHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, partnerUser, tripMeta } = useStore();

  const cards = [
    { path: '/preferences', label: 'Our Preferences', subtitle: 'Rate trip categories together', icon: <Icons.Hearts />, color: 'bg-[#ac3d29]' },
    { path: '/prompts', label: 'Daily Prompts', subtitle: 'Answer & reveal together', icon: <Icons.Conversation />, color: 'bg-[#ac3d29]' },
    { path: '/trivia', label: 'Italy Trivia', subtitle: 'Who knows Italy better?', icon: <Icons.Lightbulb />, color: 'bg-[#194f4c]' },
    { path: '/challenges', label: 'Photo Challenges', subtitle: '16 creative missions', icon: <Icons.Camera />, color: 'bg-[#194f4c]' },
    { path: '/surprises', label: 'Surprises', subtitle: 'Secret moments for each other', icon: <Icons.Gift />, color: 'bg-[#194f4c]' },
    { path: '/packing', label: 'Packing List', subtitle: 'Claim & track together', icon: <Icons.Backpack />, color: 'bg-slate-700' },
    { path: '/wishlist', label: 'Wishlist', subtitle: 'Vote on places to visit', icon: <Icons.Pin />, color: 'bg-slate-700' },
    { path: '/phrases', label: 'Learn Italian', subtitle: 'Practice phrases', icon: <Icons.Language />, color: 'bg-slate-700' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">Together</p>
          <h2 className="font-serif text-3xl font-bold text-[#194f4c] dark:text-white">Us</h2>
        </div>

        {/* Partner status card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" showName />
            <span className="text-slate-300 dark:text-slate-600 font-serif text-lg">&amp;</span>
            <UserAvatar user={partnerUser} size="md" showName />
          </div>
          {partnerUser ? (
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Connected</span>
          ) : tripMeta?.joinCode ? (
            <div className="text-right">
              <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Join Code</p>
              <p className="font-mono text-sm font-bold text-[#194f4c] tracking-[0.2em]">{tripMeta.joinCode}</p>
            </div>
          ) : null}
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

export default TogetherHub;
