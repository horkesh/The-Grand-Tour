import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  handleRedirectResult,
  onAuthChange,
  getUserTrip,
  createTrip,
  joinTrip,
  getPartnerInfo,
  buildTripUser,
  isKnownPartner,
  findAnyTrip,
} from '../services/firebaseAuth';
import { TripMeta } from '../types';
import { useStore } from '../store';

/** Load partner info and start real-time sync after trip is resolved. */
async function resolveTrip(fbUser: User, meta: TripMeta) {
  const { setCurrentUser, setTripMeta, setPartnerUser, initSync } = useStore.getState();
  const color = meta.createdBy === fbUser.uid ? 'teal' as const : 'rust' as const;

  setCurrentUser(buildTripUser(fbUser, color));
  setTripMeta(meta);

  const partnerUid = meta.partnerIds.find(id => id !== fbUser.uid);
  if (partnerUid) {
    const partner = await getPartnerInfo(meta.id, partnerUid);
    if (partner) setPartnerUser(partner);
  }

  // Defer to allow state to settle before setting up listeners
  setTimeout(() => useStore.getState().initSync(), 0);
}

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, tripMeta } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<'loading' | 'signIn' | 'joinOrCreate' | 'joinInput' | 'ready'>('loading');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // If we already have persisted auth state, skip to ready
  useEffect(() => {
    if (currentUser && tripMeta) {
      setStep('ready');
      setTimeout(() => useStore.getState().initSync(), 0);
      return;
    }

    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        console.log('[auth] user signed in:', fbUser.email, fbUser.uid);
        try {
          await handleRedirectResult();
          const existing = await getUserTrip(fbUser.uid);
          console.log('[auth] existing trip:', existing?.id || 'none');
          if (existing) {
            await resolveTrip(fbUser, existing);
            setStep('ready');
          } else if (isKnownPartner(fbUser.email)) {
            // Known partner — try auto-join
            console.log('[auth] known partner, attempting auto-join...');
            try {
              const partnerTrip = await findAnyTrip();
              console.log('[auth] trip found for auto-join:', partnerTrip?.id || 'none');
              if (partnerTrip) {
                const joined = await joinTrip(fbUser, partnerTrip.joinCode);
                await resolveTrip(fbUser, joined);
                setStep('ready');
              } else {
                console.log('[auth] no partner trip found, showing join/create');
                setStep('joinOrCreate');
              }
            } catch (autoJoinErr) {
              console.error('[auth] auto-join failed:', autoJoinErr);
              setStep('joinOrCreate');
            }
          } else {
            setStep('joinOrCreate');
          }
        } catch (err) {
          console.error('[auth] error during trip resolution:', err);
          setError(err instanceof Error ? err.message : 'Authentication error');
          setStep('joinOrCreate');
        }
      } else {
        setStep('signIn');
      }
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setError('');
    try {
      const newTrip = await createTrip(user);
      await resolveTrip(user, newTrip);
      setStep('ready');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create trip');
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setError('');
    try {
      const joined = await joinTrip(user, joinCode.trim());
      await resolveTrip(user, joined);
      setStep('ready');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not join trip');
    }
  };

  if (step === 'ready') return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#194f4c] to-[#0d2f2d] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold mb-2">May 2 – 9, 2026</p>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mb-2">Our Grand Tour</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">A trip for two across Italy</p>

        <AnimatePresence mode="wait">
          {step === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-8 h-8 border-2 border-[#194f4c] border-t-transparent rounded-full animate-spin mx-auto" />
            </motion.div>
          )}

          {step === 'signIn' && (
            <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <button
                onClick={handleSignIn}
                className="w-full py-4 bg-[#194f4c] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#163f3d] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              <p className="text-[10px] text-slate-400">Sign in to sync your trip with your partner in real-time</p>
            </motion.div>
          )}

          {step === 'joinOrCreate' && (
            <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Welcome, {user?.displayName?.split(' ')[0]}!</p>
              <button
                onClick={handleCreate}
                className="w-full p-4 bg-[#194f4c] text-white rounded-2xl font-bold text-sm hover:bg-[#163f3d] transition-colors"
              >
                Start a New Trip
              </button>
              <button
                onClick={() => setStep('joinInput')}
                className="w-full p-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                Join Partner's Trip
              </button>
            </motion.div>
          )}

          {step === 'joinInput' && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Enter the 6-letter code your partner shared</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#194f4c]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6}
                  className="flex-1 py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  Join Trip
                </button>
                <button onClick={() => setStep('joinOrCreate')} className="px-6 py-3 text-slate-400 font-bold text-xs">Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
      </motion.div>
    </div>
  );
};

export default AuthGate;
