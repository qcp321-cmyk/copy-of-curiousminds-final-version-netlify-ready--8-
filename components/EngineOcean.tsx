
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Waves, Volume2, Loader2, Sparkles, BookOpen, GraduationCap, Target, ExternalLink, FileDown, Globe, Play, Pause, Square, User, Bot, Microscope, Activity, Gauge, Headphones, X, CheckCircle2, Bookmark, ImageIcon, Info, HelpCircle, Volume1, VolumeX, MessageCircle, AlertTriangle, Phone } from 'lucide-react';
import { engineOceanQuery, deepDiveQuery, generateFounderRemark, translateEngineResult, generateMissionImage } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import { mockBackend } from '../services/mockBackend';

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Kannada', code: 'kn' }
];

const DIFFICULTIES = ['Standard', 'Adaptive', 'Specialized', 'Hardcore'];
const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2];

type AudioStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED';
type AudioChoice = 'HUMANIZED' | 'DEEP_DIVE' | 'BOTH';

// Cache key for persistent audio state
const AUDIO_CACHE_KEY = 'ocean_audio_state';

// Language to speech voice mapping with pronunciation settings
const VOICE_LANG_MAP: Record<string, { lang: string; pitch: number; rate: number; pauseMs: number }> = {
  'English': { lang: 'en-US', pitch: 1.0, rate: 1.0, pauseMs: 200 },
  'Hindi': { lang: 'hi-IN', pitch: 1.05, rate: 0.9, pauseMs: 300 },
  'Spanish': { lang: 'es-ES', pitch: 1.0, rate: 0.95, pauseMs: 250 },
  'French': { lang: 'fr-FR', pitch: 1.0, rate: 0.92, pauseMs: 280 },
  'German': { lang: 'de-DE', pitch: 0.95, rate: 0.88, pauseMs: 320 },
  'Japanese': { lang: 'ja-JP', pitch: 1.1, rate: 0.85, pauseMs: 350 },
  'Malayalam': { lang: 'ml-IN', pitch: 1.0, rate: 0.82, pauseMs: 380 },
  'Kannada': { lang: 'kn-IN', pitch: 1.0, rate: 0.85, pauseMs: 350 }
};

const AudioVisualizer = () => (
  <div className="flex items-end gap-[2px] h-3 w-4">
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_0.8s_ease-in-out_infinite] h-1"></div>
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_1.1s_ease-in-out_infinite_0.1s] h-2"></div>
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_0.9s_ease-in-out_infinite_0.2s] h-1.5"></div>
  </div>
);

