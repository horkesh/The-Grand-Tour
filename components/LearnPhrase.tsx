import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDayOfYear } from '../utils/dateUtils';
import { useStore } from '../store';
import { speakItalian, isSpeechSupported, cancelSpeech } from '../utils/speech';

interface Phrase {
  italian: string;
  english: string;
  pronunciation: string;
  category: string;
}

const PHRASES: Phrase[] = [
  // Greetings
  { italian: 'Buongiorno', english: 'Good morning', pronunciation: 'bwon-JOHR-noh', category: 'Greetings' },
  { italian: 'Buonasera', english: 'Good evening', pronunciation: 'bwoh-nah-SEH-rah', category: 'Greetings' },
  { italian: 'Buonanotte', english: 'Good night', pronunciation: 'bwoh-nah-NOHT-teh', category: 'Greetings' },
  { italian: 'Ciao', english: 'Hi / Bye (informal)', pronunciation: 'CHOW', category: 'Greetings' },
  { italian: 'Arrivederci', english: 'Goodbye', pronunciation: 'ah-ree-veh-DEHR-chee', category: 'Greetings' },
  { italian: 'Come stai?', english: 'How are you?', pronunciation: 'KOH-meh STAH-ee', category: 'Greetings' },
  { italian: 'Piacere di conoscerti', english: 'Nice to meet you', pronunciation: 'pyah-CHEH-reh dee koh-noh-SHEHR-tee', category: 'Greetings' },

  // Basics
  { italian: 'Sì', english: 'Yes', pronunciation: 'SEE', category: 'Basics' },
  { italian: 'No', english: 'No', pronunciation: 'NOH', category: 'Basics' },
  { italian: 'Grazie mille', english: 'Thank you very much', pronunciation: 'GRAH-tsee-eh MEEL-leh', category: 'Basics' },
  { italian: 'Prego', english: "You're welcome", pronunciation: 'PREH-goh', category: 'Basics' },
  { italian: 'Mi scusi', english: 'Excuse me (formal)', pronunciation: 'mee SKOO-zee', category: 'Basics' },
  { italian: 'Per favore', english: 'Please', pronunciation: 'pehr fah-VOH-reh', category: 'Basics' },
  { italian: 'Non capisco', english: "I don't understand", pronunciation: 'nohn kah-PEE-skoh', category: 'Basics' },
  { italian: 'Parla inglese?', english: 'Do you speak English?', pronunciation: 'PAR-lah een-GLEH-zeh', category: 'Basics' },
  { italian: 'Mi dispiace', english: "I'm sorry", pronunciation: 'mee dee-SPYAH-cheh', category: 'Basics' },

  // Essential
  { italian: "Dov'è il bagno?", english: 'Where is the bathroom?', pronunciation: 'doh-VEH eel BAH-nyoh', category: 'Essential' },
  { italian: 'Mi sono perso', english: "I'm lost", pronunciation: 'mee SOH-noh PEHR-soh', category: 'Essential' },
  { italian: 'Può aiutarmi?', english: 'Can you help me?', pronunciation: 'PWOH ah-yoo-TAR-mee', category: 'Essential' },
  { italian: 'Non parlo italiano', english: "I don't speak Italian", pronunciation: 'nohn PAR-loh ee-tah-LYAH-noh', category: 'Essential' },

  // Numbers
  { italian: 'Uno, due, tre', english: 'One, two, three', pronunciation: 'OO-noh, DOO-eh, TREH', category: 'Numbers' },
  { italian: 'Quattro, cinque, sei', english: 'Four, five, six', pronunciation: 'KWAHT-troh, CHEEN-kweh, SAY', category: 'Numbers' },
  { italian: 'Sette, otto, nove, dieci', english: 'Seven, eight, nine, ten', pronunciation: 'SEHT-teh, OHT-toh, NOH-veh, DYEH-chee', category: 'Numbers' },
  { italian: 'Due per favore', english: 'Two please', pronunciation: 'DOO-eh pehr fah-VOH-reh', category: 'Numbers' },

  // Time
  { italian: 'Che ora è?', english: 'What time is it?', pronunciation: 'keh OH-rah EH', category: 'Time' },
  { italian: 'A che ora?', english: 'At what time?', pronunciation: 'ah keh OH-rah', category: 'Time' },
  { italian: 'Stamattina', english: 'This morning', pronunciation: 'stah-maht-TEE-nah', category: 'Time' },
  { italian: 'Stasera', english: 'This evening', pronunciation: 'stah-SEH-rah', category: 'Time' },
  { italian: 'Domani', english: 'Tomorrow', pronunciation: 'doh-MAH-nee', category: 'Time' },

  // Directions
  { italian: "Dov'è...?", english: 'Where is...?', pronunciation: 'doh-VEH', category: 'Directions' },
  { italian: 'Sempre dritto', english: 'Straight ahead', pronunciation: 'SEHM-preh DREET-toh', category: 'Directions' },
  { italian: 'A sinistra / a destra', english: 'Left / right', pronunciation: 'ah see-NEE-strah / ah DEH-strah', category: 'Directions' },
  { italian: 'Vicino / lontano', english: 'Near / far', pronunciation: 'vee-CHEE-noh / lohn-TAH-noh', category: 'Directions' },
  { italian: "Quanto è lontano?", english: 'How far is it?', pronunciation: 'KWAHN-toh EH lohn-TAH-noh', category: 'Directions' },

  // Hotel
  { italian: 'Ho una prenotazione', english: 'I have a reservation', pronunciation: 'OH OO-nah preh-noh-tah-TSYOH-neh', category: 'Hotel' },
  { italian: 'A che ora è il check-out?', english: 'What time is check-out?', pronunciation: 'ah keh OH-rah EH eel chek-OWT', category: 'Hotel' },
  { italian: "C'è il Wi-Fi?", english: 'Is there Wi-Fi?', pronunciation: 'CHEH eel WEE-fee', category: 'Hotel' },
  { italian: 'La camera, per favore', english: 'The room, please', pronunciation: 'lah KAH-meh-rah pehr fah-VOH-reh', category: 'Hotel' },
  { italian: 'Una camera con vista', english: 'A room with a view', pronunciation: 'OO-nah KAH-meh-rah kohn VEE-stah', category: 'Hotel' },

  // Restaurant
  { italian: 'Vorrei un tavolo per due', english: "I'd like a table for two", pronunciation: 'vohr-RAY oon TAH-voh-loh pehr DOO-eh', category: 'Restaurant' },
  { italian: 'Il conto, per favore', english: 'The bill, please', pronunciation: 'eel KOHN-toh pehr fah-VOH-reh', category: 'Restaurant' },
  { italian: 'Che cosa mi consiglia?', english: 'What do you recommend?', pronunciation: 'keh KOH-zah mee kohn-SEE-lyah', category: 'Restaurant' },
  { italian: 'Acqua naturale o frizzante', english: 'Still or sparkling water', pronunciation: 'AH-kwah nah-too-RAH-leh oh freet-SAHN-teh', category: 'Restaurant' },
  { italian: 'Un caffè, per favore', english: 'A coffee, please', pronunciation: 'oon kahf-FEH pehr fah-VOH-reh', category: 'Restaurant' },
  { italian: 'Un bicchiere di vino rosso', english: 'A glass of red wine', pronunciation: 'oon beek-KYEH-reh dee VEE-noh ROHS-soh', category: 'Restaurant' },
  { italian: 'Era squisito!', english: 'It was delicious!', pronunciation: 'EH-rah skwee-ZEE-toh', category: 'Restaurant' },

  // Menu
  { italian: 'Sono allergico / allergica', english: "I'm allergic (m/f)", pronunciation: 'SOH-noh ahl-LEHR-jee-koh / ahl-LEHR-jee-kah', category: 'Menu' },
  { italian: 'Senza glutine', english: 'Gluten-free', pronunciation: 'SEHN-tsah GLOO-tee-neh', category: 'Menu' },
  { italian: 'Sono vegetariana / vegetariano', english: "I'm vegetarian (f/m)", pronunciation: 'SOH-noh veh-jeh-tah-RYAH-nah / veh-jeh-tah-RYAH-noh', category: 'Menu' },
  { italian: 'La pasta del giorno', english: 'The pasta of the day', pronunciation: 'lah PAH-stah dehl JOHR-noh', category: 'Menu' },
  { italian: 'Il dolce', english: 'Dessert', pronunciation: 'eel DOHL-cheh', category: 'Menu' },

  // Shopping
  { italian: 'Quanto costa?', english: 'How much does it cost?', pronunciation: 'KWAHN-toh KOH-stah', category: 'Shopping' },
  { italian: 'Posso pagare con carta?', english: 'Can I pay by card?', pronunciation: 'POHS-soh pah-GAH-reh kohn KAR-tah', category: 'Shopping' },
  { italian: 'Sto solo guardando', english: "I'm just looking", pronunciation: 'stoh SOH-loh gwar-DAHN-doh', category: 'Shopping' },
  { italian: 'È troppo caro', english: "It's too expensive", pronunciation: 'EH TROHP-poh KAH-roh', category: 'Shopping' },

  // Driving
  { italian: 'Dove si parcheggia?', english: 'Where can I park?', pronunciation: 'DOH-veh see par-KEH-jah', category: 'Driving' },
  { italian: 'Zona traffico limitato', english: 'Limited traffic zone (ZTL)', pronunciation: 'TSOH-nah TRAHF-fee-koh lee-mee-TAH-toh', category: 'Driving' },
  { italian: 'Il pieno, per favore', english: 'Fill it up, please', pronunciation: 'eel PYEH-noh pehr fah-VOH-reh', category: 'Driving' },

  // Emergency
  { italian: 'Aiuto!', english: 'Help!', pronunciation: 'ah-YOO-toh', category: 'Emergency' },
  { italian: 'Chiamate la polizia', english: 'Call the police', pronunciation: 'kyah-MAH-teh lah poh-lee-TSEE-ah', category: 'Emergency' },
  { italian: 'Mi sento male', english: "I don't feel well", pronunciation: 'mee SEHN-toh MAH-leh', category: 'Emergency' },
  { italian: 'Ho perso il passaporto', english: "I've lost my passport", pronunciation: 'OH PEHR-soh eel pahs-sah-POHR-toh', category: 'Emergency' },

  // Compliments
  { italian: 'Che bello!', english: 'How beautiful!', pronunciation: 'keh BEL-loh', category: 'Compliments' },
  { italian: 'Sei bellissima', english: "You're beautiful (to a woman)", pronunciation: 'SAY behl-LEES-see-mah', category: 'Compliments' },
  { italian: 'Sei bellissimo', english: "You're handsome (to a man)", pronunciation: 'SAY behl-LEES-see-moh', category: 'Compliments' },
  { italian: 'Stupendo!', english: 'Stunning!', pronunciation: 'stoo-PEHN-doh', category: 'Compliments' },

  // Expressions
  { italian: 'Cin cin!', english: 'Cheers!', pronunciation: 'chin chin', category: 'Expressions' },
  { italian: 'Andiamo!', english: "Let's go!", pronunciation: 'ahn-DYAH-moh', category: 'Expressions' },
  { italian: 'La dolce vita', english: 'The sweet life', pronunciation: 'lah DOHL-cheh VEE-tah', category: 'Expressions' },
  { italian: 'Magari!', english: 'I wish! / If only!', pronunciation: 'mah-GAH-ree', category: 'Expressions' },
  { italian: 'Allora...', english: 'So... / Well then...', pronunciation: 'ahl-LOH-rah', category: 'Expressions' },

  // Romance
  { italian: 'Ti amo', english: 'I love you', pronunciation: 'tee AH-moh', category: 'Romance' },
  { italian: 'Amore mio', english: 'My love', pronunciation: 'ah-MOH-reh MEE-oh', category: 'Romance' },
  { italian: 'Per sempre', english: 'Forever', pronunciation: 'pehr SEHM-preh', category: 'Romance' },
  { italian: 'Sei la mia vita', english: 'You are my life', pronunciation: 'SAY lah MEE-ah VEE-tah', category: 'Romance' },
  { italian: 'Mi manchi', english: 'I miss you', pronunciation: 'mee MAHN-kee', category: 'Romance' },

  // Anniversary
  { italian: 'Buon anniversario', english: 'Happy anniversary', pronunciation: 'bwon ahn-nee-vehr-SAH-ree-oh', category: 'Anniversary' },
  { italian: 'È il nostro anniversario', english: "It's our anniversary", pronunciation: 'EH eel NOH-stroh ahn-nee-vehr-SAH-ree-oh', category: 'Anniversary' },
  { italian: 'Venti anni di matrimonio', english: 'Twenty years of marriage', pronunciation: 'VEHN-tee AHN-nee dee mah-tree-MOH-nyoh', category: 'Anniversary' },
  { italian: 'Una bottiglia di prosecco', english: 'A bottle of prosecco', pronunciation: 'OO-nah boht-TEE-lyah dee proh-SEHK-koh', category: 'Anniversary' },
  { italian: 'Per festeggiare', english: 'To celebrate', pronunciation: 'pehr feh-stehj-JAH-reh', category: 'Anniversary' },
];

