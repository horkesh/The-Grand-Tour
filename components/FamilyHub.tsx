import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES } from '../constants';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import { ensureAnonymousAuth } from '../services/anonymousAuth';

interface FeedItem {
  id: string;
  type: 'stamp' | 'postcard' | 'arrival';
  cityId: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  timestamp: number;
}
interface GuestbookEntry { id: string; authorUid: string; authorName: string; message: string; timestamp: number; }
interface CarePackage    { id: string; senderUid: string; senderName: string; forCityId: string; message: string; timestamp: number; }
interface PuzzleScore    { uid: string; name: string; score: number; }

const genId    = () => Math.random().toString(36).slice(2, 10);
const dateKey  = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const relTime  = (ts: number) => { const s = Math.floor((Date.now()-ts)/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; };

const TABS = ['Feed', 'Guestbook', 'Care Packages', 'Puzzle'] as const;
type Tab = typeof TABS[number];

const REACTIONS = ['❤️','😍','🤌','😂','🙌','😢'];

export default function FamilyHub() {
  const navigate = useNavigate();

  const familyUid  = localStorage.getItem('bb_family_uid')  || '';
  const familyName = localStorage.getItem('bb_family_name') || 'Guest';

  const tripId = (() => {
    const familyTripId = localStorage.getItem('bb_family_tripId');
    if (familyTripId) return familyTripId;
    try {
      const stored = JSON.parse(localStorage.getItem('grand-tour-storage') || '{}');
      return stored?.state?.tripMeta?.id || '';
    } catch { return ''; }
  })();

  useEffect(() => { if (!familyUid) navigate('/family/join', { replace: true }); }, [familyUid, navigate]);

  // Ensure family visitors have a Firebase auth identity for Firestore reads/writes
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    ensureAnonymousAuth().then(() => setAuthReady(true)).catch((e) => {
      console.error('[FamilyHub] anonymous auth failed:', e);
    });
  }, []);

  const [tab,          setTab]          = useState<Tab>('Feed');
  const [feed,         setFeed]         = useState<FeedItem[]>([]);
  const [reactions,    setReactions]    = useState<Record<string, string>>({});
  const [guestbook,    setGuestbook]    = useState<GuestbookEntry[]>([]);
  const [gbMessage,    setGbMessage]    = useState('');
  const [packages,     setPackages]     = useState<CarePackage[]>([]);
  const [cpCity,       setCpCity]       = useState('');
  const [cpMessage,    setCpMessage]    = useState('');
  const [puzzleScores, setPuzzleScores] = useState<PuzzleScore[]>([]);
  const [sending,      setSending]      = useState(false);

  // Feed
  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/feed`, (docs) =>
      setFeed(docs.map(d => ({ ...d.data, id: d.id } as FeedItem)).sort((a, b) => b.timestamp - a.timestamp))
    );
  }, [tripId]);

  // Guestbook
  useEffect(() => {
    if (!tripId || !authReady || tab !== 'Guestbook') return;
    return listenCollection(`trips/${tripId}/guestbook`, (docs) =>
      setGuestbook(docs.map(d => ({ ...d.data, id: d.id } as GuestbookEntry)).sort((a, b) => a.timestamp - b.timestamp))
    );
  }, [tripId, tab, authReady]);

  // Care packages
  useEffect(() => {
    if (!tripId || !authReady || tab !== 'Care Packages') return;
    return listenCollection(`trips/${tripId}/carePackages`, (docs) =>
      setPackages(docs.map(d => ({ ...d.data, id: d.id } as CarePackage)).sort((a, b) => b.timestamp - a.timestamp))
    );
  }, [tripId, tab, authReady]);

  // Puzzle scores
  useEffect(() => {
    if (!tripId || !authReady || tab !== 'Puzzle') return;
    return listenCollection(`trips/${tripId}/puzzle`, (docs) => {
      const today = dateKey();
      const todayDoc = docs.find(d => d.id === today);
      if (!todayDoc) { setPuzzleScores([]); return; }
      const data = todayDoc.data as Record<string, number>;
      const scores = Object.entries(data).map(([uid, score]) => ({ uid, name: uid.slice(0, 8), score }));
      setPuzzleScores(scores.sort((a, b) => b.score - a.score));
    });
  }, [tripId, tab, authReady]);

  const react = useCallback(async (itemId: string, emoji: string) => {
    if (!tripId || !familyUid) return;
    setReactions(r => ({ ...r, [itemId]: emoji }));
    await writeDoc(`trips/${tripId}/reactions/${itemId}`, { [familyUid]: emoji });
  }, [tripId, familyUid]);

  const sendGuestbook = async () => {
    if (!gbMessage.trim() || !tripId) return;
    setSending(true);
    await writeDoc(`trips/${tripId}/guestbook/${genId()}`, {
      authorUid: familyUid, authorName: familyName,
      message: gbMessage.trim(), timestamp: Date.now(),
    });
    setGbMessage('');
    setSending(false);
  };

  const sendCarePackage = async () => {
    if (!cpMessage.trim() || !cpCity || !tripId) return;
    setSending(true);
    await writeDoc(`trips/${tripId}/carePackages/${genId()}`, {
      senderUid: familyUid, senderName: familyName,
      forCityId: cpCity, message: cpMessage.trim(), timestamp: Date.now(),
    });
    setCpMessage('');
    setSending(false);
  };

  const feedTypeIcon = (type: FeedItem['type']) =>
    type === 'stamp' ? '🏛️' : type === 'postcard' ? '📮' : '✈️';

  return (
    <div className="min-h-screen bg-[#f9f7f4] dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-[#194f4c] px-4 pt-10 pb-4">
        <h1 className="text-white font-serif text-xl font-bold">The Grand Tour</h1>
        <p className="text-teal-200 text-sm">Following along as <span className="font-semibold text-white">{familyName}</span></p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-max px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${tab === t ? 'text-[#194f4c] border-b-2 border-[#194f4c] dark:text-teal-400 dark:border-teal-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="px-4 py-4 space-y-3">

          {/* FEED */}
          {tab === 'Feed' && (
            feed.length === 0
              ? <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">No updates yet — check back soon!</p>
              : feed.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{feedTypeIcon(item.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{item.title}</p>
                        {item.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.detail}</p>}
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{relTime(item.timestamp)}</p>
                      </div>
                    </div>
                    {/* Reaction bar */}
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => react(item.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-sm border transition-colors
                            ${reactions[item.id] === emoji
                              ? 'bg-[#194f4c] border-[#194f4c] text-white'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#194f4c]'}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}

          {/* GUESTBOOK */}
          {tab === 'Guestbook' && (
            <>
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {guestbook.length === 0
                  ? <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">Be the first to leave a message!</p>
                  : guestbook.map(entry => (
                    <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#194f4c] text-white text-xs flex items-center justify-center font-bold">
                          {entry.authorName.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{entry.authorName}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{relTime(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{entry.message}</p>
                    </div>
                  ))
                }
              </div>
              <div className="flex gap-2 mt-2">
                <input value={gbMessage} onChange={e => setGbMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendGuestbook()}
                  placeholder="Leave a message…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-[#194f4c]" />
                <button onClick={sendGuestbook} disabled={sending || !gbMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-[#194f4c] text-white text-sm font-medium
                             hover:bg-[#133b39] disabled:opacity-50 transition-colors">
                  Send
                </button>
              </div>
            </>
          )}

          {/* CARE PACKAGES */}
          {tab === 'Care Packages' && (
            <>
              <div className="bg-white dark:bg-gray-900 rounded-xl px-4 py-4 shadow-sm space-y-3">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Send a Surprise Note</h2>
                <select value={cpCity} onChange={e => setCpCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-[#f9f7f4] dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-[#194f4c]">
                  <option value="">Select a city…</option>
                  {ITALIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.location}</option>
                  ))}
                </select>
                <textarea value={cpMessage} onChange={e => setCpMessage(e.target.value)} rows={3}
                  placeholder="Write something special for that stop…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-[#f9f7f4] dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-[#194f4c] resize-none" />
                <button onClick={sendCarePackage} disabled={sending || !cpMessage.trim() || !cpCity}
                  className="w-full py-2 rounded-xl bg-[#ac3d29] text-white text-sm font-medium
                             hover:bg-[#8f3320] disabled:opacity-50 transition-colors">
                  Send Care Package 🎁
                </button>
              </div>

              {packages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Sent</p>
                  {packages.map(pkg => (
                    <div key={pkg.id} className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-semibold text-[#ac3d29]">
                          {ITALIAN_CITIES.find((c) => c.id === pkg.forCityId)?.location ?? pkg.forCityId}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{relTime(pkg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{pkg.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">from {pkg.senderName}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PUZZLE */}
          {tab === 'Puzzle' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl px-4 py-4 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">Today's Leaderboard</h2>
                {puzzleScores.length === 0
                  ? <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No scores yet today. Be the first!</p>
                  : puzzleScores.map((s, i) => (
                    <div key={s.uid} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                        ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">{s.name}</span>
                      <span className="text-sm font-bold text-[#194f4c] dark:text-teal-400">{s.score}</span>
                    </div>
                  ))
                }
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/gioco')}
                className="w-full py-3 rounded-xl bg-[#194f4c] text-white font-semibold text-base
                           hover:bg-[#133b39] transition-colors">
                Play Today's Puzzle 🧩
              </motion.button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
