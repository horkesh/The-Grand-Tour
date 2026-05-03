import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import ErrorBoundary from './ErrorBoundary';

const VoiceRecorder = React.lazy(() => import('./VoiceRecorder'));

interface CarePackageReply {
  authorUid: string;
  authorName: string;
  message: string;
  audioData?: string | null;
  audioDuration?: number | null;
  timestamp: number;
}

interface CarePackage {
  id: string;
  senderUid: string;
  senderName: string;
  forCityId: string;
  message: string;
  audioData?: string | null;
  audioDuration?: number | null;
  timestamp: number;
  readBy?: string[];
  reply?: CarePackageReply | null;
}

interface Props {
  cityId: string;
}

export default function CarePackageInbox({ cityId }: Props) {
  const { currentUser, tripMeta } = useStore();
  const [packages, setPackages] = useState<CarePackage[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  const tripId = tripMeta?.id;

  useEffect(() => {
    if (!tripId) return;
    const unsub = listenCollection(
      `trips/${tripId}/carePackages`,
      (docs) => {
        const mapped = docs.map(d => ({ ...d.data, id: d.id } as CarePackage));
        setPackages(mapped.filter((p) => p.forCityId === cityId));
      }
    );
    return () => unsub?.();
  }, [tripId, cityId]);

  const markRead = async (pkg: CarePackage) => {
    if (!tripId || !currentUser?.uid) return;
    const alreadyRead = pkg.readBy?.includes(currentUser.uid);
    if (alreadyRead) return;
    await writeDoc(`trips/${tripId}/carePackages/${pkg.id}`, {
      readBy: [...(pkg.readBy ?? []), currentUser.uid],
    });
  };

  const isUnread = (pkg: CarePackage) =>
    !pkg.readBy?.includes(currentUser?.uid ?? '');

  const sendReply = async (pkg: CarePackage, audio?: { dataUrl: string; durationSec: number }) => {
    if (!tripId || !currentUser?.uid) return;
    const text = (replyDraft[pkg.id] ?? '').trim();
    if (!text && !audio) return;
    setSendingReplyId(pkg.id);
    try {
      const reply: CarePackageReply = {
        authorUid: currentUser.uid,
        authorName: (currentUser.displayName || 'Trip').split(' ')[0],
        message: text,
        audioData: audio?.dataUrl ?? null,
        audioDuration: audio?.durationSec ?? null,
        timestamp: Date.now(),
      };
      await writeDoc(`trips/${tripId}/carePackages/${pkg.id}`, { reply });
      setReplyDraft((d) => ({ ...d, [pkg.id]: '' }));
    } finally {
      setSendingReplyId(null);
    }
  };

  if (packages.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#ac3d29] dark:text-[#e07060]">
        Care Packages
      </p>
      <AnimatePresence initial={false}>
        {packages.map((pkg) => {
          const unread = isUnread(pkg);
          const open = expanded === pkg.id;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={[
                'rounded-xl border px-4 py-3 cursor-pointer transition-shadow',
                'bg-[#f9f7f4] dark:bg-[#1a2e2c]',
                unread
                  ? 'border-[#ac3d29] shadow-[0_0_10px_2px_rgba(172,61,41,0.25)]'
                  : 'border-[#194f4c]/30 dark:border-[#194f4c]/50',
              ].join(' ')}
              onClick={() => {
                setExpanded(open ? null : pkg.id);
                if (unread) markRead(pkg);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg leading-none" aria-hidden>
                    {open ? '💌' : '✉️'}
                  </span>
                  <span className="text-sm font-medium text-[#194f4c] dark:text-[#a8d5d1] truncate">
                    From {pkg.senderName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unread && (
                    <span className="w-2 h-2 rounded-full bg-[#ac3d29] inline-block" />
                  )}
                  <span className="text-xs text-[#194f4c]/50 dark:text-[#a8d5d1]/50">
                    {open ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {open && (
                  <motion.div
                    key="msg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 space-y-2 overflow-hidden"
                  >
                    {pkg.message && (
                      <p className="text-sm text-[#194f4c]/80 dark:text-[#a8d5d1]/80 leading-relaxed">
                        {pkg.message}
                      </p>
                    )}
                    {pkg.audioData && (
                      <audio
                        src={pkg.audioData}
                        controls
                        className="w-full h-9"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Reply — visible only to the original sender + the owner.
                        Stored in plain Firestore so technically any joined family
                        member with the auth token could read it; we treat it as
                        "private from siblings", not "secure". */}
                    <div
                      className="mt-3 pt-3 border-t border-[#194f4c]/15 dark:border-[#a8d5d1]/15"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pkg.reply ? (
                        <div className="rounded-lg bg-[#194f4c]/8 dark:bg-[#a8d5d1]/8 px-3 py-2 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-widest text-[#194f4c]/60 dark:text-[#a8d5d1]/60 font-bold">
                            Replied privately to {pkg.senderName}
                          </p>
                          {pkg.reply.message && (
                            <p className="text-sm text-[#194f4c] dark:text-[#a8d5d1] leading-relaxed">
                              {pkg.reply.message}
                            </p>
                          )}
                          {pkg.reply.audioData && (
                            <audio src={pkg.reply.audioData} controls className="w-full h-9" />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-[#ac3d29]/80 font-bold">
                            Reply privately — only {pkg.senderName} sees it
                          </p>
                          <textarea
                            value={replyDraft[pkg.id] ?? ''}
                            onChange={(e) => setReplyDraft((d) => ({ ...d, [pkg.id]: e.target.value }))}
                            placeholder="Write a private thank-you…"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-[#194f4c]/20 dark:border-[#a8d5d1]/20 bg-white dark:bg-[#0e1f1e] text-sm text-[#194f4c] dark:text-[#a8d5d1] focus:outline-none focus:ring-2 focus:ring-[#ac3d29] resize-none"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => sendReply(pkg)}
                              disabled={sendingReplyId === pkg.id || !(replyDraft[pkg.id] ?? '').trim()}
                              className="px-3 py-1.5 rounded-lg bg-[#ac3d29] text-white text-xs font-bold hover:bg-[#8f3320] disabled:opacity-50 transition-colors"
                            >
                              {sendingReplyId === pkg.id ? 'Sending…' : 'Send reply'}
                            </button>
                            <span className="text-[10px] text-[#194f4c]/50 dark:text-[#a8d5d1]/50">or</span>
                            <ErrorBoundary label="ReplyVoiceRecorder">
                              <Suspense fallback={<span className="text-[10px] text-[#194f4c]/50">…</span>}>
                                <VoiceRecorder
                                  disabled={sendingReplyId === pkg.id}
                                  onRecorded={(dataUrl, durationSec) => sendReply(pkg, { dataUrl, durationSec })}
                                />
                              </Suspense>
                            </ErrorBoundary>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
