import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES, Icons } from '../constants';
import { useStore } from '../store';

const ItineraryList: React.FC = () => {
  const navigate = useNavigate();
  const { weatherData } = useStore();

  return (
    <div className="h-full overflow-y-auto space-y-4 pb-12 custom-scrollbar pr-2 stagger-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl lg:text-5xl font-bold dark:text-white">Our Journey</h2>
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">8 Segments • Tuscany & Umbria</div>
      </div>
      {ITALIAN_CITIES.map((city, i) => {
        const weather = weatherData[city.id];
        const WeatherIcon = weather ? Icons.Weather[weather.icon as keyof typeof Icons.Weather] || Icons.Weather.sunny : null;
        const displayImage = city.image;
        
        return (
          <button key={city.id} onClick={() => navigate(`/day/${city.id}`)} className="w-full p-4 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-5 shadow-sm transition-all group hover:-translate-y-1 hover:shadow-xl">
            <div className="relative shrink-0">
              <img src={displayImage} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt={city.title} />
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#194f4c] text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{i + 1}</div>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-sm dark:text-white truncate text-slate-900">{city.title.split(': ')[1]}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-bold">{city.location}</p>
            </div>
            {weather && (
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="text-[#194f4c] dark:text-white scale-90">
                  {WeatherIcon && <WeatherIcon />}
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1">{weather.temp}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ItineraryList;