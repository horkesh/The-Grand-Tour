import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Phrase {
  italian: string;
  english: string;
  pronunciation: string;
  category: string;
}

const PHRASES: Phrase[] = [
  { italian: 'Buongiorno', english: 'Good morning', pronunciation: 'bwon-JOHR-noh', category: 'Greetings' },
  { italian: 'Buonasera', english: 'Good evening', pronunciation: 'bwoh-nah-SEH-rah', category: 'Greetings' },
  { italian: 'Grazie mille', english: 'Thank you very much', pronunciation: 'GRAH-tsee-eh MEEL-leh', category: 'Basics' },
  { italian: 'Prego', english: "You're welcome", pronunciation: 'PREH-goh', category: 'Basics' },
  { italian: 'Mi scusi', english: 'Excuse me', pronunciation: 'mee SKOO-zee', category: 'Basics' },
  { italian: 'Per favore', english: 'Please', pronunciation: 'pehr fah-VOH-reh', category: 'Basics' },
  { italian: 'Dov\'è il bagno?', english: 'Where is the bathroom?', pronunciation: 'doh-VEH eel BAH-nyoh', category: 'Essential' },
  { italian: 'Il conto, per favore', english: 'The bill, please', pronunciation: 'eel KOHN-toh pehr fah-VOH-reh', category: 'Restaurant' },
  { italian: 'Vorrei un tavolo per due', english: 'I\'d like a table for two', pronunciation: 'vohr-RAY oon TAH-voh-loh pehr DOO-eh', category: 'Restaurant' },
  { italian: 'Che cosa mi consiglia?', english: 'What do you recommend?', pronunciation: 'keh KOH-zah mee kohn-SEE-lyah', category: 'Restaurant' },
  { italian: 'Acqua naturale / frizzante', english: 'Still / sparkling water', pronunciation: 'AH-kwah nah-too-RAH-leh / freet-SAHN-teh', category: 'Restaurant' },
  { italian: 'Un caffè, per favore', english: 'A coffee, please', pronunciation: 'oon kahf-FEH pehr fah-VOH-reh', category: 'Restaurant' },
  { italian: 'Quanto costa?', english: 'How much does it cost?', pronunciation: 'KWAHN-toh KOH-stah', category: 'Shopping' },
  { italian: 'Posso pagare con carta?', english: 'Can I pay by card?', pronunciation: 'POHS-soh pah-GAH-reh kohn KAR-tah', category: 'Shopping' },
  { italian: 'Dove si parcheggia?', english: 'Where can I park?', pronunciation: 'DOH-veh see par-KEH-jah', category: 'Driving' },
  { italian: 'Zona traffico limitato', english: 'Limited traffic zone (ZTL)', pronunciation: 'TSOH-nah TRAHF-fee-koh lee-mee-TAH-toh', category: 'Driving' },
  { italian: 'Che bello!', english: 'How beautiful!', pronunciation: 'keh BEL-loh', category: 'Expressions' },
  { italian: 'Cin cin!', english: 'Cheers!', pronunciation: 'chin chin', category: 'Expressions' },
  { italian: 'Andiamo!', english: "Let's go!", pronunciation: 'ahn-dee-AH-moh', category: 'Expressions' },
  { italian: 'La dolce vita', english: 'The sweet life', pronunciation: 'lah DOL-cheh VEE-tah', category: 'Expressions' },
  { italian: 'Amore mio', english: 'My love', pronunciation: 'ah-MOH-reh MEE-oh', category: 'Romance' },
  { italian: 'Ti amo', english: 'I love you', pronunciation: 'tee AH-moh', category: 'Romance' },
  { italian: 'Per sempre', english: 'Forever', pronunciation: 'pehr SEHM-preh', category: 'Romance' },
  { italian: 'Buon anniversario', english: 'Happy anniversary', pronunciation: 'bwon ahn-nee-vehr-SAH-ree-oh', category: 'Romance' },
];

const LearnPhrase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());

  // Get today's phrase based on day-of-year for the daily rotation
  const dailyIndex = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5,
    );
    return dayOfYear % PHRASES.length;
  }, []);

  // Start with today's daily phrase
  useState(() => {
    setCurrentIndex(dailyIndex);
  });

  const phrase = PHRASES[currentIndex];

  const nextPhrase = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
  };

  const prevPhrase = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev - 1 + PHRASES.length) % PHRASES.length);
  };

  const markLearned = () => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const categories = [...new Set(PHRASES.map((p) => p.category))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Impara l&apos;Italiano
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#194f4c] dark:text-white mb-2">
            Learn a Phrase
          </h2>
          <p className="text-sm text-slate-400">
            {learned.size}/{PHRASES.length} phrases learned
          </p>
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            {/* Category tag */}
            <div className="px-6 pt-6 flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#194f4c] bg-[#194f4c]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                {phrase.category}
              </span>
              <span className="text-[10px] text-slate-400">
                {currentIndex + 1}/{PHRASES.length}
              </span>
            </div>

            {/* Italian (always visible) */}
            <div className="px-8 pt-8 pb-4 text-center">
              <p className="font-serif text-4xl font-bold text-slate-900 dark:text-white italic">
                &ldquo;{phrase.italian}&rdquo;
              </p>
              <p className="text-sm text-[#ac3d29] mt-3 font-medium">
                /{phrase.pronunciation}/
              </p>
            </div>

            {/* English (reveal) */}
            <div className="px-8 pb-8 text-center min-h-[80px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {revealed ? (
                  <motion.p
                    key="english"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-lg text-slate-600 dark:text-slate-300"
                  >
                    {phrase.english}
                  </motion.p>
                ) : (
                  <motion.button
                    key="reveal-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setRevealed(true)}
                    className="px-6 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Tap to reveal translation
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 dark:border-white/5 px-6 py-4 flex items-center justify-between">
              <button
                onClick={prevPhrase}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={markLearned}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  learned.has(currentIndex)
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-emerald-50'
                }`}
              >
                {learned.has(currentIndex) ? '✓ Learned' : 'Mark as learned'}
              </button>

              <button
                onClick={nextPhrase}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Category index */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            All Phrases
          </h3>
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-bold text-[#194f4c] dark:text-emerald-400 mb-2">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {PHRASES.map((p, i) =>
                  p.category === cat ? (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentIndex(i);
                        setRevealed(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                        learned.has(i)
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : currentIndex === i
                            ? 'bg-[#194f4c] text-white'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {p.italian}
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LearnPhrase;
