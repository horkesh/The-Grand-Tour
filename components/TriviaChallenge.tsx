import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';
import { getDayOfYear } from '../utils/dateUtils';

const TRIVIA = [
  { q: "Which Italian city is built on 118 small islands?", options: ["Venice", "Naples", "Genoa", "Bari"], answer: 0 },
  { q: "What is the traditional Italian afternoon break called?", options: ["Siesta", "Riposo", "Pausa", "Dolce"], answer: 1 },
  { q: "Which region is Chianti wine from?", options: ["Piedmont", "Tuscany", "Umbria", "Lazio"], answer: 1 },
  { q: "What does 'al dente' literally mean?", options: ["To the fork", "To the tooth", "To the plate", "To the taste"], answer: 1 },
  { q: "The Amalfi Coast is in which Italian region?", options: ["Calabria", "Sicily", "Campania", "Sardinia"], answer: 2 },
  { q: "What year was the Colosseum completed?", options: ["80 AD", "120 AD", "55 AD", "200 AD"], answer: 0 },
  { q: "Which city is famous for its thermal baths since Roman times?", options: ["Orvieto", "Saturnia", "Assisi", "Perugia"], answer: 1 },
  { q: "What is a ZTL in Italian driving?", options: ["Speed camera zone", "Restricted traffic zone", "Toll road", "Parking area"], answer: 1 },
  { q: "The leaning tower is in which Tuscan city?", options: ["Siena", "Florence", "Pisa", "Lucca"], answer: 2 },
  { q: "What is bruschetta traditionally topped with?", options: ["Mozzarella", "Tomato & basil", "Prosciutto", "Mushrooms"], answer: 1 },
  { q: "Civita di Bagnoregio is known as what?", options: ["The Eternal City", "The Dying City", "The Hidden City", "The Dream City"], answer: 1 },
  { q: "Which wine is Montalcino famous for?", options: ["Barolo", "Prosecco", "Brunello", "Amarone"], answer: 2 },
  { q: "What does 'dolce vita' mean?", options: ["Sweet life", "Good day", "Beautiful view", "Happy heart"], answer: 0 },
  { q: "Pienza is called the 'Ideal City of' which era?", options: ["Medieval", "Renaissance", "Baroque", "Roman"], answer: 1 },
  { q: "What is the Italian word for 'cheers'?", options: ["Grazie", "Prego", "Salute", "Ciao"], answer: 2 },
  { q: "Which road was ancient Rome's first highway?", options: ["Via Veneto", "Via Appia", "Via Roma", "Via Aurelia"], answer: 1 },
  { q: "Spello is famous for its annual festival of what?", options: ["Music", "Wine", "Flowers", "Film"], answer: 2 },
  { q: "What is a trattoria?", options: ["Bakery", "Casual restaurant", "Wine bar", "Deli"], answer: 1 },
  { q: "Ostia Antica was Rome's ancient what?", options: ["Military camp", "Port city", "Temple complex", "Villa district"], answer: 1 },
  { q: "How many regions does Italy have?", options: ["15", "18", "20", "25"], answer: 2 },
  { q: "The Val d'Orcia is a UNESCO site in which region?", options: ["Umbria", "Lazio", "Tuscany", "Marche"], answer: 2 },
  { q: "What color is traditional limoncello?", options: ["Red", "Clear", "Yellow", "Green"], answer: 2 },
  { q: "San Gimignano is famous for its medieval what?", options: ["Bridges", "Towers", "Fountains", "Walls"], answer: 1 },
  { q: "Which lake borders Bolsena?", options: ["Lake Como", "Lake Garda", "Lake Bolsena", "Lake Trasimeno"], answer: 2 },
  { q: "What is an aperitivo?", options: ["Dessert", "Pre-dinner drink", "Breakfast", "Side dish"], answer: 1 },
  { q: "What anniversary are you celebrating in Italy?", options: ["10th", "15th", "20th", "25th"], answer: 2 },
  { q: "How many days is The Grand Tour?", options: ["5", "7", "8", "10"], answer: 2 },
  { q: "What is your anniversary day destination?", options: ["Rome", "Orvieto", "Saturnia", "Spello"], answer: 2 },
  { q: "Which sea is Ostia on?", options: ["Adriatic", "Tyrrhenian", "Ionian", "Ligurian"], answer: 1 },
  { q: "How do you say 'I love you' in Italian?", options: ["Ti amo", "Ti voglio", "Mi piaci", "Sei bella"], answer: 0 },
];

