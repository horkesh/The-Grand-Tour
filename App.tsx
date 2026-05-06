import React, { Suspense, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import OverviewMap from './components/OverviewMap';
import ChatInterface from './components/ChatInterface';
import Passaporto from './components/Passaporto';
import DayDashboard from './components/DayDashboard';
import ItineraryList from './components/ItineraryList';
import Gallery from './components/Gallery';
const StoryMode = React.lazy(() => import('./components/StoryMode'));
import CountdownDashboard from './components/CountdownDashboard';
import DailyReveal from './components/DailyReveal';
import PackingChecklist from './components/PackingChecklist';
import LearnPhrase from './components/LearnPhrase';
const NukeTrip = React.lazy(() => import('./components/NukeTrip'));
const RefreshPhotos = React.lazy(() => import('./components/RefreshPhotos'));
const RouteFlyover = React.lazy(() => import('./components/RouteFlyover'));
import Wishlist from './components/Wishlist';
import PreferenceMatch from './components/PreferenceMatch';
import ConversationStarters from './components/ConversationStarters';
import SurprisePlanner from './components/SurprisePlanner';
import PhotoChallenges from './components/PhotoChallenges';
import TriviaChallenge from './components/TriviaChallenge';
import TripHub from './components/TripHub';
import TogetherHub from './components/TogetherHub';
import BlockBlast from './components/BlockBlast';
import LiveTripPage from './components/LiveTripPage';
const JudgesVerdict = React.lazy(() => import('./components/JudgesVerdict'));
import FamilyHub from './components/FamilyHub';
import FamilyJoin from './components/FamilyJoin';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store';
import { ITALIAN_CITIES, Icons } from './constants';
import { getWeatherForecast } from './services/geminiService';
import { useCountdown } from './hooks/useCountdown';
import Toast from './components/Toast';
import ImageGenerator from './components/ImageGenerator';
import Welcome from './components/Welcome';
import TripComplete from './components/TripComplete';
import { useGeolocation } from './hooks/useGeolocation';
import AuthGate from './components/AuthGate';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  return isOnline;
};

