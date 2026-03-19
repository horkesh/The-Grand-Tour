import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';
import FlipCard from './FlipCard';

const PROMPTS = [
  { id: 'p1', text: "What's the one thing you're most excited about?", day: -30 },
  { id: 'p2', text: "Describe your perfect Italian morning.", day: -29 },
  { id: 'p3', text: "One restaurant dish you MUST try?", day: -28 },
  { id: 'p4', text: "What will you miss most about home?", day: -27 },
  { id: 'p5', text: "Your dream photo from this trip looks like...", day: -26 },
  { id: 'p6', text: "One word that captures what Italy means to you.", day: -25 },
  { id: 'p7', text: "What's the bravest thing you want to do on this trip?", day: -24 },
  { id: 'p8', text: "A surprise you'd love to experience.", day: -23 },
  { id: 'p9', text: "Which day are you most looking forward to?", day: -22 },
  { id: 'p10', text: "What should our trip motto be?", day: -21 },
  { id: 'p11', text: "One thing about our relationship this trip should celebrate.", day: -20 },
  { id: 'p12', text: "If we could only visit ONE place, which?", day: -19 },
  { id: 'p13', text: "A song that should be our Italy soundtrack.", day: -18 },
  { id: 'p14', text: "What's your gelato flavor strategy?", day: -17 },
  { id: 'p15', text: "The cheesiest romantic thing you want to do.", day: -16 },
  { id: 'p16', text: "One Italian phrase you want to master.", day: -15 },
  { id: 'p17', text: "What does '20 years together' feel like?", day: -14 },
  { id: 'p18', text: "A gift you'd love to bring home.", day: -13 },
  { id: 'p19', text: "Your ideal pace: go-go-go or slow-and-savour?", day: -12 },
  { id: 'p20', text: "One memory from the last 20 years this trip reminds you of.", day: -11 },
  { id: 'p21', text: "What's the one photo you WILL take on anniversary day?", day: -10 },
  { id: 'p22', text: "Driving through Tuscany — windows down or AC on?", day: -9 },
  { id: 'p23', text: "A toast you'll make on our anniversary dinner.", day: -8 },
  { id: 'p24', text: "The thing about traveling with me that drives you crazy (lovingly).", day: -7 },
  { id: 'p25', text: "One thing you hope we talk about during this trip.", day: -6 },
  { id: 'p26', text: "Your packing confession: what unnecessary thing are you bringing?", day: -5 },
  { id: 'p27', text: "A promise you want to make for the next 20 years.", day: -4 },
  { id: 'p28', text: "The meal you're already fantasizing about.", day: -3 },
  { id: 'p29', text: "How will we know the trip was perfect?", day: -2 },
  { id: 'p30', text: "Last words before takeoff?", day: -1 },
];

const ConversationStarters: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({});
  const [myAnswer, setMyAnswer] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Calculate which prompts are unlocked based on days until May 2
  const tripDate = new Date(2026, 4, 2); // May 2, 2026
  const now = new Date();
  const daysUntil = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const unlockedPrompts = PROMPTS.filter(p => Math.abs(p.day) <= daysUntil);

  // Today's prompt
  const todayPrompt = unlockedPrompts[unlockedPrompts.length - 1];

  // Listen for responses from Firestore
  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenDoc(`trips/${tripMeta.id}/prompts/responses`, (data) => {
      if (data) setResponses(data as Record<string, Record<string, string>>);
    });
    return unsub;
  }, [tripMeta]);

  const handleSubmit = async () => {
    if (!myAnswer.trim() || !currentUser || !tripMeta || !todayPrompt) return;
    try {
      await writeDoc(`trips/${tripMeta.id}/prompts/responses`, {
        [`${todayPrompt.id}.${currentUser.uid}`]: myAnswer.trim(),
      });
      setMyAnswer('');
    } catch (e) {
      console.warn('[prompts] submit failed:', e);
    }
  };

  const handleReveal = (promptId: string) => {
    setRevealed(prev => new Set([...prev, promptId]));
  };

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Daily Prompts</h1>
      <p className="text-xs text-slate-400 text-center mb-8">Answer independently, then reveal together</p>

      {/* Today's prompt (featured) */}
      {todayPrompt && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-8 mb-8 max-w-lg mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-[#ac3d29] font-bold mb-3">Today's Prompt</p>
          <h2 className="font-serif text-xl font-bold mb-6">{todayPrompt.text}</h2>

          {!responses[todayPrompt.id]?.[myUid] ? (
            <div>
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-200 dark:border-white/10 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-[#194f4c] mb-3"
              />
              <button
                onClick={handleSubmit}
                disabled={!myAnswer.trim()}
                className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserAvatar user={currentUser} size="md" />
                <div className="flex-1 p-3 bg-[#194f4c]/10 dark:bg-[#194f4c]/20 rounded-2xl">
                  <p className="text-sm">{responses[todayPrompt.id][myUid]}</p>
                </div>
              </div>

              {responses[todayPrompt.id]?.[partnerUid] ? (
                <FlipCard
                  flipped={revealed.has(todayPrompt.id)}
                  className="w-full h-16"
                  onClick={() => !revealed.has(todayPrompt.id) && handleReveal(todayPrompt.id)}
                  front={
                    <button
                      className="w-full h-full py-3 bg-[#ac3d29] text-white rounded-xl font-bold text-sm"
                    >
                      Reveal Partner's Answer
                    </button>
                  }
                  back={
                    <div className="flex items-start gap-3 h-full">
                      <UserAvatar user={partnerUser} size="md" />
                      <div className="flex-1 p-3 bg-[#ac3d29]/10 dark:bg-[#ac3d29]/20 rounded-2xl">
                        <p className="text-sm">{responses[todayPrompt.id][partnerUid]}</p>
                      </div>
                    </div>
                  }
                />
              ) : (
                <p className="text-xs text-slate-400 text-center italic">Waiting for your partner to answer...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past prompts (scrollable history) */}
      <div className="max-w-lg mx-auto space-y-4">
        {unlockedPrompts.slice(0, -1).reverse().map(prompt => (
          <div key={prompt.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400 mb-2 font-bold">Day {prompt.day}</p>
            <p className="font-serif text-sm font-bold mb-3">{prompt.text}</p>
            {responses[prompt.id]?.[myUid] && responses[prompt.id]?.[partnerUid] && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><UserAvatar user={currentUser} size="sm" /> Answered</span>
                <span className="flex items-center gap-1"><UserAvatar user={partnerUser} size="sm" /> Answered</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConversationStarters;
