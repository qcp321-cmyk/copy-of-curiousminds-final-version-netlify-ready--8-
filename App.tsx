
import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowUpRight, 
  X, 
  Sparkles, 
  Menu, 
  BrainCircuit, 
  ShieldAlert,
  Lock,
  Globe,
  Share2,
  Cpu,
  ShieldCheck,
  Zap,
  Bot,
  User,
  ChevronRight,
  MessageCircle,
  Bookmark,
  Clock,
  Trash2,
  ExternalLink,
  Calendar,
  Calculator
} from 'lucide-react';
import ThreeBackground from './components/ThreeBackground';
import ScenarioGenerator from './components/ScenarioGenerator';
import EngineOcean from './components/EngineOcean';
import SessionStructure from './components/SessionStructure';
import AdminDashboard from './components/AdminDashboard';
import RegistrationModal from './components/RegistrationModal';
import DemoBookingModal from './components/DemoBookingModal';
import ProductCapabilities from './components/ProductCapabilities';
import ReferralOverlay from './components/ReferralOverlay';
import ImpactSection from './components/ImpactSection';
import GlobalChat from './components/GlobalChat';
import VisionModal from './components/VisionModal';
import NeuralSync from './components/NeuralSync';
import MissionPage from './components/MissionPage';
import MicroSaaSWidgets from './components/MicroSaaSWidgets';
import { mockBackend } from './services/mockBackend';
import { UserProfile, Bookmark as BookmarkType } from './types';

gsap.registerPlugin(ScrollTrigger);

const RANDOM_CURIOSITY_COLORS = [
  '#22d3ee', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Red
  '#60a5fa', // Blue
  '#f472b6'  // Pink
];

const HERO_PHRASES = [
  { white: 'unleash', color: 'curiosity.' },
  { white: 'forget', color: 'memorization.' },
  { white: 'be a part of', color: 'top 1% mind, globally.' }
];

