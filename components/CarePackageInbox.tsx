import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { listenCollection, writeDoc } from '../services/firestoreSync';

interface CarePackage {
  id: string;
  senderUid: string;
  senderName: string;
  forCityId: string;
  message: string;
  timestamp: number;
  readBy?: string[];
}

interface Props {
  cityId: string;
}

export default function CarePackageInbox({ cityId }: Props) {
  const { currentUser, tripMeta } = useStore();
  const [packages, setPackages] = useState<CarePackage[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

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
                  <motion.p
                    key="msg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 text-sm text-[#194f4c]/80 dark:text-[#a8d5d1]/80 leading-relaxed overflow-hidden"
                  >
                    {pkg.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
