import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Bot,
  FileText,
  ArrowRight,
  ShieldCheck,
  Lock,
  CheckCircle,
  Menu,
  X,
  PhoneCall,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ChevronDown,
  Smartphone,
  Database,
  Shield,
  Activity,
  Stethoscope,
  User,
  LayoutDashboard,
  BadgeCheck,
  Pill,
  Search,
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  HelpCircle,
  Award,
  Cpu,
  CheckCircle2
} from 'lucide-react';



// Assets
import doctorBookingImg from './assets/doctor_booking_elite.png';
import pharmacyDeliveryImg from './assets/pharmacy_delivery_elite.png';
import heroMotionVideo from './assets/video/video.mp4';
import { MediMascot, type MediEmotion } from './components/MediMascot';


// Elite UI: Magnetic Hook
const useMagnetic = () => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = element.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      if (distance < 60) {
        element.style.transform = `translate(${deltaX * 0.12}px, ${deltaY * 0.12}px)`;
      } else {
        element.style.transform = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return ref;
};

const MagneticWrapper = ({ children }: { children: React.ReactNode }) => {
  const ref = useMagnetic();
  return <div ref={ref} className="magnetic-wrap">{children}</div>;
};

// Modern Executive Precision Pointer / Cursor
const CustomPointer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 24, stiffness: 320, mass: 0.4 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.classList.contains('cursor-pointer')
        );
        setIsHovered(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden hidden lg:block">
      {/* 1. Precision Center Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isClicking ? 0.6 : isHovered ? 0 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
        className="fixed w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(40,117,216,0.9)]"
      />

      {/* 2. Smooth Spring Trailing Ring / Halo */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 48 : 28,
          height: isHovered ? 48 : 28,
          borderColor: isHovered ? 'rgba(77, 161, 255, 0.95)' : 'rgba(40, 117, 216, 0.5)',
          backgroundColor: isHovered ? 'rgba(40, 117, 216, 0.18)' : 'rgba(40, 117, 216, 0.04)',
          scale: isClicking ? 0.82 : 1,
        }}
        transition={{ type: 'spring', damping: 18, stiffness: 280 }}
        className="fixed rounded-full border border-primary/50 pointer-events-none shadow-[0_0_14px_rgba(40,117,216,0.25)]"
      />
    </div>
  );
};

// Toast Notification Component
const ToastNotification = ({ message, type = 'info', onClose }: { message: string; type?: 'info' | 'success'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[100] max-w-md bg-navy/95 text-white p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl flex items-center gap-3"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
        {type === 'success' ? <CheckCircle size={18} /> : <Sparkles size={18} />}
      </div>
      <div className="flex-1 pr-2">
        <p className="text-xs font-bold leading-tight">{message}</p>
      </div>
      <button onClick={onClose} className="text-white/60 hover:text-white p-1 cursor-pointer">
        <X size={14} />
      </button>
    </motion.div>
  );
};

