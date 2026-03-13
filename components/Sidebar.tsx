import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../constants';
import { useStore } from '../store';
import { useCountdown } from '../hooks/useCountdown';
import PartnerSync from './PartnerSync';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, lastViewedDay } = useStore();
  const countdown = useCountdown();
  const [showSync, setShowSync] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const btnClass = (path: string, submenu = false) => 
    `w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
      isActive(path)
        ? 'bg-[#194f4c] text-white shadow-xl' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
    } ${submenu ? 'scale-95 pl-8 opacity-90' : ''}`;

  return (
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
        <button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
          {theme === 'light' ? '☾' : '☼'}
        </button>
      </div>

      <div className="mb-8 px-4">
        <div className="relative w-full max-w-[200px] mx-auto group">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-white/10">
            <div className="bg-[#CE2B37] dark:bg-red-900 px-4 py-2 text-center border-b-4 border-black/10">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] font-sans">MAGGIO 2026</span>
            </div>
            <div className="py-6 px-4 text-center bg-[#fffcf5] dark:bg-slate-900">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Giorni Mancanti</div>
              <div className="text-7xl font-serif font-bold text-slate-900 dark:text-white leading-none tracking-tighter">
                {countdown.days}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 mb-6">
        <button onClick={() => navigate('/')} className={btnClass('/')}>
          <Icons.Map />
          <span className="text-sm font-bold">Master Map</span>
        </button>
        <button onClick={() => navigate('/list')} className={btnClass('/list')}>
          <Icons.Route />
          <span className="text-sm font-bold">Full Itinerary</span>
        </button>
        
        {/* Passport Section with Gallery Submenu */}
        <div className="flex flex-col gap-1">
          <button onClick={() => navigate('/passport')} className={btnClass('/passport')}>
            <div className="h-4 w-4 border-2 border-current rounded-sm" />
            <span className="text-sm font-bold">Il Passaporto</span>
          </button>
          <button onClick={() => navigate('/gallery')} className={btnClass('/gallery', true)}>
            <Icons.Gallery />
            <span className="text-sm font-bold">Photo Gallery</span>
          </button>
        </div>

        <button onClick={() => navigate(`/day/${lastViewedDay}`)} className={btnClass('/day')}>
          <Icons.Journal />
          <span className="text-sm font-bold">Day Journal</span>
        </button>
        <button onClick={() => navigate('/story')} className={btnClass('/story')}>
          <Icons.Story />
          <span className="text-sm font-bold">Our Story</span>
        </button>
        <button onClick={() => navigate('/chat')} className={btnClass('/chat')}>
          <Icons.Chat />
          <span className="text-sm font-bold">AI Concierge</span>
        </button>
      </nav>

      <button
        onClick={() => setShowSync(true)}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-sm font-bold">Partner Sync</span>
      </button>

      {showSync && <PartnerSync onClose={() => setShowSync(false)} />}
    </div>
  );
};

export default Sidebar;