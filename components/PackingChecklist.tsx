import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';
import type { ChecklistItem } from '../types';

const DEFAULT_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'doc-1', label: 'Passports (valid 6+ months)', category: 'documents' },
  { id: 'doc-2', label: 'Flight tickets / boarding passes', category: 'documents' },
  { id: 'doc-3', label: 'Car rental confirmation', category: 'documents' },
  { id: 'doc-4', label: 'Hotel reservations (printed/offline)', category: 'documents' },
  { id: 'doc-5', label: 'Travel insurance documents', category: 'documents' },
  { id: 'doc-6', label: 'International driving permit', category: 'documents' },
  { id: 'doc-7', label: 'Credit/debit cards + notify bank', category: 'documents' },
  { id: 'cloth-1', label: 'Comfortable walking shoes', category: 'clothing' },
  { id: 'cloth-2', label: 'Light layers (May evenings are cool)', category: 'clothing' },
  { id: 'cloth-3', label: 'Sun hat / cap', category: 'clothing' },
  { id: 'cloth-4', label: 'Swimwear (thermal springs!)', category: 'clothing' },
  { id: 'cloth-5', label: 'Anniversary dinner outfit', category: 'clothing' },
  { id: 'cloth-6', label: 'Rain jacket (light, packable)', category: 'clothing' },
  { id: 'tech-1', label: 'Phone chargers + cables', category: 'tech' },
  { id: 'tech-2', label: 'EU power adapters (Type C/F)', category: 'tech' },
  { id: 'tech-3', label: 'Portable battery pack', category: 'tech' },
  { id: 'tech-4', label: 'Camera + memory cards', category: 'tech' },
  { id: 'tech-5', label: 'Car phone mount (for navigation)', category: 'tech' },
  { id: 'toil-1', label: 'Sunscreen SPF 50', category: 'toiletries' },
  { id: 'toil-2', label: 'Medications / first aid kit', category: 'toiletries' },
  { id: 'toil-3', label: 'Insect repellent', category: 'toiletries' },
  { id: 'misc-1', label: 'Reusable water bottles', category: 'misc' },
  { id: 'misc-2', label: 'Small daypack / bag', category: 'misc' },
  { id: 'misc-3', label: 'Offline Google Maps downloaded', category: 'misc' },
  { id: 'misc-4', label: 'Anniversary gift / card', category: 'misc' },
  { id: 'misc-5', label: 'Coins for tolls & parking meters', category: 'misc' },
];

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  documents: { label: 'Documents', icon: '📄' },
  clothing: { label: 'Clothing', icon: '👕' },
  tech: { label: 'Tech & Gadgets', icon: '🔌' },
  toiletries: { label: 'Toiletries', icon: '🧴' },
  misc: { label: 'Miscellaneous', icon: '🎒' },
};

const categories = ['documents', 'clothing', 'tech', 'toiletries', 'misc'] as const;