const BookmarksModal = ({ currentUser, onClose, onSelect }: { currentUser: UserProfile | null, onClose: () => void, onSelect: (b: BookmarkType) => void }) => {
    if (!currentUser) return null;
    const bookmarks = currentUser.bookmarks || [];

    return (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300" data-lenis-prevent>
            <div className="bg-[#050505] border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 sm:p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div>
                        <h3 className="text-white font-black uppercase italic text-lg sm:text-2xl tracking-tighter">My Bookmarks</h3>
                        <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest mt-1">Saved synthesis results</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white active:scale-90 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-4 custom-scrollbar">
                    {bookmarks.length === 0 ? (
                        <div className="text-center py-20 opacity-20 text-gray-600 uppercase tracking-widest text-xs">No saved nodes archived.</div>
                    ) : (
                        bookmarks.map(b => (
                            <div key={b.id} className="bg-white/[0.03] p-4 sm:p-5 rounded-[1.5rem] border border-white/5 flex justify-between items-center gap-4 hover:border-cyan-500/20 transition-all group">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${b.type === 'SCENARIO' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {b.type}
                                        </span>
                                        <span className="text-[8px] text-gray-600 flex items-center gap-1 shrink-0"><Clock className="w-2.5 h-2.5" /> {new Date(b.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-white font-bold text-xs sm:text-sm uppercase italic truncate">{b.title}</h4>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                        onClick={() => mockBackend.toggleBookmark(b)}
                                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => onSelect(b)}
                                        className="p-2.5 bg-white/5 hover:bg-cyan-500 text-white hover:text-black rounded-xl transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const SharedViewer = ({ payload, onClose }: { payload: any, onClose: () => void }) => {
    const isMission = payload.type === 'MISSION_SYNTHESIS';
    const isVault = new URLSearchParams(window.location.search).get('vault') === 'true';

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-3 sm:p-6 md:p-10 animate-in fade-in duration-500" data-lenis-prevent>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
            <div className="relative w-full max-w-5xl bg-[#050505] border border-white/10 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col shadow-2xl h-full max-h-[90vh] md:max-h-none">
                <div className="p-5 sm:p-8 md:p-12 border-b border-white/5 bg-black/40 flex justify-between items-center relative overflow-hidden shrink-0">
                    <div className={`absolute top-0 left-0 w-full h-1 ${isVault ? 'bg-purple-600' : 'bg-cyan-600'}`}></div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${isVault ? 'bg-purple-600/20 text-purple-400' : 'bg-cyan-600/20 text-cyan-400'} border border-white/5`}>
                            {isMission ? <BrainCircuit className="w-6 h-6 sm:w-8 h-8" /> : <Globe className="w-6 h-6 sm:w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-base sm:text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Shared Link <span className={isVault ? 'text-purple-400' : 'text-cyan-400'}>Received</span></h2>
                            <p className="text-[6px] sm:text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2">
                                {isVault ? 'Privacy Protocol: Secure Access' : 'Protocol: Public Connection'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all group active:scale-90">
                        <X className="w-5 h-5 sm:w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-14 custom-scrollbar bg-black/20">
                    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
                        {isMission ? (
                            <>
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-400/10 w-fit px-3 py-1.5 rounded-lg border border-cyan-400/20">
                                        <User className="w-3 h-3" /> Information Module
                                    </div>
                                    <h3 className="text-xl sm:text-4xl md:text-5xl font-black text-white italic leading-tight">{payload.role}</h3>
                                    <div className="prose prose-invert prose-sm sm:prose-lg max-w-none text-gray-300 font-light leading-relaxed border-l-2 sm:border-l-4 border-cyan-500/30 pl-5 sm:pl-8 text-sm sm:text-lg">
                                        {payload.explanation}
                                    </div>
                                    {payload.steps && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-12">
                                            {payload.steps.map((step: string, i: number) => (
                                                <div key={i} className="p-4 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 text-[10px] sm:text-xs text-gray-400 leading-relaxed italic">
                                                    <span className="text-cyan-500 font-black mr-2">{i+1}.</span> {step}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {payload.quote && (
                                    <div className="p-5 sm:p-8 bg-cyan-500/5 border border-cyan-500/10 rounded-[1.5rem] sm:rounded-[2.5rem] text-center italic text-cyan-400/80 text-xs sm:text-base">
                                        "{payload.quote}"
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-400/10 w-fit px-3 py-1.5 rounded-lg border border-cyan-400/20">
                                        <Bot className="w-3 h-3" /> Response Stream
                                    </div>
                                    <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white italic leading-tight">{payload.query}</h3>
                                    <div className="prose prose-invert prose-sm sm:prose-lg max-w-none text-gray-300 font-light leading-relaxed bg-white/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-sm sm:text-lg">
                                        {payload.humanized?.split('\n').map((p: string, i: number) => <p key={i} className="mb-3 sm:mb-4">{p}</p>)}
                                    </div>
                                </div>
                                {payload.summary && (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-purple-400 tracking-widest bg-purple-400/10 w-fit px-3 py-1.5 rounded-lg border border-purple-400/20">
                                            <Cpu className="w-3 h-3" /> Learning Summary
                                        </div>
                                        <div className="p-5 sm:p-8 bg-purple-500/5 border border-purple-500/10 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-sm text-gray-500 italic">
                                            {payload.summary}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="pt-8 sm:pt-12 border-t border-white/5 text-center shrink-0">
                            <button onClick={onClose} className={`w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${isVault ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}`}>
                                Synchronize View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(mockBackend.getCurrentUser());
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isDemoBookingOpen, setIsDemoBookingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isMissionPageOpen, setIsMissionPageOpen] = useState(false);
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [engineMode, setEngineMode] = useState<'SCENARIO' | 'BEYOU' | 'OCEAN'>('SCENARIO');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [sharedPayload, setSharedPayload] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [curiosityColor, setCuriosityColor] = useState('#22d3ee');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isAppMounted, setIsAppMounted] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    setIsAppMounted(true);
    const randomColor = RANDOM_CURIOSITY_COLORS[Math.floor(Math.random() * RANDOM_CURIOSITY_COLORS.length)];
    setCuriosityColor(randomColor);

    const rotationInterval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % HERO_PHRASES.length);
    }, 5000);

    const searchParams = new URLSearchParams(window.location.search);
    const mission = searchParams.get('mission');
    const ocean = searchParams.get('ocean');
    
    if (mission || ocean) {
      try {
        const raw = mission || ocean;
        const decoded = decodeURIComponent(atob(raw!).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setSharedPayload(JSON.parse(decoded));
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Shared payload corrupted", e);
      }
    }

    const checkStatus = () => {
      const blocked = mockBackend.isAccessRevoked();
      setIsBlocked(blocked);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    mockBackend.trackEvent(currentUser?.id || null, 'PAGE_VIEW', 'Connection established');

    // Global Smooth Scroll Initialization
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      infinite: false,
    });
    
    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    lenis.on('scroll', (e: any) => {
        setIsScrolled(e.scroll > 100);
        ScrollTrigger.update();
    });

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Robust resize observer for viewport/zoom synchronization
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    const resizeObserver = new ResizeObserver(() => {
      // Throttle refresh slightly for performance during continuous resize/zoom
      gsap.delayedCall(0.1, handleResize);
    });
    resizeObserver.observe(document.documentElement);

    const handleStorage = () => {
        setCurrentUser(mockBackend.getCurrentUser());
        checkStatus();
    };
    window.addEventListener('storage', handleStorage);
    
    const triggerDemo = () => {
      const isShown = localStorage.getItem('cm_demo_shown');
      const isAdmin = currentUser?.role === 'ADMIN';
      
      if (!isAdmin && !isShown) {
        setTimeout(() => {
          setIsDemoBookingOpen(true);
          localStorage.setItem('cm_demo_shown', 'true');
        }, 1500);
      }
    };
    window.addEventListener('trigger-demo-booking', triggerDemo);
    
    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
      resizeObserver.disconnect();
      lenisRef.current = null;
      (window as any).lenis = null;
      clearInterval(interval);
      clearInterval(rotationInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('trigger-demo-booking', triggerDemo);
    };
  }, [currentUser?.id]);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center text-center p-6 sm:p-10 font-mono">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <ShieldAlert className="w-20 h-20 sm:w-32 sm:h-32 text-red-600 mb-6 sm:mb-8 animate-pulse" />
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Access Denied</h1>
          <div className="w-48 sm:w-64 h-1 bg-red-600/30 rounded-full mb-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-red-600 animate-[progress_2s_infinite_linear]"></div>
          </div>
          <p className="text-gray-500 max-w-md text-[10px] sm:text-sm leading-relaxed uppercase tracking-[0.2em]">
            This session has been restricted by the administrator.
          </p>
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 border border-red-900/30 bg-red-900/10 rounded-2xl sm:rounded-3xl">
             <p className="text-[8px] sm:text-[10px] text-red-500 font-bold uppercase tracking-widest">Error: Restricted Connection</p>
          </div>
          <style>{`@keyframes progress { 0% { left: -100%; } 100% { left: 100%; } }`}</style>
      </div>
    );
  }

  const handleRegistrationSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsRegistrationOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const lenis = lenisRef.current;
    if (element && lenis) {
      lenis.scrollTo(element, { 
        offset: -80,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
    } else if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setIsNavOpen(false);
  };

  return (
    <div className={`min-h-screen bg-transparent text-white selection:bg-cyan-500/30 overflow-x-hidden transition-opacity duration-1000 ${isAppMounted ? 'opacity-100' : 'opacity-0'}`}>
      <ThreeBackground mode={engineMode === 'BEYOU' ? 'SOOTHING' : 'OFF'} />

      {sharedPayload && <SharedViewer payload={sharedPayload} onClose={() => setSharedPayload(null)} />}
      {isMissionPageOpen && <MissionPage onClose={() => setIsMissionPageOpen(false)} />}
      {isToolkitOpen && <MicroSaaSWidgets onClose={() => setIsToolkitOpen(false)} />}

      <nav className={`fixed top-0 left-0 w-full z-[100] px-4 sm:px-12 py-4 sm:py-6 flex justify-between items-center transition-all duration-500 ${isScrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/5 py-3 sm:py-4' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={() => lenisRef.current?.scrollTo(0, { duration: 1.5 })}>
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-cyan-600 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-900/40 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-base sm:text-2xl font-black tracking-tighter uppercase italic shrink-0">Curious<span className="text-cyan-500">Minds</span></h1>
        </div>

        <div className="hidden md:flex items-center gap-6 lg:gap-12">
          <button onClick={() => setIsMissionPageOpen(true)} className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors relative">Mission</button>
          <button onClick={() => setIsProductOpen(true)} className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors relative">Products</button>
          <button onClick={() => setIsToolkitOpen(true)} className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors relative flex items-center gap-2">Toolkit <Calculator className="w-3 h-3" /></button>
          <button onClick={() => scrollToSection('ocean')} className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors relative">Discovery</button>
          <button onClick={() => setIsReferralOpen(true)} className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors relative">Referrals</button>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <button onClick={() => setIsRegistrationOpen(true)} className="bg-white text-black px-4 sm:px-8 py-2 sm:py-3 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all active:scale-95 shadow-2xl shrink-0">
            Join Now
          </button>
          <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 sm:p-3 md:hidden text-gray-400 hover:text-white transition-all bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group">
            <div className={`transition-all duration-300 ${isNavOpen ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
              <Menu className="w-5 h-5" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isNavOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`}>
              <X className="w-5 h-5" />
            </div>
          </button>
        </div>
      </nav>

      {isNavOpen && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-8 md:hidden" data-lenis-prevent>
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
            <button onClick={() => setIsNavOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 bg-white/5 rounded-full text-white active:scale-90 transition-transform hover:bg-white/10 border border-white/10">
              <X className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <nav className="flex flex-col items-center gap-6 sm:gap-8 text-center w-full max-w-xs relative z-10">
                <button onClick={() => { setIsNavOpen(false); setIsMissionPageOpen(true); }} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider sm:tracking-widest text-white italic hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '50ms'}}>Mission</button>
                <button onClick={() => { setIsNavOpen(false); setIsProductOpen(true); }} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider sm:tracking-widest text-white italic hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '100ms'}}>Products</button>
                <button onClick={() => { setIsNavOpen(false); setIsToolkitOpen(true); }} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider sm:tracking-widest text-white italic hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '150ms'}}>Toolkit</button>
                <button onClick={() => { setIsNavOpen(false); scrollToSection('ocean'); }} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider sm:tracking-widest text-white italic hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '200ms'}}>Discovery</button>
                <button onClick={() => { setIsNavOpen(false); setIsReferralOpen(true); }} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider sm:tracking-widest text-white italic hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '250ms'}}>Referrals</button>
                <div className="w-16 h-1 bg-cyan-600/30 rounded-full my-2 sm:my-4 animate-in fade-in duration-500" style={{animationDelay: '300ms'}}></div>
                <button onClick={() => { setIsNavOpen(false); setIsVisionOpen(true); }} className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-gray-500 hover:text-white transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '350ms'}}>Vision</button>
                {currentUser?.role === 'ADMIN' && (
                    <button onClick={() => { setIsNavOpen(false); setIsAdminOpen(true); }} className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-red-500 border border-red-500/20 px-5 sm:px-6 py-2 rounded-full hover:bg-red-500/10 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: '400ms'}}>Admin Node</button>
                )}
            </nav>
        </div>
      )}

      <section className="relative pt-32 sm:pt-32 md:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden min-h-[80vh] sm:min-h-0 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-full mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-cyan-400">Education Redefined</span>
          </div>
          
          <h2 className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[1.1] sm:leading-[0.85] mb-6 sm:mb-10 italic uppercase px-2 max-w-6xl mx-auto transition-all duration-1000 animate-in fade-in zoom-in-95" key={phraseIndex}>
            <span className="text-white block sm:inline">{HERO_PHRASES[phraseIndex].white}</span> <br className="hidden sm:block"/>
            <span style={{ color: curiosityColor }} className="drop-shadow-[0_0_20px_rgba(255,255,255,0.05)] block sm:inline">
              {HERO_PHRASES[phraseIndex].color}
            </span>
          </h2>
          
          <p className="text-gray-400 max-w-4xl mx-auto text-xs sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed mb-8 sm:mb-12 px-6 italic animate-fade-up">
            Traditional education focuses on memorization. We focus on synthesis. CuriousMinds is the catalyst for those who want to solve real-world problems.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-6 w-full max-w-4xl mx-auto animate-fade-up">
            <button onClick={() => scrollToSection('demo')} className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 bg-cyan-600 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-cyan-500 transition-all shadow-2xl active:scale-95 group flex items-center justify-center gap-3">
              Explore Engines <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setIsDemoBookingOpen(true)} className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 bg-white text-black rounded-full font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-cyan-400 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95 flex items-center justify-center gap-3">
              Book Free Demo (45min) <Calendar className="w-4 h-4" />
            </button>
            <button onClick={() => setIsVisionOpen(true)} className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 bg-white/5 border border-white/10 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 backdrop-blur-xl">
              Vision <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="relative z-20">
        <section id="demo" className="py-12 sm:py-24 md:py-32 bg-transparent px-4">
          <ScenarioGenerator 
            currentUser={currentUser} 
            onRequireAuth={() => setIsRegistrationOpen(true)} 
            externalMode={engineMode as 'SCENARIO' | 'BEYOU'}
            onModeChange={(mode) => setEngineMode(mode)}
          />
        </section>

        <section id="mission" className="bg-transparent px-4">
          <ImpactSection onRegister={() => setIsRegistrationOpen(true)} />
        </section>

        <section id="ocean" className="bg-transparent px-4">
          <EngineOcean />
        </section>

        <SessionStructure onBook={() => setIsDemoBookingOpen(true)} />

        <NeuralSync />
      </div>

      <footer className="py-16 sm:py-24 md:py-32 border-t border-white/5 bg-black/90 relative z-[100] backdrop-blur-2xl px-4">
        <div className="max-w-7xl mx-auto px-2 sm:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 lg:gap-32">
          <div className="sm:col-span-2 space-y-8 sm:space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-3xl shadow-cyan-900/40">
                <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase italic">Curious<span className="text-cyan-500">Minds</span></h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-lg max-w-md leading-relaxed italic">
              A new approach to education for the modern era. Learn to solve, not to repeat.
            </p>
            <button onClick={() => setIsDemoBookingOpen(true)} className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-cyan-500/5 border border-cyan-500/20 flex flex-col gap-3 w-full sm:w-fit text-left group hover:border-cyan-500 transition-all">
               <p className="text-[8px] sm:text-[10px] text-cyan-500 uppercase font-black tracking-[0.3em] sm:tracking-[0.4em]">Ready to Evolve?</p>
               <p className="text-xs sm:text-sm text-white font-black flex items-center gap-3 sm:gap-4 uppercase italic">
                 Book a Free Demo <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </p>
            </button>
          </div>
          <div>
            <h4 className="text-[9px] sm:text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] sm:tracking-[0.6em] mb-6 sm:mb-12">Navigation</h4>
            <div className="flex flex-col gap-4 sm:gap-6 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest">
              <button onClick={() => setIsAdminOpen(true)} className="text-left text-cyan-500 hover:text-white transition-all flex items-center gap-3 group">
                 Admin Portal <span className="text-[7px] bg-red-600/10 text-red-500 px-1.5 py-0.5 rounded font-black tracking-widest group-hover:bg-red-500 group-hover:text-white transition-all">Secure</span>
              </button>
              <button onClick={() => setIsVisionOpen(true)} className="text-left hover:text-white transition-colors">Vision</button>
              <button onClick={() => setIsToolkitOpen(true)} className="text-left hover:text-white transition-colors">Toolkit</button>
              <button onClick={() => setIsProductOpen(true)} className="text-left hover:text-white transition-colors">Products</button>
              <button onClick={() => scrollToSection('demo')} className="text-left hover:text-white transition-colors">Learning Lab</button>
            </div>
          </div>
          <div>
            <h4 className="text-[9px] sm:text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] sm:tracking-[0.6em] mb-6 sm:mb-12">Connect</h4>
            <div className="flex flex-col gap-4 sm:gap-6 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest">
              <a href="https://www.linkedin.com/company/9curiousminds/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-all flex items-center gap-3 group">LinkedIn <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /></a>
              <a href="https://wa.me/917970750727" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-all flex items-center gap-3 group">WhatsApp <MessageCircle className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /></a>
              <a href="#" className="hover:text-cyan-400 transition-all flex items-center gap-3 group">Twitter <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /></a>
              <a href="#" className="hover:text-cyan-400 transition-all flex items-center gap-3 group">Discord <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-2 sm:px-10 mt-16 sm:mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <p className="text-[8px] sm:text-[10px] text-gray-700 font-mono leading-relaxed uppercase tracking-[0.2em]">
            © 2025 CuriousMinds Inc.
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-[8px] sm:text-[10px] text-gray-800 font-mono">
             <span className="uppercase tracking-[0.3em]">Privacy Policy</span>
             <span className="uppercase tracking-[0.3em]">Security Protocol</span>
          </div>
        </div>
      </footer>

      {isRegistrationOpen && <RegistrationModal onSuccess={handleRegistrationSuccess} onClose={() => setIsRegistrationOpen(false)} />}
      {isDemoBookingOpen && <DemoBookingModal userId={currentUser?.id || mockBackend.getCurrentSessionId()} onClose={() => setIsDemoBookingOpen(false)} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isProductOpen && <ProductCapabilities onClose={() => setIsProductOpen(false)} onExplore={(id) => { setIsProductOpen(false); scrollToSection(id === 'ocean' ? 'ocean' : 'demo'); setEngineMode(id === 'beyou' ? 'BEYOU' : id === 'ocean' ? 'OCEAN' : 'SCENARIO'); }} />}
      {isReferralOpen && <ReferralOverlay currentUser={currentUser} onClose={() => setIsReferralOpen(false)} onRegister={() => setIsRegistrationOpen(true)} />}
      {isVisionOpen && <VisionModal onClose={() => setIsVisionOpen(false)} onAction={() => { setIsVisionOpen(false); scrollToSection('demo'); }} />}
      {isBookmarksOpen && (
          <BookmarksModal 
              currentUser={currentUser} 
              onClose={() => setIsBookmarksOpen(false)} 
              onSelect={(b) => {
                  setIsBookmarksOpen(false);
                  setSharedPayload(b.data);
              }}
          />
      )}
      <GlobalChat currentUser={currentUser} />
    </div>
  );
};

export default App;
