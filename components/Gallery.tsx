import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ITALIAN_CITIES } from '../constants';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const { postcards } = useStore();
  
  const allImages = Object.entries(postcards).flatMap(([key, urls]) => {
    // Key format: "cityId" or "cityId_stopIndex"
    const [cityId, stopIdxStr] = key.split('_');
    const city = ITALIAN_CITIES.find(c => c.id === cityId);
    
    let cityName = city ? city.location : 'Unknown Location';
    let subTitle = undefined;

    if (city && stopIdxStr !== undefined) {
      const stop = city.plannedStops[parseInt(stopIdxStr)];
      if (stop) {
        cityName = stop.title;
        subTitle = city.location;
      }
    }

    return (urls as string[]).map((url, idx) => ({
      url,
      cityId,
      cityName,
      subTitle,
      id: `${key}-${idx}`,
      idx
    }));
  }).reverse(); // Show newest first

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-32"
    >
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-8 p-1.5 bg-slate-200 dark:bg-white/10 rounded-full w-fit mx-auto">
         <button onClick={() => navigate('/passport')} className="px-6 py-2 text-slate-500 dark:text-slate-400 rounded-full font-bold text-sm hover:bg-white/50 dark:hover:bg-white/5 transition-colors">Passaporto</button>
         <button className="px-6 py-2 bg-[#194f4c] text-white rounded-full font-bold shadow-md text-sm">Photos</button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold dark:text-white">Our Memories</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
            {allImages.length} Polaroids Collected
          </p>
        </div>
      </div>

      {allImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 dark:text-slate-600">
          <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium">No photos taken yet.</p>
          <p className="text-xs mt-1">Visit a city dashboard to create your first memory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {allImages.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <div className="bg-white p-3 pb-12 shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 group-hover:z-10 relative">
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img src={item.url} alt={`Memory from ${item.cityName}`} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="font-serif font-bold text-slate-800 text-sm truncate px-2">{item.cityName}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                    {item.subTitle ? `${item.subTitle} • ` : ''}Photo #{item.idx + 1}
                  </p>
                </div>
                {/* Tape effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/30 backdrop-blur-[1px] border-l border-r border-white/40 shadow-sm rotate-[-2deg]" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Gallery;