
import React from 'react';
import { TripSegment } from '../types';

interface PassaportoProps {
  cities: TripSegment[];
  stamps: string[];
  onCitySelect: (city: TripSegment) => void;
}

const Passaporto: React.FC<PassaportoProps> = ({ cities, stamps, onCitySelect }) => {
  return (
    <div className="h-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar p-6 lg:p-12 stagger-in">
      <div className="w-full max-w-2xl bg-[#2a3b4c] rounded-[2rem] p-1 shadow-2xl mb-12">
        <div className="border-2 border-amber-400/30 rounded-[1.8rem] p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 border-4 border-amber-400 rounded-full flex items-center justify-center">
            <span className="text-amber-400 font-serif text-5xl font-bold">ITA</span>
          </div>
          <h2 className="text-amber-400 font-serif text-3xl font-bold uppercase tracking-[0.3em] mb-2">Repubblica Italiana</h2>
          <h3 className="text-amber-400/80 font-serif text-xl font-bold uppercase tracking-widest">PASSAPORTO</h3>
          <div className="w-full h-px bg-amber-400/20 my-8" />
          <p className="text-amber-400/60 font-serif italic text-sm">Vent'anni di vita insieme, un viaggio eterno.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {cities.map((city, idx) => {
          const isCollected = stamps.includes(city.id);
          return (
            <button
              key={city.id}
              onClick={() => onCitySelect(city)}
              className={`relative aspect-square flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl transition-all group overflow-hidden ${!isCollected ? 'opacity-40 grayscale scale-95' : 'hover:scale-105 hover:rotate-1'}`}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
              <div className={`w-full h-full border-2 rounded-full flex flex-col items-center justify-center p-2 text-center ${isCollected ? 'border-amber-600/40 text-amber-900 dark:text-amber-500' : 'border-slate-300 dark:border-slate-700 text-slate-400'}`}>
                <span className="text-[10px] font-bold uppercase tracking-tighter mb-1">Entry: {idx + 1}</span>
                <span className="font-serif text-sm font-bold leading-tight uppercase">{city.location}</span>
                {isCollected && (
                  <div className="mt-2 text-[8px] font-bold border-t border-current pt-1 uppercase">VISTO - VISITED</div>
                )}
              </div>
              <div className="absolute top-2 right-4 text-[40px] opacity-10 font-serif italic">{idx + 1}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Passaporto;
