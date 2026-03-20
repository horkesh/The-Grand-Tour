import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { writeDoc } from '../services/firestoreSync';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const PRESET_COLORS = [
  { name: 'coral',   hex: '#f87171' },
  { name: 'sky',     hex: '#38bdf8' },
  { name: 'violet',  hex: '#a78bfa' },
  { name: 'amber',   hex: '#fbbf24' },
  { name: 'emerald', hex: '#34d399' },
  { name: 'rose',    hex: '#fb7185' },
];

const genUid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

export default function FamilyJoin() {
  const navigate = useNavigate();

  const [code,     setCode]     = useState('');
  const [nickname, setNickname] = useState('');
  const [color,    setColor]    = useState(PRESET_COLORS[0].hex);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) { setError('Please enter a nickname.'); return; }
    if (code.trim().length < 4) { setError('Enter the join code shared by the travellers.'); return; }

    setLoading(true);
    try {
      // Query Firestore for a trip matching this join code
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('joinCode', '==', code.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Invalid join code. Check with the trip organiser.');
        setLoading(false);
        return;
      }
      const tripId = snap.docs[0].id;

      const familyUid = genUid();
      await writeDoc(`trips/${tripId}/family/${familyUid}`, {
        nickname: nickname.trim(),
        color,
        joinedAt: Date.now(),
      });
      localStorage.setItem('bb_family_uid',  familyUid);
      localStorage.setItem('bb_family_name', nickname.trim());
      localStorage.setItem('bb_family_color', color);
      localStorage.setItem('bb_family_tripId', tripId);
      navigate('/family');
    } catch (err) {
      setError('Could not join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4] dark:bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#194f4c] px-6 py-8 text-center">
          <p className="text-3xl mb-2">🇮🇹</p>
          <h1 className="text-white font-serif text-2xl font-bold">The Grand Tour</h1>
          <p className="text-teal-200 text-sm mt-1">Join as a family guest</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {/* Join code */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Join Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. BW6B5R"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-[#f9f7f4] dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         font-mono text-lg tracking-widest text-center
                         focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Your Nickname
            </label>
            <input
              type="text"
              maxLength={20}
              placeholder="e.g. Auntie Sara"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-[#f9f7f4] dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Pick Your Color
            </label>
            <div className="flex gap-3 justify-center">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className="w-8 h-8 rounded-full transition-transform focus:outline-none"
                  style={{
                    backgroundColor: c.hex,
                    transform: color === c.hex ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: color === c.hex ? `0 0 0 3px white, 0 0 0 5px ${c.hex}` : 'none',
                  }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#ac3d29] dark:text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl bg-[#194f4c] text-white font-semibold text-base
                       hover:bg-[#133b39] transition-colors disabled:opacity-50"
          >
            {loading ? 'Joining…' : 'Join the Trip'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
