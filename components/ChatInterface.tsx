import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SavedPOI } from '../types';
import { enrichTripPlan } from '../services/geminiService';
import { fetchPlacePhoto } from '../services/placesService';
import { useStore } from '../store';
import { ITALIAN_CITIES } from '../constants';
import GroundingResult from './GroundingResult';
import { useToast } from './Toast';
import UserAvatar from './UserAvatar';

const ChatInterface: React.FC = () => {
  const { userLocation, savedPOIs, addSavedPOI, updateSavedPOIPhoto, chatMessages, addChatMessage, clearChatMessages, currentUser, partnerUser } = useStore();
  const showToast = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      sentBy: currentUser?.uid,
      senderName: currentUser?.displayName,
      timestamp: Date.now(),
    };

    addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const result = await enrichTripPlan(text, userLocation);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text,
        grounding: result.grounding,
      };
      addChatMessage(assistantMsg);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error while exploring the map for you. Please try again.",
      };
      addChatMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isSaved = (uri: string) => savedPOIs.some(poi => poi.uri === uri);
  const getPhotoUrl = (uri: string) => savedPOIs.find(poi => poi.uri === uri)?.photoUrl;
  
  const findNearestCityId = (lat?: number, lng?: number): string => {
    if (lat == null || lng == null) return 'planned';
    let best = 'planned';
    let bestDist = Infinity;
    for (const city of ITALIAN_CITIES) {
      const dlat = city.center.lat - lat;
      const dlng = city.center.lng - lng;
      const dist = dlat * dlat + dlng * dlng;
      if (dist < bestDist) {
        bestDist = dist;
        best = city.id;
      }
    }
    // Only associate if within ~50km (roughly 0.5 degrees)
    return bestDist < 0.25 ? best : 'planned';
  };

  const handleSavePOI = (poi: { title: string, uri: string, description?: string, lat?: number, lng?: number }) => {
    const poiId = Date.now().toString();
    const newPoi: SavedPOI = {
      ...poi,
      id: poiId,
      cityId: findNearestCityId(poi.lat, poi.lng),
      timestamp: Date.now(),
    };
    addSavedPOI(newPoi);
    showToast(`Saved: ${poi.title}`, 'success');

    // Fetch photo in background
    if (poi.lat != null && poi.lng != null) {
      fetchPlacePhoto(poi.title, poi.lat, poi.lng)
        .then((photoUrl) => updateSavedPOIPhoto(poiId, photoUrl))
        .catch((err) => console.warn('[POI Photo] Failed to fetch:', err));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d0d0d] border-none rounded-3xl overflow-hidden shadow-inner transition-colors duration-300">
      {chatMessages.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{chatMessages.length} messages</span>
          <button onClick={clearChatMessages} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-red-500 dark:hover:text-red-400 transition-colors">Clear</button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
        {chatMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-4">
            <div className="bg-slate-200 dark:bg-white/5 p-6 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-center max-w-xs text-sm font-medium">
              Ask about restaurants, hidden gems, or navigation details for your trip to Italy.
            </p>
          </div>
        )}

        {chatMessages.map((msg) => {
          const isMine = msg.role === 'user' && msg.sentBy === currentUser?.uid;
          const isPartners = msg.role === 'user' && msg.sentBy != null && msg.sentBy !== currentUser?.uid;
          const senderUser = isMine ? currentUser : isPartners ? partnerUser : null;

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[90%] md:max-w-[85%]">
                {msg.role === 'user' && senderUser && (
                  <div className="flex items-center gap-1.5 mb-1 justify-end">
                    <UserAvatar user={senderUser} size="sm" showName />
                  </div>
                )}
                <div className={`rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? isMine || !isPartners
                      ? 'bg-[#194f4c] dark:bg-[#194f4c]/90 text-white rounded-br-none'
                      : 'bg-[#ac3d29] dark:bg-[#ac3d29]/90 text-white rounded-br-none'
                    : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-white/10'
                }`}>
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate dark:prose-invert'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.grounding && (
                    <GroundingResult
                      chunks={msg.grounding}
                      onSavePOI={handleSavePOI}
                      isSaved={isSaved}
                      getPhotoUrl={getPhotoUrl}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              Exploring maps & reviews...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-black/50 border-t border-slate-200 dark:border-white/10 backdrop-blur-md transition-colors duration-300">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the trip..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-slate-700 dark:text-slate-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default ChatInterface;
