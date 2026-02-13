
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import ItineraryMapOverlay from './components/ItineraryMapOverlay';
import OverviewMap from './components/OverviewMap';
import DayDashboard from './components/DayDashboard';
import Passaporto from './components/Passaporto';
import { ITALIAN_CITIES, Icons } from './constants';
import { Location, TripSegment, SavedPOI, WeatherInfo } from './types';
import { GoogleGenAI, Modality } from "@google/genai";
import { getWeatherForecast } from './services/geminiService';

const ANNIVERSARY_DATE = new Date('2026-05-06T00:00:00');

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < channelData.length; i++) channelData[i] = dataInt16[i * numChannels + c] / 32768.0;
  }
  return buffer;
}

const MiniCalendarHeader = ({ days }: { days: number }) => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-12 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="h-2.5 bg-[#CE2B37] dark:bg-red-900 w-full" />
      <div className="flex flex-col items-center justify-center h-full -mt-1">
        <span className="text-[14px] font-serif font-bold text-slate-900 dark:text-white leading-none">{days}</span>
        <span className="text-[5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">GIORNI</span>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-serif italic text-2xl font-bold tracking-tighter text-[#194f4c] dark:text-white leading-none">Grand Tour</span>
      <span className="text-[8px] font-bold text-[#ac3d29] dark:text-emerald-400 uppercase tracking-widest mt-0.5">ANNIVERSARY TRIP</span>
    </div>
  </div>
);

interface SidebarProps {
  viewMode: string;
  setViewMode: (v: any) => void;
  theme: string;
  setTheme: (t: any) => void;
  countdown: { days: number, hours: number, mins: number };
  selectedCity: TripSegment;
  handleCitySelect: (c: TripSegment) => void;
}