const EngineOcean: React.FC = () => {
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('10');
  const [marks, setMarks] = useState('5');
  const [difficulty, setDifficulty] = useState('Standard');
  const [loading, setLoading] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<{ humanized: string, summary: string, grounding: any[], deepDive?: string, imageUrl?: string } | null>(null);
  
  // Advanced Audio State
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('IDLE');
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [showAudioControls, setShowAudioControls] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const [showLimitExhausted, setShowLimitExhausted] = useState(false);

  const currentUser = mockBackend.getCurrentUser();

  // Web Speech API Refs for smooth unlimited playback
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTextRef = useRef<string>('');
  const speechProgressRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const estimatedDurationRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number>(0);

  const resultRef = useRef<HTMLDivElement>(null);
  const sessionHistoryRef = useRef<{ query: string; summary: string }[]>([]);

  // Pre-warm speech synthesis on mount for instant playback
  useEffect(() => {
    // Preload voices
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
    }
    
    // Restore persisted state if exists
    try {
      const cached = localStorage.getItem(AUDIO_CACHE_KEY);
      if (cached) {
        const { query: cachedQuery, text, progress } = JSON.parse(cached);
        if (cachedQuery && text) {
          speechTextRef.current = text;
          speechProgressRef.current = progress || 0;
        }
      }
    } catch (e) {}
    
    return () => {
      stopAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Update volume in real-time
  useEffect(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  // Update playback rate in real-time
  useEffect(() => {
    if (speechSynthRef.current && audioStatus === 'PLAYING') {
      // Restart with new rate from current position
      const currentProgress = speechProgressRef.current;
      speechSynthesis.cancel();
      const remainingText = speechTextRef.current.slice(Math.floor(currentProgress * speechTextRef.current.length));
      if (remainingText) {
        startSpeechFromText(remainingText, currentProgress);
      }
    }
  }, [audioSpeed]);
  
  // Persist audio state on changes
  useEffect(() => {
    if (result && speechTextRef.current) {
      try {
        localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify({
          query,
          text: speechTextRef.current,
          progress: speechProgressRef.current
        }));
      } catch (e) {}
    }
  }, [audioCurrentTime, result, query]);

  const updateAudioProgress = useCallback(() => {
    if (audioStatus === 'PLAYING') {
      const elapsed = (Date.now() - playbackStartTimeRef.current) / 1000 * audioSpeed;
      const baseProgress = speechProgressRef.current * estimatedDurationRef.current;
      const current = baseProgress + elapsed;
      setAudioCurrentTime(Math.min(current, audioDuration));
      
      if (current >= audioDuration) {
        setAudioStatus('IDLE');
        speechProgressRef.current = 0;
        setAudioCurrentTime(0);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(updateAudioProgress);
  }, [audioStatus, audioSpeed, audioDuration]);

  const startSpeechFromText = (text: string, progressOffset: number = 0) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech not supported in this browser');
      return;
    }
    
    // Get language-specific settings for pronunciation adaptation
    const langSettings = VOICE_LANG_MAP[selectedLanguage] || VOICE_LANG_MAP['English'];
    
    // Process text for better clarity - add natural pauses
    let processedText = text
      .replace(/\. /g, `. <break time="${langSettings.pauseMs}ms"/> `) // Pause after sentences
      .replace(/\, /g, `, <break time="${Math.floor(langSettings.pauseMs * 0.5)}ms"/> `) // Shorter pause for commas
      .replace(/\: /g, `: <break time="${Math.floor(langSettings.pauseMs * 0.7)}ms"/> `) // Medium pause for colons
      .replace(/\n/g, ` <break time="${langSettings.pauseMs}ms"/> `); // Pause for line breaks
    
    // For SSML-unsupported browsers, use simple punctuation spacing
    const simpleText = text
      .replace(/\./g, '. ')
      .replace(/\,/g, ', ')
      .replace(/\n+/g, '. ');
    
    const utterance = new SpeechSynthesisUtterance(simpleText);
    utterance.lang = langSettings.lang;
    utterance.rate = langSettings.rate * audioSpeed; // Combine language rate with user speed
    utterance.volume = audioVolume;
    utterance.pitch = langSettings.pitch;
    
    // Get best native voice for language with proper pronunciation
    const voices = speechSynthesis.getVoices();
    const langCode = langSettings.lang;
    const langPrefix = langCode.split('-')[0];
    
    // Priority: Native language voice > Local service > Any matching > Default
    const preferredVoice = 
      voices.find(v => v.lang === langCode && v.localService) ||
      voices.find(v => v.lang === langCode) ||
      voices.find(v => v.lang.startsWith(langPrefix) && v.localService) ||
      voices.find(v => v.lang.startsWith(langPrefix)) ||
      voices.find(v => v.default);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => {
      setAudioStatus('IDLE');
      speechProgressRef.current = 0;
      setAudioCurrentTime(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    
    utterance.onerror = () => {
      setAudioStatus('IDLE');
    };
    
    utterance.onboundary = (e) => {
      if (e.name === 'word' && speechTextRef.current.length > 0) {
        speechProgressRef.current = e.charIndex / speechTextRef.current.length;
      }
    };
    
    speechSynthRef.current = utterance;
    speechProgressRef.current = progressOffset;
    playbackStartTimeRef.current = Date.now();
    
    speechSynthesis.speak(utterance);
    setAudioStatus('PLAYING');
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateAudioProgress);
  };

  const stopAudio = () => {
    speechSynthesis.cancel();
    speechSynthRef.current = null;
    setAudioStatus('IDLE');
    speechProgressRef.current = 0;
    setAudioCurrentTime(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const togglePauseResume = () => {
    if (audioStatus === 'PLAYING') {
      speechSynthesis.pause();
      setAudioStatus('PAUSED');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else if (audioStatus === 'PAUSED') {
      speechSynthesis.resume();
      playbackStartTimeRef.current = Date.now();
      setAudioStatus('PLAYING');
      rafRef.current = requestAnimationFrame(updateAudioProgress);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setAudioCurrentTime(newTime);
    
    if (speechTextRef.current && (audioStatus === 'PLAYING' || audioStatus === 'PAUSED')) {
      speechSynthesis.cancel();
      const newProgress = newTime / audioDuration;
      const startIndex = Math.floor(newProgress * speechTextRef.current.length);
      const remainingText = speechTextRef.current.slice(startIndex);
      if (remainingText) {
        startSpeechFromText(remainingText, newProgress);
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBookmark = () => {
    if (!result) return;
    if (!currentUser) return;
    mockBackend.toggleBookmark({
      type: 'OCEAN',
      title: query,
      data: result
    });
  };

  const isBookmarked = currentUser?.bookmarks?.some(b => b.title === query && b.type === 'OCEAN');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    let processedQuery = query.trim();
    let currentMarks = marks;
    let isSyllabusMode = false;

    if (processedQuery.startsWith('>')) {
      isSyllabusMode = true;
      processedQuery = processedQuery.substring(1).trim();
    }

    if (processedQuery.includes('/')) {
      const parts = processedQuery.split('/');
      const potentialMarks = parts.pop()?.trim();
      if (potentialMarks && !isNaN(Number(potentialMarks))) {
        currentMarks = potentialMarks;
        processedQuery = parts.join('/').trim();
      }
    }

    const userId = currentUser?.id || mockBackend.getCurrentSessionId();
    if (!mockBackend.checkUsageLimit(userId, 'OCEAN')) { setShowLimitExhausted(true); return; }

    setLoading(true);
    setResult(null);
    stopAudio();
    setShowAudioControls(false);
    
    mockBackend.trackEvent(userId, 'FORM_SUBMISSION', 'Engine Ocean inquiry', { query: processedQuery, grade, marks: currentMarks, difficulty, isSyllabusMode });

    try {
      const [data, imageUrl] = await Promise.all([
        engineOceanQuery(processedQuery, grade, currentMarks, difficulty, isSyllabusMode),
        generateMissionImage(`Academic whiteboard sketch of ${processedQuery} for educational node ${grade}`)
      ]);

      const finalResult = { ...data, imageUrl };
      setResult(finalResult);
      
      // Store in session history for memory-based recaps
      sessionHistoryRef.current.push({ query: processedQuery, summary: data.summary });

      mockBackend.incrementUsage(userId, 'OCEAN');
      window.dispatchEvent(new CustomEvent('trigger-demo-booking'));
      
      const lenis = (window as any).lenis;
      if (lenis && resultRef.current) {
        lenis.scrollTo(resultRef.current, { offset: -50 });
      } else {
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    } catch (e) { alert("Resolution failed."); } finally { setLoading(false); }
  };

  const handleDeepDive = async () => {
    if (!result || deepDiveLoading) return;
    setDeepDiveLoading(true);
    try {
      const dd = await deepDiveQuery(query, result.humanized);
      setResult(prev => prev ? { ...prev, deepDive: dd } : null);
    } catch (e) { alert("Neural expansion failed."); } finally { setDeepDiveLoading(false); }
  };

  const initiateAudioSelector = () => {
    if (!result) return;
    if (audioStatus === 'PLAYING' || audioStatus === 'PAUSED') {
      stopAudio();
      setShowAudioControls(false);
      return;
    }
    setShowAudioSelector(true);
  };

  const handleSpeak = async (choice: AudioChoice) => {
    if (!result) return;
    setShowAudioSelector(false);
    
    // Prepare full text with no word limits
    let audioText = "";
    if (choice === 'HUMANIZED') audioText = result.humanized;
    else if (choice === 'DEEP_DIVE') audioText = result.deepDive || "";
    else if (choice === 'BOTH') audioText = `${result.humanized}. ${result.deepDive || ''}. ${result.summary}`;
    
    // Clean text for speech - remove special chars but keep punctuation
    audioText = audioText.replace(/[\[\]\(\)\*\#\_\~\`\>\/\\\|]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!audioText) {
      alert('No content to play');
      return;
    }
    
    // Store for persistence and scrubbing
    speechTextRef.current = audioText;
    speechProgressRef.current = 0;
    
    // Estimate duration: ~150 words per minute at 1x speed
    const wordCount = audioText.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;
    estimatedDurationRef.current = estimatedDuration;
    setAudioDuration(estimatedDuration);
    setShowAudioControls(true);
    
    // Start playback immediately - no loading delay
    startSpeechFromText(audioText, 0);
  };

  const renderFormattedText = (text: string) => {
    const cleanLine = (line: string) => line.replace(/[*#_~`>\[\]\(\)\/\\]/g, '').trim();
    const lines = text.split('\n');

    return lines.map((line, i) => {
        const cleaned = cleanLine(line);
        if (!cleaned && !line.includes('|')) return <div key={i} className="h-4" />;

        const isHeader = cleaned.match(/^[A-Z\s:]{4,40}$/) || 
                         cleaned.toLowerCase().includes('abstract') || 
                         cleaned.toLowerCase().includes('mechanics') ||
                         cleaned.toLowerCase().includes('analysis') ||
                         cleaned.toLowerCase().includes('visualisation') ||
                         cleaned.toLowerCase().includes('diagram') ||
                         cleaned.toLowerCase().includes('roadmap') ||
                         cleaned.toLowerCase().includes('synergy') ||
                         cleaned.toLowerCase().includes('references');

        if (isHeader) {
            return (
              <div key={i}>
                <h3 className="text-xl sm:text-2xl font-black text-cyan-400 mt-10 mb-5 uppercase tracking-tighter italic border-b border-white/5 pb-2">
                  {cleaned}
                </h3>
                {(cleaned.toLowerCase().includes('visualisation') || cleaned.toLowerCase().includes('diagram')) && result?.imageUrl && (
                  <div className="my-8 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl aspect-video bg-black/40">
                      <img src={result.imageUrl} alt="Neural Synthesis Visualization" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute bottom-6 left-6 flex items-center gap-3">
                         <div className="p-2 bg-cyan-500 rounded-lg text-black shadow-lg">
                            <ImageIcon className="w-4 h-4" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Generated Schematic Visualization</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
        }

        if (line.includes('|') || line.includes('->') || line.includes('+--')) {
            return <pre key={i} className="bg-black/60 p-4 rounded-xl font-mono text-[10px] sm:text-xs text-cyan-500/80 overflow-x-auto my-4 border border-cyan-500/10 shadow-inner">{line}</pre>;
        }

        return <p key={i} className="mb-6 text-gray-300 leading-relaxed font-light text-sm sm:text-base">{cleaned}</p>;
    });
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    
    try {
      const founderInsight = await generateFounderRemark(result.humanized, 'OCEAN');
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = 0;

      const checkNewPage = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
          drawHeader();
          return true;
        }
        return false;
      };

      const drawHeader = () => {
        doc.setFillColor(10, 15, 20); doc.rect(0, 0, pageWidth, 50, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.text('CuriousMinds', margin, 22);
        doc.setTextColor(34, 211, 238); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('ENGINE OCEAN UPLINK // UNIVERSITY GRADE', margin, 30);
        doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.5); doc.line(margin, 34, margin + 40, 34);
        currentY = 65;
      };

      const drawFooter = () => {
        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('© 2025 CURIOUSMINDS INC. // SYNTHESIS ARCHITECTURE', pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      drawHeader(); drawFooter();
      
      doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(query.toUpperCase(), contentWidth);
      doc.text(titleLines, margin, currentY); currentY += (titleLines.length * 8) + 10;

      doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const briefingLines = doc.splitTextToSize(result.humanized.replace(/[*#_~`>\[\]\(\)\/\\]/g, ''), contentWidth);
      briefingLines.forEach((line: string) => {
        checkNewPage(6); doc.text(line, margin, currentY); currentY += 6;
      });

      currentY += 15; checkNewPage(40);
      doc.setFillColor(10, 15, 20); doc.roundedRect(margin - 5, currentY, contentWidth + 10, 35, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('FOUNDER\'S MOTO', margin + 5, currentY + 10);
      doc.setTextColor(34, 211, 238); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
      const quoteLines = doc.splitTextToSize(`"${founderInsight.remark}"`, contentWidth - 10);
      doc.text(quoteLines, margin + 5, currentY + 18);

      doc.save(`CuriousMinds_Ocean_${query.replace(/\s+/g, '_').substring(0, 20)}.pdf`);
    } catch (e) { alert("PDF generation failed."); } finally { setIsExporting(false); }
  };

  return (
    <section id="ocean" className="py-12 sm:py-32 px-1 sm:px-4 bg-gradient-to-b from-black to-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
      
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4 sm:mb-6">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">High-Intelligence Synthesis Hub</span>
          </div>
          <h2 className="text-3xl sm:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight italic uppercase">Engine <span className="text-cyan-500">Ocean</span></h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-xs sm:text-lg px-4 leading-relaxed italic">Definitive university-grade resolution with integrated neural visualizations.</p>
        </div>

        <div className="glass-panel p-5 sm:p-12 rounded-[1.5rem] sm:rounded-[3rem] border border-white/10 shadow-3xl">
          <form onSubmit={handleSearch} className="space-y-6 sm:space-y-10">
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Query topic for definitive resolution..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-12 sm:px-16 py-4 sm:py-5 text-white outline-none focus:border-cyan-500/50 transition-all text-xs sm:text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                <div className="flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl group hover:border-cyan-500/30 transition-all">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 shrink-0"><Sparkles className="w-3.5 h-3.5" /></div>
                  <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1 italic">Syllabus Mode</p>
                    <p className="text-[8px] text-gray-500 leading-relaxed">Start with <span className="text-cyan-400 font-bold">&gt;</span> to generate an exhaustive degree roadmap (8 semesters for Univ).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl group hover:border-purple-500/30 transition-all">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0"><HelpCircle className="w-3.5 h-3.5" /></div>
                  <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1 italic">Resolution Depth</p>
                    <p className="text-[8px] text-gray-500 leading-relaxed">Add <span className="text-purple-400 font-bold">/marks</span> (e.g., /20) to force a specific academic weightage output.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Academic Node</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer text-[10px] sm:text-xs">
                  {[...Array(12)].map((_, i) => <option key={i} value={i+1} className="bg-black">Grade {i+1}</option>)}
                  <option value="University" className="bg-black">University / Higher Ed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4" /> Resolution Depth</label>
                <select value={marks} onChange={e => setMarks(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer text-[10px] sm:text-xs">
                  <option value="5" className="bg-black">5 - Core Summary</option>
                  <option value="10" className="bg-black">10 - Advanced Analysis</option>
                  <option value="20" className="bg-black">20 - Comprehensive Synthesis</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4" /> Intelligence Bias</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer text-[10px] sm:text-xs">
                  {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                </select>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 sm:py-5 bg-cyan-600 hover:bg-cyan-500 rounded-xl sm:rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-widest text-[9px] sm:text-xs">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 sm:w-5 h-5" /> Execute Ocean Uplink</>}
            </button>
          </form>

          {result && !loading && (
            <div ref={resultRef} className="mt-12 sm:mt-16 animate-in fade-in zoom-in-95 duration-700">
              <div className="flex flex-col xl:flex-row justify-between items-center gap-4 sm:gap-6 mb-8 sm:mb-10 bg-cyan-950/20 border border-cyan-500/20 p-4 sm:p-6 rounded-[1.2rem] sm:rounded-[2rem]">
                <div className="flex items-center gap-2 sm:gap-3 text-cyan-400 shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 h-6" />
                  <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight sm:tracking-[0.2em]">Synthesis Delivered</span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 w-full xl:w-auto">
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 px-3 py-2 rounded-lg sm:rounded-xl border border-white/10 shrink-0">
                    <Globe className="w-3.5 h-3.5 text-gray-500" />
                    <select disabled={isTranslating} value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-transparent text-[8px] sm:text-[10px] font-black uppercase text-white outline-none cursor-pointer disabled:opacity-50">
                      {LANGUAGES.map(l => <option key={l.code} value={l.name} className="bg-black">{l.name}</option>)}
                    </select>
                  </div>

                  <button onClick={initiateAudioSelector} disabled={isTranslating} className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 min-w-[100px] ${audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-50'}`}>
                    {audioStatus === 'LOADING' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? <Square className="w-2.5 h-2.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? 'Stop' : 'Listen'}</span>
                    {(audioStatus === 'PLAYING' || audioStatus === 'PAUSED') && <AudioVisualizer />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button onClick={handleBookmark} className={`p-2.5 rounded-lg sm:rounded-xl border transition-all active:scale-90 ${isBookmarked ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`} title="Bookmark result">
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={handleDeepDive} disabled={deepDiveLoading || isTranslating} className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-cyan-500/30 transition-all active:scale-95 min-w-[100px] disabled:opacity-50">
                      {deepDiveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Microscope className="w-3.5 h-3.5" />} Deep Dive
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting || isTranslating} className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 bg-white text-black rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center min-w-[100px] disabled:opacity-50">
                      {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Audio Controls Bar */}
              {showAudioControls && (
                <div className="mb-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePauseResume} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-90">
                        {audioStatus === 'PLAYING' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                      <div className="flex-1 flex flex-col gap-1">
                        <input 
                          type="range" 
                          min="0" 
                          max={audioDuration || 0} 
                          step="0.01"
                          value={audioCurrentTime} 
                          onChange={handleScrub}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[8px] sm:text-[10px] font-black font-mono text-gray-500 uppercase tracking-widest">
                          <span>{formatTime(audioCurrentTime)}</span>
                          <span>{formatTime(audioDuration)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 group">
                          {audioVolume === 0 ? <VolumeX className="w-4 h-4 text-gray-500" /> : audioVolume < 0.5 ? <Volume1 className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />}
                          <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={audioVolume} onChange={e => setAudioVolume(parseFloat(e.target.value))}
                            className="w-20 sm:w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" 
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Gauge className="w-4 h-4 text-gray-500" />
                          <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                            {PLAYBACK_SPEEDS.map(speed => (
                              <button 
                                key={speed} 
                                onClick={() => setAudioSpeed(speed)}
                                className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black transition-all ${audioSpeed === speed ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-white'}`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { stopAudio(); setShowAudioControls(false); }} className="text-[8px] sm:text-[10px] font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-colors">Terminate Stream</button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-8 sm:space-y-12 relative">
                 {isTranslating && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                      <div className="flex items-center gap-3 bg-black/80 p-6 rounded-2xl border border-cyan-500/30">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Neural Calibration...</span>
                      </div>
                   </div>
                 )}

                 <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-400/10 w-fit px-3 py-1.5 rounded-lg border border-cyan-400/20"><User className="w-3.5 h-3.5" /> High-Resolution Briefing</div>
                    <div className="prose prose-invert prose-sm sm:prose-lg max-w-none text-gray-200 bg-white/5 p-5 sm:p-12 rounded-[1.2rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl overflow-x-hidden font-light min-h-[400px]">
                      {renderFormattedText(result.humanized)}
                      
                      {result.deepDive && (
                        <div className="mt-12 pt-12 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
                           <div className="flex items-center gap-2 sm:gap-3 mb-6 text-cyan-400 font-black uppercase text-[10px] sm:text-xs tracking-widest">
                             <Microscope className="w-4 h-4 sm:w-5 h-5" /> Technical Nexus Expansion
                           </div>
                           <div className="text-gray-400 text-sm sm:text-base leading-relaxed italic border-l-2 border-cyan-500/30 pl-4 sm:pl-8 whitespace-pre-wrap break-words">
                             {renderFormattedText(result.deepDive)}
                           </div>
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-purple-400 tracking-widest bg-purple-400/10 w-fit px-3 py-1.5 rounded-lg border border-purple-400/20"><Bot className="w-3.5 h-3.5" /> Engine Metadata</div>
                    <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-gray-500 bg-purple-500/5 p-5 sm:p-8 rounded-[1.2rem] sm:rounded-[2rem] border border-purple-500/10 leading-relaxed italic overflow-x-hidden break-words">
                      {result.summary}
                    </div>
                 </div>
              </div>

              {result.grounding.length > 0 && (
                <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/5 overflow-x-auto no-scrollbar">
                  <span className="text-[8px] sm:text-[10px] text-gray-600 uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] block mb-4">Neural Node References:</span>
                  <div className="flex gap-2 sm:gap-3 pb-2">
                    {result.grounding.map((chunk, i) => chunk.web && (
                      <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] sm:text-[10px] text-cyan-400 hover:bg-white/10 transition-all font-bold whitespace-nowrap">
                        <ExternalLink className="w-3 h-3" /> {chunk.web.title || 'Uplink Node'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAudioSelector && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative" data-lenis-prevent>
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>
              <button onClick={() => setShowAudioSelector(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              <div className="text-center mb-8">
                <Headphones className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Audio Synthesis</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Select playback stream</p>
              </div>
              <div className="space-y-3 pb-4">
                <button onClick={() => handleSpeak('HUMANIZED')} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                  <User className="w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
                  <div className="text-left"><p className="text-xs font-black text-white uppercase italic">Full Resolution Stream</p><p className="text-[9px] text-gray-500 uppercase">Comprehensive briefing</p></div>
                </button>
                <button onClick={() => handleSpeak('DEEP_DIVE')} className={`w-full p-4 border rounded-2xl flex items-center gap-4 transition-all group ${result?.deepDive ? 'bg-white/5 border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30' : 'opacity-40 cursor-not-allowed bg-black border-white/5'}`} disabled={!result?.deepDive}>
                  <Microscope className="w-5 h-5 text-gray-600 group-hover:text-purple-400" />
                  <div className="text-left"><p className="text-xs font-black text-white uppercase italic">Nexus Deep Dive</p><p className="text-[9px] text-gray-500 uppercase">{result?.deepDive ? 'Technical expansion stream' : 'Not generated'}</p></div>
                </button>
                <button onClick={() => handleSpeak('BOTH')} className="w-full p-4 bg-cyan-600/10 border border-cyan-500/30 rounded-2xl flex items-center gap-4 hover:bg-cyan-600/20 transition-all group">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  <div className="text-left"><p className="text-xs font-black text-white uppercase italic">Full Synthesis</p><p className="text-[9px] text-gray-500 uppercase">Complete immersive session</p></div>
                </button>
              </div>
           </div>
        </div>
      )}
      <style>{`
        @keyframes sound-wave { 0%, 100% { height: 3px; } 50% { height: 100%; } }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.05); border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { height: 12px; width: 12px; border-radius: 6px; background: #fff; cursor: pointer; -webkit-appearance: none; margin-top: -4px; box-shadow: 0 0 10px rgba(34,211,238,0.5); }
      `}</style>

      {/* Limit Exhausted Popup */}
      {showLimitExhausted && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#080808] border border-orange-500/30 rounded-[2.5rem] w-full max-w-md p-8 text-center relative shadow-2xl">
            <button onClick={() => setShowLimitExhausted(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <div className="p-4 bg-orange-500/10 rounded-2xl inline-block mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-3">Usage Limit Reached</h3>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">You've exhausted your Ocean Engine queries for today. Connect with our team to unlock more learning sessions.</p>
            <div className="space-y-3">
              <a href="https://wa.me/917970750727?text=Hi%20CuriousMinds!%20I've%20reached%20my%20Ocean%20Engine%20limit%20and%20would%20like%20to%20continue%20learning." target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-green-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-green-500 transition-all active:scale-95">
                <MessageCircle className="w-5 h-5" /> Connect on WhatsApp
              </a>
              <a href="tel:+917970750727" className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95">
                <Phone className="w-5 h-5" /> Call Us Directly
              </a>
            </div>
            <p className="text-[9px] text-gray-600 mt-6 uppercase tracking-widest">Limits reset daily at midnight</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default EngineOcean;
