
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { generateScenario, generateAssessmentQuestions, generateBeYouPersona, chatWithPersona, generateMissionImage, generateSpeech, generateFounderRemark } from '../services/geminiService';
import { ScenarioResponse, BeYouUserDetails, BeYouPersonaResponse, ChatMessage, UserProfile, DifficultyLevel } from '../types';
import { mockBackend } from '../services/mockBackend';
import { 
  Loader2, Zap, ArrowRight, BrainCircuit, GraduationCap, Download, BarChart3, Target, 
  Lightbulb, User, Sparkles, MessageSquare, Send, ScrollText, Lock, Check, Trash2, 
  Cpu, ChevronDown, Layers, Search, Eye, Image as ImageIcon, Volume2, Maximize2, 
  RefreshCw, FileDown, Wand2, AlertTriangle, Rocket, FlaskConical, Palette, 
  TrendingUp, Fingerprint, Globe, Microscope, Shield, Binary, Code, Heart, Activity,
  Share2, Link, ShieldAlert, Headphones, Play, Pause, Square, Bot, ChevronRight, UserCircle2,
  ShieldCheck, Bookmark, Gauge, MessageCircle, Phone, X
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { jsPDF } from 'jspdf';

type AudioStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED';

const AudioVisualizer = () => (
  <div className="flex items-end gap-[2px] h-3 w-4">
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_0.8s_ease-in-out_infinite] h-1"></div>
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_1.1s_ease-in-out_infinite_0.1s] h-2"></div>
    <div className="w-[2px] bg-cyan-400 animate-[sound-wave_0.9s_ease-in-out_infinite_0.2s] h-1.5"></div>
  </div>
);

