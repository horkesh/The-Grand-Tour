import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { listenCollection } from '../services/firestoreSync';

const CHALLENGES: { id: string; title: string; emoji: string }[] = [
  { id: 'ch1',  title: 'The Kiss',           emoji: '\u{1F48B}' },
  { id: 'ch2',  title: 'Gelato Face',         emoji: '\u{1F366}' },
  { id: 'ch3',  title: 'Golden Hour',         emoji: '\u{1F305}' },
  { id: 'ch4',  title: 'La Vespa',            emoji: '\u{1F6F5}' },
  { id: 'ch5',  title: 'Mirror Mirror',       emoji: '\u{1FA9E}' },
  { id: 'ch6',  title: 'Local Friend',        emoji: '\u{1F91D}' },
  { id: 'ch7',  title: 'The Toast',           emoji: '\u{1F942}' },
  { id: 'ch8',  title: 'Lost & Found',        emoji: '\u{1F5FA}️' },
  { id: 'ch9',  title: 'Door Envy',           emoji: '\u{1F6AA}' },
  { id: 'ch10', title: 'Market Haul',         emoji: '\u{1F9FA}' },
  { id: 'ch11', title: 'The View',            emoji: '⛰️' },
  { id: 'ch12', title: 'Nonna Approved',      emoji: '\u{1F475}' },
  { id: 'ch13', title: 'Street Art',          emoji: '\u{1F3A8}' },
  { id: 'ch14', title: 'Us × 20',        emoji: '\u{1F4F7}' },
  { id: 'ch15', title: 'Tiny Street',         emoji: '\u{1F3D8}️' },
  { id: 'ch16', title: 'Anniversary Selfie',  emoji: '❤️' },
];

type Vote = 'me' | 'partner' | 'tie';

const VOTES_KEY = 'gt_judges_verdict_votes_v1';
const loadVotes = (): Record<string, Vote> => {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); } catch { return {}; }
};
const saveVotes = (v: Record<string, Vote>) => {
  try { localStorage.setItem(VOTES_KEY, JSON.stringify(v)); } catch { /* ignore */ }
};

// The rigging. Whichever player's first name matches "Maja" (case-insensitive)
// gets a stack of comically biased modifiers. Falls back to partnerUser if
// Maja isn't in the trip — keeps the joke working for testing accounts.
const RIGGED_BONUSES: { label: string; points: number }[] = [
  { label: 'Charm Bonus',           points: 12 },
  { label: 'Composition Mastery',   points: 8 },
  { label: 'Romance Multiplier',    points: 10 },
  { label: 'Anniversary Eye',       points: 7 },
  { label: 'Aesthetic Conviction',  points: 6 },
  { label: 'Sunlight Cooperation',  points: 5 },
];

const JUDGE_NOTES: string[] = [
  'A masterclass in restraint.',
  'Light, geometry, soul. Submitted with quiet confidence.',
  'The crop alone deserves an award.',
  'You can hear the photo. Remarkable.',
  'A study in golden-hour patience.',
  'There is a poem hiding in this frame.',
  'The judges nodded in unison.',
  'This is the kind of work that wins twenty-year anniversaries.',
];

const PIQUED_NOTES: string[] = [
  'Spirited effort. Composition slightly off.',
  'Charming, but the horizon is having a day.',
  'Solid. Just outshone today.',
  'A respectable contribution.',
  'Earnest. The judges respect that.',
  'A noble try.',
];

