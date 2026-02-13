
import React, { useState, useRef, useEffect } from 'react';
import { TripSegment, WeatherInfo } from '../types';
import { Icons } from '../constants';
import { generatePostcard } from '../services/geminiService';

interface DayDashboardProps {
  city: TripSegment;
  weather?: WeatherInfo;
  onOpenChat: () => void;
  onOpenMap: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
  note: string;
  onUpdateNote: (note: string) => void;
  onNarrate: (text: string) => void;
  isNarrating: boolean;
  postcard?: string;
  onPostcardGenerated: (url: string) => void;
  onCheckIn: () => void;
  isCheckedIn: boolean;
}

const DayDashboard: React.FC<DayDashboardProps> = ({ 
  city, weather, onOpenChat, onOpenMap, theme, note, onUpdateNote, onNarrate, isNarrating,
  postcard, onPostcardGenerated, onCheckIn, isCheckedIn
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const WeatherIcon = weather ? Icons.Weather[weather.icon as keyof typeof Icons.Weather] || Icons.Weather.sunny : Icons.Weather.sunny;

  // Cleanup camera stream
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
      alert("Please allow camera access to take a postcard photo.");
    }
  };

  const captureAndMerge = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Generate or use existing postcard background
      let basePostcard = postcard;
      if (!basePostcard) {
        basePostcard = await generatePostcard(city.location, "oil painting, nostalgic gold lighting");
      }

      // 2. Prepare Canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = basePostcard!;

      await new Promise((resolve) => { bgImg.onload = resolve; });

      canvas.width = bgImg.width;
      canvas.height = bgImg.height;

      // Draw Background
      ctx.drawImage(bgImg, 0, 0);

      // 3. Capture Camera Frame
      const video = videoRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0);
        
        // 4. Overlay Camera Frame as a Polaroid
        const photoWidth = canvas.width * 0.35;
        const photoHeight = (tempCanvas.height / tempCanvas.width) * photoWidth;
        const x = canvas.width * 0.55;
        const y = canvas.height * 0.1;

        // Draw shadow/border for polaroid look
        ctx.save();
        ctx.translate(x + photoWidth / 2, y + photoHeight / 2);
        ctx.rotate((Math.random() * 10 - 5) * Math.PI / 180); // Slight random tilt
        ctx.translate(-(photoWidth / 2), -(photoHeight / 2));

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'white';
        // Polaroid Frame
        const border = 15;
        ctx.fillRect(-border, -border, photoWidth + border * 2, photoHeight + border * 5);
        
        // The actual photo
        ctx.shadowBlur = 0;
        ctx.drawImage(tempCanvas, 0, 0, photoWidth, photoHeight);
        
        // Hand-written style text on Polaroid
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px "Playfair Display"';
        ctx.textAlign = 'center';
        ctx.fillText("Together in " + city.location, photoWidth / 2, photoHeight + 50);

        ctx.restore();
      }

      // 5. Save result
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onPostcardGenerated(finalDataUrl);

      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    } catch (err) {
      console.error("Postcard merge error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePostcard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    startCamera();
  };

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-1 pb-32">
      <div className="perspective-1000 shrink-0 h-[45vh] lg:h-[60vh] relative group">
        <div className={`relative h-full w-full transition-transform duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => !isCameraActive && setIsFlipped(!isFlipped)}>
          
          <div className="absolute inset-0 backface-hidden rounded-[3rem] overflow-hidden shadow-2xl">
            {isCameraActive ? (
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover mirror"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 gap-4">
                  <p className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Smile for our Anniversary Postcard!</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); captureAndMerge(); }}
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
                <img src={postcard || city.image} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                   <div className="flex gap-2">
                     <button onClick={handleCreatePostcard} className={`px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-white/40 transition-all ${isGenerating ? 'animate-pulse' : ''}`}>
                       {isGenerating ? 'Developing...' : postcard ? 'Take New Anniversary Photo' : 'Capture Anniversary Memory'}
                     </button>
                     {weather && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl text-white">
                         <WeatherIcon />
                         <span className="text-xs font-bold">{weather.temp}</span>
                       </div>
                     )}
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); onNarrate(city.milestone); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isNarrating ? 'bg-emerald-500 scale-110' : 'bg-white/20'} backdrop-blur-3xl text-white border border-white/20`}>
                     {isNarrating ? '...' : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" /></svg>}
                   </button>
                </div>
                <div className="absolute bottom-10 left-10 text-white">
                  <h2 className="font-serif text-4xl lg:text-7xl font-bold tracking-tighter">{city.title.split(': ')[1]}</h2>
                  <div className="mt-4 flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-white/60">
                    <span>{city.location}</span>
                    {isCheckedIn && <span className="text-emerald-400">✓ Stamp Collected</span>}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#f4f1ea] dark:bg-[#1a1a1a] rounded-[3rem] p-12 shadow-2xl flex flex-col items-center justify-center text-center">
            <p className="font-serif text-xl lg:text-3xl italic text-slate-800 dark:text-slate-200">"{city.milestone}"</p>
            <button onClick={(e) => { e.stopPropagation(); onCheckIn(); }} disabled={isCheckedIn} className={`mt-10 px-8 py-3 rounded-full font-bold text-sm transition-all ${isCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-[#194f4c] text-white hover:scale-105 shadow-xl'}`}>
              {isCheckedIn ? 'Stamp Collected' : 'Stamp My Passaporto'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        <div className="lg:col-span-8 space-y-10">
          <section className="stagger-in">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Itinerary Waypoints</h3>
               {weather && (
                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Forecast: {weather.description}</span>
                 </div>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {city.plannedStops.map((stop, i) => (
                 <a key={i} href={stop.uri} target="_blank" className="flex items-center gap-4 p-5 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-[#ac3d29] transition-all group shadow-sm">
                   <div className="w-10 h-10 shrink-0 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center font-serif font-bold text-[#194f4c] dark:text-white">{i + 1}</div>
                   <div className="flex-1 min-w-0"><h4 className="font-serif text-base font-bold text-slate-900 dark:text-white truncate">{stop.title}</h4><p className="text-[9px] uppercase tracking-widest text-slate-400">{stop.type}</p></div>
                 </a>
               ))}
             </div>
          </section>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
           <button onClick={onOpenChat} className="p-8 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 border border-slate-100 dark:border-white/5"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Icons.Chat /></div><span className="font-serif font-bold">AI Concierge</span></button>
           <button onClick={onOpenMap} className="p-8 bg-[#194f4c] rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 text-white"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Icons.Map /></div><span className="font-serif font-bold">Live Map</span></button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        .perspective-1000 { perspective: 1000px; } 
        .preserve-3d { transform-style: preserve-3d; } 
        .backface-hidden { backface-visibility: hidden; } 
        .rotate-y-180 { transform: rotateY(180deg); }
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
};

export default DayDashboard;