const TriviaChallenge: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const todayIdx = getDayOfYear() % TRIVIA.length;
  const today = TRIVIA[todayIdx];
  const dayKey = `day-${getDayOfYear()}`;

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenDoc(`trips/${tripMeta.id}/trivia/scores`, (data) => {
      if (data) setScores(data as Record<string, Record<string, number>>);
    });
    return unsub;
  }, [tripMeta]);

  const todayScore = scores[dayKey];
  const alreadyAnswered = todayScore?.[myUid] !== undefined;
  const partnerAnswered = todayScore?.[partnerUid] !== undefined;

  const handleAnswer = async (idx: number) => {
    if (alreadyAnswered || !tripMeta || !currentUser) return;
    setSelectedAnswer(idx);
    setRevealed(true);
    const correct = idx === today.answer ? 1 : 0;
    try {
      await writeDoc(`trips/${tripMeta.id}/trivia/scores`, {
        [dayKey]: { ...todayScore, [currentUser.uid]: correct },
      });
    } catch (e) {
      console.warn('[trivia] answer failed:', e);
    }
  };

  // All-time scores
  const myTotal = Object.values(scores).reduce((sum, day) => sum + (day[myUid] || 0), 0);
  const partnerTotal = Object.values(scores).reduce((sum, day) => sum + (day[partnerUid] || 0), 0);
  const totalDays = Object.keys(scores).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Daily Trivia</h1>
      <p className="text-xs text-slate-400 text-center mb-6">Who knows Italy better?</p>

      {/* Scoreboard */}
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <UserAvatar user={currentUser} size="md" />
            <p className="text-2xl font-serif font-bold mt-2">{myTotal}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">points</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{totalDays} rounds</p>
            <p className="font-serif text-lg font-bold text-slate-300">vs</p>
          </div>
          <div className="text-center flex-1">
            <UserAvatar user={partnerUser} size="md" />
            <p className="text-2xl font-serif font-bold mt-2">{partnerTotal}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">points</p>
          </div>
        </div>
      </div>

      {/* Today's question */}
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-8">
        <p className="text-[10px] uppercase tracking-widest text-[#ac3d29] font-bold mb-3">Today's Question</p>
        <h2 className="font-serif text-lg font-bold mb-6">{today.q}</h2>

        <div className="space-y-3">
          {today.options.map((opt, idx) => {
            const isCorrect = idx === today.answer;
            const isSelected = selectedAnswer === idx;
            let btnClass = 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10';

            if (revealed || alreadyAnswered) {
              if (isCorrect) btnClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-400';
              else if (isSelected && !isCorrect) btnClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
              else btnClass = 'bg-slate-50 dark:bg-white/5 text-slate-400';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={alreadyAnswered || revealed}
                className={`w-full p-4 rounded-2xl font-bold text-sm text-left transition-colors ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {(revealed || alreadyAnswered) && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <UserAvatar user={currentUser} size="sm" />
                <span className={`text-xs font-bold ${todayScore?.[myUid] ? 'text-emerald-500' : 'text-red-400'}`}>
                  {todayScore?.[myUid] ? 'Correct!' : 'Wrong'}
                </span>
              </div>
              {partnerAnswered ? (
                <div className="flex items-center gap-1.5">
                  <UserAvatar user={partnerUser} size="sm" />
                  <span className={`text-xs font-bold ${todayScore?.[partnerUid] ? 'text-emerald-500' : 'text-red-400'}`}>
                    {todayScore?.[partnerUid] ? 'Correct!' : 'Wrong'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Partner hasn't answered yet</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TriviaChallenge;