const JudgesVerdict: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [completions, setCompletions] = useState<Record<string, Record<string, string>>>({});
  const [votes, setVotes] = useState<Record<string, Vote>>(() => loadVotes());

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenCollection(`trips/${tripMeta.id}/challenges`, (docs) => {
      const map: Record<string, Record<string, string>> = {};
      for (const d of docs) map[d.id] = (d.data as Record<string, unknown>).completions as Record<string, string> || {};
      setCompletions(map);
    });
    return unsub;
  }, [tripMeta]);

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';
  const myName = (currentUser?.displayName || 'You').split(' ')[0];
  const partnerName = (partnerUser?.displayName || 'Partner').split(' ')[0];

  // Identify which side is "Maja". If she's in the trip, that's the rigged
  // winner regardless of who's looking at the page. Otherwise default to the
  // partnerUser so the joke still works.
  const majaSide: 'me' | 'partner' = useMemo(() => {
    if (myName.toLowerCase().startsWith('maja')) return 'me';
    if (partnerName.toLowerCase().startsWith('maja')) return 'partner';
    return 'partner'; // sensible default for "the partner always wins"
  }, [myName, partnerName]);
  const majaName = majaSide === 'me' ? myName : partnerName;
  const otherName = majaSide === 'me' ? partnerName : myName;

  const setVote = (challengeId: string, vote: Vote) => {
    const next = { ...votes, [challengeId]: vote };
    setVotes(next);
    saveVotes(next);
  };

  // Real per-challenge scoring from votes (1 win, 0.5 tie). Then we layer
  // the comically-large rigged bonus on top of Maja's total so she always
  // wins regardless of how Haris voted. Visible line items make the rig
  // part of the joke.
  const lineItems = useMemo(() => {
    let majaPoints = 0;
    let otherPoints = 0;
    for (const ch of CHALLENGES) {
      const v = votes[ch.id];
      if (v === 'tie') { majaPoints += 0.5; otherPoints += 0.5; }
      else if (v === 'me') {
        if (majaSide === 'me') majaPoints += 1; else otherPoints += 1;
      } else if (v === 'partner') {
        if (majaSide === 'partner') majaPoints += 1; else otherPoints += 1;
      }
    }
    const bonusTotal = RIGGED_BONUSES.reduce((s, b) => s + b.points, 0);
    return {
      maja: { base: majaPoints, bonuses: RIGGED_BONUSES, total: majaPoints + bonusTotal },
      other: { base: otherPoints, total: otherPoints },
    };
  }, [votes, majaSide]);

  const verdictMsg = lineItems.maja.total >= lineItems.other.total
    ? `Photo Challenge Champion: ${majaName}. (As predicted.)`
    : `Photo Challenge Champion: ${majaName}.`; // never actually reached

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">The Verdict</p>
          <h1 className="font-serif text-3xl font-bold text-[#194f4c] dark:text-white">Judge's Verdict</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">
            After exhaustive deliberation, the panel has reached a decision.
          </p>
        </header>

        {/* Per-challenge voting cards */}
        <div className="space-y-4 mb-10">
          {CHALLENGES.map((ch, i) => {
            const myPhoto = completions[ch.id]?.[myUid];
            const partnerPhoto = completions[ch.id]?.[partnerUid];
            const v = votes[ch.id];
            const note = (i % 2 === 0 ? JUDGE_NOTES : PIQUED_NOTES)[i % 6];
            return (
              <div key={ch.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{ch.emoji}</span>
                  <h3 className="font-bold text-sm flex-1">{ch.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => myPhoto && setVote(ch.id, 'me')}
                    disabled={!myPhoto}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      v === 'me' ? 'border-[#194f4c] ring-2 ring-[#194f4c]/30' : 'border-transparent'
                    } ${!myPhoto ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {myPhoto ? (
                      <img src={myPhoto} alt={`${myName}'s submission`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[9px] text-slate-400">no entry</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] uppercase tracking-widest py-1 text-center">{myName}</div>
                  </button>
                  <button
                    onClick={() => partnerPhoto && setVote(ch.id, 'partner')}
                    disabled={!partnerPhoto}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      v === 'partner' ? 'border-[#ac3d29] ring-2 ring-[#ac3d29]/30' : 'border-transparent'
                    } ${!partnerPhoto ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {partnerPhoto ? (
                      <img src={partnerPhoto} alt={`${partnerName}'s submission`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[9px] text-slate-400">no entry</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] uppercase tracking-widest py-1 text-center">{partnerName}</div>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVote(ch.id, 'tie')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      v === 'tie' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Tie
                  </button>
                  {v && <p className="flex-1 text-[10px] text-slate-400 dark:text-slate-500 italic text-right">{note}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final scorecard */}
        <div className="bg-gradient-to-br from-[#194f4c] to-[#0f3a37] text-white rounded-3xl p-6 shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-3">Final Tally</p>

          <div className="space-y-1.5 mb-4">
            <ScoreRow label={`${majaName} — base score`} value={lineItems.maja.base} />
            {lineItems.maja.bonuses.map((b) => (
              <ScoreRow key={b.label} label={`${b.label}`} value={b.points} bonus />
            ))}
          </div>
          <div className="border-t border-white/10 pt-2 mb-4">
            <ScoreRow label={`${majaName} TOTAL`} value={lineItems.maja.total} bold />
          </div>

          <div className="border-t border-white/10 pt-3 mb-4">
            <ScoreRow label={`${otherName} TOTAL`} value={lineItems.other.total} bold />
          </div>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-amber-300 mb-2">Verdict</p>
            <p className="font-serif text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {verdictMsg}
            </p>
            <p className="text-[10px] text-white/60 italic mt-3">
              The judges' decision is final, binding, and lovingly biased.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ScoreRow: React.FC<{ label: string; value: number; bonus?: boolean; bold?: boolean }> = ({ label, value, bonus, bold }) => (
  <div className="flex items-baseline gap-3">
    <span className={`text-xs flex-1 truncate ${bold ? 'font-bold text-white' : bonus ? 'text-amber-200/90' : 'text-white/80'}`}>{label}</span>
    <span className={`tabular-nums ${bold ? 'text-base font-bold text-white' : 'text-xs text-white/90'}`}>
      {bonus ? `+${value}` : value}
    </span>
  </div>
);

export default JudgesVerdict;
