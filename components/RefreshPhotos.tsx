import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { isPlacesApiBlocked, clearPlacesApiBlock } from '../services/placesService';

const RefreshPhotos: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'idle' | 'wiping' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const wasBlocked = isPlacesApiBlocked();

  const wipeAndRefetch = async () => {
    setStep('wiping');
    try {
      // Clear in-memory cache
      useStore.setState({ waypointImages: {}, imagesHydrated: false });

      // Clear the "Places API blocked" kill switch so the queue tries again.
      clearPlacesApiBlock();

      // Wipe IndexedDB image store
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('grand-tour-images');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve(); // proceed anyway
      });

      setStep('done');
      // Reload so ImageGenerator rebuilds the queue from scratch
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep('error');
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Cache Tools
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#194f4c] dark:text-white mb-2">
            Refresh Place Photos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Clears your phone's photo cache and re-fetches every place from Google.
          </p>
        </div>

        {step === 'idle' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 space-y-5">
            {wasBlocked && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-bold uppercase tracking-widest text-[10px]">Places API blocked</p>
                <p>Last time the app tried, your Google API key was rejected for the Places API and we paused fetching so you wouldn't see the same toast every load.</p>
                <p>To fix: in Google Cloud Console → Credentials → your API key → <span className="font-bold">API restrictions</span>, add <span className="font-mono">Places API (New)</span> alongside Generative Language. Then come back and tap Refresh below.</p>
              </div>
            )}
            <div className="text-sm text-slate-700 dark:text-slate-200 space-y-3">
              <p>This will:</p>
              <ul className="text-xs space-y-1 pl-4 list-disc text-slate-500 dark:text-slate-400">
                <li>Delete every cached place photo on this device</li>
                <li>Re-fetch fresh photos from Google Places for the whole itinerary</li>
                <li>Re-enable photo fetching if it was paused</li>
                <li>Reload the app once cleared</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use this if you're seeing old AI-generated images instead of real photos, or if photos look broken. Only affects this device — Maja's phone is untouched.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={wipeAndRefetch}
                className="flex-1 px-5 py-3 rounded-xl bg-[#194f4c] text-white text-sm font-bold hover:bg-[#0f3a37] transition-colors"
              >
                Refresh photos
              </button>
            </div>
          </div>
        )}

        {step === 'wiping' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-[#194f4c] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Clearing photo cache…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-emerald-200 dark:border-emerald-900/40 p-6 text-center space-y-4">
            <div className="text-5xl">📸</div>
            <h3 className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400">Cleared</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Reloading the app so it can re-fetch fresh photos…
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/40 p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-red-600">Something went wrong</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-mono break-words">{errorMsg}</p>
            <button
              onClick={() => setStep('idle')}
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

export default RefreshPhotos;