const CATEGORIES = Array.from(new Set(PHRASES.map((p) => p.category)));

const SpeakerIcon: React.FC<{ slow?: boolean }> = ({ slow }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
    {slow ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 12h3" />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14" />
      </>
    )}
  </svg>
);

const LearnPhrase: React.FC = () => {
  const learnedPhrases = useStore((s) => s.learnedPhrases);
  const toggleLearnedPhrase = useStore((s) => s.toggleLearnedPhrase);

  const [currentIndex, setCurrentIndex] = useState(() => getDayOfYear() % PHRASES.length);
  const [revealed, setRevealed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [speakingSlow, setSpeakingSlow] = useState(false);

  const speechSupported = isSpeechSupported();
  const phrase = PHRASES[currentIndex];
  const isLearned = learnedPhrases.includes(phrase.italian);

  const visiblePhrases = useMemo(
    () => (activeCategory ? PHRASES.filter((p) => p.category === activeCategory) : PHRASES),
    [activeCategory],
  );

  // Stop any in-flight speech if the user navigates away
  useEffect(() => () => cancelSpeech(), []);

  // Auto-play normal-speed audio when the card changes
  useEffect(() => {
    if (!speechSupported) return;
    const t = setTimeout(() => speakItalian(phrase.italian), 250);
    return () => clearTimeout(t);
  }, [currentIndex, phrase.italian, speechSupported]);

  const handleSpeak = (slow: boolean) => {
    setSpeakingSlow(slow);
    speakItalian(phrase.italian, { slow });
    setTimeout(() => setSpeakingSlow(false), 800);
  };

  const nextPhrase = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
  };

  const prevPhrase = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev - 1 + PHRASES.length) % PHRASES.length);
  };

  const jumpTo = (i: number) => {
    setCurrentIndex(i);
    setRevealed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {learnedPhrases.length}/{PHRASES.length} phrases learned
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
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {currentIndex + 1}/{PHRASES.length}
              </span>
            </div>

            {/* Italian (always visible) */}
            <div className="px-8 pt-8 pb-2 text-center">
              <p className="font-serif text-4xl font-bold text-slate-900 dark:text-white italic">
                &ldquo;{phrase.italian}&rdquo;
              </p>
              <p className="text-sm text-[#ac3d29] mt-3 font-medium">
                /{phrase.pronunciation}/
              </p>
            </div>

            {/* Audio buttons */}
            {speechSupported && (
              <div className="px-8 pb-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleSpeak(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#194f4c]/10 text-[#194f4c] dark:text-emerald-300 dark:bg-emerald-900/20 text-xs font-bold hover:bg-[#194f4c]/20 transition-colors"
                  aria-label="Hear pronunciation"
                >
                  <SpeakerIcon />
                  Hear it
                </button>
                <button
                  onClick={() => handleSpeak(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    speakingSlow
                      ? 'bg-[#ac3d29] text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  aria-label="Hear it slowly"
                >
                  <SpeakerIcon slow />
                  Slow
                </button>
              </div>
            )}

            {/* English (reveal) */}
            <div className="px-8 pt-2 pb-8 text-center min-h-[80px] flex items-center justify-center">
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
                aria-label="Previous phrase"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => toggleLearnedPhrase(phrase.italian)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  isLearned
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-emerald-50'
                }`}
              >
                {isLearned ? '✓ Learned' : 'Mark as learned'}
              </button>

              <button
                onClick={nextPhrase}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Next phrase"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Category filter */}
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Filter by category
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                activeCategory === null
                  ? 'bg-[#194f4c] text-white'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({PHRASES.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = PHRASES.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#194f4c] text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Phrase index */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {activeCategory ? activeCategory : 'All Phrases'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {visiblePhrases.map((p) => {
              const i = PHRASES.indexOf(p);
              const learned = learnedPhrases.includes(p.italian);
              return (
                <button
                  key={p.italian}
                  onClick={() => jumpTo(i)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    learned
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : currentIndex === i
                        ? 'bg-[#194f4c] text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {p.italian}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LearnPhrase;