const ProgressSynapse = ({ input, themeColor }: { input: string, themeColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  
  const getRelevantIcons = (text: string) => {
    const lower = text.toLowerCase();
    const iconPool = [BrainCircuit, Sparkles, Zap, Lightbulb];
    if (lower.match(/space|mars|rocket|astronomy|star|planet/)) iconPool.push(Rocket, Globe, Sparkles);
    if (lower.match(/ai|robot|tech|code|software|computer|digital|quantum|data/)) iconPool.push(Cpu, Binary, Code, Zap);
    if (lower.match(/science|chem|bio|med|health|doctor|lab|physics|nature/)) iconPool.push(FlaskConical, Microscope, Fingerprint, Heart);
    if (lower.match(/money|stock|finance|business|market|startup|econ/)) iconPool.push(TrendingUp, BarChart3, Globe, Shield);
    if (lower.match(/art|design|create|music|movie|draw|fashion/)) iconPool.push(Palette, ImageIcon, Wand2, Sparkles);
    if (lower.match(/law|police|detective|crime|forensic|safety/)) iconPool.push(Shield, Search, Fingerprint, Lock);
    if (lower.match(/game|play|fun|sport|adventure/)) iconPool.push(Zap, Target, Rocket, Activity);
    return Array.from(new Set(iconPool)).slice(0, 5);
  };

  const activeIcons = getRelevantIcons(input);

  useLayoutEffect(() => {
    if (!iconsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(containerRef.current, {
        boxShadow: `0 0 80px ${themeColor}33`,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      const icons = iconsRef.current.children;
      gsap.set(icons, { opacity: 0, scale: 0 });
      gsap.to(icons, {
        opacity: 1,
        scale: 1,
        stagger: 0.2,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      Array.from(icons).forEach((icon, i) => {
        gsap.to(icon, {
          y: "random(-15, 15)",
          x: "random(-15, 15)",
          rotation: "random(-20, 20)",
          duration: "random(2, 3)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.1
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [themeColor]);

  return (
    <div ref={containerRef} className="relative w-full py-12 sm:py-20 flex flex-col items-center justify-center bg-black/40 rounded-[1.5rem] sm:rounded-[3rem] border border-white/5 overflow-hidden min-h-[300px]">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 blur-[60px] sm:blur-[120px] opacity-15" style={{ backgroundColor: themeColor }}></div>
      <div ref={iconsRef} className="relative flex gap-3 sm:gap-12 items-center justify-center z-20 flex-wrap px-6">
        {activeIcons.map((Icon, i) => (
          <div key={i} className="p-3 sm:p-6 rounded-xl sm:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all hover:border-white/20">
            <Icon className="w-5 h-5 sm:w-12 sm:h-12" style={{ color: themeColor }} />
          </div>
        ))}
      </div>
      <div className="mt-8 sm:mt-12 text-center z-20 px-4 sm:px-6">
         <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
           <div className="w-1.5 h-1.5 sm:w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: themeColor }}></div>
           <h3 className="text-sm sm:text-2xl font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">Synapse Processing</h3>
         </div>
         <p className="text-gray-500 font-mono text-[8px] sm:text-[10px] uppercase tracking-widest max-w-[280px] sm:max-w-sm mx-auto leading-relaxed">
           Aligning multi-modal patterns for: <span className="text-white font-bold">{input.length > 20 ? input.substring(0, 20) + "..." : input}</span>
         </p>
      </div>
    </div>
  );
};

interface ScenarioGeneratorProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
  externalMode?: 'SCENARIO' | 'BEYOU';
  onModeChange?: (mode: 'SCENARIO' | 'BEYOU') => void;
}

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
];

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2];

const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({ currentUser, onRequireAuth, externalMode, onModeChange }) => {
  const [localMode, setLocalMode] = useState<'SCENARIO' | 'BEYOU'>('SCENARIO');
  const mode = externalMode !== undefined ? externalMode : localMode;
  const setMode = (newMode: 'SCENARIO' | 'BEYOU') => {
    if (onModeChange) onModeChange(newMode);
    else setLocalMode(newMode);
  };

  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScenarioResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Enhanced Audio State
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('IDLE');
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [showAudioControls, setShowAudioControls] = useState(false);

  const [beYouStep, setBeYouStep] = useState<'DETAILS' | 'ASSESSMENT' | 'GENERATING' | 'RESULT'>('DETAILS');
  const [userDetails, setUserDetails] = useState<BeYouUserDetails>({ name: '', age: '', grade: '', goal: '', timeframe: '' });
  const [assessmentQuestions, setAssessmentQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [personaData, setPersonaData] = useState<BeYouPersonaResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROADMAP' | 'CHAT'>('ROADMAP');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLimitExhausted, setShowLimitExhausted] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  // Audio Playback Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentUser?.beYouSession) {
        const s = currentUser.beYouSession;
        setUserDetails(s.details);
        setPersonaData(s.persona);
        setChatHistory(s.history);
        setBeYouStep('RESULT');
    }
    return () => {
      stopAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentUser]);

  useEffect(() => {
    if (audioStatus === 'PLAYING') {
      // Reload speech if language changes
      stopAudio();
      handleSpeakMission();
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(audioVolume, audioCtxRef.current?.currentTime || 0, 0.05);
    }
  }, [audioVolume]);

  useEffect(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.setTargetAtTime(audioSpeed, audioCtxRef.current?.currentTime || 0, 0.05);
    }
  }, [audioSpeed]);

  useEffect(() => {
      if (data && titleRef.current) {
          setTimeout(() => ScrollTrigger.refresh(), 100);
          gsap.fromTo(titleRef.current, 
              { y: 20, opacity: 0, scale: 0.95, filter: 'blur(8px)' },
              { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }
          );
      }
  }, [data]);

  useEffect(() => {
    if (chatEndRef.current && activeTab === 'CHAT') {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const updateAudioProgress = () => {
    if (audioStatus === 'PLAYING' && audioCtxRef.current) {
      const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * audioSpeed;
      const current = offsetRef.current + elapsed;
      setAudioCurrentTime(current);
      if (current >= audioDuration) {
        setAudioStatus('IDLE');
        offsetRef.current = 0;
        setAudioCurrentTime(0);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(updateAudioProgress);
  };

  const startAudioNode = (offset: number) => {
    if (!audioBufferRef.current || !audioCtxRef.current) return;
    
    // Stop existing
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e){}
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = audioSpeed;

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = audioVolume;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }

    source.connect(gainNodeRef.current);
    source.start(0, offset);
    
    audioSourceRef.current = source;
    offsetRef.current = offset;
    startTimeRef.current = audioCtxRef.current.currentTime;
    setAudioStatus('PLAYING');
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateAudioProgress);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e){}
        audioSourceRef.current = null;
    }
    setAudioStatus('IDLE');
    offsetRef.current = 0;
    setAudioCurrentTime(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const togglePauseResume = () => {
    if (audioStatus === 'PLAYING') {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e){}
      }
      // Store accurate offset
      const elapsed = (audioCtxRef.current!.currentTime - startTimeRef.current) * audioSpeed;
      offsetRef.current = offsetRef.current + elapsed;
      setAudioStatus('PAUSED');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else if (audioStatus === 'PAUSED') {
      startAudioNode(offsetRef.current);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(e.target.value);
    setAudioCurrentTime(newOffset);
    if (audioStatus === 'PLAYING' || audioStatus === 'PAUSED') {
      startAudioNode(newOffset);
    }
  };

  const handleBookmark = () => {
    if (!data) return;
    if (!currentUser) { onRequireAuth(); return; }
    mockBackend.toggleBookmark({
      type: 'SCENARIO',
      title: data.role || topic,
      data: data
    });
  };

  const isBookmarked = data && currentUser?.bookmarks?.some(b => b.title === (data.role || topic) && b.type === 'SCENARIO');

  const handleShare = async (encrypted: boolean) => {
    if (!data) return;
    setShowShareMenu(false);
    
    try {
      const shareData = {
        role: data.role,
        explanation: data.explanation,
        objective: data.objective,
        steps: data.steps,
        quote: data.quote,
        type: 'MISSION_SYNTHESIS'
      };
      
      const payload = JSON.stringify(shareData);
      const encoded = btoa(encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
      
      const url = new URL(window.location.href);
      url.searchParams.set('mission', encoded);
      if (encrypted) url.searchParams.set('vault', 'true');
      
      const shareUrl = url.toString();
      await navigator.clipboard.writeText(shareUrl);
      alert(`${encrypted ? 'Secure' : 'Public'} mission link copied.`);
    } catch (e) {
      alert("Sharing protocol failed.");
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const founderInsight = await generateFounderRemark(data.explanation, 'SCENARIO');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      const drawHeader = () => {
          doc.setFillColor(10, 15, 20); doc.rect(0, 0, pageWidth, 55, 'F');
          doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.text('CuriousMinds', margin, 30);
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(34, 211, 238); 
          doc.text(`SYNTHESIS NODE // GRADE ${grade} // ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, margin, 42);
          doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.5); doc.line(margin, 46, margin + 40, 46);
      };
      
      const drawFooter = () => {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 180, 180);
          doc.text('© 2025 CURIOUSMINDS INC. // PROPRIETARY COGNITIVE SYNTHESIS ARCHITECTURE', pageWidth / 2, pageHeight - 12, { align: 'center' });
      };

      drawHeader(); drawFooter();
      let currentY = 70;

      // Role
      doc.setTextColor(34, 211, 238); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); 
      doc.text(data.role.toUpperCase(), margin, currentY); currentY += 12;

      // Explanation
      doc.setTextColor(60, 60, 60); doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      const sText = doc.splitTextToSize(data.explanation, contentWidth); 
      doc.text(sText, margin, currentY); currentY += (sText.length * 6) + 15;

      // Roadmap Header
      doc.setTextColor(100, 100, 100); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('MISSION STEPS', margin, currentY); currentY += 8;

      // Steps
      data.steps.forEach((step, i) => {
          if (currentY > pageHeight - 40) { doc.addPage(); drawHeader(); currentY = 70; }
          doc.setFillColor(245, 245, 245); doc.roundedRect(margin - 2, currentY - 4, contentWidth + 4, 12, 1, 1, 'F');
          doc.setTextColor(34, 211, 238); doc.setFontSize(10); doc.text(`${i+1}`, margin + 2, currentY + 3);
          doc.setTextColor(40, 40, 40); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
          doc.text(step, margin + 10, currentY + 3); currentY += 15;
      });

      // Founder Insight Section
      currentY += 10;
      if (currentY > pageHeight - 60) { doc.addPage(); drawHeader(); currentY = 70; }
      doc.setFillColor(10, 15, 20); doc.roundedRect(margin - 5, currentY, contentWidth + 10, 35, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('FOUNDER\'S INSIGHT', margin + 5, currentY + 12);
      doc.setTextColor(34, 211, 238); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
      const remarkLines = doc.splitTextToSize(`"${founderInsight.remark}"`, contentWidth - 10);
      doc.text(remarkLines, margin + 5, currentY + 20);

      doc.save(`CuriousMinds_Synthesis_${data.role.replace(/\s+/g, '_')}.pdf`);
    } catch (e) { alert("Export failed."); } finally { setIsExporting(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !grade) return;
    if (!currentUser) { onRequireAuth(); return; }
    if (!mockBackend.checkUsageLimit(currentUser.id, 'SCENARIO')) { setShowLimitExhausted(true); return; }
    setData(null); setLoading(true); stopAudio();
    
    mockBackend.trackEvent(currentUser.id, 'FORM_SUBMISSION', 'Scenario generation inquiry', { topic, grade, difficulty });

    try {
        const result = await generateScenario(topic, grade, difficulty);
        setData(result);
        mockBackend.incrementUsage(currentUser.id, 'SCENARIO');
        window.dispatchEvent(new CustomEvent('trigger-demo-booking'));
        
        // Use global Lenis for programmatic scrolling
        const lenis = (window as any).lenis;
        if (lenis && resultRef.current) {
          lenis.scrollTo(resultRef.current, { offset: -50 });
        } else {
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
        }
    } catch (err) { alert("Synthesizer overloaded."); } finally { setLoading(false); }
  };

  const handleSpeakMission = async () => {
    if (!data) return;
    if (audioStatus === 'PLAYING' || audioStatus === 'PAUSED') { stopAudio(); return; }
    
    setAudioStatus('LOADING');
    try {
      const missionText = `Mission Briefing. Role: ${data.role}. Explanation: ${data.explanation}. AI View: ${data.scenario}. Steps: ${data.steps.join('. ')}. Quote: ${data.quote}`;
      const buffer = await generateSpeech(missionText, selectedLanguage);
      if (buffer) {
          if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          audioBufferRef.current = buffer;
          setAudioDuration(buffer.duration);
          setShowAudioControls(true);
          startAudioNode(0);
      } else {
        setAudioStatus('IDLE');
        alert("Audio synthesis failed.");
      }
    } catch (e) { setAudioStatus('IDLE'); }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startBeYouAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    setLoading(true);
    
    mockBackend.trackEvent(currentUser.id, 'FORM_SUBMISSION', 'beYOU prediction initialization', userDetails);

    try {
      const qs = await generateAssessmentQuestions(userDetails);
      setAssessmentQuestions(qs);
      setBeYouStep('ASSESSMENT');
    } catch (e) { alert("Future self nexus failed."); } finally { setLoading(false); }
  };

  const submitAssessmentAnswer = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...assessmentAnswers, currentAnswer];
    setAssessmentAnswers(newAnswers);
    setCurrentAnswer('');
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishAssessment(newAnswers);
    }
  };

  const finishAssessment = async (answers: string[]) => {
    setBeYouStep('GENERATING');
    const qaPairs = assessmentQuestions.map((q, i) => ({ question: q, answer: answers[i] }));
    
    if (currentUser) {
        mockBackend.trackEvent(currentUser.id, 'FORM_SUBMISSION', 'beYOU assessment completed', { questions: assessmentQuestions, answers });
    }

    try {
      const persona = await generateBeYouPersona(userDetails, qaPairs);
      setPersonaData(persona);
      const initialHistory: ChatMessage[] = [{ role: 'model', text: persona.initialGreeting }];
      setChatHistory(initialHistory);
      setBeYouStep('RESULT');
      if (currentUser) {
        mockBackend.saveBeYouSession(currentUser.id, { details: userDetails, persona, history: initialHistory, lastUpdated: Date.now() });
        mockBackend.incrementUsage(currentUser.id, 'BEYOU');
        window.dispatchEvent(new CustomEvent('trigger-demo-booking'));
      }
    } catch (error) { alert("Nexus alignment failed."); setBeYouStep('DETAILS'); }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !personaData) return;
    const userMsg = chatInput;
    setChatInput('');
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const response = await chatWithPersona(personaData.systemInstruction, chatHistory, userMsg);
      const finalHistory: ChatMessage[] = [...newHistory, { role: 'model', text: response }];
      setChatHistory(finalHistory);
      if (currentUser) {
        mockBackend.saveBeYouSession(currentUser.id, { details: userDetails, persona: personaData, history: finalHistory, lastUpdated: Date.now() });
      }
    } catch (err) { setChatHistory(prev => [...prev, { role: 'model', text: "Signal interference." }]); } finally { setChatLoading(false); }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-1 sm:p-2 relative z-20">
      <div className="glass-panel rounded-[1.5rem] sm:rounded-[3rem] p-4 sm:p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-cyan-500/20">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 sm:mb-12">
             <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 transition-colors ${mode === 'BEYOU' ? 'bg-purple-600/20' : 'bg-cyan-600/20'}`}>
                  {mode === 'BEYOU' ? <Sparkles className="w-5 h-5 sm:w-7 h-7 text-purple-400" /> : <BrainCircuit className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" />}
                </div>
                <div>
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{mode === 'BEYOU' ? 'beYOU Engine' : 'Synthesis Engine'}</h3>
                    <p className={`text-[7px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase ${mode === 'BEYOU' ? 'text-purple-400/80' : 'text-cyan-400/80'}`}>
                      {mode === 'BEYOU' ? 'Success Prediction' : 'Beyond Classrooms'}
                    </p>
                </div>
             </div>
             <div className="flex bg-black/50 p-1 rounded-full border border-white/10 w-full md:w-auto">
                <button onClick={() => setMode('SCENARIO')} className={`flex-1 md:px-8 py-2 md:py-3 rounded-full text-[9px] sm:text-xs font-bold transition-all ${mode === 'SCENARIO' ? 'bg-cyan-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>Scenario</button>
                <button onClick={() => setMode('BEYOU')} className={`flex-1 md:px-8 py-2 md:py-3 rounded-full text-[9px] sm:text-xs font-bold transition-all ${mode === 'BEYOU' ? 'bg-purple-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>beYOU</button>
             </div>
          </div>

          {mode === 'SCENARIO' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
               <form onSubmit={handleGenerate} className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                    <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full md:w-1/3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none cursor-pointer text-xs sm:text-sm" required>
                       <option value="" className="bg-black">Level</option>
                       {[...Array(12)].map((_, i) => <option key={i} value={i+1} className="bg-black">Grade {i+1}</option>)}
                       <option value="University" className="bg-black">Higher Ed</option>
                    </select>
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic: e.g. Quantum Computing..." className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none placeholder:text-gray-600 text-xs sm:text-sm" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Difficulty</span>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                       {['EASY', 'MEDIUM', 'HARD'].map((lvl) => (
                         <button key={lvl} type="button" onClick={() => setDifficulty(lvl as DifficultyLevel)} className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl border text-[8px] sm:text-[10px] font-black tracking-widest transition-all ${difficulty === lvl ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                           {lvl}
                         </button>
                       ))}
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="w-full py-3.5 sm:py-5 bg-cyan-600 hover:bg-cyan-500 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-xs text-white flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-widest">
                     {loading ? <Loader2 className="w-4 h-4 sm:w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 sm:w-5 h-5" /> Execute Neural Engine</>}
                  </button>
               </form>
               {loading && <ProgressSynapse input={topic} themeColor="#22d3ee" />}
               {data && !loading && (
                <div ref={resultRef} className="space-y-6 sm:space-y-8 pb-4 animate-in fade-in zoom-in-95">
                  <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-cyan-950/20 border border-cyan-500/20 p-4 sm:p-5 rounded-[1.2rem] sm:rounded-3xl shadow-lg w-full">
                      <div className="flex items-center gap-2 sm:gap-3 text-cyan-400">
                          <Check className="w-4 h-4 sm:w-5 h-5" />
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-[0.2em]">Synthesis Complete</span>
                          <span className="text-[8px] sm:text-[9px] bg-cyan-400 text-black px-1.5 py-0.5 rounded font-black">{data.difficulty}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 px-3 py-2 rounded-lg sm:rounded-xl border border-white/10 shrink-0">
                          <Globe className="w-3 h-3 text-cyan-500" />
                          <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-transparent text-[8px] sm:text-[10px] font-black uppercase text-white outline-none cursor-pointer">
                            {LANGUAGES.map(l => <option key={l.code} value={l.name} className="bg-black">{l.name}</option>)}
                          </select>
                        </div>
                        
                        <button 
                          onClick={handleSpeakMission} 
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 min-w-[140px] sm:min-w-[200px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 ${
                            audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 
                            audioStatus === 'LOADING' ? 'bg-white/5 text-gray-400 border border-white/10 cursor-wait' :
                            'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                            {audioStatus === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                             audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                            <span>{audioStatus === 'LOADING' ? 'Analyzing...' : audioStatus === 'PLAYING' || audioStatus === 'PAUSED' ? 'Stop' : 'Listen'}</span>
                            {(audioStatus === 'PLAYING' || audioStatus === 'PAUSED') && <AudioVisualizer />}
                        </button>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={handleBookmark}
                            className={`flex-1 sm:flex-none p-3.5 rounded-xl border transition-all active:scale-90 ${isBookmarked ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                            title="Bookmark results"
                          >
                             <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>

                          <div className="relative group/share flex-1 sm:flex-none">
                            <button 
                              onClick={() => setShowShareMenu(!showShareMenu)}
                              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all shadow-xl active:scale-95"
                            >
                              <Share2 className="w-3 h-3" /> Share
                            </button>
                            
                            {showShareMenu && (
                              <div className="absolute bottom-full right-0 mb-3 w-40 sm:w-48 bg-black border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100]">
                                <button onClick={() => handleShare(false)} className="w-full p-3.5 sm:p-4 flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-black uppercase text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all text-left">
                                  <Link className="w-3.5 h-3.5" /> Public
                                </button>
                                <button onClick={() => handleShare(true)} className="w-full p-3.5 sm:p-4 flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-black uppercase text-gray-400 hover:text-purple-400 hover:bg-white/5 transition-all text-left border-t border-white/5">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Secure
                                </button>
                              </div>
                            )}
                          </div>

                          <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl">
                              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} PDF
                          </button>
                        </div>
                      </div>
                  </div>

                  {/* Audio Control Bar */}
                  {showAudioControls && (
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
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
                              <Volume2 className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
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
                          <button onClick={() => { stopAudio(); setShowAudioControls(false); }} className="text-[8px] sm:text-[10px] font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-colors">Terminate Link</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 sm:space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-400/10 w-fit px-3 py-1.5 rounded-lg border border-cyan-400/20">
                         <User className="w-3 h-3" /> Humanized Scenario
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-[1.2rem] sm:rounded-[2.5rem] p-5 sm:p-12 shadow-2xl overflow-x-hidden">
                         <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                            <div className="flex-1 space-y-6 sm:space-y-8">
                               <div>
                                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-500 mb-2 block">Identity</span>
                                  <h4 ref={titleRef} className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight uppercase italic break-words">{data.role}</h4>
                               </div>
                               <div className="prose prose-invert prose-sm sm:prose-lg max-w-none text-gray-200 border-l-2 sm:border-l-4 border-cyan-500/30 pl-4 sm:pl-8 leading-relaxed font-light break-words">{data.explanation}</div>
                               <div className="space-y-3 sm:space-y-4">
                                  <p className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">Roadmap</p>
                                  {data.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 sm:gap-4 items-start bg-white/5 p-3 sm:p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                       <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-[8px] sm:text-[10px] font-black shrink-0">{i+1}</span>
                                       <p className="text-[11px] sm:text-sm text-white/80 leading-relaxed break-words">{step}</p>
                                    </div>
                                  ))}
                                </div>
                            </div>
                            <div className="w-full lg:w-72 xl:w-80 shrink-0">
                               <div className="p-5 sm:p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl sm:rounded-3xl w-full">
                                  <ShieldAlert className="w-4 h-4 sm:w-5 h-5 text-cyan-400 mb-2" />
                                  <p className="text-[11px] sm:text-xs text-cyan-400/80 italic font-medium leading-relaxed break-words">"{data.quote}"</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-purple-400 tracking-widest bg-purple-400/10 w-fit px-3 py-1.5 rounded-lg border border-purple-400/20">
                         <Bot className="w-3 h-3" /> AI Engine View
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-[1.2rem] sm:rounded-[2rem] p-5 sm:p-8 text-gray-400 italic text-xs sm:text-base leading-relaxed break-words">
                         {data.scenario}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {beYouStep === 'DETAILS' && (
                <form onSubmit={startBeYouAssessment} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input required className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 py-3.5 sm:py-4 text-white outline-none text-xs sm:text-sm placeholder:text-gray-600 focus:border-purple-500/50" placeholder="Name" value={userDetails.name} onChange={e => setUserDetails({...userDetails, name: e.target.value})} />
                    <input required className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 py-3.5 sm:py-4 text-white outline-none text-xs sm:text-sm placeholder:text-gray-600 focus:border-purple-500/50" placeholder="Age" value={userDetails.age} onChange={e => setUserDetails({...userDetails, age: e.target.value})} />
                    <input required className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 py-3.5 sm:py-4 text-white outline-none text-xs sm:text-sm placeholder:text-gray-600 focus:border-purple-500/50" placeholder="Target Field" value={userDetails.goal} onChange={e => setUserDetails({...userDetails, goal: e.target.value})} />
                    <input required className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 py-3.5 sm:py-4 text-white outline-none text-xs sm:text-sm placeholder:text-gray-600 focus:border-purple-500/50" placeholder="Timeframe" value={userDetails.timeframe} onChange={e => setUserDetails({...userDetails, timeframe: e.target.value})} />
                  </div>
                  <button disabled={loading} type="submit" className="w-full py-4 sm:py-5 bg-purple-600 hover:bg-purple-500 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-widest">
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Initialize Success Prediction</>}
                  </button>
                </form>
              )}

              {beYouStep === 'ASSESSMENT' && (
                <div className="space-y-6 sm:space-y-8 py-4 sm:py-10">
                   <div className="text-center">
                      <p className="text-[8px] sm:text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3 sm:mb-4">Phase {currentQuestionIndex + 1} of 5</p>
                      <h4 className="text-lg sm:text-2xl font-bold text-white max-w-2xl mx-auto leading-tight px-2">{assessmentQuestions[currentQuestionIndex]}</h4>
                   </div>
                   <textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Type your realization..." className="w-full h-32 sm:h-40 bg-white/5 border border-white/10 rounded-[1.2rem] sm:rounded-3xl p-5 sm:p-6 text-white outline-none focus:border-purple-500/50 resize-none shadow-inner text-xs sm:text-sm" />
                   <button onClick={submitAssessmentAnswer} disabled={!currentAnswer.trim()} className="w-full py-3.5 sm:py-5 bg-purple-600 hover:bg-purple-500 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest">
                      {currentQuestionIndex === 4 ? 'Predict My Success' : 'Next Synapse'} <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              )}

              {beYouStep === 'GENERATING' && <ProgressSynapse input={userDetails.goal} themeColor="#a855f7" />}

              {beYouStep === 'RESULT' && personaData && (
                <div className="min-h-[500px] h-[75vh] md:h-[650px] flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
                   <div className="w-full md:w-64 lg:w-80 bg-white/5 border border-white/10 rounded-[1.2rem] sm:rounded-[2.5rem] p-4 flex flex-col shrink-0">
                      <div className="flex items-center gap-3 mb-4 sm:mb-8 bg-purple-600/10 p-3 rounded-xl border border-purple-500/20">
                         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shrink-0"><UserCircle2 className="w-5 h-5 sm:w-6 h-6 text-white" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[7px] sm:text-[8px] text-gray-500 uppercase font-black">Persona Active</p>
                            <p className="text-[10px] sm:text-xs font-bold text-white truncate">{userDetails.name}</p>
                         </div>
                      </div>
                      <nav className="flex flex-row md:flex-col gap-2 flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
                         <button onClick={() => setActiveTab('ROADMAP')} className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-xl text-[9px] sm:text-xs font-bold transition-all shrink-0 ${activeTab === 'ROADMAP' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                            <ScrollText className="w-4 h-4" /> Roadmap
                         </button>
                         <button onClick={() => setActiveTab('CHAT')} className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-xl text-[9px] sm:text-xs font-bold transition-all shrink-0 ${activeTab === 'CHAT' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                            <MessageSquare className="w-4 h-4" /> Synapse
                         </button>
                      </nav>
                      <button onClick={() => { if(confirm("Reset?")) setBeYouStep('DETAILS'); }} className="mt-2 md:mt-auto w-full py-2.5 text-[8px] sm:text-[10px] font-black uppercase text-gray-600 hover:text-red-500 flex items-center justify-center gap-2 transition-colors"><RefreshCw className="w-3 h-3" /> Restart</button>
                   </div>
                   
                   <div className="flex-1 bg-black/40 border border-white/10 rounded-[1.2rem] sm:rounded-[2.5rem] p-5 sm:p-8 overflow-hidden flex flex-col relative" data-lenis-prevent>
                      {activeTab === 'ROADMAP' ? (
                        <div className="overflow-y-auto space-y-4 sm:space-y-6 pr-2 h-full custom-scrollbar animate-in slide-in-from-bottom-4">
                           <h4 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-6 flex items-center gap-2.5"><Target className="w-4 h-4 text-purple-400" /> Strategic Analysis</h4>
                           <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-gray-300 font-light leading-relaxed break-words pb-8">
                              {personaData.roadmap.split('\n').map((l, i) => (
                                <p key={i} className={`mb-3 last:mb-0 ${l.startsWith('#') ? 'text-purple-400 font-bold uppercase tracking-widest mt-6' : ''}`}>
                                  {l.replace(/^#+\s*/, '')}
                                </p>
                              ))}
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 overflow-hidden">
                           <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 custom-scrollbar">
                              {chatHistory.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[90%] p-3 rounded-xl text-[10px] sm:text-xs leading-relaxed break-words ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-200'}`}>
                                      {m.text}
                                   </div>
                                </div>
                              ))}
                              {chatLoading && <div className="text-[8px] sm:text-[10px] text-purple-400 animate-pulse uppercase font-black p-2">Future Self is aligning...</div>}
                              <div ref={chatEndRef} className="h-4" />
                           </div>
                           <form onSubmit={handleChatSubmit} className="flex gap-2 shrink-0 pt-2 border-t border-white/5">
                              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Query your future self..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/50" />
                              <button disabled={chatLoading} type="submit" className="p-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition-all shadow-lg active:scale-90"><Send className="w-4 h-4 text-white" /></button>
                           </form>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes sound-wave { 0%, 100% { height: 3px; } 50% { height: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: rgba(255,255,255,0.05); border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { height: 14px; width: 14px; border-radius: 7px; background: #fff; cursor: pointer; -webkit-appearance: none; margin-top: -4px; box-shadow: 0 0 10px rgba(34,211,238,0.5); }
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
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">You've exhausted your Scenario Engine generations for today. Connect with our team to unlock more learning sessions.</p>
            <div className="space-y-3">
              <a href="https://wa.me/917970750727?text=Hi%20CuriousMinds!%20I've%20reached%20my%20Scenario%20Engine%20limit%20and%20would%20like%20to%20continue%20learning." target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-green-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-green-500 transition-all active:scale-95">
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
    </div>
  );
};

export default ScenarioGenerator;
