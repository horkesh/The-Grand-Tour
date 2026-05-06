import React, { useEffect, useMemo, useState } from 'react';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import { FeedIdentity } from './FeedEntryActions';

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
  { id: 'ch14', title: 'Us × 20',         emoji: '\u{1F4F7}' },
  { id: 'ch15', title: 'Tiny Street',         emoji: '\u{1F3D8}️' },
  { id: 'ch16', title: 'Anniversary Selfie',  emoji: '❤️' },
];

interface TripUserLite { uid: string; displayName?: string; color?: string }

interface Props {
  tripId: string;
  authReady: boolean;
  identity: FeedIdentity | null;
  onAskIdentity: () => void;
}

const PhotoChallengesGallery: React.FC<Props> = ({ tripId, authReady, identity, onAskIdentity }) => {
  const [completions, setCompletions] = useState<Record<string, Record<string, string>>>({});
  // Per-challenge votes: { [challengeId]: { [voterUid]: ownerUidVotedFor } }
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
  // Trip users so we can show the photographer's name + colour under each entry.
  const [users, setUsers] = useState<Record<string, TripUserLite>>({});
  const [openChallenge, setOpenChallenge] = useState<string | null>(null);

  // ---- Listeners ----
  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/challenges`, (docs) => {
      const map: Record<string, Record<string, string>> = {};
      for (const d of docs) map[d.id] = (d.data as { completions?: Record<string, string> }).completions || {};
      setCompletions(map);
    });
  }, [tripId, authReady]);

  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/challengeVotes`, (docs) => {
      const map: Record<string, Record<string, string>> = {};
      for (const d of docs) map[d.id] = (d.data as Record<string, string>) || {};
      setVotes(map);
    });
  }, [tripId, authReady]);

  useEffect(() => {
    if (!tripId || !authReady) return;
    return listenCollection(`trips/${tripId}/users`, (docs) => {
      const map: Record<string, TripUserLite> = {};
      for (const d of docs) {
        const data = d.data as TripUserLite;
        map[d.id] = { uid: d.id, displayName: data.displayName, color: data.color };
      }
      setUsers(map);
    });
  }, [tripId, authReady]);

  // Voting writes the entire votes-doc back. Tapping the same photo again
  // unvotes (deletes the voter's entry).
  const castVote = async (challengeId: string, ownerUid: string) => {
    if (!identity) { onAskIdentity(); return; }
    const current = { ...(votes[challengeId] || {}) };
    if (current[identity.uid] === ownerUid) delete current[identity.uid];
    else current[identity.uid] = ownerUid;
    try {
      await writeDoc(`trips/${tripId}/challengeVotes/${challengeId}`, current);
    } catch (e) { console.warn('[PhotoChallengesGallery] vote failed:', e); }
  };

  // For each challenge, get the two submissions in stable order: pinned by
  // colour ('teal' first if present, then 'rust', then anything else) so
  // 'Haris' tends to be on the left and 'Maja' on the right consistently.
  const orderedSubmissions = (challengeId: string): Array<{ uid: string; url: string; user?: TripUserLite }> => {
    const entries = Object.entries(completions[challengeId] || {}) as Array<[string, string]>;
    const enriched = entries.map(([uid, url]) => ({ uid, url, user: users[uid] }));
    return enriched.sort((a, b) => {
      const ac = a.user?.color === 'teal' ? 0 : a.user?.color === 'rust' ? 1 : 2;
      const bc = b.user?.color === 'teal' ? 0 : b.user?.color === 'rust' ? 1 : 2;
      return ac - bc;
    });
  };

  const challengesWithEntries = useMemo(
    () => CHALLENGES.filter((ch) => Object.keys(completions[ch.id] || {}).length > 0),
    [completions],
  );

  if (challengesWithEntries.length === 0) return null;

  return (
    <section className="max-w-xl mx-auto w-full px-4 pb-6">
      <h2
        className="font-serif text-lg text-[#194f4c] dark:text-teal-300 mt-4 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Photo Challenges
      </h2>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 italic">
        Tap a heart to vote for your favourite. {challengesWithEntries.length} challenges live.
      </p>

      <div className="space-y-3">
        {challengesWithEntries.map((ch) => {
          const subs = orderedSubmissions(ch.id);
          const chVotes = votes[ch.id] || {};
          const totalVotes = Object.keys(chVotes).length;
          const isOpen = openChallenge === ch.id;
          return (
            <div key={ch.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenChallenge(isOpen ? null : ch.id)}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
              >
                <span className="text-xl shrink-0" aria-hidden>{ch.emoji}</span>
                <span className="flex-1 font-bold text-sm text-gray-900 dark:text-gray-100">{ch.title}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                  {subs.length} entr{subs.length === 1 ? 'y' : 'ies'}
                  {totalVotes > 0 && ` · ${totalVotes} vote${totalVotes === 1 ? '' : 's'}`}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                  {subs.map(({ uid, url, user }) => {
                    const voteCount = Object.values(chVotes).filter((v) => v === uid).length;
                    const youVoted = identity ? chVotes[identity.uid] === uid : false;
                    return (
                      <div key={uid} className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="aspect-square">
                          <img src={url} alt={user?.displayName || 'submission'} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="px-2 py-2 flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: user?.color === 'rust' ? '#ac3d29' : user?.color === 'teal' ? '#194f4c' : '#9ca3af' }}
                          />
                          <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {user?.displayName?.split(' ')[0] || 'Player'}
                          </span>
                          <button
                            onClick={() => castVote(ch.id, uid)}
                            className={`ml-auto inline-flex items-center gap-1 transition-transform active:scale-95 ${
                              youVoted ? 'text-[#ac3d29]' : 'text-gray-400 hover:text-[#ac3d29]'
                            }`}
                            aria-label={youVoted ? 'Unvote' : 'Vote for this photo'}
                          >
                            <span aria-hidden style={{ fontSize: '14px' }}>{youVoted ? '❤️' : '🤍'}</span>
                            {voteCount > 0 && <span className="text-[11px] font-bold">{voteCount}</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PhotoChallengesGallery;
