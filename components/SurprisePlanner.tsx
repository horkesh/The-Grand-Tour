import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenCollection } from '../services/firestoreSync';
import { ITALIAN_CITIES } from '../constants';

interface Surprise {
  id: string;
  createdBy: string;
  forDay: string;   // cityId
  title: string;
  note: string;
  revealOnDay: boolean;  // auto-reveal when that day arrives
  revealed: boolean;
}

const SurprisePlanner: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [forDay, setForDay] = useState('day-1');

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenCollection(`trips/${tripMeta.id}/surprises`, (docs) => {
      setSurprises(docs.map(d => ({ ...d.data, id: d.id } as Surprise)));
    });
    return unsub;
  }, [tripMeta]);

  const handleSave = async () => {
    if (!title.trim() || !currentUser || !tripMeta) return;
    const id = crypto.randomUUID();
    try {
      await writeDoc(`trips/${tripMeta.id}/surprises/${id}`, {
        id,
        createdBy: currentUser.uid,
        forDay,
        title: title.trim(),
        note: note.trim(),
        revealOnDay: true,
        revealed: false,
      });
      setTitle('');
      setNote('');
      setShowForm(false);
    } catch (e) {
      console.warn('[surprises] save failed:', e);
    }
  };

  const mySurprises = surprises.filter(s => s.createdBy === currentUser?.uid);
  const forMeSurprises = surprises.filter(s => s.createdBy !== currentUser?.uid);

  // Revealed surprises: partner's surprises that have been revealed
  const revealedForMe = forMeSurprises.filter(s => s.revealed);
  // Hidden: show count only ("Your partner has X surprises planned!")
  const hiddenForMe = forMeSurprises.filter(s => !s.revealed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Surprises</h1>
      <p className="text-xs text-slate-400 text-center mb-8">Plan secret moments for your partner</p>

      {/* Teaser: hidden surprises for me */}
      {hiddenForMe.length > 0 && (
        <div className="bg-gradient-to-br from-[#ac3d29]/10 to-[#ac3d29]/5 rounded-[2rem] p-6 mb-8 text-center max-w-lg mx-auto">
          <span className="text-4xl block mb-3">🎁</span>
          <p className="font-serif text-lg font-bold">
            {hiddenForMe.length} surprise{hiddenForMe.length > 1 ? 's' : ''} waiting for you!
          </p>
          <p className="text-xs text-slate-400 mt-1">They'll be revealed at just the right moment</p>
        </div>
      )}

      {/* Revealed surprises */}
      {revealedForMe.length > 0 && (
        <div className="max-w-lg mx-auto mb-8">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Revealed</h3>
          {revealedForMe.map(s => {
            const city = ITALIAN_CITIES.find(c => c.id === s.forDay);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎁</span>
                  <h4 className="font-bold text-sm">{s.title}</h4>
                  <span className="text-[9px] text-slate-400 ml-auto">{city?.location}</span>
                </div>
                {s.note && <p className="text-sm text-slate-600 dark:text-slate-400">{s.note}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My planned surprises (visible only to me) */}
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">My Planned Surprises</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] font-bold text-[#194f4c] uppercase tracking-wider"
          >
            {showForm ? 'Cancel' : '+ New'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-4 overflow-hidden"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Surprise title..."
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm outline-none mb-3"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Details (only you can see this until revealed)..."
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm resize-none h-20 outline-none mb-3"
              />
              <select
                value={forDay}
                onChange={(e) => setForDay(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm outline-none mb-4"
              >
                {ITALIAN_CITIES.map((city, i) => (
                  <option key={city.id} value={city.id}>Day {i + 1}: {city.location}</option>
                ))}
              </select>
              <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50">
                Save Surprise
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {mySurprises.map(s => {
          const city = ITALIAN_CITIES.find(c => c.id === s.forDay);
          return (
            <div key={s.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{s.title}</h4>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  s.revealed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {s.revealed ? 'Revealed' : 'Hidden'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{city?.location} · Day {ITALIAN_CITIES.indexOf(city!) + 1}</p>
              {!s.revealed && (
                <button
                  onClick={() => tripMeta && writeDoc(`trips/${tripMeta.id}/surprises/${s.id}`, { revealed: true }).catch(() => {})}
                  className="mt-3 text-xs font-bold text-[#ac3d29]"
                >
                  Reveal Now
                </button>
              )}
            </div>
          );
        })}

        {mySurprises.length === 0 && !showForm && (
          <p className="text-center text-slate-400 text-sm py-8">No surprises planned yet. Tap + New to start!</p>
        )}
      </div>
    </motion.div>
  );
};

export default SurprisePlanner;
