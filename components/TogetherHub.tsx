import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';
import { useStore } from '../store';
import UserAvatar from './UserAvatar';
import { useToast } from './Toast';
import VoiceRecorder from './VoiceRecorder';

const TogetherHub: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { currentUser, partnerUser, tripMeta, shareLivePosition, toggleShareLivePosition, sendVoiceUpdate } = useStore();
  const [shareCopied, setShareCopied] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const familyJoinUrl = tripMeta?.joinCode
    ? `${window.location.origin}/#/family/join/${tripMeta.joinCode}`
    : '';

  const handleShareFamily = async () => {
    if (!familyJoinUrl) return;
    const shareData = {
      title: 'Our Italian Anniversary Trip',
      text: 'Follow our trip and send us notes from home — tap to join 💌',
      url: familyJoinUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(familyJoinUrl);
        setShareCopied(true);
        showToast('Link copied — paste it anywhere to share', 'success');
        setTimeout(() => setShareCopied(false), 2200);
      }
    } catch {
      // User cancelled the share sheet — silent
    }
  };

  const cards = [
    { path: '/gioco', label: 'Piazza Puzzle', subtitle: 'Daily block challenge', icon: <Icons.Puzzle />, color: 'bg-[#ac3d29]' },
    { path: '/preferences', label: 'Our Preferences', subtitle: 'Rate trip categories together', icon: <Icons.Hearts />, color: 'bg-[#ac3d29]' },
    { path: '/trivia', label: 'Italy Trivia', subtitle: 'Who knows Italy better?', icon: <Icons.Lightbulb />, color: 'bg-[#194f4c]' },
    { path: '/challenges', label: 'Photo Challenges', subtitle: '16 creative missions', icon: <Icons.Camera />, color: 'bg-[#194f4c]' },
    { path: '/phrases', label: 'Learn Italian', subtitle: 'Practice phrases', icon: <Icons.Language />, color: 'bg-slate-700' },
    { path: '/together/live', label: 'Live + Family', subtitle: 'Map, photos, notes from family', icon: <Icons.Live />, color: 'bg-slate-700' },
    { path: '/photos', label: 'Refresh photos', subtitle: 'Re-fetch place photos / unblock cache', icon: <Icons.Camera />, color: 'bg-slate-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">Together</p>
          <h2 className="font-serif text-3xl font-bold text-[#194f4c] dark:text-white">Us</h2>
        </div>

        {/* Partner status card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" showName />
            <span className="text-slate-300 dark:text-slate-500 font-serif text-lg">&amp;</span>
            <UserAvatar user={partnerUser} size="md" showName />
          </div>
          {partnerUser ? (
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Connected</span>
          ) : tripMeta?.joinCode ? (
            <div className="text-right">
              <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Join Code</p>
              <p className="font-mono text-sm font-bold text-[#194f4c] tracking-[0.2em]">{tripMeta.joinCode}</p>
            </div>
          ) : null}
        </div>

        {/* Share with family */}
        {familyJoinUrl && (
          <button
            onClick={handleShareFamily}
            className="w-full mb-6 flex items-center justify-between gap-3 bg-gradient-to-br from-[#194f4c] to-[#0f3a37] text-white rounded-2xl px-5 py-4 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">
                💌
              </div>
              <div>
                <p className="text-sm font-bold">Share with Family</p>
                <p className="text-[11px] text-white/70">One tap — no codes for them to enter</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/15 px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
              {shareCopied ? '✓ Copied' : 'Share'}
            </span>
          </button>
        )}

        {/* Voice update to family */}
        {tripMeta && (
          <div className="mb-3 bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/5">
            {!showRecorder ? (
              <button
                onClick={() => setShowRecorder(true)}
                className="w-full flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#ac3d29]/10 dark:bg-[#ac3d29]/20 flex items-center justify-center text-xl shrink-0">
                    🎙️
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Voice update for family</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">A quick hello, lands in their feed</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#ac3d29]/10 text-[#ac3d29] px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
                  Record
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <VoiceRecorder
                  onRecorded={(dataUrl, durationSec) => {
                    sendVoiceUpdate(dataUrl, durationSec);
                    setShowRecorder(false);
                    showToast('Voice note sent to family ✓', 'success');
                  }}
                />
                <button
                  onClick={() => setShowRecorder(false)}
                  className="w-full text-[11px] text-slate-500 dark:text-slate-400 py-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live position toggle */}
        <div className="mb-6 flex items-center justify-between gap-3 bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-3 border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#194f4c]/10 dark:bg-emerald-900/20 flex items-center justify-center text-base shrink-0">
              📍
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Live position</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {shareLivePosition ? 'Family sees a pulsing dot of where you are' : 'Paused — your location stays private'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleShareLivePosition}
            role="switch"
            aria-checked={shareLivePosition}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              shareLivePosition ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                shareLivePosition ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.button
              key={card.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(card.path)}
              className={`${card.color} rounded-2xl p-5 text-left text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                {card.icon}
              </div>
              <h3 className="font-bold text-sm">{card.label}</h3>
              <p className="text-[10px] text-white/60 mt-0.5">{card.subtitle}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TogetherHub;