const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  const { theme, toggleTheme, weatherData, updateCityWeather, hydrateImages } = useStore();
  const isOnline = useOnlineStatus();
  useGeolocation();

  useEffect(() => { hydrateImages(); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bella_italia_theme', theme);
  }, [theme]);
  useEffect(() => {
    const fetchAllWeather = async () => {
      // Prioritize first city if missing
      const missingCities = ITALIAN_CITIES.filter(city => !weatherData[city.id]);
      if (!missingCities.length) return;

      // Sequential fetch to avoid hitting rate limits instantly
      for (const city of missingCities) {
        try {
          const dateStr = city.description.split(':')[0];
          const info = await getWeatherForecast(city.location, dateStr);
          if (info) updateCityWeather(city.id, info);
          // Small delay between requests
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.warn(`Weather fetch skipped for ${city.location}`);
        }
      }
    };
    fetchAllWeather();
  }, []); // Empty dependency array intentionally to run once on mount

  return (
    <div className="flex h-screen w-full bg-[#f9f7f4] dark:bg-[#000] overflow-hidden pt-safe-top pb-safe-bottom">
      <Welcome />
      <TripComplete />
      <Toast />
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-amber-500 text-white text-center py-2 text-xs font-bold uppercase tracking-widest" role="alert">
          You're offline — some features may be unavailable
        </div>
      )}
      <ImageGenerator />
      <aside className="hidden lg:flex w-80 bg-white dark:bg-[#070707] border-r border-slate-200 dark:border-white/5 p-8 flex-col z-10 shadow-2xl" role="complementary">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden shrink-0 flex flex-col z-20 px-4 pt-4 pb-2 bg-transparent relative">
          <div className="flex items-center justify-between mb-4 px-2">
            <MiniCalendarHeader />
            <button onClick={toggleTheme} aria-label="Toggle dark mode" className="w-9 h-9 rounded-full bg-white dark:bg-white/10 shadow-lg flex items-center justify-center text-slate-600 dark:text-white border border-slate-100 dark:border-white/5">
              {theme === 'light' ? '☾' : '☼'}
            </button>
          </div>
          <MobileNav />
        </header>

        <div className="flex-1 relative overflow-hidden w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const p = location.pathname;

  const tripPaths = ['/list', '/countdown', '/reveals', '/phrases', '/flyover', '/chat', '/story'];
  const togetherPaths = ['/preferences', '/prompts', '/trivia', '/challenges', '/surprises', '/packing', '/wishlist', '/gioco', '/together/live', '/together/verdict'];

  const isMap = p === '/';
  const isTrip = p === '/trip' || p.startsWith('/day') || tripPaths.some(tp => p === tp);
  const isPassport = p === '/passport' || p === '/gallery';
  const isTogether = p === '/together' || togetherPaths.some(tp => p === tp);

  return (
    <nav aria-label="Main navigation" className="p-1.5 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl flex items-center justify-around">
      <NavButton active={isMap} onClick={() => navigate('/')} icon={<Icons.Map />} label="Map" />
      <NavButton active={isTrip} onClick={() => navigate('/trip')} icon={<Icons.Compass />} label="Trip" />
      <NavButton active={isPassport} onClick={() => navigate('/passport')} icon={<div className="h-4 w-4 border-2 border-current rounded-sm" aria-hidden="true" />} label="Passport" />
      <NavButton active={isTogether} onClick={() => navigate('/together')} icon={<Icons.Hearts />} label="Us" />
    </nav>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={onClick} aria-current={active ? 'page' : undefined} className={`shrink-0 flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 rounded-[1.8rem] transition-all gap-1 ${active ? 'bg-[#194f4c] text-white shadow-xl' : 'text-slate-500 dark:text-slate-400'}`}>
    <span aria-hidden="true">{icon}</span>
    <span className="text-[7px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

const MiniCalendarHeader = () => {
  const { days } = useCountdown();
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-12 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="h-2.5 bg-[#CE2B37] dark:bg-red-900 w-full" />
        <div className="flex flex-col items-center justify-center h-full -mt-1">
          <span className="text-[14px] font-serif font-bold text-slate-900 dark:text-white leading-none">{days}</span>
          <span className="text-[5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tighter">GIORNI</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-serif italic text-2xl font-bold tracking-tighter text-[#194f4c] dark:text-white leading-none">Grand Tour</span>
        <span className="text-[8px] font-bold text-[#ac3d29] dark:text-emerald-400 uppercase tracking-widest mt-0.5">ANNIVERSARY TRIP</span>
      </div>
    </div>
  );
};

const LazyFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#f9f7f4] dark:bg-black">
    <div className="w-8 h-8 border-2 border-[#194f4c] border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<LazyFallback />}>
    <AnimatePresence mode="popLayout">
      <Routes location={location}>
        <Route path="/" element={<OverviewMap />} />
        <Route path="/list" element={<ItineraryList />} />
        <Route path="/passport" element={<Passaporto />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/story" element={<StoryMode />} />
        <Route path="/countdown" element={<CountdownDashboard />} />
        <Route path="/reveals" element={<DailyReveal />} />
        <Route path="/packing" element={<PackingChecklist />} />
        <Route path="/phrases" element={<LearnPhrase />} />
        <Route path="/nuke" element={<NukeTrip />} />
        <Route path="/photos" element={<RefreshPhotos />} />
        <Route path="/flyover" element={<RouteFlyover />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/preferences" element={<PreferenceMatch />} />
        <Route path="/prompts" element={<ConversationStarters />} />
        <Route path="/surprises" element={<SurprisePlanner />} />
        <Route path="/challenges" element={<PhotoChallenges />} />
        <Route path="/trivia" element={<TriviaChallenge />} />
        <Route path="/trip" element={<TripHub />} />
        <Route path="/together" element={<TogetherHub />} />
        <Route path="/together/live" element={<LiveTripPage embedded />} />
        <Route path="/together/verdict" element={<JudgesVerdict />} />
        <Route path="/gioco" element={<BlockBlast />} />
        <Route path="/day/:cityId" element={<DayDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </Suspense>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isPublic = location.pathname === '/live' || location.pathname.startsWith('/family');
  if (isPublic) {
    return (
      <Routes location={location}>
        <Route
          path="/live"
          element={
            <ErrorBoundary
              label="LiveTripPage"
              fallback={
                <div className="h-[100dvh] flex items-center justify-center p-6 text-center bg-[#f9f7f4]">
                  <div className="max-w-sm">
                    <p className="font-serif text-xl text-[#194f4c] mb-2">Something tripped up the page</p>
                    <p className="text-sm text-slate-500 mb-4">Try reloading — that usually clears it.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-5 py-2 rounded-full bg-[#194f4c] text-white text-sm font-bold"
                    >
                      Reload
                    </button>
                  </div>
                </div>
              }
            >
              <LiveTripPage />
            </ErrorBoundary>
          }
        />
        {/* /family was the old interactive page; it's now folded into /live */}
        <Route path="/family" element={<Navigate to="/live" replace />} />
        <Route path="/family/join" element={<FamilyJoin />} />
        <Route path="/family/join/:code" element={<FamilyJoin />} />
      </Routes>
    );
  }
  return (
    <AuthGate>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </AuthGate>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;