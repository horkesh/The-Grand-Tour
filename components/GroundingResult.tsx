
import React from 'react';
import { GroundingChunk } from '../types';
import { Icons } from '../constants';

interface GroundingResultProps {
  chunks: GroundingChunk[];
  cityId: string;
  onSavePOI: (poi: { title: string, uri: string, description?: string }) => void;
  isSaved?: (uri: string) => boolean;
}

const GroundingResult: React.FC<GroundingResultProps> = ({ chunks, cityId, onSavePOI, isSaved }) => {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Icons.Compass />
        Verified Places & Sources
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {chunks.map((chunk, index) => {
          if (chunk.maps) {
            // Use fallback empty string for uri check
            const alreadySaved = isSaved?.(chunk.maps.uri || '');
            return (
              <div
                key={index}
                className="block p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group relative"
              >
                <div className="flex justify-between items-start mb-1 pr-8">
                  <a 
                    href={chunk.maps.uri || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                  >
                    {chunk.maps.title || 'Unknown Place'}
                  </a>
                  <Icons.Map />
                </div>
                {/* Safe access to placeAnswerSources as any after type update in types.ts */}
                {chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.text && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{chunk.maps.placeAnswerSources.reviewSnippets[0].text}"
                  </p>
                )}
                
                <div className="mt-3 flex items-center justify-between gap-2">
                  <a 
                    href={chunk.maps.uri || '#'}
                    target="_blank"
                    className="text-[10px] text-blue-500 dark:text-blue-400 font-medium hover:underline"
                  >
                    View Map &rarr;
                  </a>
                  <button
                    onClick={() => onSavePOI({ 
                      title: chunk.maps!.title || 'Unknown Place', 
                      uri: chunk.maps!.uri || '',
                      // Safe access to review snippet text
                      description: chunk.maps!.placeAnswerSources?.reviewSnippets?.[0]?.text
                    })}
                    disabled={alreadySaved}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      alreadySaved 
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-default' 
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    {alreadySaved ? '✓ Saved' : '+ Add to Trip'}
                  </button>
                </div>
              </div>
            );
          }
          if (chunk.web) {
            return (
              <a
                key={index}
                href={chunk.web.uri || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 truncate">
                    {chunk.web.title || 'Source'}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-emerald-50 dark:text-emerald-900/30 font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {chunk.web.uri || ''}
                </div>
                <div className="mt-1 text-[10px] text-emerald-500 font-medium truncate">
                   Visit Site &rarr;
                </div>
              </a>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default GroundingResult;
