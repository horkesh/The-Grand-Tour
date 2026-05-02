import React, { useEffect, useState } from 'react';
import { ITALIAN_CITIES } from '../constants';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import VoiceRecorder from './VoiceRecorder';

interface GuestbookEntry { id: string; authorUid: string; authorName: string; message: string; timestamp: number }
interface CarePackage { id: string; senderUid: string; senderName: string; forCityId: string; message: string; audioData?: string | null; audioDuration?: number | null; timestamp: number }

const PRESET_COLORS = [
  { name: 'coral',   hex: '#f87171' },
  { name: 'sky',     hex: '#38bdf8' },
  { name: 'violet',  hex: '#a78bfa' },
  { name: 'amber',   hex: '#fbbf24' },
  { name: 'emerald', hex: '#34d399' },
  { name: 'rose',    hex: '#fb7185' },
];

const genId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function relTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Identity {
  uid: string;
  name: string;
  color: string;
  isOwner: boolean;
}

interface Props {
  tripId: string;
  authReady: boolean;
}

/** Combines guestbook + care packages + an inline nickname prompt so /live
 *  can be the single page family interacts with. */
const FamilyInteractions: React.FC<Props> = ({ tripId, authReady }) => {
  // ---- Identity ----
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [showIdentityPrompt, setShowIdentityPrompt] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(PRESET_COLORS[0].hex);

  useEffect(() => {
    // Owner first
    try {
      const stored = JSON.parse(localStorage.getItem('grand-tour-storage') || '{}');
      const u = stored?.state?.currentUser;
      if (u?.uid && u?.displayName) {
        setIdentity({
          uid: u.uid,
          name: (u.displayName as string).split(' ')[0],
          color: u.color === 'rust' ? '#ac3d29' : '#194f4c',
          isOwner: true,
        });
        return;
      }
    } catch { /* ignore */ }
    // Saved family guest
    const uid = localStorage.getItem('bb_family_uid');
    const name = localStorage.getItem('bb_family_name');
    const color = localStorage.getItem('bb_family_color') || PRESET_COLORS[0].hex;
    if (uid && name) setIdentity({ uid, name, color, isOwner: false });
  }, []);

  const saveGuestIdentity = () => {
    if (!draftName.trim()) return;
    const uid = genId();
    const name = draftName.trim();
    localStorage.setItem('bb_family_uid', uid);
    localStorage.setItem('bb_family_name', name);
    localStorage.setItem('bb_family_color', draftColor);
    if (tripId) localStorage.setItem('bb_family_tripId', tripId);
    setIdentity({ uid, name, color: draftColor, isOwner: false });
    setShowIdentityPrompt(false);
    // Register them as a family member so the trip owner can see who joined
    if (tripId) {
      writeDoc(`trips/${tripId}/family/${uid}`, {
        nickname: name,
        color: draftColor,
        joinedAt: Date.now(),
      }).catch(() => { /* non-fatal */ });
    }
  };

  // ---- Listeners ----
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [packages, setPackages] = useState<CarePackage[]>([]);

  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/guestbook`, (docs) =>
      setGuestbook(docs.map((d) => ({ ...d.data, id: d.id } as GuestbookEntry)).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)),
    );
  }, [tripId, authReady]);

  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/carePackages`, (docs) =>
      setPackages(docs.map((d) => ({ ...d.data, id: d.id } as CarePackage)).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)),
    );
  }, [tripId, authReady]);

  // ---- Composers ----
  const [gbMessage, setGbMessage] = useState('');
  const [cpCity, setCpCity] = useState('');
  const [cpMessage, setCpMessage] = useState('');
  const [sending, setSending] = useState(false);

  const requireIdentity = (): boolean => {
    if (identity) return true;
    setShowIdentityPrompt(true);
    return false;
  };

  const sendGuestbook = async () => {
    if (!gbMessage.trim() || !tripId) return;
    if (!requireIdentity()) return;
    setSending(true);
    await writeDoc(`trips/${tripId}/guestbook/${genId()}`, {
      authorUid: identity!.uid,
      authorName: identity!.name,
      message: gbMessage.trim(),
      timestamp: Date.now(),
    }).catch(() => { /* non-fatal */ });
    setGbMessage('');
    setSending(false);
  };

  const sendCarePackage = async (audio?: { dataUrl: string; durationSec: number }) => {
    if (!cpCity || !tripId) return;
    if (!audio && !cpMessage.trim()) return;
    if (!requireIdentity()) return;
    setSending(true);
    await writeDoc(`trips/${tripId}/carePackages/${genId()}`, {
      senderUid: identity!.uid,
      senderName: identity!.name,
      forCityId: cpCity,
      message: cpMessage.trim(),
      audioData: audio?.dataUrl || null,
      audioDuration: audio?.durationSec || null,
      timestamp: Date.now(),
    }).catch(() => { /* non-fatal */ });
    setCpMessage('');
    setSending(false);
  };

  // ---- Render ----
  if (!tripId) return null;

  return (
    <section className="max-w-xl mx-auto w-full px-4 pb-10 space-y-6">
      {/* Identity prompt */}
      {showIdentityPrompt && !identity && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border-2 border-[#194f4c]/30 dark:border-teal-700/40 p-4 space-y-3 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#ac3d29] dark:text-orange-400 mb-1">First time?</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Tell them who's saying hi</p>
          </div>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Your nickname (e.g. Auntie Sara)"
            maxLength={20}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[#f9f7f4] dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
          />
          <div className="flex gap-2.5 justify-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setDraftColor(c.hex)}
                aria-label={c.name}
                className="w-7 h-7 rounded-full transition-transform"
                style={{
                  backgroundColor: c.hex,
                  transform: draftColor === c.hex ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: draftColor === c.hex ? `0 0 0 2px white, 0 0 0 4px ${c.hex}` : 'none',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowIdentityPrompt(false)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold"
            >
              Not now
            </button>
            <button
              onClick={saveGuestIdentity}
              disabled={!draftName.trim()}
              className="flex-1 px-3 py-2 rounded-xl bg-[#194f4c] text-white text-xs font-bold disabled:opacity-50"
            >
              Save & continue
            </button>
          </div>
        </div>
      )}

      {/* Guestbook */}
      <div>
        <h3
          className="font-serif text-lg text-[#194f4c] dark:text-teal-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Guestbook
        </h3>
        <div className="space-y-2 mb-3">
          {guestbook.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No notes yet — be the first to say hello.</p>
          ) : (
            guestbook.map((e) => (
              <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-5 h-5 rounded-full bg-[#194f4c] text-white text-[10px] flex items-center justify-center font-bold">
                    {e.authorName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{e.authorName}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{relTime(e.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{e.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={gbMessage}
            onChange={(e) => setGbMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendGuestbook()}
            placeholder={identity ? `Leave a note as ${identity.name}…` : 'Leave a note…'}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
          />
          <button
            onClick={sendGuestbook}
            disabled={sending || !gbMessage.trim()}
            className="px-4 py-2 rounded-xl bg-[#194f4c] text-white text-xs font-bold hover:bg-[#133b39] disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Care packages */}
      <div>
        <h3
          className="font-serif text-lg text-[#194f4c] dark:text-teal-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Send a Care Package
        </h3>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm space-y-3">
          <select
            value={cpCity}
            onChange={(e) => setCpCity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[#f9f7f4] dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
          >
            <option value="">Pick a city for them to read it…</option>
            {ITALIAN_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.location}</option>
            ))}
          </select>
          <textarea
            value={cpMessage}
            onChange={(e) => setCpMessage(e.target.value)}
            rows={3}
            placeholder="Write something special for that stop…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[#f9f7f4] dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#194f4c] resize-none"
          />
          <button
            onClick={() => sendCarePackage()}
            disabled={sending || !cpMessage.trim() || !cpCity}
            className="w-full py-2 rounded-xl bg-[#ac3d29] text-white text-sm font-bold hover:bg-[#8f3320] disabled:opacity-50 transition-colors"
          >
            Send Care Package 🎁
          </button>
          {cpCity && (
            <VoiceRecorder
              disabled={sending}
              onRecorded={(dataUrl, durationSec) => sendCarePackage({ dataUrl, durationSec })}
            />
          )}
        </div>

        {packages.length > 0 && (
          <div className="space-y-2 mt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Recently sent</p>
            {packages.slice(0, 5).map((p) => (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-[#ac3d29]">
                    {ITALIAN_CITIES.find((c) => c.id === p.forCityId)?.location ?? p.forCityId}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{relTime(p.timestamp)}</span>
                </div>
                {p.message && <p className="text-xs text-gray-700 dark:text-gray-300">{p.message}</p>}
                {p.audioData && <audio src={p.audioData} controls className="w-full h-9 mt-1.5" />}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">from {p.senderName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FamilyInteractions;
