import React, { useState } from 'react';
import { writeDoc } from '../services/firestoreSync';

export interface FeedComment {
  id: string;
  authorUid: string;
  authorName: string;
  color?: string;
  message: string;
  timestamp: number;
}

export interface FeedIdentity {
  uid: string;
  name: string;
  color: string;
  isOwner: boolean;
}

interface Props {
  tripId: string;
  feedId: string;
  identity: FeedIdentity | null;
  onAskIdentity: () => void;
  /** Map of uid → timestamp for likes on this feed item. */
  likes: Record<string, number>;
  /** Comments on this feed item (already sorted oldest→newest). */
  comments: FeedComment[];
}

const genId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function relTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const FeedEntryActions: React.FC<Props> = ({ tripId, feedId, identity, onAskIdentity, likes, comments }) => {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);

  const likeCount = Object.keys(likes).length;
  const youLiked = identity ? !!likes[identity.uid] : false;

  const toggleLike = async () => {
    if (!identity) { onAskIdentity(); return; }
    const next = { ...likes };
    if (youLiked) delete next[identity.uid];
    else next[identity.uid] = Date.now();
    try {
      await writeDoc(`trips/${tripId}/feedLikes/${feedId}`, next);
    } catch (e) {
      console.warn('[FeedActions] like failed:', e);
    }
  };

  const sendComment = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!identity) { onAskIdentity(); return; }
    setSending(true);
    try {
      const newComment: FeedComment = {
        id: genId(),
        authorUid: identity.uid,
        authorName: identity.name,
        color: identity.color,
        message: text,
        timestamp: Date.now(),
      };
      const merged = [...comments, newComment].slice(-50); // hard cap to keep doc under 1 MB
      await writeDoc(`trips/${tripId}/feedComments/${feedId}`, { entries: merged });
      setDraft('');
    } catch (e) {
      console.warn('[FeedActions] comment failed:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
      {/* Action row */}
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 transition-transform active:scale-95 ${
            youLiked ? 'text-[#ac3d29]' : 'text-gray-500 dark:text-gray-400 hover:text-[#ac3d29]'
          }`}
          aria-label={youLiked ? 'Unlike' : 'Like'}
        >
          <span aria-hidden style={{ fontSize: '14px' }}>{youLiked ? '❤️' : '🤍'}</span>
          {likeCount > 0 && <span className="font-semibold">{likeCount}</span>}
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[#194f4c] dark:hover:text-teal-300"
        >
          <span aria-hidden>💬</span>
          <span className="font-semibold">{comments.length}</span>
          <span className="text-[10px] uppercase tracking-widest">{expanded ? 'hide' : (comments.length ? 'view' : 'comment')}</span>
        </button>
      </div>

      {/* Comment list + composer */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {comments.length > 0 && (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 items-start">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: c.color || '#194f4c' }}
                  >
                    {c.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.authorName}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{relTime(c.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
              placeholder={identity ? `Comment as ${identity.name}…` : 'Comment…'}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#194f4c]"
            />
            <button
              onClick={sendComment}
              disabled={sending || !draft.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#194f4c] text-white text-[11px] font-bold hover:bg-[#133b39] disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedEntryActions;
