import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';

const CHALLENGES = [
  { id: 'ch1', title: 'The Kiss', desc: 'Kiss in front of a famous Italian landmark', emoji: '\u{1F48B}', day: null },
  { id: 'ch2', title: 'Gelato Face', desc: 'Capture the first bite of gelato reaction', emoji: '\u{1F366}', day: null },
  { id: 'ch3', title: 'Golden Hour', desc: 'Silhouette photo at sunset', emoji: '\u{1F305}', day: null },
  { id: 'ch4', title: 'La Vespa', desc: 'Pose with a Vespa (bonus: ride one)', emoji: '\u{1F6F5}', day: null },
  { id: 'ch5', title: 'Mirror Mirror', desc: 'Reflection photo in water or glass', emoji: '\u{1FA9E}', day: null },
  { id: 'ch6', title: 'Local Friend', desc: 'Photo with a friendly local (with permission)', emoji: '\u{1F91D}', day: null },
  { id: 'ch7', title: 'The Toast', desc: 'Glasses clinking \u2014 aperitivo hour', emoji: '\u{1F942}', day: null },
  { id: 'ch8', title: 'Lost & Found', desc: 'Photo of a beautiful unexpected discovery', emoji: '\u{1F5FA}\uFE0F', day: null },
  { id: 'ch9', title: 'Door Envy', desc: 'The most beautiful Italian door you find', emoji: '\u{1F6AA}', day: null },
  { id: 'ch10', title: 'Market Haul', desc: 'Show off your local market finds', emoji: '\u{1F9FA}', day: null },
  { id: 'ch11', title: 'The View', desc: 'Best panoramic view of the trip', emoji: '\u26F0\uFE0F', day: null },
  { id: 'ch12', title: 'Nonna Approved', desc: 'A plate of food so good nonna would approve', emoji: '\u{1F475}', day: null },
  { id: 'ch13', title: 'Street Art', desc: 'Find and photograph street art', emoji: '\u{1F3A8}', day: null },
  { id: 'ch14', title: 'Us \u00D7 20', desc: 'Recreate a photo from early in your relationship', emoji: '\u{1F4F7}', day: null },
  { id: 'ch15', title: 'Tiny Street', desc: 'The narrowest, most charming alley you find', emoji: '\u{1F3D8}\uFE0F', day: null },
  { id: 'ch16', title: 'Anniversary Selfie', desc: 'The official anniversary day portrait', emoji: '\u2764\uFE0F', day: 'day-5' as string | null },
];

/** Resize image file to fit within maxSize px and return as JPEG data URL (keeps under Firestore 1MB limit) */
function resizeImageToDataUrl(file: File, maxSize = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const PhotoChallenges: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [completions, setCompletions] = useState<Record<string, Record<string, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenCollection(`trips/${tripMeta.id}/challenges`, (docs) => {
      const map: Record<string, Record<string, string>> = {};
      for (const d of docs) map[d.id] = (d.data as Record<string, unknown>).completions as Record<string, string> || {};
      setCompletions(map);
    });
    return unsub;
  }, [tripMeta]);

  const handleUpload = async (challengeId: string, file: File) => {
    if (!currentUser || !tripMeta) return;
    setUploadingId(challengeId);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await writeDoc(`trips/${tripMeta.id}/challenges/${challengeId}`, {
        completions: { ...completions[challengeId], [currentUser.uid]: dataUrl },
      });
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploadingId(null);
    setMenuId(null);
  };

  const handleRemove = async (challengeId: string) => {
    if (!currentUser || !tripMeta) return;
    const next = { ...(completions[challengeId] || {}) };
    delete next[currentUser.uid];
    try {
      await writeDoc(`trips/${tripMeta.id}/challenges/${challengeId}`, { completions: next });
    } catch (e) {
      console.error('Remove failed:', e);
    }
    setMenuId(null);
  };

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';
  const completedCount = CHALLENGES.filter(c => completions[c.id]?.[myUid] && completions[c.id]?.[partnerUid]).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Photo Challenges</h1>
      <p className="text-xs text-slate-400 text-center mb-2">{completedCount}/{CHALLENGES.length} completed by both</p>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-[#194f4c] to-[#ac3d29] rounded-full transition-all"
            style={{ width: `${(completedCount / CHALLENGES.length) * 100}%` }}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingId) handleUpload(uploadingId, file);
          e.target.value = '';
        }}
      />

      <div className="max-w-lg mx-auto grid grid-cols-1 gap-4">
        {CHALLENGES.map(ch => {
          const myPhoto = completions[ch.id]?.[myUid];
          const partnerPhoto = completions[ch.id]?.[partnerUid];
          const bothDone = myPhoto && partnerPhoto;

          return (
            <div
              key={ch.id}
              className={`bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm overflow-hidden ${
                bothDone ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{ch.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{ch.title}</h3>
                    <p className="text-[10px] text-slate-400">{ch.desc}</p>
                  </div>
                  {bothDone && <span className="text-emerald-500 font-bold text-[9px] uppercase">Both done!</span>}
                </div>

                {/* Photo submissions */}
                <div className="flex gap-3 mt-3">
                  {/* My submission */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={currentUser} size="sm" />
                      <span className="text-[9px] text-slate-400 font-bold">You</span>
                    </div>
                    {myPhoto ? (
                      <div className="relative">
                        <button
                          onClick={() => setMenuId(menuId === ch.id ? null : ch.id)}
                          className="block w-full"
                          aria-label="Edit photo"
                        >
                          <img src={myPhoto} alt="My submission" className="w-full aspect-square object-cover rounded-xl" />
                        </button>
                        {menuId === ch.id && (
                          <div className="absolute inset-0 rounded-xl bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setUploadingId(ch.id);
                                fileInputRef.current?.click();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white text-[#194f4c] text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100"
                            >
                              🔄 Replace
                            </button>
                            <button
                              onClick={() => handleRemove(ch.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#ac3d29] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#8f3320]"
                            >
                              🗑 Remove
                            </button>
                            <button
                              onClick={() => setMenuId(null)}
                              className="text-white/70 text-[9px] underline mt-1"
                            >
                              cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUploadingId(ch.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingId === ch.id}
                        className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:border-[#194f4c] transition-colors"
                      >
                        {uploadingId === ch.id ? (
                          <div className="w-5 h-5 border-2 border-[#194f4c] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span className="text-xl">{'\u{1F4F8}'}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Add photo</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Partner submission */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={partnerUser} size="sm" />
                      <span className="text-[9px] text-slate-400 font-bold">{partnerUser?.displayName?.split(' ')[0] || 'Partner'}</span>
                    </div>
                    {partnerPhoto ? (
                      <img src={partnerPhoto} alt="Partner submission" className="w-full aspect-square object-cover rounded-xl" />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                        <span className="text-[9px] text-slate-300 dark:text-slate-500">Waiting...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PhotoChallenges;
