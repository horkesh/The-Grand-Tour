import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ITALIAN_CITIES, Icons } from '../constants';
import { useStore } from '../store';
import UserAvatar from './UserAvatar';

const Passaporto: React.FC = () => {
  const navigate = useNavigate();
  const { stamps, currentUser, partnerUser } = useStore();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar p-6 pb-32"
    >
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-8 p-1.5 bg-slate-200 dark:bg-white/10 rounded-full shrink-0 sticky top-0 z-30 backdrop-blur-md">
         <button className="px-6 py-2 bg-[#194f4c] text-white rounded-full font-bold shadow-md text-sm">Passaporto</button>
         <button onClick={() => navigate('/gallery')} className="px-6 py-2 text-slate-500 dark:text-slate-400 rounded-full font-bold text-sm hover:bg-white/50 dark:hover:bg-white/5 transition-colors">Photos</button>
      </div>

      <div className="w-full max-w-2xl bg-[#2a3b4c] dark:bg-[#1a2530] rounded-[2rem] p-1 shadow-2xl mb-12 shrink-0">
        <div className="border-2 border-amber-400/30 rounded-[1.8rem] p-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 border-2 border-amber-400 rounded-full flex items-center justify-center">
                <span className="text-amber-400 font-serif text-2xl font-bold">ITA</span>
            </div>
            <div className="text-left">
                <h2 className="text-amber-400 font-serif text-xl font-bold uppercase tracking-[0.2em] leading-none">Repubblica</h2>
                <h2 className="text-amber-400 font-serif text-xl font-bold uppercase tracking-[0.2em] leading-none">Italiana</h2>
            </div>
          </div>
          <div className="w-full h-px bg-amber-400/20 mb-4" />
          <div className="grid grid-cols-3 gap-8 text-amber-400/60 text-[10px] uppercase tracking-widest font-bold w-full">
            <div className="flex flex-col">
                <span>Stamps</span>
                <span className="text-amber-100 text-lg">{stamps.length}</span>
            </div>
            <div className="flex flex-col">
                <span>Holder</span>
                <span className="text-amber-100 text-lg">Us</span>
            </div>
            <div className="flex flex-col">
                <span>Year</span>
                <span className="text-amber-100 text-lg">2026</span>
            </div>
          {/* Stamp Race */}
          {(currentUser || partnerUser) && (
            <div className="w-full mt-6 bg-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserAvatar user={currentUser} size="sm" />
                <span className="text-amber-100 font-bold text-sm">{stamps.length}/8</span>
              </div>
              <span className="text-amber-400/60 text-[10px] font-bold uppercase tracking-widest">Stamp Race</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-100 font-bold text-sm">{stamps.length}/8</span>
                <UserAvatar user={partnerUser} size="sm" />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Print button */}
      <div className="flex justify-center mb-6 shrink-0">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-colors print-visible"
        >
          Print Passport
        </button>
      </div>

      {stamps.length === 0 && (
        <div className="text-center mb-8 px-4">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-serif italic">
            Visit a city and flip the card to start collecting stamps.
          </p>
        </div>
      )}

      <div className="w-full max-w-3xl space-y-12">
        {ITALIAN_CITIES.map((city, cityIdx) => (
            <div key={city.id} className="relative">
                <div className="sticky top-16 z-20 bg-[#f9f7f4]/95 dark:bg-black/95 backdrop-blur-md py-4 mb-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-[#194f4c] dark:text-white">{city.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">{city.location}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Main City Stamp */}
                    <StampButton
                        id={city.id}
                        label={city.location}
                        subLabel="City Check-in"
                        isCollected={stamps.includes(city.id)}
                        onClick={() => navigate(`/day/${city.id}`)}
                        type="city"
                        currentUser={currentUser}
                        partnerUser={partnerUser}
                    />

                    {/* Waypoint Stamps */}
                    {city.plannedStops.map((stop, stopIdx) => {
                        const stampId = `${city.id}_${stopIdx}`;
                        return (
                            <StampButton
                                key={stampId}
                                id={stampId}
                                label={stop.title}
                                subLabel={stop.type}
                                isCollected={stamps.includes(stampId)}
                                onClick={() => navigate(`/day/${city.id}`)}
                                type={stop.type}
                                currentUser={currentUser}
                                partnerUser={partnerUser}
                            />
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </motion.div>
  );
};

const StampButton = ({ id, label, subLabel, isCollected, onClick, type, currentUser, partnerUser }: any) => {
    // Rotation randomization for stamped look
    const rotation = React.useMemo(() => Math.floor(Math.random() * 6) - 3, []);

    return (
        <button
            onClick={onClick}
            className={`aspect-square flex flex-col items-center justify-center p-4 rounded-2xl transition-all group relative overflow-hidden ${
                isCollected
                ? 'bg-white dark:bg-[#111] shadow-md border border-slate-200 dark:border-white/5'
                : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 opacity-60'
            }`}
        >
            {isCollected && (
                <div
                    className="absolute inset-0 border-4 border-amber-600/30 rounded-2xl pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg) scale(0.9)` }}
                />
            )}

            <div className={`w-10 h-10 mb-3 rounded-full flex items-center justify-center ${
                isCollected ? 'bg-[#194f4c] text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400'
            }`}>
                {type === 'hotel' ? <Icons.External /> : <Icons.Gallery />}
            </div>

            <span className="font-serif text-xs font-bold leading-tight text-center line-clamp-2 dark:text-slate-200">
                {label}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">{subLabel}</span>

            {/* Dual partner stamp dots */}
            {(currentUser || partnerUser) && (
                <div className="flex items-center gap-1.5 mt-2">
                    <span
                        className={`w-3 h-3 rounded-full ${
                            isCollected
                                ? 'bg-[#194f4c]'
                                : 'border border-[#194f4c]/40'
                        }`}
                        title={currentUser?.displayName || 'You'}
                    />
                    <span
                        className={`w-3 h-3 rounded-full ${
                            isCollected
                                ? 'bg-[#ac3d29]'
                                : 'border border-[#ac3d29]/40'
                        }`}
                        title={partnerUser?.displayName || 'Partner'}
                    />
                </div>
            )}

            {isCollected && (
                <div
                    className="absolute top-2 right-2 text-[8px] font-bold text-amber-700/50 uppercase border border-amber-700/30 px-1 transform rotate-12"
                >
                    Visto
                </div>
            )}
        </button>
    )
}

export default Passaporto;