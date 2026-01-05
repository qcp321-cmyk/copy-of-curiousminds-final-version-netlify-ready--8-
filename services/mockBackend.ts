
import { UserProfile, AdminConfig, UserUsageLimits, InteractionEvent, SystemMetric, BeYouSession, UserRole, LeadCapsule, NeuralComm, Bookmark, AdminCredential, UserLocation, DemoBooking } from '../types';

const USERS_KEY = 'curious_users_v14';
const ADMIN_CONFIG_KEY = 'curious_admin_config_v14';
const CURRENT_USER_ID_KEY = 'curious_current_user_id_v14';
const EVENT_LOG_KEY = 'curious_event_log_v14';
const BLOCKED_ENTITIES_KEY = 'curious_blocked_entities_v14'; 
const LEADS_KEY = 'curious_leads_v14';
const NEURAL_COMMS_KEY = 'curious_neural_comms_v14';
const BOOKINGS_KEY = 'curious_bookings_v14';

const DEFAULT_ADMIN_PASS = 'admin2025#';

const DEFAULT_LIMITS: UserUsageLimits = {
  scenarioLimit: 3,
  beYouLimit: 3,
  oceanLimit: 5
};

export const ALL_PERMISSIONS = ['OVERVIEW', 'VISITORS', 'USERS', 'ARCHIVE', 'VOICE_MESSAGES', 'BOOKINGS', 'LOGS', 'ACCESS', 'SETTINGS'];

class MockBackendService {
  private users: UserProfile[] = [];
  private eventLog: InteractionEvent[] = [];
  private leads: LeadCapsule[] = [];
  private neuralComms: NeuralComm[] = [];
  private demoBookings: DemoBooking[] = [];
  private blockedEntities: { ips: string[], ids: string[] } = { ips: [], ids: [] };
  private adminConfig: AdminConfig = {
    adminUsers: [],
    liveVisitorBase: 0 
  };
  private systemStartTime = Date.now();
  private currentSessionId: string;
  private currentSessionLocation: UserLocation = { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, flag: '🇮🇳' };

  constructor() {
    this.currentSessionId = this.getOrCreateSessionId();
    this.loadData();
    this.initializeRegistry();
    this.trackEvent(this.currentSessionId, 'PAGE_VIEW', `Link established from ${this.getDeviceSignature()}`);
    this.resolveCurrentLocation();
  }

  private async resolveCurrentLocation() {
    try {
      const res = await fetch(`https://ipapi.co/json/`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.reason || "Uplink error");

      const countryCode = data.country_code;
      const flagEmoji = countryCode ? countryCode.toUpperCase().replace(/./g, (char: string) => 
          String.fromCodePoint(char.charCodeAt(0) + 127397)
      ) : '🌐';

      this.currentSessionLocation = {
        city: data.city || 'Unknown City',
        country: data.country_name || 'Global',
        lat: data.latitude || 19.0760,
        lng: data.longitude || 72.8777,
        flag: flagEmoji
      };

      const user = this.users.find(u => u.id === this.currentSessionId);
      if (user) {
        user.ip = data.ip || "Resolving...";
        user.location = { ...this.currentSessionLocation };
        this.saveData();
        window.dispatchEvent(new Event('storage'));
        this.trackEvent(this.currentSessionId, 'SYSTEM', `Geographic Uplink: ${data.city}, ${data.country_name}`);
      }
    } catch (error) {
      console.warn("Location resolution node unreachable. Using default heuristics.", error);
    }
  }