const PackingChecklist: React.FC = () => {
  const { checklist, setChecklist, toggleChecklistItem, addChecklistItem, removeChecklistItem,
    currentUser, partnerUser, tripMeta } = useStore();
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistItem['category']>('misc');
  const [filter, setFilter] = useState<'all' | 'mine' | 'theirs' | 'unclaimed'>('all');

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  // Initialize default items if checklist is empty
  useEffect(() => {
    if (checklist.length === 0) {
      setChecklist(DEFAULT_ITEMS.map((item) => ({ ...item, checked: false })));
    }
  }, [checklist.length, setChecklist]);

  const handleClaim = (itemId: string) => {
    if (!myUid || !tripMeta) return;
    const item = checklist.find(i => i.id === itemId);
    if (!item) return;
    const claimedBy = item.claimedBy === myUid ? undefined : myUid;
    writeDoc(`trips/${tripMeta.id}/checklist/${itemId}`, { ...item, claimedBy }).catch(() => {});
  };

  const handleAddItem = () => {
    const label = newItem.trim();
    if (!label) return;
    addChecklistItem({
      id: `custom-${Date.now()}`,
      label,
      category: newCategory,
      checked: false,
    });
    setNewItem('');
  };

  // Filter items
  const filteredChecklist = checklist.filter(item => {
    if (filter === 'mine') return item.claimedBy === myUid;
    if (filter === 'theirs') return item.claimedBy === partnerUid;
    if (filter === 'unclaimed') return !item.claimedBy;
    return true;
  });

  // Per-user progress
  const myItems = checklist.filter(i => i.claimedBy === myUid);
  const myPacked = myItems.filter(i => i.checked).length;
  const partnerItems = checklist.filter(i => i.claimedBy === partnerUid);
  const partnerPacked = partnerItems.filter(i => i.checked).length;
  const totalChecked = checklist.filter(i => i.checked).length;
  const totalProgress = checklist.length > 0 ? (totalChecked / checklist.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">
            Pre-Trip
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold text-[#194f4c] dark:text-white mb-4">
            Packing List
          </h2>
        </div>

        {/* Dual progress bars */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
          <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <UserAvatar user={currentUser} size="sm" showName />
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full">
              <div className="h-full bg-[#194f4c] rounded-full transition-all" style={{ width: `${myItems.length ? (myPacked / myItems.length) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">{myPacked}/{myItems.length} packed</span>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <UserAvatar user={partnerUser} size="sm" showName />
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full">
              <div className="h-full bg-[#ac3d29] rounded-full transition-all" style={{ width: `${partnerItems.length ? (partnerPacked / partnerItems.length) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">{partnerPacked}/{partnerItems.length} packed</span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="max-w-xs mx-auto mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{totalChecked}/{checklist.length} total</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#194f4c] to-[#ac3d29] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {totalProgress === 100 && (
            <p className="text-emerald-500 text-xs font-bold mt-2 text-center">
              All packed! Pronto per l&apos;Italia!
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex justify-center gap-1 mb-6 p-1 bg-slate-100 dark:bg-white/5 rounded-full max-w-sm mx-auto">
          {(['all', 'mine', 'theirs', 'unclaimed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-[#194f4c] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f === 'theirs' ? (partnerUser?.displayName?.split(' ')[0] || 'Partner') + "'s" : f}
            </button>
          ))}
        </div>

        {/* Add custom item */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/10">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="Add custom item..."
            className="flex-1 px-4 py-2 bg-transparent text-slate-900 dark:text-white text-sm outline-none"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as ChecklistItem['category'])}
            className="px-3 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-[#194f4c] text-white rounded-xl font-bold text-sm"
          >
            Add
          </button>
        </div>

        {/* Categories */}
        {categories.map((cat) => {
          const items = filteredChecklist.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const catChecked = items.filter((i) => i.checked).length;

          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">{meta.icon}</span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  {meta.label}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {catChecked}/{items.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const claimedByMe = item.claimedBy === myUid;
                  const claimedByPartner = item.claimedBy === partnerUid;
                  const claimUser = claimedByMe ? currentUser : claimedByPartner ? partnerUser : null;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                        item.checked
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                          : claimedByMe
                            ? 'bg-white dark:bg-white/5 border-[#194f4c]/20'
                            : claimedByPartner
                              ? 'bg-white dark:bg-white/5 border-[#ac3d29]/20'
                              : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5'
                      }`}
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                          item.checked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-white/20'
                        }`}
                      >
                        {item.checked && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          item.checked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Claim indicator or button */}
                      {claimUser ? (
                        <UserAvatar user={claimUser} size="sm" />
                      ) : (
                        <button
                          onClick={() => handleClaim(item.id)}
                          className="text-[9px] font-bold text-slate-300 dark:text-slate-600 hover:text-[#194f4c] dark:hover:text-emerald-400 uppercase tracking-wider transition-colors"
                        >
                          Claim
                        </button>
                      )}

                      {/* Unclaim if mine */}
                      {claimedByMe && !item.checked && (
                        <button
                          onClick={() => handleClaim(item.id)}
                          className="text-[9px] text-slate-300 hover:text-red-400 transition-colors"
                          title="Unclaim"
                        >
                          ×
                        </button>
                      )}

                      {item.id.startsWith('custom-') && (
                        <button
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PackingChecklist;