const SidebarContent = ({ viewMode, setViewMode, theme, setTheme, countdown, selectedCity, handleCitySelect }: SidebarProps) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#194f4c] dark:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Icons.Compass />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold dark:text-white leading-none">Grand Tour</h1>
          <p className="text-[9px] text-[#ac3d29] dark:text-emerald-400 font-bold uppercase tracking-widest mt-1">Italia '26</p>
        </div>
      </div>
      <button onClick={() => setTheme((t: string) => t === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
        {theme === 'light' ? '☾' : '☼'}
      </button>
    </div>

    <div className="mb-10 px-4">
      <div className="relative w-full max-w-[200px] mx-auto group">
        <div className="absolute -top-3 left-0 right-0 flex justify-center gap-12 z-10">
          <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-600 shadow-lg"></div>
          <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-600 shadow-lg"></div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 dark:border-white/10 transform transition-transform group-hover:rotate-1">
          <div className="bg-[#CE2B37] dark:bg-red-900 px-4 py-2 text-center border-b-4 border-black/10">
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] font-sans">MAGGIO 2026</span>
          </div>
          <div className="py-6 px-4 text-center bg-[#fffcf5] dark:bg-slate-900 relative">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Giorni Mancanti</div>
            <div className="text-7xl font-serif font-bold text-slate-900 dark:text-white leading-none tracking-tighter drop-shadow-sm">
              {countdown.days}
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
      <button onClick={() => setViewMode('overview')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === 'overview' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
        <Icons.Map />
        <span className="text-sm font-bold">Master Map</span>
      </button>
      <button onClick={() => setViewMode('list')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
        <Icons.Route />
        <span className="text-sm font-bold">Full Itinerary</span>
      </button>
      <button onClick={() => setViewMode('passaporto')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === 'passaporto' ? 'bg-amber-700 text-white shadow-xl' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
        <div className="h-4 w-4 border-2 border-current rounded-sm" />
        <span className="text-sm font-bold">Il Passaporto</span>
      </button>
      <button onClick={() => setViewMode('day')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === 'day' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
        <Icons.Journal />
        <span className="text-sm font-bold">Day Journal</span>
      </button>
      <button onClick={() => setViewMode('chat')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === 'chat' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
        <Icons.Chat />
        <span className="text-sm font-bold">AI Concierge</span>
      </button>
    </nav>
  </div>
);

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'day' | 'chat' | 'list' | 'passaporto'>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('bella_italia_theme') as any) || 'light');
  const [selectedCity, setSelectedCity] = useState<TripSegment>(ITALIAN_CITIES[0]);
  const [userLocation, setUserLocation] = useState<Location | undefined>();
  const [savedPOIs, setSavedPOIs] = useState<SavedPOI[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0 });
  const [isNarrating, setIsNarrating] = useState(false);
  const [stamps, setStamps] = useState<string[]>(JSON.parse(localStorage.getItem('trip_stamps') || '[]'));
  const [postcards, setPostcards] = useState<Record<string, string>>(JSON.parse(localStorage.getItem('trip_postcards') || '{}'));
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('trip_stamps', JSON.stringify(stamps));
    localStorage.setItem('trip_postcards', JSON.stringify(postcards));
  }, [stamps, postcards]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = ANNIVERSARY_DATE.getTime() - new Date().getTime();
      if (diff > 0) setCountdown({ days: Math.floor(diff / 864e5), hours: Math.floor((diff / 36e5) % 24), mins: Math.floor((diff / 6e4) % 60) });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bella_italia_theme', theme);
  }, [theme]);

  // Fetch weather for ALL cities to display in Route view
  useEffect(() => {
    const fetchAllWeather = async () => {
      // Create a batch of promises for missing weather data
      const weatherPromises = ITALIAN_CITIES.map(async (city) => {
        if (!weatherData[city.id]) {
          try {
            const dateStr = city.description.split(':')[0];
            const info = await getWeatherForecast(city.location, dateStr);
            if (info) return { id: city.id, info };
          } catch (err) {
            console.error(`Failed weather for ${city.location}`, err);
          }
        }
        return null;
      });

      const results = await Promise.all(weatherPromises);
      const newWeather: Record<string, WeatherInfo> = { ...weatherData };
      let changed = false;
      results.forEach(res => {
        if (res) {
          newWeather[res.id] = res.info;
          changed = true;
        }
      });
      if (changed) setWeatherData(newWeather);
    };

    // Trigger on mount or when view mode changes to list
    if (viewMode === 'list' || Object.keys(weatherData).length === 0) {
      fetchAllWeather();
    }
  }, [viewMode]);

  const handleNarrate = useCallback(async (text: string) => {
    if (isNarrating) return;
    setIsNarrating(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
      });
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        const source = ctx.createBufferSource();
        source.buffer = await decodeAudioData(decodeBase64(data), ctx, 24000, 1);
        source.connect(ctx.destination);
        source.onended = () => setIsNarrating(false);
        source.start();
      } else setIsNarrating(false);
    } catch (e) { setIsNarrating(false); }
  }, [isNarrating]);

  const handleCitySelect = (city: TripSegment) => {
    setSelectedCity(city);
    setViewMode('day');
  };

  return (
    <div className="flex h-screen w-full bg-[#f9f7f4] dark:bg-[#000] overflow-hidden pt-safe-top pb-safe-bottom">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-80 bg-white dark:bg-[#070707] border-r border-slate-200 dark:border-white/5 p-8 flex-col z-10 shadow-2xl">
        <SidebarContent 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
          theme={theme} 
          setTheme={setTheme} 
          countdown={countdown} 
          selectedCity={selectedCity} 
          handleCitySelect={handleCitySelect} 
        />
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header with Calendar and Navigation */}
        <header className="lg:hidden shrink-0 flex flex-col z-20 px-4 pt-4 pb-2 bg-transparent relative">
          <div className="flex items-center justify-between mb-4 px-2">
            <MiniCalendarHeader days={countdown.days} />
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="w-9 h-9 rounded-full bg-white dark:bg-white/10 shadow-lg flex items-center justify-center text-slate-600 dark:text-white border border-slate-100 dark:border-white/5">
              {theme === 'light' ? '☾' : '☼'}
            </button>
          </div>
          
          <div className="p-1 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
            <button onClick={() => setViewMode('overview')} className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${viewMode === 'overview' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
              <Icons.Map /><span className="text-[7px] font-bold uppercase tracking-widest">Map</span>
            </button>
            <button onClick={() => setViewMode('list')} className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${viewMode === 'list' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
              <Icons.Route /><span className="text-[7px] font-bold uppercase tracking-widest">Route</span>
            </button>
            <button onClick={() => setViewMode('passaporto')} className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${viewMode === 'passaporto' ? 'bg-amber-700 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
              <div className="h-4 w-4 border-2 border-current rounded-sm" /><span className="text-[7px] font-bold uppercase tracking-widest">Passport</span>
            </button>
            <button onClick={() => setViewMode('day')} className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${viewMode === 'day' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
              <Icons.Journal /><span className="text-[7px] font-bold uppercase tracking-widest">Day</span>
            </button>
            <button onClick={() => setViewMode('chat')} className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${viewMode === 'chat' ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
              <Icons.Chat /><span className="text-[7px] font-bold uppercase tracking-widest">AI</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-12 overflow-hidden">
          {viewMode === 'overview' && <OverviewMap cities={ITALIAN_CITIES} onCitySelect={handleCitySelect} theme={theme} userLocation={userLocation} />}
          {viewMode === 'passaporto' && <Passaporto cities={ITALIAN_CITIES} stamps={stamps} onCitySelect={handleCitySelect} />}
          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto space-y-4 pb-12 custom-scrollbar pr-2 stagger-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-3xl lg:text-5xl font-bold dark:text-white">Our Journey</h2>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">8 Segments • Tuscany & Umbria</div>
              </div>
              {ITALIAN_CITIES.map((city, i) => {
                const weather = weatherData[city.id];
                const WeatherIcon = weather ? Icons.Weather[weather.icon as keyof typeof Icons.Weather] || Icons.Weather.sunny : null;
                
                return (
                  <button key={city.id} onClick={() => handleCitySelect(city)} className="w-full p-4 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-5 shadow-sm transition-all group hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative shrink-0">
                      <img src={city.image} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
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
          )}
          {viewMode === 'day' && <DayDashboard city={selectedCity} onOpenChat={() => setViewMode('chat')} onOpenMap={() => setIsMapVisible(true)} theme={theme} onNarrate={handleNarrate} isNarrating={isNarrating} postcard={postcards[selectedCity.id]} onPostcardGenerated={(url) => setPostcards(p => ({ ...p, [selectedCity.id]: url }))} onCheckIn={() => setStamps(s => Array.from(new Set([...s, selectedCity.id])))} isCheckedIn={stamps.includes(selectedCity.id)} onBack={() => setViewMode('overview')} note={''} onUpdateNote={() => {}} weather={weatherData[selectedCity.id]} />}
          {viewMode === 'chat' && <ChatInterface cityId={selectedCity.id} savedPOIs={savedPOIs} onSavePOI={(p) => setSavedPOIs(s => [...s, { ...p, id: Date.now().toString(), cityId: selectedCity.id, timestamp: Date.now() }])} />}
        </div>
      </main>

      {isMapVisible && <ItineraryMapOverlay city={selectedCity} savedPOIs={savedPOIs} onClose={() => setIsMapVisible(false)} theme={theme} onRemovePOI={() => {}} onUpdateNotes={() => {}} />}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