// Auth / Join Modal Component
const AuthModal = ({ isOpen, mode, onClose, showToast }: { isOpen: boolean; mode: 'signin' | 'join'; onClose: () => void; showToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'pharmacy'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      showToast(mode === 'signin' ? "Welcome back! Session encrypted and verified." : "Registration request submitted! Welcome to Medicata.");
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative"
        >
          {/* Header gradient banner */}
          <div className="bg-gradient-to-r from-navy to-primary p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10 cursor-pointer">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">AES-256 Vault</span>
            </div>
            <h3 className="text-xl font-medium text-white">{mode === 'signin' ? 'Access Medicata' : 'Join Medicata Ecosystem'}</h3>
            <p className="text-xs text-blue-100/80 mt-1">Select your account tier to proceed to encrypted portal.</p>
          </div>

          {/* Account Role Tabs */}
          <div className="p-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              {[
                { id: 'patient', label: 'Patient Portal' },
                { id: 'doctor', label: 'Specialist' },
                { id: 'pharmacy', label: 'Pharmacy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@medicata.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5">Passcode</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                  <span>Remember device token</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); showToast("Recovery token dispatched to your email."); }} className="text-primary font-bold hover:underline">Forgot passcode?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary hover:bg-[#1f60b5] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Verify & Sign In' : 'Complete Registration'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              {mode === 'signin' ? "Don't have an account yet?" : "Already verified on Medicata?"}{' '}
              <button
                onClick={() => onClose()}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                {mode === 'signin' ? 'Apply for Priority Access' : 'Sign in here'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Command Palette Component (Ctrl+K)
const CommandPalette = ({ isOpen, onClose, showToast }: { isOpen: boolean; onClose: () => void; showToast: (msg: string) => void }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const items = [
    { title: "Medi AI Symptom Checker", desc: "Interactive triage assistant with 99.4% accuracy", icon: Bot, action: () => { showToast("Opening Medi AI Triage..."); onClose(); } },
    { title: "Find Top Specialist", desc: "Book 1-on-1 video consult with verified board doctors", icon: Stethoscope, action: () => { showToast("Navigating to Specialist Directory..."); onClose(); } },
    { title: "Prietech Vault Privacy", desc: "AES-256 hardware encryption specifications", icon: Shield, action: () => { showToast("Viewing Prietech Vault Security Ledger..."); onClose(); } },
    { title: "30-Min Global Pharmacy Dispatch", desc: "Hyper-local prescription routing", icon: Pill, action: () => { showToast("Pharmacy Courier Network Active."); onClose(); } },
    { title: "24/7 Concierge Hotline", desc: "Connect with emergency health dispatch team", icon: PhoneCall, action: () => { showToast("Emergency Concierge connected."); onClose(); } }
  ];

  const filtered = items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.desc.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-start justify-center pt-20 p-4 bg-navy/60 backdrop-blur-md" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
            <Search size={18} className="text-primary mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search Medicata features, symptoms, or specialists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-4 text-sm font-semibold text-navy placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-400 rounded border border-slate-200">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No matching services found for &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full p-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-navy group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 font-normal truncate">{item.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface NavbarProps {
  onOpenAuth: (mode: 'signin' | 'join') => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

const Navbar = ({ onOpenAuth, showToast }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sections = ['features', 'how-it-works', 'medi-ai', 'safety'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPos >= element.offsetTop && scrollPos < element.offsetTop + element.offsetHeight) {
          setActiveSection(section);
          return;
        }
      }
      if (window.scrollY < 300) setActiveSection('hero');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'features', label: 'Features', icon: LayoutDashboard },
    { id: 'how-it-works', label: 'How it Works', icon: Activity },
    { id: 'medi-ai', label: 'Medi AI', icon: Bot, badge: '24/7' },
    { id: 'safety', label: 'Safety', icon: Shield },
  ];

  return (
    <>
      {/* Top Page Reading Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2.5px] bg-primary origin-left z-[60] pointer-events-none" style={{ scaleX }} />

      <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-between items-center px-3 sm:px-6 max-w-6xl mx-auto pointer-events-none w-full gap-2 sm:gap-4">
        
        {/* Card 1: Pure Icon Floating Card (Clean Minimalist) */}
        <div className={`pointer-events-auto transition-all duration-300 ${isScrolled ? 'bg-white/95 shadow-xl shadow-navy/10 border-slate-300 scale-[0.98]' : 'bg-white/90 shadow-lg shadow-navy/5 border-slate-200/80'} backdrop-blur-2xl border p-2 sm:p-2.5 rounded-full flex items-center justify-center hover:shadow-xl hover:scale-105`}>
          <a href="#" className="flex items-center justify-center group" aria-label="Medicata Home">
            <img src="/favicon.png" alt="Medicata" className="h-6 w-6 sm:h-7 sm:w-7 object-contain transition-transform group-hover:scale-110" />
          </a>
        </div>

        {/* Card 2: Center Navigation Links Floating Card */}
        <nav 
          className={`pointer-events-auto hidden md:flex items-center gap-1 font-bold text-xs tracking-wide transition-all duration-300 ${isScrolled ? 'bg-white/95 shadow-xl shadow-navy/10 border-slate-300 scale-[0.98]' : 'bg-white/90 shadow-lg shadow-navy/5 border-slate-200/80'} backdrop-blur-2xl p-1.5 rounded-full border`}
          onMouseLeave={() => setHoveredTab(null)}
        >
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            const isHovered = hoveredTab === link.id;
            const Icon = link.icon;

            return (
              <motion.a
                key={link.id}
                href={`#${link.id}`}
                onMouseEnter={() => setHoveredTab(link.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => showToast(`Scrolled to ${link.label} section`, "info")}
                className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${isActive ? 'text-primary' : 'text-slate-600 hover:text-navy'}`}
              >
                {/* Active Sliding Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-white rounded-full shadow-xs border border-slate-200/80 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Hover Sliding Pill (when not active) */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="hoverNavPill"
                    className="absolute inset-0 bg-white/70 rounded-full border border-slate-200/50 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}

                <Icon size={13} className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-navy'} />
                <span>{link.label}</span>

                {link.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-primary/15 text-primary border border-primary/20">
                    {link.badge}
                  </span>
                )}
              </motion.a>
            );
          })}
        </nav>

        {/* Card 3: Action Buttons & Auth Floating Card */}
        <div className={`pointer-events-auto transition-all duration-300 ${isScrolled ? 'bg-white/95 shadow-xl shadow-navy/10 border-slate-300 scale-[0.98]' : 'bg-white/90 shadow-lg shadow-navy/5 border-slate-200/80'} backdrop-blur-2xl border p-1 sm:p-1.5 rounded-full flex items-center gap-1 sm:gap-2`}>
          {/* Sign In button */}
          <button
            onClick={() => onOpenAuth('signin')}
            className="hidden sm:block text-xs font-extrabold uppercase tracking-wider text-navy/70 hover:text-primary transition-colors px-3 py-1.5 cursor-pointer"
          >
            Sign In
          </button>

          {/* Join Now CTA */}
          <MagneticWrapper>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('join')}
              className="bg-navy text-white hover:bg-primary text-[11px] uppercase font-black tracking-widest px-4 sm:px-5 py-2 rounded-full shadow-md hover:shadow-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Join Now</span>
              <ArrowRight size={13} className="text-white" />
            </motion.button>
          </MagneticWrapper>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden p-1.5 text-navy hover:text-primary transition-colors rounded-lg cursor-pointer ml-0.5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 8 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="md:hidden glass border border-navy/10 absolute top-full left-4 right-4 p-5 rounded-3xl shadow-2xl z-[60] pointer-events-auto bg-white/95 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-3 font-bold text-xs uppercase tracking-widest text-navy">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`p-3 rounded-xl transition-colors ${activeSection === link.id ? 'bg-primary/10 text-primary font-black' : 'hover:bg-slate-100 text-navy'}`}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-navy/10">
                <button
                  onClick={() => { setIsMenuOpen(false); onOpenAuth('signin'); }}
                  className="w-full py-3 rounded-2xl border border-navy/20 font-black text-navy text-xs uppercase tracking-widest hover:bg-slate-50 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); onOpenAuth('join'); }}
                  className="w-full py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-primary/90 cursor-pointer"
                >
                  Join Medicata
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
};

const MediChatWidget = ({ onOpenApp, showToast }: { onOpenApp: () => void; showToast: (msg: string, type?: 'info' | 'success') => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);
  const [mediEmotion, setMediEmotion] = useState<MediEmotion>('idle');
  const [messages, setMessages] = useState<Array<{ sender: 'medi' | 'user'; text: string; actionText?: string }>>([
    {
      sender: 'medi',
      text: "Hello. I am Medi, your 24/7 clinical AI assistant. How can I evaluate your symptoms or assist you today?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    { label: "Triage Symptoms", query: "Can you evaluate my current symptoms?" },
    { label: "Find Specialist", query: "How do I connect with a verified specialist?" },
    { label: "Express Pharmacy", query: "How fast is prescription fulfillment and delivery?" },
    { label: "Vault Security", query: "How are my clinical records encrypted?" }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userQuery = text.trim();
    setInputVal('');
    setShowPrompts(false); // Hide prompts to give maximum chat space
    
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setIsTyping(true);
    setMediEmotion('thinking');

    setTimeout(() => {
      setIsTyping(false);
      setMediEmotion('happy');
      let reply = "I have analyzed your inquiry across 40M+ clinical pathways. Connect with our board-certified specialists for real-time consultation on the Medicata app.";
      let actionText = "Open Medicata App";
      
      const lower = userQuery.toLowerCase();
      if (lower.includes('symptom') || lower.includes('triage') || lower.includes('pain') || lower.includes('headache') || lower.includes('fever') || lower.includes('feel')) {
        reply = "Assessment ready: Clinical protocols suggest immediate vitals logging and specialist evaluation. Launch the Medicata app for sub-0.4s AI triage and physician consultation.";
        actionText = "Start AI Triage Now";
      } else if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('book')) {
        reply = "Medicata connects you directly with top 1% global physicians from Johns Hopkins, Mayo Clinic, and Harvard Health in under 15 minutes.";
        actionText = "Browse Global Specialists";
      } else if (lower.includes('pharmacy') || lower.includes('prescription') || lower.includes('delivery')) {
        reply = "Our hyper-local pharmacy ledger verifies inventory across Tier-1 certified hubs for 30-minute express courier dispatch.";
        actionText = "Track Prescriptions";
      } else if (lower.includes('vault') || lower.includes('secure') || lower.includes('data') || lower.includes('privacy')) {
        reply = "Your health telemetry is secured with military-grade AES-256 GCM hardware encryption and zero-knowledge architecture. Only you hold the decryption keys.";
        actionText = "Learn More About Vault";
      }

      setMessages(prev => [...prev, { sender: 'medi', text: reply, actionText }]);
      showToast("Medi responded to your inquiry", "info");
      
      // Return to idle state after a short delay
      setTimeout(() => {
        setMediEmotion('idle');
      }, 2000);
    }, 1200);
  };

  return (
    <>
      {/* Floating Mascot Button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Collapsed Greeting Bubble */}
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#0c182c]/95 backdrop-blur-xl border border-white/10 text-white px-3.5 py-1.5 rounded-full shadow-2xl hover:border-primary/40 transition-all group cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium font-sans">Chat with <strong className="text-[#4da1ff] font-semibold">Medi</strong></span>
          </motion.button>
        )}

        {/* Mascot Avatar Button - Transparent & Direct Mascot */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setMediEmotion('wink');
              setTimeout(() => setMediEmotion('idle'), 1500);
            }
          }}
          aria-label="Open Medi AI Assistant"
          className="relative w-11 h-11 cursor-pointer flex items-center justify-center overflow-visible"
        >
          <div className="w-11 h-11 flex items-center justify-center relative overflow-visible">
            <div className="scale-[0.38] origin-center absolute">
              <MediMascot emotion={mediEmotion} size="sm" />
            </div>
          </div>

          {/* Active Online Dot */}
          <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#071324] z-20" />
        </motion.button>
      </div>

      {/* Floating Interactive Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[360px] h-[480px] max-h-[85vh] z-50 bg-[#0a182e]/98 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => {
                    const reactEmotions: MediEmotion[] = ['shy', 'blush', 'wink', 'laugh', 'wing_happy', 'belly_poke'];
                    const rand = reactEmotions[Math.floor(Math.random() * reactEmotions.length)];
                    setMediEmotion(rand);
                    setTimeout(() => setMediEmotion('idle'), 1500);
                  }}
                  className="w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer overflow-visible relative"
                >
                  <div className="scale-[0.25] origin-center absolute">
                    <MediMascot emotion={mediEmotion} size="sm" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 leading-tight">
                    Medi AI
                    <span className="px-1.5 py-[1px] rounded-full text-[8px] font-bold bg-primary/20 text-[#4da1ff] border border-primary/30">
                      CLINICAL
                    </span>
                  </h4>
                  <p className="text-[9px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • AI Clinical Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!showPrompts && (
                  <button
                    onClick={() => setShowPrompts(true)}
                    className="text-[9px] text-[#4da1ff] hover:text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10 transition-colors cursor-pointer"
                  >
                    Prompts
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  aria-label="Close Medi Chat"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-[11px] font-sans">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-2.5 rounded-2xl leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-xs shadow-sm font-normal'
                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-xs font-normal'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.actionText && (
                      <button
                        onClick={onOpenApp}
                        className="mt-2 w-full bg-primary hover:bg-[#1f60b5] text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-lg transition-all cursor-pointer shadow-sm text-center"
                      >
                        {m.actionText}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 text-slate-300 border border-white/10 p-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-slate-400">Medi is analyzing vitals...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills - 2-Column Clean Grid (Auto-Hides on Click to Maximize Chat Space) */}
            <AnimatePresence>
              {showPrompts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 py-1.5 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-1 shrink-0 overflow-hidden"
                >
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qp.query)}
                      className="px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer text-center truncate"
                    >
                      {qp.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="p-2.5 bg-[#071324] border-t border-white/10 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputVal);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask Medi a question..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    inputVal.trim()
                      ? 'bg-primary hover:bg-[#1f60b5] text-white shadow-sm'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  Send
                </button>
              </form>

              {/* Bottom Quick Launch Link */}
              <div className="pt-1.5 text-center">
                <button
                  onClick={onOpenApp}
                  className="text-[9px] text-slate-400 hover:text-[#4da1ff] transition-colors font-medium text-center mx-auto cursor-pointer block"
                >
                  Launch full clinic on app.medicata.ng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


const FAQItem = ({ 
  question, 
  answer, 
  category, 
  isOpen, 
  onToggle, 
  onFeedback 
}: { 
  question: string; 
  answer: string; 
  category: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  onFeedback: (type: 'up' | 'down') => void; 
}) => {
  const [feedbackState, setFeedbackState] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${question}\n${answer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-white border-primary ring-2 ring-primary/20 shadow-md' : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'}`}>
      <button
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer gap-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            {category}
          </span>
          <span className="text-xs sm:text-sm font-bold text-navy leading-snug">{question}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-navy/70"
        >
          <ChevronDown size={15} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-slate-200/60">
              <p className="text-xs text-slate-600 leading-relaxed font-sans mb-3.5">
                {answer}
              </p>

              {/* Instant Feedback & Copy Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/40 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Was this helpful?</span>
                  <button
                    onClick={() => {
                      setFeedbackState('up');
                      onFeedback('up');
                    }}
                    className={`px-2 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${feedbackState === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-300 font-bold' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    <ThumbsUp size={11} />
                    <span className="text-[10px]">Yes</span>
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackState('down');
                      onFeedback('down');
                    }}
                    className={`px-2 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${feedbackState === 'down' ? 'bg-rose-50 text-rose-600 border-rose-300 font-bold' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    <ThumbsDown size={11} />
                    <span className="text-[10px]">No</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-400 hover:text-navy transition-colors cursor-pointer"
                  title="Copy FAQ answer"
                >
                  {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  <span className="text-[10px] font-medium">{copied ? "Copied" : "Copy Answer"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = ({ showToast }: { showToast: (msg: string, type?: 'info' | 'success') => void }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { 
      category: "Specialists",
      question: "How are your Global Specialists vetted?", 
      answer: "Each specialist on Medicata is selected from the top 1% of their respective fields, primarily from Ivy League institutions and world-leading research hospitals. We verify active medical licensing, peer-reviewed clinical outcomes, and board certifications." 
    },
    { 
      category: "Security & Vault",
      question: "What is the Medicata Zero-Knowledge Vault?", 
      answer: "The Vault is a distributed ledger encryption layer. Your private health telemetry is encrypted at the hardware level before it leaves your mobile device, utilizing military-grade AES-256 GCM protocols and zero-knowledge proof architecture." 
    },
    { 
      category: "AI Triage",
      question: "How accurate is the Medi AI Triage system?", 
      answer: "Medi AI has been clinically trained across 40M+ peer-reviewed diagnostic pathways, achieving a 99.4% triage accuracy benchmark. It analyzes real-time symptoms to route emergencies and prepare specialist briefings in under 0.4 seconds." 
    },
    { 
      category: "Prescriptions",
      question: "How does the hyper-local pharmacy dispatch work?", 
      answer: "Through our unified pharmacy ledger, verified prescriptions are instantly transmitted to Tier-1 certified pharmacies in your exact radius. The first to verify inventory triggers a secure biometric courier for 30-minute priority delivery." 
    },
    { 
      category: "Specialists",
      question: "Does Medicata accept international health insurance?", 
      answer: "Yes. Our concierge coordination team works directly with major global health insurance providers to authorize and process claims for out-of-network teleconsultations and prescription deliveries." 
    },
    { 
      category: "AI Triage",
      question: "Can Medi AI replace an emergency physician?", 
      answer: "Medi AI is engineered as an intelligent diagnostic and triage assistant. For acute life-threatening emergencies, the system automatically detects critical vectors and offers 1-tap emergency dispatch protocols." 
    }
  ];

  const categories = ['All', 'AI Triage', 'Specialists', 'Security & Vault', 'Prescriptions'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFeedback = (type: 'up' | 'down') => {
    if (type === 'up') {
      showToast("Thank you for your feedback! Glad this helped.", "success");
    } else {
      showToast("Feedback noted. Our clinical team will update this FAQ.", "info");
    }
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#EEF2F6] border-t border-b border-slate-300/80 text-navy">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="badge mb-3">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-medium text-navy tracking-tight mb-2">
            Everything you need to know
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Clear, transparent answers regarding AI triage, specialist consults, and vault security.
          </p>
        </div>

        {/* Interactive Search & Filter Controls */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-navy placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-none"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${activeCategory === cat ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <FAQItem
                key={index}
                category={faq.category}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                onFeedback={handleFeedback}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200/70 p-6">
              <HelpCircle size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-navy">No matching questions found.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-[11px] text-primary font-bold mt-1 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

const ScrollReveal = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
  </div>
);





const HowItWorksSection = ({ showToast }: { showToast: (msg: string, type?: 'info' | 'success') => void }) => {
  const [activeCard, setActiveCard] = useState<number>(0);

  const steps = [
    {
      id: '01',
      title: 'Autonomous AI Triage',
      desc: 'Medi AI ingests vital telemetry and evaluates symptom patterns across 40M+ clinical protocols to generate your diagnostic brief in under a second.',
      icon: Bot,
      preview: {
        metric1: 'Heart Rate: 72 BPM',
        metric2: 'SpO2: 99%',
        status: 'Stable Vitals',
        action: 'Neurology Fast-Track'
      }
    },
    {
      id: '02',
      title: 'Board-Certified Teleconsult',
      desc: 'Connect directly via encrypted HD video with attending physicians from top academic medical institutions for comprehensive clinical evaluation.',
      icon: Stethoscope,
      preview: {
        doctor: 'Dr. Sarah Chen, MD',
        institution: 'Johns Hopkins Medicine',
        status: 'Encrypted HD Room',
        action: 'Care Plan Established'
      }
    },
    {
      id: '03',
      title: 'Cryptographic E-Prescribe',
      desc: 'Your physician issues a tamper-proof digital prescription card with biometric verification and instant fraud immunity for pharmacy fulfillment.',
      icon: FileText,
      preview: {
        token: 'Token #RX-8842-ZK',
        medication: 'Sumatriptan 50mg',
        status: 'Biometric Signed',
        action: 'Verified & Active'
      }
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-28 bg-[#EEF2F6] text-navy relative border-b border-slate-300/80">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header - Clean, Uncluttered, Human-Crafted */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2.5">
            Clinical Pathway
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-navy tracking-tight mb-3 leading-tight">
            Vetted care in 3 precise steps.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            From initial symptom assessment to your cryptographic digital prescription, care flows without friction or delay.
          </p>
        </div>

        {/* 3 Executive Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isSelected = activeCard === index;

            return (
              <motion.div
                key={step.id}
                whileHover={{ y: -3 }}
                onClick={() => {
                  setActiveCard(index);
                  showToast(`Step ${step.id}: ${step.title}`, "info");
                }}
                className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                  isSelected 
                    ? 'shadow-md ring-2 ring-primary/20' 
                    : 'shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top ID & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      /{step.id}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-navy mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
                    {step.desc}
                  </p>
                </div>

                {/* Embedded UI Preview Pill / Card */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs">
                  {step.id === '01' && (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">{step.preview.metric1}</span>
                        <span className="font-semibold text-slate-700">{step.preview.metric2}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {step.preview.status}
                        </span>
                        <span className="font-semibold text-primary">{step.preview.action}</span>
                      </div>
                    </>
                  )}

                  {step.id === '02' && (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-navy flex items-center gap-1">
                          {step.preview.doctor}
                          <BadgeCheck size={13} className="text-primary shrink-0" />
                        </span>
                        <span className="text-slate-500 text-[10px]">{step.preview.institution}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {step.preview.status}
                        </span>
                        <span className="font-semibold text-primary">{step.preview.action}</span>
                      </div>
                    </>
                  )}

                  {step.id === '03' && (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-navy">{step.preview.token}</span>
                        <span className="font-semibold text-slate-700">{step.preview.medication}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 text-slate-500">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          {step.preview.status}
                        </span>
                        <span className="font-semibold text-primary">{step.preview.action}</span>
                      </div>
                    </>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};



const FeatureCard = ({ title, desc, icon: Icon, tag }: any) => (
  <div className="bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/10 shadow-none hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 group h-full flex flex-col justify-between text-left w-full max-w-full overflow-hidden">
    <div className="w-full">
      <div className="w-10 h-10 rounded-xl bg-white/10 text-[#4da1ff] flex items-center justify-center mb-4 border border-white/15 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div className="mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">{tag}</span>
        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight break-words">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal break-words">{desc}</p>
    </div>
    <div className="mt-5">
      <MagneticWrapper>
        <button className="text-[#4da1ff] hover:text-white font-bold uppercase text-[9px] tracking-widest flex items-center gap-2 cursor-pointer transition-colors">
          Explore <ArrowRight size={13} />
        </button>
      </MagneticWrapper>
    </div>
  </div>
);


const SuccessStories = () => {
  const stories = [
    {
      category: "Patients",
      role: "Verified Member",
      location: "London, UK",
      name: "Sarah Jenkins",
      initials: "SJ",
      icon: User,
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      title: "Life-changing precision",
      quote: "Medicata didn't just save me time. The AI diagnosed an inconsistency my local GP missed, and I was connected to a Johns Hopkins specialist within 20 minutes.",
    },
    {
      category: "Doctors",
      role: "Cardiologist",
      location: "Lagos, Nigeria",
      name: "Dr. Amara Okafor",
      initials: "AO",
      icon: Stethoscope,
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      title: "The future of clinical care",
      quote: "As a cardiologist, the clinical MD-panel allows me to track patient history with unprecedented accuracy. The QR-prescriptions eliminated fraud in my practice.",
    },
    {
      category: "Pharmacies",
      role: "Lead Pharmacist",
      location: "Accra, Ghana",
      name: "Kofi Mensah",
      initials: "KM",
      icon: Pill,
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      title: "Unified supply flow",
      quote: "Joining the Medicata ledger transformed our dispatch speed. We now fulfill orders 40% faster with absolute verification of every prescription.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <span className="badge mb-3">Member Stories</span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mb-2.5">
          Proven Impact Across Healthcare
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Real experiences from patients, licensed specialists, and pharmacy hubs worldwide.
        </p>
      </div>

      {/* 3-Column Minimalist Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {stories.map((story, index) => {
          const Icon = story.icon;
          return (
            <div
              key={index}
              className="bg-white/5 rounded-3xl p-6 sm:p-7 border border-white/10 shadow-none flex flex-col justify-between hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div>
                {/* Card Top: Category Badge & Stars */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${story.badgeColor}`}>
                    <Icon size={12} />
                    {story.category}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-xs">★</span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-white mb-2 tracking-tight">
                  "{story.title}"
                </h3>

                {/* Quote */}
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  "{story.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-[#4da1ff] shrink-0">
                  {story.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                      {story.name}
                    </h4>
                    <CheckCircle size={12} className="text-[#4da1ff] shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {story.role} • {story.location}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const InstitutionalTrust = ({ showToast }: { showToast: (msg: string, type?: 'info' | 'success') => void }) => {
  const items = [
    { label: "Data Integrity", value: "SOC2 Type II", desc: "Military-grade service transparency." },
    { label: "Privacy Standard", value: "HIPAA & GDPR", desc: "Global medical data sovereignty." },
    { label: "Clinical Excellence", value: "Board-Led", desc: "Research-driven medical governance." },
    { label: "Information Security", value: "ISO 27001", desc: "Unmatched network resilience." }
  ];

  return (
    <section className="py-14 md:py-18 bg-white border-t border-b border-slate-200/70">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-medium text-navy tracking-tight mb-1.5">
            Built on verified excellence.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Adhering to the world's most rigorous clinical governance and data protection frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => showToast(`${item.value}: Verified medical compliance and data sovereignty.`, "info")}
              className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 shadow-none hover:border-primary/40 hover:bg-white transition-all duration-200 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                <BadgeCheck size={18} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{item.label}</span>
              <h3 className="text-sm font-semibold text-navy mb-1">{item.value}</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const NotFoundPage = ({ onNavigateHome }: { onNavigateHome: () => void }) => {
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between container max-w-6xl mx-auto relative z-10">
        <button onClick={onNavigateHome} className="flex items-center gap-2.5 cursor-pointer">
          <img src="/favicon.png" alt="Medicata" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-lg text-white tracking-tight">
            MEDICATA <span className="text-[9px] font-black text-primary px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 ml-1">AI</span>
          </span>
        </button>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Return to Platform
        </button>
      </header>

      {/* Main 404 Hero */}
      <main className="container max-w-2xl mx-auto px-4 py-16 text-center relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>ERROR 404 · CLINICAL PATH NOT FOUND</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Lost in the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#5AC8FA] to-white">
              Clinical Network?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            The requested diagnostic endpoint or clinical protocol does not exist, has expired, or is restricted by hardware security policies.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Home</span>
              <ArrowRight size={14} />
            </button>
            <a
              href="mailto:support@medicata.ai"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={14} />
              <span>Contact Support</span>
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 relative z-10 border-t border-white/5">
        <p>© 2026 Medicata Health Inc. Vault-Grade Healthcare Ecosystem.</p>
      </footer>
    </div>
  );
};

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'pharmacy'>('patient');

  // Interactive UI States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'join'>('join');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ message, type });
  };

  const is404 = currentPath !== '/' && currentPath !== '' && currentPath !== '/index.html';

  if (is404) {
    return (
      <NotFoundPage
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast("Please enter a valid email address.", "info");
      return;
    }
    setIsNewsletterSubscribed(true);
    showToast(`Subscribed ${newsletterEmail} to Medicata Intelligence!`, "success");
    setNewsletterEmail('');
  };

  const handleOpenAuth = (mode?: 'signin' | 'join') => {
    if (mode) setAuthMode(mode);
    window.location.href = 'https://app.medicata.ng';
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#071324] text-white">
      <div className="noise-overlay" />

      {/* Static Full-Page Background Video Layer across entire landing page */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          src={heroMotionVideo}
          className="w-full h-full object-cover object-center"
        />
        {/* Transparent Dark Layer with 0.5 opacity */}
        <div className="absolute inset-0 bg-[#071324]/50" />
      </div>

      {/* Modern Executive Precision Pointer / Cursor */}
      <CustomPointer />

      <Navbar
        onOpenAuth={handleOpenAuth}
        showToast={showToast}
      />

      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        showToast={showToast}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        showToast={showToast}
      />

      <AnimatePresence>
        {toastMessage && (
          <ToastNotification
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Medi Mascot AI Chat Trigger & Drawer */}
      <MediChatWidget
        onOpenApp={() => handleOpenAuth('join')}
        showToast={showToast}
      />

      {/* Main Content Layered Directly Above Video Canvas */}
      <main className="relative z-10">

        {/* 1. Hero Section - Deep Professional Canvas with Directional Atmospheric Fog */}
        <section className="pt-40 pb-28 sm:pt-52 sm:pb-36 overflow-hidden relative min-h-screen sm:min-h-[105vh] flex items-center">
          
          {/* Directional Atmospheric Weather / Cool Fog from Left for Supreme Contrast */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-gradient-to-r from-[#071324]/85 via-[#071324]/50 to-transparent pointer-events-none z-[1]" />
          <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-primary/20 blur-[130px] rounded-full pointer-events-none z-[1]" />

          <div className="container max-w-6xl mx-auto relative z-10 px-4 sm:px-6">
            <div className="max-w-3xl text-left">
              {/* Direct Clean High-Contrast Typography */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Left-Aligned Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.2] tracking-tight mb-4 drop-shadow-md">
                  Autonomous Medical Intelligence & <span className="font-semibold text-[#4da1ff]">Precision Care.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans mb-8 max-w-xl font-normal drop-shadow-sm">
                  Next-generation clinical infrastructure unifying 24/7 AI symptom triage, board-verified global specialists, and zero-knowledge encrypted medical records in real time.
                </p>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <MagneticWrapper>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleOpenAuth('join')}
                      className="bg-primary hover:bg-[#1f60b5] text-white text-xs uppercase font-bold tracking-widest px-7 py-3.5 rounded-full shadow-lg shadow-primary/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Start Your Journey</span>
                      <ArrowRight size={14} className="text-white" />
                    </motion.button>
                  </MagneticWrapper>

                  <MagneticWrapper>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const el = document.getElementById('about');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs uppercase font-bold tracking-widest px-7 py-3.5 rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center backdrop-blur-md"
                    >
                      Explore Ecosystem
                    </motion.button>
                  </MagneticWrapper>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. Executive About Section (Second Section After Hero - 0.4 Tint) */}
        <section id="about" className="py-20 md:py-28 bg-[#071324]/40 backdrop-blur-xl text-white relative border-y border-white/10 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[450px] h-[300px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
          
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-3xl mb-14 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 text-[9px] font-bold uppercase tracking-wider mb-3 border border-white/10">
                <Award size={11} className="text-[#4da1ff]" />
                <span>About Medicata</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight mb-4 leading-tight">
                Pioneering the next era of <br />
                <span className="font-medium text-[#4da1ff]">clinical intelligence.</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Founded to eliminate diagnostic latency and democratize access to elite healthcare, Medicata synthesizes 40M+ peer-reviewed medical protocols with top 1% global physicians to deliver instant, hardware-secured care worldwide.
              </p>
            </div>

            {/* 3 Subtle Metric / Pillar Cards with Micro-Interactions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              {[
                {
                  icon: Cpu,
                  title: "0.4s AI Triage Latency",
                  desc: "Continuous neural symptom evaluation cross-referencing global protocols with 99.4% precision."
                },
                {
                  icon: Stethoscope,
                  title: "Top 1% Global Specialists",
                  desc: "Direct high-definition consultations with Ivy League and research-hospital verified physicians."
                },
                {
                  icon: ShieldCheck,
                  title: "Zero-Knowledge Security",
                  desc: "End-to-end AES-256 GCM hardware encryption protecting patient records at every layer."
                }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => showToast(`${card.title}: Clinical feature active across all regions.`, "info")}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-primary/40 hover:bg-white/[0.08] transition-all cursor-pointer group shadow-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-[#4da1ff] flex items-center justify-center mb-4 border border-white/15 group-hover:scale-110 transition-transform">
                    <card.icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Institutional Trust Section */}
        <InstitutionalTrust showToast={showToast} />

        {/* 4. Elite Ecosystem (Dynamic Role Switcher - 0.4 Tint) */}
        <section id="features" className="py-16 md:py-24 bg-[#071324]/40 backdrop-blur-xl text-white relative border-b border-white/10 overflow-hidden w-full">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 w-full overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge mb-3">Elite Ecosystem</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight mb-2">
              Designed for every side of care.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Unified workflows tailored for Patients, Doctors, and Pharmacies.
            </p>

            {/* Role Switcher Toggle (Responsive Grid - Zero Mobile Horizontal Overflow) */}
            <div className="flex justify-center mt-6 px-2 w-full max-w-full">
              <div className="w-full max-w-xs sm:max-w-md grid grid-cols-3 p-1 bg-white/10 border border-white/15 rounded-2xl shadow-xs relative">
                {['patient', 'doctor', 'pharmacy'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role as any)}
                    className={`relative z-10 w-full py-2 px-1 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl cursor-pointer flex items-center justify-center gap-1 sm:gap-2 ${activeRole === role ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    {activeRole === role && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-xl shadow-xs"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-1 sm:gap-2 truncate">
                       {role === 'patient' && <User size={13} className="shrink-0" />}
                       {role === 'doctor' && <Stethoscope size={13} className="shrink-0" />}
                       {role === 'pharmacy' && <Database size={13} className="shrink-0" />}
                       <span className="capitalize">{role}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full overflow-hidden"
            >
              {activeRole === 'patient' && [
                { title: 'Global Specialist Access', desc: "Direct access to the world's leading medical minds. Search by specialty and real-time availability.", icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', tag: 'Expert Care' },
                { title: 'WhatsApp Companion', desc: 'Receive prescription alerts, appointment reminders, and quick-chat support directly on WhatsApp.', icon: Bot, color: 'text-primary', bg: 'bg-primary/10', tag: 'AI Guardian' },
                { title: 'QR-Verified Health Vault', desc: 'Your medical history and prescriptions stored securely with biometric-linked sharing cards.', icon: Activity, color: 'text-primary', bg: 'bg-primary/10', tag: 'Private Care' }
              ].map((f, i) => <FeatureCard key={i} {...f} />)}

              {activeRole === 'doctor' && (
                <>
                  <div className="lg:col-span-2 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full w-full">
                      <FeatureCard title="Clinical MD-Panel" desc="A command center designed for precision archiving, schedule settings, and license-verified trust." icon={LayoutDashboard} tag="MD Commands" />
                      <FeatureCard title="QR-Verified E-Prescribe" desc="Generate digital prescriptions with secure sharing logic and expiry tracking in seconds." icon={FileText} tag="Digital Flow" />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl border border-white/10 shadow-none hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 overflow-hidden flex flex-col w-full max-w-full">
                    <div className="h-36 sm:h-32 bg-white/5 flex items-center justify-center p-4 border-b border-white/10 overflow-hidden">
                       <img src={doctorBookingImg} alt="Doctor Panel" className="h-full w-auto max-w-full object-contain" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Institutional</span>
                        <h3 className="text-base sm:text-lg font-semibold text-white leading-tight">Elite Patient History Vault</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed font-normal">Instant clinical forensics with biometric authorization.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-[#4da1ff] hover:text-white font-bold uppercase text-[9px] tracking-widest flex items-center gap-2 mt-4 cursor-pointer transition-colors">View MD Specs <ArrowRight size={13} /></button>
                      </MagneticWrapper>
                    </div>
                  </div>
                </>
              )}

              {activeRole === 'pharmacy' && (
                <>
                  <div className="bg-white/5 rounded-2xl border border-white/10 shadow-none hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 overflow-hidden flex flex-col w-full max-w-full">
                    <div className="h-36 sm:h-32 bg-white/5 flex items-center justify-center p-4 border-b border-white/10 overflow-hidden">
                       <img src={pharmacyDeliveryImg} alt="Pharmacy Logistics" className="h-full w-auto max-w-full object-contain" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Supply Chain</span>
                        <h3 className="text-base sm:text-lg font-semibold text-white leading-tight">Unified Order Ledger</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed font-normal">Track prescriptions from doctor to patient with algorithmic dispatch.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-[#4da1ff] hover:text-white font-bold uppercase text-[9px] tracking-widest flex items-center gap-2 mt-4 cursor-pointer transition-colors">Register Hub <ArrowRight size={13} /></button>
                      </MagneticWrapper>
                    </div>
                  </div>
                  <div className="lg:col-span-2 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full w-full">
                      <FeatureCard title="Verified QR Check" desc="Instant verification of sharing cards through our distributed clinical ledger. Avoid expiry issues." icon={Lock} tag="Fraud Protection" />
                      <FeatureCard title="Global Stock Monitoring" desc="Optimize routes for ultra-fast pharmaceutical dispatching based on real-time drug availability." icon={MapPin} tag="Supply Network" />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>


      {/* 5. How It Works - Interactive 4-Stage Clinical Pathway */}
      <HowItWorksSection showToast={showToast} />

      {/* 6. Medi AI Section (Transparent Canvas with 0.4 Tint Revealing Video) */}
      <section id="medi-ai" className="py-20 md:py-28 bg-[#071324]/40 backdrop-blur-xl relative overflow-hidden text-white border-t border-white/10">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[160px] rounded-full pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-slate-300 text-[11px] font-bold tracking-wider mb-4 border border-white/10">
              <Bot size={13} className="text-[#4da1ff]" />
              <span>Autonomous Clinical Intelligence</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mb-4 leading-tight">
              A clinical companion that <br />
              <span className="font-medium text-[#4da1ff]">actually listens.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
              Medi is an autonomous clinical triage platform built on 40M+ verified medical workflows to evaluate symptom telemetry, assess health risks, and coordinate specialist care with sub-second precision.
            </p>
          </div>

          {/* 4 Executive Modern Minimalist Cards with Micro-Interactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Activity,
                title: "40M+ Protocol Triage",
                badge: "0.4s Latency",
                desc: "Continuous neural synthesis across verified clinical protocols to generate immediate symptom assessments.",
                metric: "Sub-Second Response",
                actionTip: "Evaluates symptom vectors in real time."
              },
              {
                icon: Stethoscope,
                title: "Top 1% Specialist Alignment",
                badge: "Sub-15 Min",
                desc: "Direct escalation to board-verified physicians from Johns Hopkins, Mayo Clinic, and Harvard Health.",
                metric: "Ivy-League Network",
                actionTip: "Instant live HD video triage."
              },
              {
                icon: ShieldCheck,
                title: "Zero-Knowledge Encryption",
                badge: "AES-256 Vault",
                desc: "Client-side encrypted biometric records and medical telemetry isolated from third-party interception.",
                metric: "Hardware Isolation",
                actionTip: "Strict HIPAA & GDPR certified."
              },
              {
                icon: Bot,
                title: "Proactive Health Advocacy",
                badge: "24/7 Monitoring",
                desc: "Automated medication schedules, symptom progression tracking, and prescription renewal reminders.",
                metric: "Continuous Care",
                actionTip: "Synchronized across WhatsApp & web."
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => showToast(`${card.title}: ${card.actionTip}`, "info")}
                className="bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] p-6 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-[#4da1ff] flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                      <card.icon size={19} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2 tracking-tight group-hover:text-[#4da1ff] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-5 font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1 text-[#4da1ff]">
                    <CheckCircle size={11} className="text-emerald-400" />
                    {card.metric}
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight size={12} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Direct App Launch Banner (Compact and Optimized for Mobile) */}
          <div className="mt-8 sm:mt-12 text-center px-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenAuth('join')}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-primary hover:bg-[#1f60b5] text-white text-[11px] sm:text-xs uppercase font-bold tracking-wider sm:tracking-widest px-4 py-2.5 sm:px-8 sm:py-3.5 rounded-full shadow-md shadow-primary/20 transition-all cursor-pointer max-w-full"
            >
              <Bot size={14} className="shrink-0" />
              <span className="truncate">Launch Medi AI Triage on App</span>
              <ArrowRight size={13} className="shrink-0" />
            </motion.button>
          </div>

        </div>
      </section>

      {/* 8. Safety & Trust */}
      <section id="safety" className="py-16 sm:py-20 md:py-28 bg-[#EEF2F6] text-navy relative border-b border-slate-300/80">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2.5">
              Privacy & Security
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-navy tracking-tight mb-3 leading-tight">
              Your data is <span className="text-primary font-semibold">vault-grade secure.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Built on zero-knowledge architecture and hardware-isolated enclaves so your health telemetry and records remain strictly private.
            </p>
          </div>

          {/* 3 Executive Professional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch mb-10">
            {/* Card 1: Client Enclave */}
            <div className="bg-white rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-4">
                  <Smartphone size={20} />
                </div>
                <h3 className="text-base font-bold text-navy mb-2 tracking-tight">
                  Zero-Knowledge Enclave
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
                  Private decryption keys are generated locally within your device biometric hardware. Plaintext medical records never leave your physical device.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  On-Device Isolation
                </span>
                <span className="font-mono text-[10px] text-slate-400">AES-256</span>
              </div>
            </div>

            {/* Card 2: Hardware HSM Vault */}
            <div className="bg-white rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-navy mb-2 tracking-tight">
                  Hardware Security Module
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
                  Prescription signatures and clinical verifications are processed inside dedicated FIPS 140-2 Level 3 hardware vaults with tamper-evident zeroization.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  Tamper-Evident Shards
                </span>
                <span className="font-mono text-[10px] text-slate-400">FIPS 140-2</span>
              </div>
            </div>

            {/* Card 3: Continuous Audited Compliance */}
            <div className="bg-white rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <BadgeCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-navy mb-2 tracking-tight">
                  Audited Compliance
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
                  Continuously evaluated and certified by independent clinical and cybersecurity auditors under rigorous HIPAA, SOC2 Type II, and GDPR standards.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  Verified Compliance
                </span>
                <span className="font-mono text-[10px] text-slate-400">SOC2 · HIPAA</span>
              </div>
            </div>
          </div>

          {/* Clean Enterprise Trust Seal Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 pt-6 border-t border-slate-300/60">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" /> End-to-End Encrypted</span>
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-primary" /> Zero Plaintext Storage</span>
            <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-primary" /> HIPAA & SOC2 Certified</span>
          </div>

        </div>
      </section>

      {/* 9. Elite Member Insights - Transparent Canvas with 0.4 Tint */}
      <section className="py-16 md:py-24 bg-[#071324]/40 backdrop-blur-xl text-white relative overflow-hidden border-b border-white/10">
        <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <SuccessStories />
        </div>
      </section>

      {/* 10. Mobile Apps Section - Solid Gray Canvas */}
      <section className="py-16 sm:py-20 bg-[#EEF2F6] text-navy border-b border-slate-300/80 relative overflow-hidden">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <div className="flex flex-col items-center">
              
              {/* Refined Small Headline */}
              <h2 className="text-2xl sm:text-3xl font-medium text-navy tracking-tight mb-3">
                Healthcare in <span className="text-primary font-semibold">your pocket.</span>
              </h2>

              {/* Minimalist Subtitle */}
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-sans mb-8">
                Access 24/7 AI symptom triage, verified doctor consultations, and hardware-encrypted medical records anywhere on your mobile device.
              </p>

              {/* Real Official Store Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                {/* Apple App Store */}
                <MagneticWrapper>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => showToast("Medicata for iOS will be released soon on the App Store!", "info")}
                    className="w-full sm:w-auto bg-[#0a1128] hover:bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3.5 transition-all shadow-md hover:shadow-primary/20 border border-navy/20 cursor-pointer"
                  >
                    <svg viewBox="0 0 384 512" className="w-6 h-6 fill-current shrink-0" aria-hidden="true">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold leading-none">Download on the</p>
                      <p className="text-sm font-bold tracking-tight leading-tight mt-0.5">App Store</p>
                    </div>
                  </motion.button>
                </MagneticWrapper>

                {/* Google Play Store */}
                <MagneticWrapper>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => showToast("Medicata for Android will be released soon on Google Play!", "info")}
                    className="w-full sm:w-auto bg-[#0a1128] hover:bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3.5 transition-all shadow-md hover:shadow-primary/20 border border-navy/20 cursor-pointer"
                  >
                    <svg viewBox="0 0 512 512" className="w-5 h-5 shrink-0" aria-hidden="true">
                      <path fill="#4285F4" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9.2.2z"/>
                      <path fill="#34A853" d="M47 0C34 7.5 25.4 21.2 25.4 38.6v434.7c0 17.5 8.6 31.2 21.6 38.7L268.5 256 47 0z"/>
                      <path fill="#FBBC04" d="M428.2 202.6l-67.1-38.6-60.6 60.6 60.8 60.8 67.2-38.6c17.5-10.1 28.5-27.9 28.5-47.1s-11-37-28.8-47.1z"/>
                      <path fill="#EA4335" d="M325.3 277.7l60.1 59.9L104.6 499l220.7-221.3z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold leading-none">GET IT ON</p>
                      <p className="text-sm font-bold tracking-tight leading-tight mt-0.5">Google Play</p>
                    </div>
                  </motion.button>
                </MagneticWrapper>
              </div>

              {/* Minimal Availability Note */}
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-5">
                iOS 16+ & Android 12+ • Hardware Biometric Authentication
              </p>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 11. Strategic Partners Section - Transparent Dark Canvas with 0.4 Tint */}
      <section className="py-14 sm:py-18 bg-[#071324]/40 backdrop-blur-lg text-white border-b border-white/10 relative overflow-hidden">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-center font-medium text-white/50 mb-8 uppercase tracking-[0.3em] text-[10px]">
            Strategically Partnered with Global Excellence
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {['Johns Hopkins', 'Mayo Clinic', 'Harvard Health', 'Cleveland Clinic', 'NHS Verified'].map((name, i) => (
              <motion.span 
                key={i} 
                whileHover={{ scale: 1.05 }}
                className="text-base sm:text-lg font-medium tracking-tight text-white/40 grayscale hover:text-primary transition-all duration-300 cursor-default select-none"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ Section - Solid Light Canvas */}
      <FAQ showToast={showToast} />

      {/* 13. Standalone Clinical Digest / Newsletter Section (0.4 Dark Tint) */}
      <section className="py-16 md:py-20 bg-[#071324]/40 backdrop-blur-xl text-white border-t border-b border-white/10 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-[#4da1ff] text-[10px] font-bold uppercase tracking-wider mb-3.5 border border-primary/30">
            <Mail size={12} />
            <span>Clinical Intelligence Digest</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2.5">
            Stay ahead with <span className="font-medium text-[#4da1ff]">clinical AI insights.</span>
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-8 font-sans">
            Receive weekly verified medical breakthroughs, platform updates, and triage protocols directly in your inbox.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your clinical email..."
                className="w-full pl-4 pr-10 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-primary focus:bg-white/15 transition-all shadow-xs"
                required
              />
              <Mail size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-[#1f60b5] text-white text-xs uppercase font-bold tracking-widest px-7 py-3 rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <span>{isNewsletterSubscribed ? 'Subscribed' : 'Subscribe'}</span>
              {isNewsletterSubscribed ? <CheckCircle size={13} className="text-emerald-300" /> : <Send size={13} />}
            </motion.button>
          </form>
        </div>
      </section>
    </main>




      {/* Executive Professional Multi-Column Footer */}
      <footer className="bg-[#071324]/80 backdrop-blur-xl text-white pt-12 pb-8 border-t border-white/10 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Main 4-Column Navigation & Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10 text-left">
            
            {/* Column 1: Brand & Contact (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-start space-y-3">
              <div className="flex items-center gap-2.5">
                <img src="/favicon.png" alt="Medicata Icon" className="h-6 w-6 object-contain" />
                <span className="font-display font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                  MEDICATA
                  <span className="inline-flex items-center px-1.5 py-[2px] rounded-full text-[8px] font-black bg-primary/20 text-[#4da1ff] border border-primary/30 leading-none">
                    AI
                  </span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans pr-4">
                Autonomous AI triage, specialist consults, and encrypted medical records.
              </p>

              {/* Direct Email Inquiries */}
              <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <a
                  href="mailto:contact@medicata.ai"
                  onClick={() => showToast("Opening mail to contact@medicata.ai", "info")}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail size={12} className="text-[#4da1ff]" />
                  <span>contact@medicata.ai</span>
                </a>
                <a
                  href="mailto:support@medicata.ai"
                  onClick={() => showToast("Opening mail to support@medicata.ai", "info")}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail size={12} className="text-[#4da1ff]" />
                  <span>support@medicata.ai</span>
                </a>
              </div>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>42 Global Regions Operational</span>
              </div>
            </div>

            {/* Column 2: Platform Solutions (3 cols) */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#medi-ai" className="hover:text-white transition-colors">Medi AI Triage</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Specialist Telehealth</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Pharmacy Dispatch</a></li>
                <li><a href="#safety" className="hover:text-white transition-colors">Zero-Knowledge Vault</a></li>
              </ul>
            </div>

            {/* Column 3: Compliance & Security (3 cols) */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Security</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#4da1ff]" /><span>HIPAA Security Rule</span></li>
                <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#4da1ff]" /><span>GDPR Data Sovereignty</span></li>
                <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#4da1ff]" /><span>SOC2 Type II Certified</span></li>
                <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#4da1ff]" /><span>ISO/IEC 27001 Validated</span></li>
              </ul>
            </div>

            {/* Column 4: Governance & Legal (2 cols) */}
            <div className="lg:col-span-2 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Governance</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" onClick={(e) => { e.preventDefault(); showToast("Clinical Charter (Research-Driven)", "info"); }} className="hover:text-white transition-colors">Clinical Charter</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); showToast("Privacy Policy", "info"); }} className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); showToast("Terms of Service", "info"); }} className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); showToast("Responsible AI Disclosure", "info"); }} className="hover:text-white transition-colors">Responsible AI</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Social Channels */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <div className="text-[11px]">
              <span>© 2026 Medicata Ltd. A product Pioneers ICT. All rights reserved.</span>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Mail, href: "mailto:contact@medicata.ai", label: "Email" }
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  aria-label={item.label}
                  onClick={(e) => { 
                    if (item.href === "#") {
                      e.preventDefault();
                      showToast(`Opening Medicata ${item.label}...`, "info");
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <item.icon size={12} />
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default App;
