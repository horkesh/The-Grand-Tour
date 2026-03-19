import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ITALIAN_CITIES, Icons } from '../constants';
import { writeDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { savedPOIs, addSavedPOI, removeSavedPOI, wishlistNotes, setWishlistNote,
    currentUser, partnerUser, tripMeta } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newCityId, setNewCityId] = useState(ITALIAN_CITIES[0].id);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const id = `wish-${Date.now()}`;
    addSavedPOI({
      id,
      cityId: newCityId,
      title: newTitle.trim(),
      uri: '',
      timestamp: Date.now(),
      notes: newNote.trim() || undefined,
      addedBy: myUid,
    });
    if (newNote.trim()) {
      setWishlistNote(id, newNote.trim());
    }
    setNewTitle('');
    setNewNote('');
    setShowAddForm(false);
  };

  const handleVote = (poiId: string, vote: 'up' | 'down') => {
    if (!myUid || !tripMeta) return;
    const poi = savedPOIs.find(p => p.id === poiId);
    if (!poi) return;
    // Toggle: if already voted the same way, remove vote
    const currentVote = poi.votes?.[myUid];
    const newVote = currentVote === vote ? undefined : vote;
    const newVotes = { ...poi.votes, [myUid]: newVote };
    writeDoc(`trips/${tripMeta.id}/pois/${poiId}`, { votes: newVotes }).catch(() => {});
  };

  // Group by city, sort "both want" items first
  const grouped = ITALIAN_CITIES.map((city) => ({
    city,
    pois: savedPOIs
      .filter((p) => p.cityId === city.id)
      .sort((a, b) => {
        const aBoth = a.votes?.[myUid] === 'up' && a.votes?.[partnerUid] === 'up' ? 1 : 0;
        const bBoth = b.votes?.[myUid] === 'up' && b.votes?.[partnerUid] === 'up' ? 1 : 0;
        return bBoth - aBoth;
      }),
  })).filter((g) => g.pois.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Pre-Trip Planning
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold text-[#194f4c] dark:text-white mb-2">
            Our Wishlist
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {savedPOIs.length} places saved · Vote on your favorites
          </p>
        </div>

        {/* Add button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-[#194f4c] text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
          >
            {showAddForm ? 'Cancel' : '+ Add a Place'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111] rounded-2xl shadow-xl p-6 mb-8 border border-slate-200 dark:border-white/10"
          >
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  Place Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder='e.g., "That gelato place near the Duomo"'
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white text-sm outline-none border border-slate-200 dark:border-white/10 focus:border-[#194f4c]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  For which day?
                </label>
                <select
                  value={newCityId}
                  onChange={(e) => setNewCityId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white text-sm outline-none border border-slate-200 dark:border-white/10"
                >
                  {ITALIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {c.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  Notes (optional)
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="I heard this place is amazing for..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white text-sm outline-none border border-slate-200 dark:border-white/10 resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm"
              >
                Save to Wishlist
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {grouped.length === 0 && !showAddForm && (
          <div className="text-center py-16 text-slate-400">
            <span className="text-4xl block mb-4">📌</span>
            <p className="font-serif text-lg">No places saved yet.</p>
            <p className="text-sm mt-1">
              Add restaurants, sights, or hidden gems you want to visit!
            </p>
          </div>
        )}

        {/* Grouped list */}
        {grouped.map(({ city, pois }) => (
          <div key={city.id} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-serif text-lg font-bold text-[#194f4c] dark:text-white">
                {city.location}
              </h3>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                Day {ITALIAN_CITIES.indexOf(city) + 1} · {pois.length} place{pois.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {pois.map((poi) => {
                const myVote = poi.votes?.[myUid];
                const partnerVote = poi.votes?.[partnerUid];
                const bothWant = myVote === 'up' && partnerVote === 'up';
                const addedByUser = poi.addedBy === myUid ? currentUser : poi.addedBy === partnerUid ? partnerUser : null;

                return (
                  <div
                    key={poi.id}
                    className={`bg-white dark:bg-white/5 rounded-xl p-4 border ${
                      bothWant
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-slate-100 dark:border-white/5'
                    } flex items-start gap-4`}
                  >
                    <div className="w-8 h-8 bg-[#194f4c]/10 rounded-lg flex items-center justify-center text-[#194f4c] shrink-0 mt-0.5">
                      <Icons.Map />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {poi.title}
                        </h4>
                        {bothWant && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-full">
                            Both want this!
                          </span>
                        )}
                      </div>

                      {/* Added by */}
                      {addedByUser && (
                        <div className="flex items-center gap-1 mb-1">
                          <UserAvatar user={addedByUser} size="sm" />
                          <span className="text-[9px] text-slate-400">added this</span>
                        </div>
                      )}

                      {/* Editable note */}
                      {editingNote === poi.id ? (
                        <div className="mt-2">
                          <textarea
                            autoFocus
                            defaultValue={poi.notes || wishlistNotes[poi.id] || ''}
                            onBlur={(e) => {
                              setWishlistNote(poi.id, e.target.value);
                              setEditingNote(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                setWishlistNote(poi.id, (e.target as HTMLTextAreaElement).value);
                                setEditingNote(null);
                              }
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none border border-[#194f4c]/30 resize-none"
                          />
                        </div>
                      ) : (
                        <p
                          onClick={() => setEditingNote(poi.id)}
                          className="text-xs text-slate-400 dark:text-slate-500 mt-1 cursor-pointer hover:text-slate-600 italic"
                        >
                          {poi.notes || wishlistNotes[poi.id] || 'Tap to add a note...'}
                        </p>
                      )}

                      {/* Partner vote indicator */}
                      {partnerVote && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <UserAvatar user={partnerUser} size="sm" />
                          <span className="text-[9px] text-slate-400">
                            voted {partnerVote === 'up' ? '👍' : '👎'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Vote buttons + actions */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleVote(poi.id, 'up')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                          myVote === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-emerald-50'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleVote(poi.id, 'down')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                          myVote === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-50'
                        }`}
                      >
                        👎
                      </button>
                      {poi.uri && (
                        <a
                          href={poi.uri}
                          target="_blank"
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Icons.External />
                        </a>
                      )}
                      <button
                        onClick={() => removeSavedPOI(poi.id)}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate(`/day/${city.id}`)}
              className="mt-3 text-xs font-bold text-[#194f4c] dark:text-emerald-400 uppercase tracking-widest hover:underline"
            >
              View Day {ITALIAN_CITIES.indexOf(city) + 1} Dashboard →
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Wishlist;
