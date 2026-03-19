import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ITALIAN_CITIES } from '../constants';

// 30 tiles of pre-trip reveals (unlocking daily from April 3 to May 2)
const REVEAL_TILES = [
  { type: 'photo', city: 'Fiumicino', content: 'Your first Italian sunset awaits at the fishing harbour.', image: ITALIAN_CITIES[0].image },
  { type: 'phrase', city: 'Italy', content: '"Buongiorno!" — Good morning!', detail: 'bwon-JOHR-noh' },
  { type: 'fact', city: 'Orvieto', content: 'Orvieto\'s cathedral took 300 years to complete.', detail: 'Construction began in 1290' },
  { type: 'restaurant', city: 'Bagnoregio', content: 'Alma Civita — a restaurant inside a cave dwelling in the dying city.' },
  { type: 'photo', city: 'Val d\'Orcia', content: 'Rolling cypress-lined hills straight from a Renaissance painting.', image: ITALIAN_CITIES[2].image },
  { type: 'phrase', city: 'Italy', content: '"Grazie mille!" — Thank you very much!', detail: 'GRAH-tsee-eh MEEL-leh' },
  { type: 'fact', city: 'San Gimignano', content: 'San Gimignano had 72 towers in the Middle Ages. Only 14 survive.' },
  { type: 'restaurant', city: 'Montalcino', content: 'Fattoria Poggio Alloro — a working Tuscan farm with panoramic lunch.' },
  { type: 'photo', city: 'Pienza', content: 'Pienza: the "ideal city" redesigned by Pope Pius II.', image: ITALIAN_CITIES[3].image },
  { type: 'phrase', city: 'Italy', content: '"Amore mio" — My love', detail: 'ah-MOH-reh MEE-oh' },
  { type: 'fact', city: 'Bagno Vignoni', content: 'Bagno Vignoni\'s main square is a pool of thermal water, not a piazza.' },
  { type: 'restaurant', city: 'Pienza', content: 'Podere Il Casale — organic pecorino cheese farm with tastings.' },
  { type: 'photo', city: 'Saturnia', content: 'Turquoise thermal cascades under the Tuscan stars.', image: ITALIAN_CITIES[4].image },
  { type: 'phrase', city: 'Italy', content: '"Cin cin!" — Cheers!', detail: 'chin chin' },
  { type: 'fact', city: 'Saturnia', content: 'Saturnia\'s hot springs are said to be where Saturn\'s thunderbolt struck the earth.' },
  { type: 'restaurant', city: 'Monticchiello', content: 'Osteria La Porta — your anniversary dinner with a view of Val d\'Orcia.' },
  { type: 'photo', city: 'Spello', content: 'Medieval streets carpeted in spring flowers.', image: ITALIAN_CITIES[5].image },
  { type: 'phrase', city: 'Italy', content: '"Andiamo!" — Let\'s go!', detail: 'ahn-dee-AH-moh' },
  { type: 'fact', city: 'Pitigliano', content: 'Pitigliano is called "Little Jerusalem" for its historic Jewish community.' },
  { type: 'restaurant', city: 'Spello', content: 'Osteria del Buchetto — hearty Umbrian cuisine in a 14th-century cellar.' },
  { type: 'photo', city: 'Via Appia', content: '2,300-year-old basalt stones, still walked today.', image: ITALIAN_CITIES[6].image },
  { type: 'phrase', city: 'Italy', content: '"Che bella giornata!" — What a beautiful day!', detail: 'keh BEL-lah jor-NAH-tah' },
  { type: 'fact', city: 'Spoleto', content: 'The Ponte delle Torri in Spoleto is a 230m aqueduct bridge from the 13th century.' },
  { type: 'restaurant', city: 'Ostia', content: 'Paja & Fieno — fresh handmade pasta near the ancient ruins.' },
  { type: 'photo', city: 'Ostia', content: 'Ancient mosaics and the smell of Mediterranean salt.', image: ITALIAN_CITIES[7].image },
  { type: 'phrase', city: 'Italy', content: '"Ti amo" — I love you', detail: 'tee AH-moh' },
  { type: 'fact', city: 'Italy', content: 'Italy has over 1,500 lakes, including volcanic ones like Lake Bolsena.' },
  { type: 'fact', city: 'Radicofani', content: 'Radicofani\'s fortress sits at 896m and has views across three regions.' },
  { type: 'phrase', city: 'Italy', content: '"La dolce vita" — The sweet life', detail: 'lah DOL-cheh VEE-tah' },
  { type: 'fact', city: 'Italy', content: 'In 8 days you\'ll drive through Lazio, Tuscany, and Umbria — three of Italy\'s 20 regions.' },
];

const TYPE_ICONS: Record<string, string> = {
  photo: '📷',
  phrase: '🗣️',
  fact: '💡',
  restaurant: '🍽️',
};

const TYPE_COLORS: Record<string, string> = {
  photo: 'from-emerald-500 to-teal-600',
  phrase: 'from-amber-500 to-orange-600',
  fact: 'from-blue-500 to-indigo-600',
  restaurant: 'from-rose-500 to-red-600',
};

const DailyReveal: React.FC = () => {
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  // Calculate which tiles are unlocked based on days before May 2
  const unlockedCount = useMemo(() => {
    const tripStart = new Date('2026-05-02T00:00:00');
    const now = new Date();
    const daysBeforeTrip = Math.ceil((tripStart.getTime() - now.getTime()) / 864e5);
    // Tiles unlock from 30 days before (April 2) through May 2
    const unlocked = 30 - daysBeforeTrip;
    return Math.max(0, Math.min(30, unlocked));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Pre-Trip Countdown
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold text-[#194f4c] dark:text-white mb-2">
            Daily Reveals
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {unlockedCount}/30 tiles unlocked · A new tile each day before departure
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
          {REVEAL_TILES.map((tile, i) => {
            const isUnlocked = i < unlockedCount;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => isUnlocked && setSelectedTile(i)}
                className={`aspect-square rounded-2xl relative overflow-hidden transition-all ${
                  isUnlocked
                    ? 'cursor-pointer hover:scale-105 shadow-lg'
                    : 'cursor-not-allowed opacity-40'
                }`}
              >
                {isUnlocked ? (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${TYPE_COLORS[tile.type]} flex flex-col items-center justify-center gap-1 p-2`}
                  >
                    <span className="text-2xl">{TYPE_ICONS[tile.type]}</span>
                    <span className="text-white text-[7px] font-bold uppercase tracking-wider truncate w-full text-center">
                      {tile.city}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                    <span className="text-slate-300 dark:text-white/20 text-2xl">?</span>
                  </div>
                )}
                <div className="absolute top-1 left-1 text-[8px] font-bold text-white/60 bg-black/20 rounded px-1">
                  {i + 1}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedTile !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setSelectedTile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {REVEAL_TILES[selectedTile].image && (
                <img
                  src={REVEAL_TILES[selectedTile].image}
                  alt={REVEAL_TILES[selectedTile].city}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-3xl">{TYPE_ICONS[REVEAL_TILES[selectedTile].type]}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Day {selectedTile + 1} · {REVEAL_TILES[selectedTile].type}
                  </span>
                </div>
                <p className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {REVEAL_TILES[selectedTile].content}
                </p>
                {REVEAL_TILES[selectedTile].detail && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                    {REVEAL_TILES[selectedTile].detail}
                  </p>
                )}
                <p className="text-xs text-[#194f4c] font-bold mt-4">
                  {REVEAL_TILES[selectedTile].city}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyReveal;
