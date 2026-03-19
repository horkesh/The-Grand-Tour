import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { ITALIAN_CITIES, ANNIVERSARY_DAY_ID } from '../constants';
import { useCountdown } from '../hooks/useCountdown';
import { exportAndShare } from '../export/exporter';
import { CountdownCard } from '../export/templates/CountdownCard';
import { DayCard } from '../export/templates/DayCard';
import { StampCollectionPage } from '../export/templates/StampCollectionPage';
import { PostcardGrid } from '../export/templates/PostcardGrid';
import { TripSummaryCard } from '../export/templates/TripSummaryCard';

type TemplateType = 'countdown' | 'day' | 'stamps' | 'postcards' | 'summary';

interface ExportHubProps {
  open: boolean;
  onClose: () => void;
}

const ExportHub: React.FC<ExportHubProps> = ({ open, onClose }) => {
  const { stamps, postcards, weatherData, waypointImages } = useStore();
  const { days } = useCountdown();
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('countdown');
  const [selectedDay, setSelectedDay] = useState(0);
  const [exporting, setExporting] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const totalPostcards = Object.values(postcards).flat().length;

  const allImages = Object.entries(postcards).flatMap(([key, urls]) => {
    const [cityId, stopIdxStr] = key.split('_');
    const city = ITALIAN_CITIES.find((c) => c.id === cityId);
    let cityName = city ? city.location : 'Italy';
    if (city && stopIdxStr !== undefined) {
      const stop = city.plannedStops[parseInt(stopIdxStr)];
      if (stop) cityName = stop.title;
    }
    return (urls as string[]).map((url) => ({ url, cityName }));
  });

  const handleExport = useCallback(async () => {
    if (!templateRef.current || exporting) return;
    setExporting(true);
    try {
      const filename = `grand-tour-${activeTemplate}${activeTemplate === 'day' ? `-${selectedDay + 1}` : ''}.png`;
      await exportAndShare(templateRef.current, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [activeTemplate, selectedDay, exporting]);

  const city = ITALIAN_CITIES[selectedDay];
  const dayStamps = city
    ? [city.id, ...city.plannedStops.map((_, i) => `${city.id}_${i}`)].filter((s) =>
        stamps.includes(s),
      ).length
    : 0;

  const templates: Array<{ id: TemplateType; label: string; icon: string }> = [
    { id: 'countdown', label: 'Countdown', icon: '⏳' },
    { id: 'day', label: 'Day Card', icon: '📍' },
    { id: 'stamps', label: 'Passport', icon: '📕' },
    { id: 'postcards', label: 'Photos', icon: '📸' },
    { id: 'summary', label: 'Trip Wrap', icon: '✨' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#194f4c] dark:text-white">
                  Export &amp; Share
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Create shareable cards from your journey
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Sidebar - Template Picker */}
              <div className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 p-4 lg:p-6 overflow-y-auto">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Template
                </p>
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTemplate(t.id)}
                      className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-medium ${
                        activeTemplate === t.id
                          ? 'bg-[#194f4c] text-white shadow-lg'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="whitespace-nowrap">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Day selector for Day Card template */}
                {activeTemplate === 'day' && (
                  <div className="mt-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Select Day
                    </p>
                    <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                      {ITALIAN_CITIES.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedDay(i)}
                          className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            selectedDay === i
                              ? 'bg-[#194f4c]/10 text-[#194f4c] dark:bg-white/10 dark:text-white border border-[#194f4c]/30 dark:border-white/20'
                              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="whitespace-nowrap">
                            D{i + 1}: {c.location}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto bg-slate-50 dark:bg-black/50">
                <div className="w-full flex justify-center">
                  <div
                    style={{
                      transform: 'scale(0.3)',
                      transformOrigin: 'top center',
                      marginBottom: '-60%',
                    }}
                  >
                    {activeTemplate === 'countdown' && (
                      <CountdownCard
                        ref={templateRef}
                        daysUntil={days}
                        cityName={ITALIAN_CITIES[0].location}
                        backgroundUrl={ITALIAN_CITIES[0].image}
                      />
                    )}

                    {activeTemplate === 'day' && city && (
                      <DayCard
                        ref={templateRef}
                        dayNumber={selectedDay + 1}
                        title={city.title}
                        location={city.location}
                        milestone={city.milestone}
                        backgroundUrl={waypointImages[city.id] || city.image}
                        weather={weatherData[city.id]}
                        stampsCollected={dayStamps}
                        totalStops={city.plannedStops.length + 1}
                        isAnniversary={city.id === ANNIVERSARY_DAY_ID}
                      />
                    )}

                    {activeTemplate === 'stamps' && (
                      <StampCollectionPage
                        ref={templateRef}
                        cities={ITALIAN_CITIES}
                        stamps={stamps}
                      />
                    )}

                    {activeTemplate === 'postcards' && (
                      <PostcardGrid ref={templateRef} images={allImages} />
                    )}

                    {activeTemplate === 'summary' && (
                      <TripSummaryCard
                        ref={templateRef}
                        cities={ITALIAN_CITIES}
                        stamps={stamps}
                        postcardCount={totalPostcards}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with export button */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Exports as high-resolution PNG (3x)
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-xl ${
                  exporting
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-wait'
                    : 'bg-[#194f4c] text-white hover:scale-105 active:scale-95'
                }`}
              >
                {exporting ? 'Exporting...' : 'Share / Download'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportHub;
