import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES, ANNIVERSARY_DAY_ID } from '../constants';
import { useStore } from '../store';
import ExportHub from './ExportHub';
import JourneyReplay from './JourneyReplay';
import { downloadStoryHtml } from '../utils/storyExport';

const StoryMode: React.FC = () => {
  const navigate = useNavigate();
  const { stamps, postcards, waypointImages, weatherData } = useStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  const totalStamps = stamps.length;
  const totalPostcards = Object.values(postcards).flat().length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black"
    >
      {/* Hero */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#194f4c] to-[#0d2f2d]" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative text-center text-white px-8"
        >
          <p className="text-white/50 text-xs uppercase tracking-[0.4em] font-bold mb-4">May 2 – 9, 2026</p>
          <h1 className="font-serif text-5xl lg:text-7xl font-bold mb-4">Our Grand Tour</h1>
          <p className="font-serif text-lg italic text-white/70">The story of twenty years, told across Italy</p>
          <div className="flex items-center justify-center gap-6 mt-8 text-white/40 text-xs uppercase tracking-widest font-bold">
            <span>{totalStamps} stamps</span>
            <span>·</span>
            <span>{totalPostcards} photos</span>
            <span>·</span>
            <span>8 days</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={() => setReplayOpen(true)}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            >
              Replay Journey
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            >
              Export &amp; Share
            </button>
            <button
              onClick={() => downloadStoryHtml({ stamps, postcards, weatherData, waypointImages })}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            >
              Save as HTML
            </button>
          </div>
        </motion.div>
      </div>

      {/* Day chapters */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-20">
        {ITALIAN_CITIES.map((city, dayIdx) => {
          const dayImage = waypointImages[city.id] || city.image;
          const isAnniversary = city.id === ANNIVERSARY_DAY_ID;
          const isStamped = stamps.includes(city.id);
          const weather = weatherData[city.id];
          const dayPostcards = Object.entries(postcards)
            .filter(([key]) => key === city.id || key.startsWith(`${city.id}_`))
            .flatMap(([, urls]) => urls as string[]);

          // Stop images for this day
          const stopImages = city.plannedStops
            .map((stop, i) => ({ stop, image: waypointImages[`${city.id}_${i}`] }))
            .filter(s => s.image);

          return (
            <motion.section
              key={city.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              {/* Chapter header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                  isAnniversary
                    ? 'bg-[#ac3d29] border-[#ac3d29] text-white'
                    : isStamped
                      ? 'bg-[#194f4c] border-[#194f4c] text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  {isAnniversary ? '❤️' : dayIdx + 1}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Day {dayIdx + 1} · {city.location}
                    {weather && ` · ${weather.temp}`}
                  </p>
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                    {city.title.split(': ')[1] || city.title}
                  </h2>
                </div>
              </div>

              {isAnniversary && (
                <p className="text-[#ac3d29] text-xs font-bold uppercase tracking-[0.3em] mb-4">
                  May 6, 2006 — May 6, 2026 · Twenty Years
                </p>
              )}

              {/* Hero image */}
              <div className="rounded-2xl overflow-hidden shadow-xl mb-6 aspect-[16/9]">
                <img
                  src={dayImage}
                  alt={city.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Milestone quote */}
              <blockquote className="font-serif text-lg italic text-slate-600 dark:text-slate-400 border-l-4 border-[#194f4c] dark:border-emerald-600 pl-6 mb-6">
                "{city.milestone}"
              </blockquote>

              {/* Stops summary */}
              <div className="flex flex-wrap gap-2 mb-6">
                {city.plannedStops.map((stop, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                      stamps.includes(`${city.id}_${i}`)
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {stop.title}
                  </span>
                ))}
              </div>

              {/* Stop images grid */}
              {stopImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {stopImages.map(({ stop, image }, i) => (
                    <div key={i} className="rounded-xl overflow-hidden shadow-md aspect-[4/3] relative group">
                      <img src={image} alt={stop.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-[10px] font-bold uppercase tracking-wider truncate">{stop.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Postcards */}
              {dayPostcards.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {dayPostcards.map((url, i) => (
                    <div key={i} className="shrink-0 bg-white p-2 pb-8 shadow-lg transform rotate-[-1deg] hover:rotate-0 transition-transform">
                      <img src={url} alt={`Memory ${i + 1}`} className="w-40 h-28 object-cover" loading="lazy" />
                      <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-serif text-slate-500 italic">
                        {city.location}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Stamp badge */}
              {isStamped && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Stamp Collected</span>
                </div>
              )}
            </motion.section>
          );
        })}

        {/* Finale */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center py-16 border-t border-slate-200 dark:border-white/10"
        >
          <p className="text-4xl mb-6">🇮🇹</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Fin del Viaggio
          </h2>
          <p className="font-serif text-lg italic text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            Eight days of la dolce vita. Twenty years of love.
            Every stamp a memory, every photo a promise.
          </p>
          <div className="flex items-center justify-center gap-8 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-bold">
            <div className="text-center">
              <span className="block text-2xl font-serif text-slate-900 dark:text-white mb-1">{totalStamps}</span>
              Stamps
            </div>
            <div className="text-center">
              <span className="block text-2xl font-serif text-slate-900 dark:text-white mb-1">{totalPostcards}</span>
              Photos
            </div>
            <div className="text-center">
              <span className="block text-2xl font-serif text-slate-900 dark:text-white mb-1">8</span>
              Days
            </div>
          </div>
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => setExportOpen(true)}
              className="px-8 py-3 bg-[#ac3d29] text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              Export &amp; Share
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-[#194f4c] text-white font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              Back to Map
            </button>
          </div>
        </motion.div>
      </div>

      <ExportHub open={exportOpen} onClose={() => setExportOpen(false)} />
      <JourneyReplay open={replayOpen} onClose={() => setReplayOpen(false)} />
    </motion.div>
  );
};

export default StoryMode;
