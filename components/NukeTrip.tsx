import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useStore } from '../store';

const SUBCOLLECTIONS = [
  'pois', 'stamps', 'checklist', 'chat', 'feed', 'wishlistNotes',
  'users', 'puzzle', 'carePackages', 'family', 'reactions',
  'guestbook', 'challenges', 'surprises', 'preferences',
];
const SINGLE_DOCS = ['postcardIndex', 'prompts/responses', 'trivia/scores'];
const CONFIRM_PHRASE = 'NUKE';

const NukeTrip: React.FC = () => {
  const tripMeta = useStore((s) => s.tripMeta);
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'confirm' | 'wiping' | 'done' | 'error'>('confirm');
  const [progress, setProgress] = useState('');
  const [deletedCount, setDeletedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const tripId = tripMeta?.id;

  const wipeAll = async () => {
    if (!tripId) {
      setErrorMsg('No trip ID found — are you logged in?');
      setStep('error');
      return;
    }
    setStep('wiping');
    let deleted = 0;
    try {
      for (const sub of SUBCOLLECTIONS) {
        setProgress(`Wiping ${sub}…`);
        const snap = await getDocs(collection(db, `trips/${tripId}/${sub}`));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
          deleted++;
          setDeletedCount(deleted);
        }
      }
      for (const path of SINGLE_DOCS) {
        setProgress(`Wiping ${path}…`);
        try {
          await deleteDoc(doc(db, `trips/${tripId}/${path}`));
          deleted++;
          setDeletedCount(deleted);
        } catch {
          // doc may not exist — fine
        }
      }

      setProgress('Clearing local state…');
      useStore.setState({
        savedPOIs: [],
        stamps: [],
        postcards: {},
        chatMessages: [],
        checklist: [],
        audioPostcards: [],
        wishlistNotes: {},
        learnedPhrases: [],
        waypointImages: {},
      });

      setProgress('Clearing image cache…');
      try {
        indexedDB.deleteDatabase('grand-tour-images');
      } catch {
        // best effort
      }

      setStep('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStep('error');
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32 bg-[#fef7f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Danger Zone
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#194f4c] dark:text-white mb-2">
            Nuke Trip Data
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Wipes all shared Firestore data plus your local cache.
          </p>
        </div>

        {step === 'confirm' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border-2 border-[#ac3d29]/30 p-6 space-y-5">
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <p className="font-bold">This will permanently delete:</p>
              <ul className="text-xs space-y-1 pl-4 list-disc text-slate-500 dark:text-slate-400">
                <li>All postcards, stamps, saved POIs, photos</li>
                <li>Chat history, checklist, wishlist notes</li>
                <li>Care packages, reactions, guestbook entries</li>
                <li>Game scores, daily reveals, surprises</li>
                <li>Learned phrases, generated images</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trip pairing with Maja is kept so you stay logged in.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                <strong>Trip ID:</strong> {tripId || '(none)'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Type <span className="text-[#ac3d29]">{CONFIRM_PHRASE}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-[#ac3d29]"
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={wipeAll}
                disabled={confirmText !== CONFIRM_PHRASE}
                className="flex-1 px-5 py-3 rounded-xl bg-[#ac3d29] text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#8a3120] transition-colors"
              >
                Nuke it
              </button>
            </div>
          </div>
        )}

        {step === 'wiping' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-[#ac3d29] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{progress}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{deletedCount} docs deleted</p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-emerald-200 dark:border-emerald-900/40 p-6 text-center space-y-4">
            <div className="text-5xl">✨</div>
            <h3 className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400">Clean slate</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {deletedCount} Firestore docs deleted. Local cache cleared. Maja's device will sync the wipe automatically.
            </p>
            <button
              onClick={() => {
                navigate('/');
                window.location.reload();
              }}
              className="w-full px-5 py-3 rounded-xl bg-[#194f4c] text-white text-sm font-bold hover:bg-[#0f3a37] transition-colors"
            >
              Reload app
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/40 p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-red-600">Something went wrong</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-mono break-words">{errorMsg}</p>
            <p className="text-xs text-slate-500">{deletedCount} docs deleted before failure.</p>
            <button
              onClick={() => setStep('confirm')}
              className="w-full px-5 py-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NukeTrip;
