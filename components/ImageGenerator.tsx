import React, { useEffect, useState } from 'react';
import { ITALIAN_CITIES } from '../constants';
import { useStore } from '../store';
import { generateLocationImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const { waypointImages, setWaypointImage } = useStore();
  const [queue, setQueue] = useState<{ key: string; prompt: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // 1. Build the Queue on Mount
  useEffect(() => {
    const newQueue: { key: string; prompt: string }[] = [];

    ITALIAN_CITIES.forEach((city) => {
      // Main City Image
      if (!waypointImages[city.id]) {
        newQueue.push({
          key: city.id,
          prompt: `A cinematic, wide-angle travel photography shot of ${city.location}, Italy. Golden hour, warm lighting, highly detailed, 8k resolution, photorealistic style.`
        });
      }

      // Stop Images
      city.plannedStops.forEach((stop, idx) => {
        const key = `${city.id}_${idx}`;
        if (!waypointImages[key]) {
          newQueue.push({
            key,
            prompt: `A cinematic travel photography close-up of ${stop.title} in ${city.location}, Italy. Photorealistic, soft sunlight, highly detailed, postcard aesthetic.`
          });
        }
      });
    });

    if (newQueue.length > 0) {
      console.log(`[ImageGenerator] Queuing ${newQueue.length} images for generation.`);
      setQueue(newQueue);
      setProgress({ current: 0, total: newQueue.length });
    }
  }, []); // Run once on mount to check gaps

  // 2. Process Queue
  useEffect(() => {
    if (queue.length === 0 || isProcessing) return;

    const processNext = async () => {
      setIsProcessing(true);
      const item = queue[0];
      
      try {
        // Double check in case it was generated elsewhere in the meantime
        if (!waypointImages[item.key]) {
        //   console.log(`[ImageGenerator] Generating: ${item.key}`);
          const img = await generateLocationImage(item.prompt);
          setWaypointImage(item.key, img);
        }
      } catch (err) {
        console.error(`[ImageGenerator] Failed ${item.key}:`, err);
        // Move to back of queue to retry later? Or just drop?
        // For now, we drop it to prevent blocking the queue.
      } finally {
        setQueue((prev) => prev.slice(1));
        setProgress(p => ({ ...p, current: p.current + 1 }));
        
        // Rate Limit Protection: Wait 4 seconds between generations
        setTimeout(() => {
          setIsProcessing(false);
        }, 4000);
      }
    };

    processNext();
  }, [queue, isProcessing, waypointImages, setWaypointImage]);

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-pulse">
        <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                {Math.round((progress.current / progress.total) * 100)}%
            </div>
        </div>
        <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Curating Gallery</p>
            <p className="text-xs font-serif font-bold text-slate-800 dark:text-white">Developing photos...</p>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;