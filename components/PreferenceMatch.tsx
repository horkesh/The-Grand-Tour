import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';

const CATEGORIES = [
  { id: 'museums', label: 'Museums & Art', emoji: '🏛️', desc: 'Galleries, churches, history' },
  { id: 'food', label: 'Food & Wine', emoji: '🍷', desc: 'Restaurants, tastings, markets' },
  { id: 'nature', label: 'Nature & Walks', emoji: '🌿', desc: 'Hikes, gardens, viewpoints' },
  { id: 'romance', label: 'Romance', emoji: '💕', desc: 'Couples moments, sunset spots' },
  { id: 'adventure', label: 'Adventure', emoji: '🏎️', desc: 'Driving, exploring, spontaneous' },
  { id: 'relax', label: 'Relaxation', emoji: '♨️', desc: 'Thermal baths, slow mornings' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', desc: 'Markets, boutiques, souvenirs' },
  { id: 'nightlife', label: 'Evening Out', emoji: '🌙', desc: 'Aperitivo, night walks, live music' },
  { id: 'photography', label: 'Photography', emoji: '📸', desc: 'Photo stops, golden hour' },
  { id: 'culture', label: 'Local Culture', emoji: '🎭', desc: 'Traditions, festivals, people' },
];

const PreferenceMatch: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [partnerRatings, setPartnerRatings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const category = CATEGORIES[currentIdx];

  // Listen for partner's preferences via Firestore
  useEffect(() => {
    if (!tripMeta || !currentUser) return;
    const partnerUid = tripMeta.partnerIds.find(id => id !== currentUser.uid);
    if (!partnerUid) return;

    const unsub = listenDoc(
      `trips/${tripMeta.id}/preferences/${partnerUid}`,
      (data) => {
        if (data.categories) {
          setPartnerRatings(data.categories as Record<string, number>);
        }
      }
    );

    return unsub;
  }, [tripMeta, currentUser]);

  // Derived: show results when both have submitted
  const showResults = submitted && Object.keys(partnerRatings).length === CATEGORIES.length;

  const handleRate = (rating: number) => {
    const updated = { ...myRatings, [category.id]: rating };
    setMyRatings(updated);

    if (currentIdx < CATEGORIES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Submit to Firestore
      if (tripMeta && currentUser) {
        writeDoc(`trips/${tripMeta.id}/preferences/${currentUser.uid}`, {
          categories: updated,
          submittedAt: Date.now(),
        }).catch(e => console.warn('[preferences] submit failed:', e));
      }
      setSubmitted(true);
    }
  };

  if (showResults) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-lg mx-auto">
        <h2 className="font-serif text-2xl font-bold text-center mb-8">Your Match</h2>

        {CATEGORIES.map(cat => {
          const mine = myRatings[cat.id] || 0;
          const theirs = partnerRatings[cat.id] || 0;
          const diff = Math.abs(mine - theirs);
          const match = diff <= 1 ? 'perfect' : diff <= 2 ? 'close' : 'compromise';

          return (
            <div key={cat.id} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-2xl">{cat.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{cat.label}</span>
                  {match === 'perfect' && <span className="text-[9px] font-bold text-emerald-500 uppercase">Perfect Match</span>}
                  {match === 'compromise' && <span className="text-[9px] font-bold text-amber-500 uppercase">Compromise Zone</span>}
                </div>
                <div className="flex items-center gap-2">
                  <UserAvatar user={currentUser} size="sm" />
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-6 h-2 rounded-full ${n <= mine ? 'bg-[#194f4c]' : 'bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar user={partnerUser} size="sm" />
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-6 h-2 rounded-full ${n <= theirs ? 'bg-[#ac3d29]' : 'bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="font-serif text-2xl font-bold mb-2">Submitted!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Waiting for your partner to finish rating...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-6">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
        {currentIdx + 1} / {CATEGORIES.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={category.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center"
        >
          <span className="text-5xl block mb-4">{category.emoji}</span>
          <h3 className="font-serif text-xl font-bold mb-1">{category.label}</h3>
          <p className="text-xs text-slate-400 mb-6">{category.desc}</p>

          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">How important to you?</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => handleRate(n)}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-[#194f4c] hover:text-white text-slate-700 dark:text-white font-bold text-lg transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-300 dark:text-slate-500 mt-3">1 = skip it · 5 = must do</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PreferenceMatch;
