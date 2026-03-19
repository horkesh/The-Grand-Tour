import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { SavedPOI } from '../types';
import { useToast } from './Toast';

/**
 * Partner sync via clipboard — export your stamps/POIs as a compact string,
 * import your partner's to merge. No backend needed.
 */

interface SyncPayload {
  v: 1;
  stamps: string[];
  pois: Pick<SavedPOI, 'id' | 'cityId' | 'title' | 'uri' | 'lat' | 'lng' | 'timestamp'>[];
}

const encode = (data: SyncPayload): string => {
  return btoa(JSON.stringify(data));
};

const decode = (str: string): SyncPayload | null => {
  try {
    const parsed = JSON.parse(atob(str.trim()));
    if (parsed?.v !== 1) return null;
    if (!Array.isArray(parsed.stamps) || !parsed.stamps.every((s: unknown) => typeof s === 'string')) return null;
    if (!Array.isArray(parsed.pois) || !parsed.pois.every((p: any) =>
      typeof p.id === 'string' && typeof p.title === 'string' && typeof p.uri === 'string'
    )) return null;
    return parsed;
  } catch {
    return null;
  }
};

const PartnerSync: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { stamps, addStamp, savedPOIs, addSavedPOI } = useStore();
  const showToast = useToast();
  const [importText, setImportText] = useState('');
  const [mode, setMode] = useState<'menu' | 'export' | 'import'>('menu');

  const exportCode = useMemo(() => encode({
    v: 1,
    stamps,
    pois: savedPOIs.map(({ id, cityId, title, uri, lat, lng, timestamp }) => ({ id, cityId, title, uri, lat, lng, timestamp })),
  }), [stamps, savedPOIs]);

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      showToast('Copied to clipboard! Send it to your partner.', 'success');
    } catch {
      showToast('Could not copy — select and copy manually.', 'error');
    }
  };

  const handleImport = () => {
    const data = decode(importText);
    if (!data) {
      showToast('Invalid sync code. Ask your partner to re-export.', 'error');
      return;
    }

    let newStamps = 0;
    let newPois = 0;

    // Merge stamps (union)
    for (const s of data.stamps) {
      if (!stamps.includes(s)) {
        addStamp(s);
        newStamps++;
      }
    }

    // Merge POIs (skip duplicates by URI)
    const existingUris = new Set(savedPOIs.map(p => p.uri));
    for (const poi of data.pois) {
      if (!existingUris.has(poi.uri)) {
        addSavedPOI({ ...poi, id: `partner-${poi.id}` });
        newPois++;
      }
    }

    showToast(`Synced! +${newStamps} stamps, +${newPois} saved places.`, 'success');
    setImportText('');
    setMode('menu');
  };

  return (
    <div className="fixed inset-0 z-[9996] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl p-8 max-w-md w-full"
      >
        <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-2">Partner Sync</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Share stamps and saved places between phones.</p>

        <AnimatePresence mode="wait">
          {mode === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <button
                onClick={() => setMode('export')}
                className="w-full p-4 bg-[#194f4c] text-white rounded-2xl font-bold text-sm flex items-center gap-4 hover:bg-[#163f3d] transition-colors"
              >
                <span className="text-2xl">📤</span>
                <div className="text-left">
                  <span className="block">Send My Data</span>
                  <span className="text-[10px] font-normal text-white/60 uppercase tracking-wider">{stamps.length} stamps · {savedPOIs.length} places</span>
                </div>
              </button>
              <button
                onClick={() => setMode('import')}
                className="w-full p-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-bold text-sm flex items-center gap-4 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl">📥</span>
                <div className="text-left">
                  <span className="block">Receive Partner's Data</span>
                  <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">Paste their sync code</span>
                </div>
              </button>
            </motion.div>
          )}

          {mode === 'export' && (
            <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                readOnly
                value={exportCode}
                className="w-full h-32 p-4 bg-slate-50 dark:bg-black rounded-2xl text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 mb-4 resize-none focus:ring-2 focus:ring-[#194f4c] outline-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="flex gap-2">
                <button onClick={handleCopyExport} className="flex-1 py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm">Copy Code</button>
                <button onClick={() => setMode('menu')} className="px-6 py-3 text-slate-400 font-bold text-xs">Back</button>
              </div>
            </motion.div>
          )}

          {mode === 'import' && (
            <motion.div key="import" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                autoFocus
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your partner's sync code here..."
                className="w-full h-32 p-4 bg-slate-50 dark:bg-black rounded-2xl text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 mb-4 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-[#194f4c] outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50">Import & Merge</button>
                <button onClick={() => setMode('menu')} className="px-6 py-3 text-slate-400 font-bold text-xs">Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onClose} className="w-full mt-4 py-2 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">Close</button>
      </motion.div>
    </div>
  );
};

export default PartnerSync;
