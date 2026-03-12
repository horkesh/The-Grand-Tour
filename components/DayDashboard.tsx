import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ITALIAN_CITIES, Icons } from '../constants';
import { useStore } from '../store';
import { mergePostcardImage } from '../utils/imageProcessing';
import ItineraryMapOverlay from './ItineraryMapOverlay';
import { useToast } from './Toast';

const DayDashboard: React.FC = () => {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const city = ITALIAN_CITIES.find(c => c.id === cityId);

  const { weatherData, stamps, addStamp, postcards, addPostcard } = useStore();
  const weather = city ? weatherData[city.id] : undefined;
  
  // Selection State
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);

  // Derived Properties
  const currentKey = city ? (selectedStopIdx !== null ? `${city.id}_${selectedStopIdx}` : city.id) : '';
  const currentStop = (city && selectedStopIdx !== null) ? city.plannedStops[selectedStopIdx] : null;
  const currentTitle = currentStop ? currentStop.title : (city?.title.split(': ')[1] || '');
  const currentLocation = currentStop ? city?.location : (city?.location || '');
  const currentContext = currentStop ? `Visiting ${currentStop.title}` : (city?.milestone || '');
  const isCurrentItemStamped = stamps.includes(currentKey);
  const currentPostcards = postcards[currentKey] || [];

  // Final Image Source - use the static image from the city data
  const heroImage = (currentStop?.image) || city?.image || '';

  // UI State
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessingPostcard, setIsProcessingPostcard] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const showToast = useToast();
  const WeatherIcon = weather ? Icons.Weather[weather.icon as keyof typeof Icons.Weather] || Icons.Weather.sunny : Icons.Weather.sunny;

  // Camera cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCameraActive(false);
      showToast("Please allow camera access to take a postcard photo.", 'error');
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !city || !heroImage) return;

    // Stop video stream immediately for UI feedback
    const videoEl = videoRef.current;
    
    // Process
    setIsCameraActive(false);
    setIsProcessingPostcard(true);

    try {
      const finalDataUrl = await mergePostcardImage(
        heroImage,
        videoEl,
        currentStop ? currentStop.title : city.location,
        "20 Years of Us"
      );
      
      addPostcard(currentKey, finalDataUrl);
      
      // Cleanup stream tracks
      if (videoEl.srcObject) {
         (videoEl.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      console.error("Postcard generation failed:", err);
      showToast("Failed to develop postcard. Please try again.", 'error');
    } finally {
      setIsProcessingPostcard(false);
    }
  };

  const handleCreatePostcard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessingPostcard) return;
    startCamera();
  };

  const handleSelectStop = (idx: number) => {
    setSelectedStopIdx(idx);
    setIsFlipped(false);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  if (!city) return <div className="p-12 text-center text-slate-500">City not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 w-full h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar p-4 lg:p-12 pb-32"
    >
      <div ref={topRef} className="perspective-1000 shrink-0 h-[45vh] lg:h-[60vh] relative group">
        <div className={`relative h-full w-full transition-transform duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => !isCameraActive && setIsFlipped(!isFlipped)}>
          
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden rounded-[3rem] overflow-hidden shadow-2xl bg-slate-900">
            {isCameraActive ? (
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover mirror"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 gap-4">
                  <p className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                    Smile at {currentStop ? currentStop.title : city.location}!
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCapture(); }}
                      className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 bg-emerald-500 rounded-full" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsCameraActive(false); 
                        if(videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                      }}
                      className="px-6 py-2 bg-black/60 text-white font-bold text-xs uppercase rounded-full backdrop-blur-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  key={currentKey}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full relative"
                >
                    <img 
                      src={heroImage} 
                      className="w-full h-full object-cover" 
                      alt={currentTitle}
                    />
                    
                    <AnimatePresence>
                      {isProcessingPostcard && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
                        >
                            <div className="flex flex-col items-center text-white/90">
                              <div className="w-12 h-12 border-4 border-t-emerald-500 border-white/20 rounded-full animate-spin mb-4" />
                              <span className="font-serif font-bold text-lg animate-pulse">Developing Memory...</span>
                            </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Header Controls */}
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
                   <div className="flex gap-2">
                     {selectedStopIdx !== null && (
                       <button onClick={(e) => { e.stopPropagation(); setSelectedStopIdx(null); }} className="px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-white/40 transition-all flex items-center gap-2">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                         Back to Overview
                       </button>
                     )}
                     
                     <button onClick={handleCreatePostcard} disabled={isProcessingPostcard} className={`px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-white/40 transition-all ${isProcessingPostcard ? 'opacity-50 cursor-not-allowed' : ''}`}>
                         {isProcessingPostcard ? 'Processing...' : 'Create Postcard'}
                     </button>

                     {weather && selectedStopIdx === null && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl text-white">
                         <WeatherIcon />
                         <span className="text-xs font-bold">{weather.temp}</span>
                       </div>
                     )}
                   </div>
                </div>

                <div className="absolute bottom-10 left-10 text-white z-10">
                  <h2 className="font-serif text-3xl lg:text-7xl font-bold tracking-tighter leading-tight max-w-2xl">{currentTitle}</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-white/60">
                    <span>{currentLocation}</span>
                    {isCurrentItemStamped && <span className="text-emerald-400">✓ Stamp Collected</span>}
                    {currentPostcards.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); navigate('/gallery'); }} className="text-white hover:text-emerald-300 underline decoration-emerald-400 decoration-2 underline-offset-4">
                        View {currentPostcards.length} photos
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Back Face (Flip) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#f4f1ea] dark:bg-[#1a1a1a] rounded-[3rem] p-12 shadow-2xl flex flex-col items-center justify-center text-center">
            <p className="font-serif text-xl lg:text-3xl italic text-slate-800 dark:text-slate-200">"{currentContext}"</p>
            
            <button 
                onClick={(e) => { e.stopPropagation(); addStamp(currentKey); }} 
                disabled={isCurrentItemStamped} 
                className={`mt-10 px-8 py-3 rounded-full font-bold text-sm transition-all ${isCurrentItemStamped ? 'bg-emerald-100 text-emerald-700' : 'bg-[#194f4c] text-white hover:scale-105 shadow-xl'}`}
            >
                {isCurrentItemStamped ? `Stamped: ${currentTitle}` : `Stamp "${currentTitle}"`}
            </button>
            
            {selectedStopIdx !== null && (
                <div className="mt-8 flex gap-4">
                     <a href={currentStop?.uri} target="_blank" onClick={(e) => e.stopPropagation()} className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-full font-bold text-sm shadow-md flex items-center gap-2">
                        <Icons.Map /> Open Maps
                     </a>
                     <button onClick={(e) => { e.stopPropagation(); setSelectedStopIdx(null); }} className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-500 rounded-full font-bold text-sm">
                        Back to Day
                     </button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Itinerary List */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2"
      >
        <div className="lg:col-span-8 space-y-10">
          <section>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Itinerary Waypoints</h3>
               {weather && selectedStopIdx === null && (
                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Forecast: {weather.description}</span>
                 </div>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {city.plannedStops.map((stop, i) => (
                 <div 
                   key={i} 
                   onClick={() => handleSelectStop(i)}
                   className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all group shadow-sm cursor-pointer relative overflow-hidden ${selectedStopIdx === i ? 'bg-[#194f4c] border-[#194f4c] ring-4 ring-[#194f4c]/20' : 'bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-white/5 hover:border-[#ac3d29]'}`}
                 >
                   <div className="flex items-center gap-4 min-w-0">
                       <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-serif font-bold transition-colors ${selectedStopIdx === i ? 'bg-white text-[#194f4c]' : 'bg-slate-100 dark:bg-white/5 text-[#194f4c] dark:text-white'}`}>{i + 1}</div>
                       <div className="min-w-0">
                           <h4 className={`font-serif text-base font-bold truncate ${selectedStopIdx === i ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{stop.title}</h4>
                           <p className={`text-[9px] uppercase tracking-widest ${selectedStopIdx === i ? 'text-white/60' : 'text-slate-400'}`}>{stop.type}</p>
                       </div>
                   </div>

                   <div className="flex items-center gap-2 pl-2">
                       {postcards[`${city.id}_${i}`]?.length > 0 && (
                           <div className={`w-2 h-2 rounded-full ${selectedStopIdx === i ? 'bg-white' : 'bg-emerald-500'}`} />
                       )}
                       
                       <a 
                           href={stop.uri} 
                           target="_blank" 
                           onClick={(e) => e.stopPropagation()} 
                           className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedStopIdx === i ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                           title="Open in Google Maps"
                       >
                           <Icons.Map />
                       </a>
                   </div>
                 </div>
               ))}
             </div>
          </section>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
           <button onClick={() => navigate('/chat')} className="p-8 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 border border-slate-100 dark:border-white/5"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Icons.Chat /></div><span className="font-serif font-bold">AI Concierge</span></button>
           <button onClick={() => setIsMapVisible(true)} className="p-8 bg-[#194f4c] rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 text-white"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Icons.Map /></div><span className="font-serif font-bold">Live Map</span></button>
        </div>
      </motion.div>

      {isMapVisible && <ItineraryMapOverlay city={city} onClose={() => setIsMapVisible(false)} />}

      <style>{`
        .perspective-1000 { perspective: 1000px; } 
        .preserve-3d { transform-style: preserve-3d; } 
        .backface-hidden { backface-visibility: hidden; } 
        .rotate-y-180 { transform: rotateY(180deg); }
        .mirror { transform: scaleX(-1); }
      `}</style>
    </motion.div>
  );
};

export default DayDashboard;