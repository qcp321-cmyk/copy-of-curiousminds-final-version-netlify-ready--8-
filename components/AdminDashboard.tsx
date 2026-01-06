
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { mockBackend, ALL_PERMISSIONS } from '../services/mockBackend';
import { UserProfile, SystemMetric, InteractionEvent, UserRole, LeadCapsule, NeuralComm, AdminCredential, DemoBooking } from '../types';
import { 
  Shield, Users, Activity, Unlock, LogOut, History, MapPin, Ban, Terminal, 
  Globe, Search, X, Clock, RefreshCcw, Cpu, Database, Network, Radar, Zap, 
  Check, Key, Settings, UserCog, Waves, Filter, Calendar, ExternalLink, 
  ShieldCheck, Monitor, Smartphone, Monitor as DesktopIcon, Tablet as TabletIcon, 
  HardDrive, Inbox, UserPlus, MessageSquare, Play, Trash2, Square, Pause, 
  ChevronDown, ChevronUp, Eye, UserPlus2, ShieldAlert, CheckCircle2, Ticket, User,
  Mail, Phone, Laptop, Gauge, Save, AlertTriangle
} from 'lucide-react';
import LiveGlobe from './LiveGlobe';

interface AdminDashboardProps {
  onClose: () => void;
}

const ALL_SECTIONS = [
  { id: 'OVERVIEW', icon: Activity, label: 'Overview' },
  { id: 'VISITORS', icon: Radar, label: 'Active Visitors' },
  { id: 'USERS', icon: Gauge, label: 'Usage Limits' },
  { id: 'API_LIMITS', icon: Zap, label: 'API Limits' },
  { id: 'BOOKINGS', icon: Ticket, label: 'Demo Bookings' },
  { id: 'ARCHIVE', icon: Inbox, label: 'Visitor History' },
  { id: 'VOICE_MESSAGES', icon: MessageSquare, label: 'Voice Messages' },
  { id: 'LOGS', icon: Terminal, label: 'System Logs' },
  { id: 'ACCESS', icon: UserCog, label: 'Permissions' },
  { id: 'SETTINGS', icon: Settings, label: 'Settings' }
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [loggedAdmin, setLoggedAdmin] = useState<AdminCredential | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<string>('OVERVIEW');
  const [selectedUserLogs, setSelectedUserLogs] = useState<{name: string, id: string, logs: InteractionEvent[]} | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric | null>(null);
  const [logs, setLogs] = useState<InteractionEvent[]>([]);
  const [neuralComms, setNeuralComms] = useState<NeuralComm[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<number>(1440);
  const [logFilter, setLogFilter] = useState<'ALL' | 'FORMS' | 'SYSTEM'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const [adminCredentials, setAdminCredentials] = useState<AdminCredential[]>([]);
  const [newAdminUser, setNewAdminUser] = useState({ username: '', password: '', permissions: [] as string[] });

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLimits, setEditLimits] = useState({ scenarioLimit: 3, beYouLimit: 3, oceanLimit: 5 });
  const [usageSearch, setUsageSearch] = useState('');

  // API Limits State
  const [apiLimits, setApiLimits] = useState({ globalLimit: 100000, scenarioEngineLimit: 100000, beYouEngineLimit: 100000, oceanEngineLimit: 100000 });
  const [apiUsage, setApiUsage] = useState({ total: 0, scenarioEngine: 0, beYouEngine: 0, oceanEngine: 0 });
  const [editingApiLimits, setEditingApiLimits] = useState(false);
  const [tempApiLimits, setTempApiLimits] = useState({ ...apiLimits });

  const currentSessionId = useMemo(() => mockBackend.getCurrentSessionId(), []);

  const fetchData = () => {
    setSystemMetrics(mockBackend.getSystemMetrics());
    setLogs(mockBackend.getTrafficLogs(timeFilter));
    setUsers(mockBackend.getAllUsers());
    setBookings(mockBackend.getDemoBookings());
    setNeuralComms(mockBackend.getNeuralComms());
    setAdminCredentials(mockBackend.getAdminCredentials());
    setApiLimits(mockBackend.getApiLimits());
    setApiUsage(mockBackend.getApiUsage());
  };

  useEffect(() => {
    if (!loggedAdmin) return;
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [loggedAdmin, timeFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = mockBackend.authenticateAdmin(username, password);
    if (admin) {
      setLoggedAdmin(admin);
      if (!admin.permissions.includes(activeTab)) {
        setActiveTab(admin.permissions[0] || 'OVERVIEW');
      }
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleToggleBlock = (userId: string) => {
    mockBackend.toggleBlockUser(userId);
    fetchData();
  };

  // Add missing viewUserHistory function
  const viewUserHistory = (user: UserProfile) => {
    const userLogs = mockBackend.getUserNavigationLogs(user.id);
    setSelectedUserLogs({
      name: user.name,
      id: user.id,
      logs: userLogs
    });
  };

  const activeVisitors = useMemo(() => {
    const now = Date.now();
    return users.filter(u => (now - u.lastActiveAt) < (10 * 60 * 1000)); // Active in last 10 mins
  }, [users]);

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'FORMS') return l.type === 'FORM_SUBMISSION' || l.type === 'DEMO_BOOKING';
    if (logFilter === 'SYSTEM') return l.type !== 'FORM_SUBMISSION' && l.type !== 'DEMO_BOOKING';
    return true;
  });

  const toggleAudio = (id: string, base64?: string) => {
    if (!base64) return;
    if (playingId === id) {
      audioInstanceRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioInstanceRef.current) audioInstanceRef.current.pause();
    const audio = new Audio(base64);
    audioInstanceRef.current = audio;
    setPlayingId(id);
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { alert("Passwords match error."); return; }
    mockBackend.updateAdminPassword(loggedAdmin!.id, newPassword);
    setPasswordChangeStatus('SUCCESS');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordChangeStatus('IDLE'), 3000);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminUser.permissions.length === 0) { alert("Select permissions."); return; }
    mockBackend.createAdminCredential({
      username: newAdminUser.username,
      passwordHash: newAdminUser.password,
      permissions: newAdminUser.permissions
    });
    setNewAdminUser({ username: '', password: '', permissions: [] });
    fetchData();
  };

  const availableTabs = ALL_SECTIONS.filter(s => loggedAdmin?.permissions.includes(s.id));

  if (!loggedAdmin) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative text-center">
           <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>
           <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-6 inline-block">
              <Shield className="w-8 h-8 text-cyan-500" />
           </div>
           <h2 className="text-2xl font-black text-white uppercase italic mb-8 tracking-tighter">Admin Access</h2>
           <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs outline-none" placeholder="Username" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-xs outline-none" placeholder="Security Key" />
              <button type="submit" className="w-full bg-cyan-600 text-white font-black py-4 rounded-xl shadow-xl hover:bg-cyan-500 uppercase tracking-widest text-[10px]">Verify Node</button>
              <button type="button" onClick={onClose} className="w-full py-2 text-gray-500 text-[9px] uppercase tracking-widest">Return</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] bg-black text-white flex flex-col font-mono" data-lenis-prevent>
      {/* Header */}
      <div className="h-16 sm:h-20 border-b border-white/5 flex justify-between items-center px-4 sm:px-10 bg-black/80 shrink-0">
         <div className="flex items-center gap-3">
            <Radar className="w-5 h-5 text-cyan-500 animate-pulse" />
            <h2 className="font-black text-sm sm:text-xl uppercase italic">Vault <span className="text-cyan-500">v3.0</span></h2>
         </div>
         <button onClick={() => setLoggedAdmin(null)} className="p-2.5 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar */}
         <div className="w-16 sm:w-24 bg-black border-r border-white/5 flex flex-col items-center py-6 space-y-6 shrink-0 overflow-y-auto no-scrollbar">
            {availableTabs.map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label} className={`p-3 sm:p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-700 hover:text-white'}`}>
                  <tab.icon className="w-5 h-5 sm:w-6 h-6" />
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar bg-black/40">
            
            {/* Overview */}
            {activeTab === 'OVERVIEW' && systemMetrics && (
                <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Live Traffic', val: activeVisitors.length, icon: Activity },
                          { label: 'Total Vault', val: users.length, icon: Database },
                          { label: 'Comms Queue', val: neuralComms.length, icon: MessageSquare },
                          { label: 'Pending Slots', val: bookings.filter(b => b.status === 'PENDING').length, icon: Ticket }
                        ].map((stat, i) => (
                           <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                              <stat.icon className="w-4 h-4 text-cyan-500 mb-3" />
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                              <h3 className="text-3xl font-black text-white">{stat.val}</h3>
                           </div>
                        ))}
                    </div>
                    <div className="h-[400px] sm:h-[600px] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <LiveGlobe activeUsers={activeVisitors} />
                    </div>
                </div>
            )}

            {/* Active Visitors */}
            {activeTab === 'VISITORS' && (
              <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
                 <h3 className="text-2xl font-black text-white uppercase italic">Active Nodes</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {activeVisitors.length === 0 ? (
                      <div className="text-center py-20 text-gray-600 text-xs italic">No active nodes detected.</div>
                    ) : activeVisitors.map(user => (
                      <div key={user.id} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="w-12 h-12 bg-cyan-600/20 rounded-2xl flex items-center justify-center text-cyan-500 font-black">NODE</div>
                           <div>
                              <h4 className="text-white font-bold">{user.name}</h4>
                              <p className="text-[9px] text-gray-500 uppercase">{user.ip} // {user.device}</p>
                           </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                           <button onClick={() => viewUserHistory(user)} className="flex-1 md:flex-none px-6 py-2.5 bg-white/5 text-xs font-black uppercase rounded-xl hover:bg-white/10 transition-all">Audit</button>
                           <button onClick={() => handleToggleBlock(user.id)} className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${user.isBlocked ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
                              {user.isBlocked ? 'Restore' : 'Revoke'}
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* User Usage Limits Management */}
            {activeTab === 'USERS' && (
              <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Engine Limits</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Real-time usage sync // Per user controls</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input value={usageSearch} onChange={e => setUsageSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-6 text-xs text-white outline-none w-full sm:w-64" placeholder="Search users..." />
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-[8px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-600"></div><span className="text-gray-500">Scenario Engine</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-600"></div><span className="text-gray-500">BeYou Engine</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-600"></div><span className="text-gray-500">Ocean Engine</span></div>
                </div>

                <div className="space-y-3">
                  {users.filter(u => u.name.toLowerCase().includes(usageSearch.toLowerCase()) || u.email.toLowerCase().includes(usageSearch.toLowerCase())).map(user => {
                    const isExhausted = (used: number, limit: number) => used >= limit;
                    const scenarioExhausted = isExhausted(user.usage.scenarioCount, user.limits.scenarioLimit);
                    const beYouExhausted = isExhausted(user.usage.beYouCount, user.limits.beYouLimit);
                    const oceanExhausted = isExhausted(user.usage.oceanCount, user.limits.oceanLimit);
                    const anyExhausted = scenarioExhausted || beYouExhausted || oceanExhausted;
                    
                    return (
                      <div key={user.id} className={`bg-white/[0.03] border rounded-2xl p-4 sm:p-6 transition-all ${anyExhausted ? 'border-orange-500/30' : 'border-white/5'}`}>
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          {/* User Info */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${anyExhausted ? 'bg-orange-600/20 text-orange-500' : 'bg-cyan-600/20 text-cyan-500'}`}>
                              {anyExhausted ? <AlertTriangle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-white uppercase truncate">{user.name}</p>
                              <p className="text-[8px] text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          
                          {/* Usage Bars */}
                          {editingUserId !== user.id ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-md">
                              {/* Scenario */}
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[7px] font-black uppercase">
                                  <span className="text-cyan-500">Scenario</span>
                                  <span className={scenarioExhausted ? 'text-orange-500' : 'text-gray-500'}>{user.usage.scenarioCount}/{user.limits.scenarioLimit}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${scenarioExhausted ? 'bg-orange-500' : 'bg-cyan-600'}`} style={{width: `${Math.min((user.usage.scenarioCount / user.limits.scenarioLimit) * 100, 100)}%`}} />
                                </div>
                              </div>
                              {/* BeYou */}
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[7px] font-black uppercase">
                                  <span className="text-purple-500">BeYou</span>
                                  <span className={beYouExhausted ? 'text-orange-500' : 'text-gray-500'}>{user.usage.beYouCount}/{user.limits.beYouLimit}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${beYouExhausted ? 'bg-orange-500' : 'bg-purple-600'}`} style={{width: `${Math.min((user.usage.beYouCount / user.limits.beYouLimit) * 100, 100)}%`}} />
                                </div>
                              </div>
                              {/* Ocean */}
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[7px] font-black uppercase">
                                  <span className="text-emerald-500">Ocean</span>
                                  <span className={oceanExhausted ? 'text-orange-500' : 'text-gray-500'}>{user.usage.oceanCount}/{user.limits.oceanLimit}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${oceanExhausted ? 'bg-orange-500' : 'bg-emerald-600'}`} style={{width: `${Math.min((user.usage.oceanCount / user.limits.oceanLimit) * 100, 100)}%`}} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Edit Mode */
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-md">
                              <div className="flex-1 space-y-1">
                                <label className="text-[7px] font-black text-cyan-500 uppercase">Scenario Limit</label>
                                <input type="number" min="0" value={editLimits.scenarioLimit} onChange={e => setEditLimits({...editLimits, scenarioLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[7px] font-black text-purple-500 uppercase">BeYou Limit</label>
                                <input type="number" min="0" value={editLimits.beYouLimit} onChange={e => setEditLimits({...editLimits, beYouLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[7px] font-black text-emerald-500 uppercase">Ocean Limit</label>
                                <input type="number" min="0" value={editLimits.oceanLimit} onChange={e => setEditLimits({...editLimits, oceanLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex gap-2 shrink-0">
                            {editingUserId === user.id ? (
                              <>
                                <button onClick={() => { mockBackend.updateUserLimits(user.id, editLimits); setEditingUserId(null); fetchData(); }} className="px-4 py-2 bg-green-600 text-white text-[9px] font-black uppercase rounded-xl flex items-center gap-2">
                                  <Save className="w-3 h-3" /> Save
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="px-4 py-2 bg-white/5 text-gray-400 text-[9px] font-black uppercase rounded-xl">Cancel</button>
                              </>
                            ) : (
                              <button onClick={() => { setEditingUserId(user.id); setEditLimits({...user.limits}); }} className="px-4 py-2 bg-white/5 text-cyan-500 text-[9px] font-black uppercase rounded-xl hover:bg-cyan-500/10 transition-all">Edit Limits</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* API Limits Section */}
            {activeTab === 'API_LIMITS' && (
              <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic">API Limits</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Global engine limits // Real-time sync</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-green-600/20 text-green-500 rounded-lg text-[8px] font-black uppercase flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Live Sync
                    </div>
                  </div>
                </div>

                {/* Global Usage Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-cyan-500" />
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global Usage</span>
                    </div>
                    <p className="text-2xl font-black text-white">{apiUsage.total.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-500 mt-1">of {apiLimits.globalLimit.toLocaleString()}</p>
                    <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all" style={{width: `${Math.min((apiUsage.total / apiLimits.globalLimit) * 100, 100)}%`}} />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-cyan-500/20 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-cyan-500" />
                      <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Scenario Engine</span>
                    </div>
                    <p className="text-2xl font-black text-white">{apiUsage.scenarioEngine.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-500 mt-1">of {apiLimits.scenarioEngineLimit.toLocaleString()}</p>
                    <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-cyan-600 rounded-full transition-all" style={{width: `${Math.min((apiUsage.scenarioEngine / apiLimits.scenarioEngineLimit) * 100, 100)}%`}} />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-purple-500/20 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-purple-500" />
                      <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest">BeYou Engine</span>
                    </div>
                    <p className="text-2xl font-black text-white">{apiUsage.beYouEngine.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-500 mt-1">of {apiLimits.beYouEngineLimit.toLocaleString()}</p>
                    <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{width: `${Math.min((apiUsage.beYouEngine / apiLimits.beYouEngineLimit) * 100, 100)}%`}} />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-emerald-500/20 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves className="w-4 h-4 text-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ocean Engine</span>
                    </div>
                    <p className="text-2xl font-black text-white">{apiUsage.oceanEngine.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-500 mt-1">of {apiLimits.oceanEngineLimit.toLocaleString()}</p>
                    <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full transition-all" style={{width: `${Math.min((apiUsage.oceanEngine / apiLimits.oceanEngineLimit) * 100, 100)}%`}} />
                    </div>
                  </div>
                </div>

                {/* Edit Limits Panel */}
                <div className="bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-[2rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black text-white uppercase italic">Configure Limits</h4>
                    {!editingApiLimits ? (
                      <button onClick={() => { setEditingApiLimits(true); setTempApiLimits({...apiLimits}); }} className="px-4 py-2 bg-cyan-600 text-white text-[9px] font-black uppercase rounded-xl flex items-center gap-2">
                        <Settings className="w-3 h-3" /> Edit Limits
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { mockBackend.updateApiLimits(tempApiLimits); setEditingApiLimits(false); fetchData(); }} className="px-4 py-2 bg-green-600 text-white text-[9px] font-black uppercase rounded-xl flex items-center gap-2">
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditingApiLimits(false)} className="px-4 py-2 bg-white/5 text-gray-400 text-[9px] font-black uppercase rounded-xl">Cancel</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-cyan-500" /> Global API Limit
                      </label>
                      {editingApiLimits ? (
                        <input type="number" min="0" value={tempApiLimits.globalLimit} onChange={e => setTempApiLimits({...tempApiLimits, globalLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                      ) : (
                        <p className="text-xl font-black text-white">{apiLimits.globalLimit.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Scenario Engine Limit
                      </label>
                      {editingApiLimits ? (
                        <input type="number" min="0" value={tempApiLimits.scenarioEngineLimit} onChange={e => setTempApiLimits({...tempApiLimits, scenarioEngineLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                      ) : (
                        <p className="text-xl font-black text-white">{apiLimits.scenarioEngineLimit.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" /> BeYou Engine Limit
                      </label>
                      {editingApiLimits ? (
                        <input type="number" min="0" value={tempApiLimits.beYouEngineLimit} onChange={e => setTempApiLimits({...tempApiLimits, beYouEngineLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                      ) : (
                        <p className="text-xl font-black text-white">{apiLimits.beYouEngineLimit.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Waves className="w-3 h-3" /> Ocean Engine Limit
                      </label>
                      {editingApiLimits ? (
                        <input type="number" min="0" value={tempApiLimits.oceanEngineLimit} onChange={e => setTempApiLimits({...tempApiLimits, oceanEngineLimit: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-emerald-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                      ) : (
                        <p className="text-xl font-black text-white">{apiLimits.oceanEngineLimit.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-[8px] text-gray-600 uppercase tracking-widest">Default: 100,000 requests per engine • Real-time sync enabled • Admin & Local Admin access</p>
                  </div>
                </div>
              </div>
            )}

            {/* Archive / History */}
            {activeTab === 'ARCHIVE' && (
              <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <h3 className="text-2xl font-black text-white uppercase italic">Vault Registry</h3>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-6 text-xs text-white outline-none w-full sm:w-64" placeholder="Search Vault..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(user => (
                    <div key={user.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-600" />
                          <div>
                             <p className="text-xs font-black text-white uppercase">{user.name}</p>
                             <p className="text-[8px] text-gray-500">{user.email}</p>
                          </div>
                       </div>
                       <button onClick={() => viewUserHistory(user)} className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg"><History className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings */}
            {activeTab === 'BOOKINGS' && (
              <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
                 <h3 className="text-2xl font-black text-white uppercase italic">Slot Requests</h3>
                 <div className="space-y-4">
                    {bookings.map(book => (
                      <div key={book.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                           <div className="space-y-3">
                              <h4 className="text-lg font-black text-white uppercase">{book.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[8px] px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded font-bold uppercase">{book.focusArea}</span>
                                <span className={`text-[8px] px-2 py-1 rounded font-bold uppercase ${book.status === 'CONFIRMED' ? 'bg-green-600/20 text-green-500' : 'bg-orange-600/20 text-orange-500'}`}>{book.status}</span>
                              </div>
                              <p className="text-[10px] text-gray-500">{book.phone} | {book.email}</p>
                           </div>
                           <div className="flex flex-col gap-2 shrink-0 md:w-48">
                              <button onClick={() => { mockBackend.updateBookingStatus(book.id, 'CONFIRMED'); fetchData(); }} className="w-full py-2 bg-green-600 text-white text-[9px] font-black uppercase rounded-lg">Confirm</button>
                              <button onClick={() => { mockBackend.updateBookingStatus(book.id, 'CANCELLED'); fetchData(); }} className="w-full py-2 bg-white/5 text-gray-500 text-[9px] font-black uppercase rounded-lg">Deny</button>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Logs */}
            {activeTab === 'LOGS' && (
              <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase italic">Neural Logs</h3>
                    <div className="flex bg-white/5 rounded-xl p-1">
                       <button onClick={() => setLogFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${logFilter === 'ALL' ? 'bg-cyan-600' : 'text-gray-500'}`}>All</button>
                       <button onClick={() => setLogFilter('FORMS')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${logFilter === 'FORMS' ? 'bg-cyan-600' : 'text-gray-500'}`}>Forms</button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                           <div className="flex items-center gap-4">
                              <div className={`w-1.5 h-1.5 rounded-full ${log.type.includes('FORM') ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                              <p className="text-[10px] text-white font-bold uppercase truncate max-w-xs sm:max-w-md">{log.details}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[8px] text-gray-500 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              {expandedLogId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </div>
                        </div>
                        {expandedLogId === log.id && (
                          <div className="p-4 border-t border-white/5 bg-black/60">
                             <pre className="text-[9px] text-cyan-500/80 overflow-x-auto">{JSON.stringify(log.payload, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Access Controls */}
            {activeTab === 'ACCESS' && (
              <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
                       <h4 className="text-xl font-black text-white uppercase italic mb-6">Provision Admin</h4>
                       <form onSubmit={handleCreateAdmin} className="space-y-4">
                          <input required value={newAdminUser.username} onChange={e => setNewAdminUser({...newAdminUser, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm" placeholder="ID Signature" />
                          <input required type="password" value={newAdminUser.password} onChange={e => setNewAdminUser({...newAdminUser, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm" placeholder="Neural Key" />
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Permissions</p>
                             <div className="grid grid-cols-2 gap-2">
                                {ALL_PERMISSIONS.map(p => (
                                  <button key={p} type="button" onClick={() => setNewAdminUser(prev => ({...prev, permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]}))} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all ${newAdminUser.permissions.includes(p) ? 'bg-cyan-600' : 'bg-white/5 text-gray-600'}`}>{p}</button>
                                ))}
                             </div>
                          </div>
                          <button type="submit" className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl mt-4">Authorize Node</button>
                       </form>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xl font-black text-white uppercase italic">Active Nodes</h4>
                       {adminCredentials.map(admin => (
                         <div key={admin.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                            <div>
                               <p className="font-black text-white uppercase">{admin.username}</p>
                               <p className="text-[8px] text-gray-500 uppercase">Created: {new Date(admin.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => { mockBackend.deleteAdminCredential(admin.id); fetchData(); }} disabled={admin.id === 'master-admin'} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl disabled:opacity-20"><Trash2 className="w-5 h-5" /></button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {/* Voice Messages */}
            {activeTab === 'VOICE_MESSAGES' && (
              <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
                 <h3 className="text-2xl font-black text-white uppercase italic">Neural Transmissions</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {neuralComms.map(comm => (
                      <div key={comm.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="p-4 bg-cyan-600/20 rounded-2xl text-cyan-500"><Waves className="w-6 h-6" /></div>
                           <div>
                              <h4 className="text-white font-black uppercase">{comm.name || 'Anonymous'}</h4>
                              <p className="text-[9px] text-gray-500 uppercase">{comm.phone || 'No Phone'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="text-right hidden sm:block">
                              <p className="text-[9px] text-gray-500 uppercase">{new Date(comm.timestamp).toLocaleString()}</p>
                              <p className="text-[10px] text-white font-mono">{comm.duration}s Uplink</p>
                           </div>
                           <button onClick={() => toggleAudio(comm.id, comm.audioBlobUrl)} className={`p-4 rounded-2xl transition-all ${playingId === comm.id ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'}`}>
                              {playingId === comm.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'SETTINGS' && (
              <div className="max-w-2xl mx-auto animate-in fade-in">
                 <h3 className="text-2xl font-black text-white uppercase italic mb-8">Node Security</h3>
                 <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem]">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Update Security Key</label>
                          <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm" placeholder="New Neural Key" />
                       </div>
                       <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm" placeholder="Confirm Key" />
                       <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl flex items-center justify-center gap-3">
                          <Key className="w-5 h-5" /> Synchronize Neural Path
                       </button>
                       {passwordChangeStatus === 'SUCCESS' && <p className="text-center text-[10px] text-green-500 font-black uppercase tracking-[0.2em] animate-pulse">Update Verified</p>}
                    </form>
                 </div>
              </div>
            )}

         </div>
      </div>

      {/* User History Audit Modal */}
      {selectedUserLogs && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-[#050505] border border-white/10 w-full max-w-2xl h-[80vh] rounded-[3rem] shadow-2xl relative flex flex-col">
              <button onClick={() => setSelectedUserLogs(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
              <div className="p-8 border-b border-white/5">
                 <h3 className="text-xl font-black text-white uppercase italic">Audit Node: {selectedUserLogs.name}</h3>
                 <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Signal History // {selectedUserLogs.id}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                 {selectedUserLogs.logs.map(log => (
                   <div key={log.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black text-white uppercase">{log.details}</p>
                         <p className="text-[8px] text-gray-600">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <span className="text-[7px] px-2 py-0.5 bg-black/40 text-gray-500 rounded border border-white/5 uppercase font-black">{log.type}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