  private getDeviceSignature(): string {
    if (typeof navigator === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet Device';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile Device';
    return 'Desktop Computer';
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'session-id';
    let id = sessionStorage.getItem('cm_session_id');
    if (!id) {
      id = `user-${crypto.randomUUID().substring(0, 8)}`;
      sessionStorage.setItem('cm_session_id', id);
    }
    return id;
  }

  private generateReferralCode(name: string): string {
    const prefix = (name || 'USER').substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${random}`;
  }

  private initializeRegistry() {
    if (!this.users) this.users = [];
    
    let adminNode = this.users.find(u => u.id === this.currentSessionId);
    if (!adminNode) {
      adminNode = {
        id: this.currentSessionId,
        name: 'ADMINISTRATOR',
        email: 'admin@curiousminds.local',
        phone: '---',
        device: this.getDeviceSignature(),
        type: 'STUDENT',
        role: 'ADMIN',
        usage: { scenarioCount: 0, beYouCount: 0, oceanCount: 0 },
        limits: { scenarioLimit: 9999, beYouLimit: 9999, oceanLimit: 9999 },
        registeredAt: this.systemStartTime,
        lastActiveAt: Date.now(),
        ip: "Authenticating...",
        location: { ...this.currentSessionLocation },
        isBlocked: false,
        referralCode: this.generateReferralCode('ADMIN'),
        bookmarks: []
      };
      this.users.push(adminNode);
    } else {
        adminNode.device = this.getDeviceSignature();
        if (!adminNode.bookmarks) adminNode.bookmarks = [];
    }

    if (this.adminConfig.adminUsers.length === 0) {
      this.adminConfig.adminUsers.push({
        id: 'master-admin',
        username: 'admin',
        passwordHash: DEFAULT_ADMIN_PASS,
        permissions: ALL_PERMISSIONS,
        createdAt: Date.now()
      });
    }

    this.saveData();
    localStorage.setItem(CURRENT_USER_ID_KEY, this.currentSessionId);
  }

  public loadData() {
    if (typeof window === 'undefined') return;
    try {
      const storedConfig = localStorage.getItem(ADMIN_CONFIG_KEY);
      if (storedConfig) this.adminConfig = JSON.parse(storedConfig);

      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers) this.users = JSON.parse(storedUsers);

      const storedEvents = localStorage.getItem(EVENT_LOG_KEY);
      if (storedEvents) this.eventLog = JSON.parse(storedEvents);

      const storedLeads = localStorage.getItem(LEADS_KEY);
      if (storedLeads) this.leads = JSON.parse(storedLeads);

      const storedComms = localStorage.getItem(NEURAL_COMMS_KEY);
      if (storedComms) this.neuralComms = JSON.parse(storedComms);

      const storedBlocked = localStorage.getItem(BLOCKED_ENTITIES_KEY);
      if (storedBlocked) this.blockedEntities = JSON.parse(storedBlocked);

      const storedBookings = localStorage.getItem(BOOKINGS_KEY);
      if (storedBookings) this.demoBookings = JSON.parse(storedBookings);
    } catch (e) { console.error("Restore failed", e); }
  }

  private saveData() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(this.adminConfig));
    localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(this.eventLog));
    localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
    localStorage.setItem(NEURAL_COMMS_KEY, JSON.stringify(this.neuralComms));
    localStorage.setItem(BLOCKED_ENTITIES_KEY, JSON.stringify(this.blockedEntities));
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(this.demoBookings));
  }

  public toggleBookmark(bookmark: Omit<Bookmark, 'id' | 'timestamp'>) {
    const user = this.getCurrentUser();
    if (!user) return;
    if (!user.bookmarks) user.bookmarks = [];
    const existingIndex = user.bookmarks.findIndex(b => b.title === bookmark.title && b.type === bookmark.type);
    if (existingIndex > -1) { user.bookmarks.splice(existingIndex, 1); } else {
      user.bookmarks.push({ ...bookmark, id: crypto.randomUUID(), timestamp: Date.now() });
    }
    this.saveData();
    window.dispatchEvent(new Event('storage'));
  }

  public isAccessRevoked(): boolean {
    const user = this.getCurrentUser();
    const currentIP = user?.ip || "unknown";
    return this.blockedEntities.ids.includes(this.currentSessionId) || 
           this.blockedEntities.ips.includes(currentIP);
  }

  authenticateAdmin(username: string, password: string): AdminCredential | null {
    const admin = this.adminConfig.adminUsers.find(u => u.username === username && u.passwordHash === password);
    if (admin) {
      this.trackEvent(admin.id, 'MODAL_OPEN', `Admin login successful: ${username}`);
      return admin;
    }
    return null;
  }

  updateAdminPassword(adminId: string, newPass: string) {
    const admin = this.adminConfig.adminUsers.find(u => u.id === adminId);
    if (admin) {
      admin.passwordHash = newPass;
      this.saveData();
      this.trackEvent(adminId, 'MODAL_OPEN', `Admin password changed for ${admin.username}`);
      window.dispatchEvent(new Event('storage'));
    }
  }

  createAdminCredential(creds: Omit<AdminCredential, 'id' | 'createdAt'>) {
    const newAdmin: AdminCredential = {
      ...creds,
      id: `admin-${crypto.randomUUID().substring(0, 8)}`,
      createdAt: Date.now()
    };
    this.adminConfig.adminUsers.push(newAdmin);
    this.saveData();
    this.trackEvent(null, 'FORM_SUBMISSION', `New admin credential created: ${creds.username}`);
  }

  deleteAdminCredential(id: string) {
    this.adminConfig.adminUsers = this.adminConfig.adminUsers.filter(u => u.id !== id);
    this.saveData();
  }

  getAdminCredentials(): AdminCredential[] {
    return this.adminConfig.adminUsers;
  }

  registerUser(details: any): UserProfile {
    const currentSessionUser = this.users.find(u => u.id === this.currentSessionId);
    const newUser: UserProfile = {
      ...details,
      id: `user-${crypto.randomUUID().substring(0, 8)}`,
      device: this.getDeviceSignature(),
      role: 'DEMO', 
      usage: { scenarioCount: 0, beYouCount: 0, oceanCount: 0 },
      limits: { ...DEFAULT_LIMITS }, 
      registeredAt: Date.now(),
      lastActiveAt: Date.now(),
      referralCode: this.generateReferralCode(details?.name || 'USER'),
      ip: currentSessionUser?.ip || "Unknown IP",
      location: { ...this.currentSessionLocation },
      isBlocked: false,
      bookmarks: []
    };
    this.users.push(newUser);
    this.saveData();
    this.trackEvent(newUser.id, 'FORM_SUBMISSION', 'Registration form submitted', details);
    return newUser;
  }

  saveDemoBooking(booking: Omit<DemoBooking, 'id' | 'timestamp' | 'status' | 'location'>) {
    const newBooking: DemoBooking = {
      ...booking,
      id: `book-${crypto.randomUUID().substring(0, 8)}`,
      timestamp: Date.now(),
      status: 'PENDING',
      location: { ...this.currentSessionLocation }
    };
    this.demoBookings.push(newBooking);
    this.saveData();
    this.trackEvent(booking.userId, 'DEMO_BOOKING', 'Demo slot requested', { name: booking.name, grade: booking.grade });
  }

  getDemoBookings(): DemoBooking[] {
    return [...this.demoBookings].sort((a, b) => b.timestamp - a.timestamp);
  }

  updateBookingStatus(id: string, status: DemoBooking['status']) {
    const booking = this.demoBookings.find(b => b.id === id);
    if (booking) { booking.status = status; this.saveData(); }
  }

  captureLead(lead: Omit<LeadCapsule, 'id' | 'timestamp'>) {
    const newLead: LeadCapsule = { ...lead, id: crypto.randomUUID(), timestamp: Date.now() };
    this.leads.push(newLead);
    this.saveData();
    this.trackEvent(lead.userId, 'FORM_SUBMISSION', 'Chat lead captured', lead);
  }

  getLeads(): LeadCapsule[] { return [...this.leads].sort((a, b) => b.timestamp - a.timestamp); }

  saveNeuralComm(comm: Omit<NeuralComm, 'id' | 'timestamp' | 'status'>) {
    const newComm: NeuralComm = { ...comm, id: crypto.randomUUID(), timestamp: Date.now(), status: 'UNREAD' };
    this.neuralComms.push(newComm);
    this.saveData();
    this.trackEvent(comm.userId, 'FORM_SUBMISSION', 'Voice message form submitted', { name: comm.name, phone: comm.phone, duration: comm.duration });
  }

  getNeuralComms(): NeuralComm[] { return [...this.neuralComms].sort((a, b) => b.timestamp - a.timestamp); }

  getCurrentUser(): UserProfile | null {
    const id = localStorage.getItem(CURRENT_USER_ID_KEY);
    return this.users.find(u => u.id === id) || null;
  }

  getAllUsers(): UserProfile[] { return [...this.users].sort((a, b) => b.lastActiveAt - a.lastActiveAt); }

  updateUserRole(userId: string, role: UserRole) {
    const user = this.users.find(u => u.id === userId);
    if (user) { user.role = role; this.saveData(); }
  }

  updateUserLimits(userId: string, limits: UserUsageLimits) {
    const user = this.users.find(u => u.id === userId);
    if (user) { user.limits = { ...limits }; this.saveData(); }
  }

  toggleBlockUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    user.isBlocked = !user.isBlocked;
    if (user.isBlocked) {
      if (!this.blockedEntities.ids.includes(user.id)) this.blockedEntities.ids.push(user.id);
      if (!this.blockedEntities.ips.includes(user.ip)) this.blockedEntities.ips.push(user.ip);
    } else {
      this.blockedEntities.ids = this.blockedEntities.ids.filter(id => id !== user.id);
      this.blockedEntities.ips = this.blockedEntities.ips.filter(ip => ip !== user.ip);
    }
    this.saveData();
    this.trackEvent(userId, 'MODAL_OPEN', `Security Alert: Visitor ${user.isBlocked ? 'Blocked' : 'Unblocked'}`);
  }

  saveBeYouSession(userId: string, session: BeYouSession) {
    const user = this.users.find(u => u.id === userId);
    if (user) { user.beYouSession = session; this.saveData(); }
  }

  checkUsageLimit(userId: string, mode: 'SCENARIO' | 'BEYOU' | 'OCEAN'): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user || user.isBlocked) return false;
    const limits = user.limits || DEFAULT_LIMITS;
    if (mode === 'SCENARIO') return user.usage.scenarioCount < limits.scenarioLimit;
    if (mode === 'BEYOU') return user.usage.beYouCount < limits.beYouLimit;
    if (mode === 'OCEAN') return user.usage.oceanCount < limits.oceanLimit;
    return false;
  }

  incrementUsage(userId: string, mode: 'SCENARIO' | 'BEYOU' | 'OCEAN') {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (mode === 'SCENARIO') user.usage.scenarioCount++;
      if (mode === 'BEYOU') user.usage.beYouCount++;
      if (mode === 'OCEAN') user.usage.oceanCount++;
      user.lastActiveAt = Date.now();
      this.saveData();
    }
  }

  trackEvent(userId: string | null, type: InteractionEvent['type'], details?: string, payload?: any, timestamp: number = Date.now()) {
    const targetId = userId || this.currentSessionId;
    const event: InteractionEvent = { id: crypto.randomUUID(), userId: targetId, type, timestamp, details: details || 'Signal Logged', payload };
    this.eventLog.push(event);
    if (this.eventLog.length > 5000) this.eventLog.shift();
    this.saveData();
  }

  getSystemMetrics(): SystemMetric {
    return { cpu: 4, memory: 8, latency: 12, activeConnections: this.users.length, errorRate: 0, requestsPerSecond: 1, region: "Global", uptime: 1000 };
  }

  getTrafficLogs(minutes: number = 30): InteractionEvent[] {
    const now = Date.now();
    return this.eventLog.filter(l => l.timestamp >= now - (minutes * 60 * 1000)).sort((a, b) => b.timestamp - a.timestamp);
  }

  getUserNavigationLogs(userId: string): InteractionEvent[] {
    return this.eventLog.filter(l => l.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  }

  getCurrentSessionId(): string { return this.currentSessionId; }
}

export const mockBackend = new MockBackendService();
