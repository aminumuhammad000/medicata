import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
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
  Globe,
  Smartphone,
  Database,
  Shield,
  Activity,
  Stethoscope,
  User,
  LayoutDashboard,
  BadgeCheck,
  ChevronRight,
  Plus,
  Pill,
  Search,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';



// Assets
import mediMascot from './assets/medi.png';
import doctorBookingImg from './assets/doctor_booking_elite.png';
import pharmacyDeliveryImg from './assets/pharmacy_delivery_elite.png';


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
          <div className="bg-gradient-to-r from-navy via-primary to-secondary p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10 cursor-pointer">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Prietech AES-256 Vault</span>
            </div>
            <h3 className="text-2xl font-black">{mode === 'signin' ? 'Access Medicata' : 'Join Medicata Ecosystem'}</h3>
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
                className="w-full py-3.5 bg-primary hover:bg-[#1E5CAF] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
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
                    <h4 className="text-xs font-black text-navy group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{item.desc}</p>
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
    <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
      <nav className={`nav-pill transition-all duration-300 pointer-events-auto flex items-center justify-between px-3 sm:px-5 ${isScrolled ? 'py-1.5 sm:py-2 bg-white/95 shadow-xl shadow-navy/10 border-navy/15 scale-[0.98]' : 'py-2 sm:py-2.5 bg-white/90 shadow-lg shadow-navy/5 border-navy/10'} backdrop-blur-2xl border max-w-[96vw] sm:max-w-6xl w-full rounded-full`}>
        
        {/* Brand & Clean Icon without border */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="#" className="flex items-center gap-2.5 group">
            <img src="/favicon.png" alt="Medicata Icon" className="h-7 w-7 sm:h-8 sm:w-8 object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-display font-black text-sm sm:text-base text-navy tracking-tight leading-none flex items-center gap-1.5">
                MEDICATA
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                  AI
                </span>
              </span>
            </div>
          </a>

          {/* System Status Dot */}
          <button
            onClick={() => showToast("24/7 AI Triage system active across 42 global regions with 99.4% accuracy.", "success")}
            className="hidden xl:flex items-center gap-2 pl-3 border-l border-navy/10 text-[10px] font-semibold text-navy/70 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to view AI system status"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="tracking-wide uppercase text-[9px] font-bold text-green-700">24/7 AI Active</span>
          </button>
        </div>

        {/* Desktop Nav Items with Dual-Spring Micro-Interactions */}
        <div 
          className="hidden md:flex items-center gap-1 font-bold text-xs tracking-wide bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 shadow-inner"
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
                className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${isActive ? 'text-primary' : 'text-slate-600 hover:text-navy'}`}
              >
                {/* Active Sliding Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-slate-200/80 -z-10"
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
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sign In button */}
          <button
            onClick={() => onOpenAuth('signin')}
            className="hidden lg:block text-xs font-extrabold uppercase tracking-wider text-navy/70 hover:text-primary transition-colors px-3 py-1.5 cursor-pointer"
          >
            Sign In
          </button>

          {/* Join Now CTA */}
          <MagneticWrapper>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('join')}
              className="bg-navy text-white hover:bg-primary text-[11px] uppercase font-black tracking-widest px-4 sm:px-5 py-2 sm:py-2 rounded-full shadow-md hover:shadow-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Join Now</span>
              <ArrowRight size={13} className="text-secondary" />
            </motion.button>
          </MagneticWrapper>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden p-1.5 text-navy hover:text-primary transition-colors rounded-lg cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Top Progress Line */}
        <motion.div className="nav-progress-line" style={{ scaleX }} />
      </nav>

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
  );
};


const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/80 last:border-0">
      <button
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm sm:text-base font-extrabold text-navy">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-navy/60" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    { question: "How are your Global Specialists vetted?", answer: "Each specialist on Medicata is selected from the top 1% of their respective fields, primarily from Ivy League institutions and world-leading research hospitals. We verify board certifications, peer-reviewed contributions, and clinical outcomes." },
    { question: "What is the Prietech Vault exactly?", answer: "The Prietech Vault is a distributed ledger secondary-encryption layer. Your data is encrypted at the hardware level before it even leaves your device, utilizing military-grade AES-256 protocols and zero-knowledge architecture." },
    { question: "Does Medicata handle international medical insurance?", answer: "Yes! Our concierge team works with major global health insurance providers to authorize and process claims for out-of-network specialist consultations and premium pharmaceutical fulfillment." },
    { question: "How does the 30-minute global dispatch work?", answer: "Through our unified pharmacy ledger, your prescription is instantly beamed to several Tier-1 pharmacies in your vicinity. The first to verify stock triggers an automated priority courier for hyper-local delivery." }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="badge">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mb-2">Everything you need to know</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">Clear answers to standard queries regarding Medicata's global healthcare platform.</p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
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





const LogisticsLedger = ({ progress }: { progress: any }) => {
  const steps = [
    { label: "CONSULT", color: "bg-primary" },
    { label: "ALIGN", color: "bg-secondary" },
    { label: "DISPATCH", color: "bg-accent" }
  ];

  return (
    <div className="hidden xl:flex fixed right-12 top-1/2 -translate-y-1/2 flex-col gap-10 z-50">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <motion.div 
            style={{ 
              scale: useSpring(progress as any, { stiffness: 100, damping: 30 }),
              opacity: useSpring(progress as any, { stiffness: 100, damping: 30 })
            }}
            className={`w-3 h-3 rounded-full ${step.color} shadow-lg`}
          />
        </div>
      ))}
    </div>
  );
};

const JourneyStep = ({ step, index, progress }: { step: any, index: number, progress: any }) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-6 lg:gap-12 mb-16 last:mb-0 w-full`}>
      {/* Visual Indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20 flex flex-col items-center">
        <motion.div
          style={{ scale: useSpring(progress as any, { stiffness: 100, damping: 30 }) }}
          className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-xs"
        />
      </div>

      {/* Content Card */}
      <div className={`w-full lg:w-[45%] ${isEven ? 'lg:text-right' : 'lg:text-left'} bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300`}>
        <div className="flex items-center gap-3 mb-3 justify-start lg:justify-end">
          <div className={`w-10 h-10 ${step.color} rounded-xl flex items-center justify-center shadow-xs`}>
            <step.icon size={20} className="text-white" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-navy/40">Step {step.id}</span>
        </div>
        <h3 className="text-base sm:text-lg font-extrabold text-navy mb-2 tracking-tight">{step.title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
      </div>

      {/* Spacing for opposite side */}
      <div className="hidden lg:block lg:w-[45%]" />
    </div>
  );
};

const SecurityMap = () => {
  return (
    <div className="relative w-full h-[320px] bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex items-center justify-center p-6">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,27,61,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(13,27,61,0.04)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 20 50 L 50 50" stroke="#5AC8FA" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M 50 50 L 80 50" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 2" />
      </svg>

      {/* Nodes Container */}
      <div className="absolute inset-0 flex items-center justify-between px-[10%]">
        
        {/* User Node */}
        <div className="flex flex-col items-center gap-2 relative z-10 w-20">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
            <Smartphone className="text-navy" size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-navy/60 whitespace-nowrap">User Node</span>
        </div>

        {/* Vault Node (Middle) */}
        <div className="flex flex-col items-center gap-2 relative z-10 w-28">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-xl flex items-center justify-center relative shadow-xs">
            <Shield className="text-primary" size={28} />
            <div className="absolute inset-0 rounded-2xl border border-dashed border-primary/20" />
            <div className="absolute -bottom-2 w-6 h-6 rounded-full bg-white border border-primary flex items-center justify-center shadow-xs">
              <Lock className="text-primary" size={11} />
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-primary mt-1 whitespace-nowrap">Prietech Vault</span>
        </div>

        {/* Server Node */}
        <div className="flex flex-col items-center gap-2 relative z-10 w-20">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
            <Database className="text-green-500" size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-green-600/80 whitespace-nowrap">Global Server</span>
        </div>

      </div>

      {/* Floating Status UI */}
      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 border border-slate-200 shadow-xs flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-[8px] font-black text-navy uppercase tracking-wider">Data Encrypted</span>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, color, bg, tag }: any) => (
  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 group h-full flex flex-col justify-between">
    <div>
      <div className={`w-11 h-11 ${bg} ${color} rounded-xl flex items-center justify-center mb-4 shadow-xs`}>
        <Icon size={22} />
      </div>
      <div className="mb-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-navy/40 mb-1 block">{tag}</span>
        <h3 className="text-base sm:text-lg font-extrabold text-navy tracking-tight">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
    <div className="mt-5">
      <MagneticWrapper>
        <button className="text-primary font-black uppercase text-[9px] tracking-widest flex items-center gap-2 cursor-pointer hover:underline">
          Explore <ArrowRight size={13} />
        </button>
      </MagneticWrapper>
    </div>
  </div>
);


const SuccessStories = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const tabs = ['patients', 'doctors', 'pharmacy'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = tabs.indexOf(current);
        return tabs[(currentIndex + 1) % tabs.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stories: Record<string, any> = {
    patients: {
      title: "Life-changing precision.",
      rating: 5,
      author: "Sarah J., London",
      quote: "Medicata didn't just save me time. The AI diagnosed an inconsistency my local GP missed. I was connected to a Johns Hopkins specialist within 20 minutes.",
      category: "Patients",
      subtext: "Seeking precision care",
      id: "Sarah"
    },
    doctors: {
      title: "The future of clinical work.",
      rating: 5,
      author: "Dr. Amara, Lagos",
      quote: "As a cardiologist, the clinical MD-panel allows me to track patient history with unprecedented accuracy. The QR-prescriptions eliminated fraud in my practice.",
      category: "Doctors",
      subtext: "Practicing elite medicine",
      id: "Amara"
    },
    pharmacy: {
      title: "Unified supply flow.",
      rating: 5,
      author: "Kofi, Ghana",
      quote: "Joining the Medicata ledger transformed our dispatch speed. We now fulfill orders 40% faster with absolute verification of every prescription.",
      category: "Pharmacies",
      subtext: "Optimized fulfillment",
      id: "Kofi"
    }
  };

  const story = stories[activeTab];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center max-w-xl mx-auto">
        <span className="badge">Member Insights</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mb-2">Our Success Stories</h2>
        <p className="text-xs sm:text-sm text-slate-600">Verified experiences from patients, specialists, and pharmacy hubs.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Tabs */}
        <div className="lg:col-span-4 space-y-2">
          {Object.entries(stories).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${activeTab === key ? 'bg-white border border-slate-200/80 shadow-xs' : 'hover:bg-white/60'}`}
            >
              {activeTab === key && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-20" />
              )}
              
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center relative z-10 shrink-0 ${activeTab === key ? 'bg-primary text-white' : 'bg-slate-100 text-navy/40'}`}>
                {key === 'patients' && <User size={16} />}
                {key === 'doctors' && <Stethoscope size={16} />}
                {key === 'pharmacy' && <Database size={16} />}
              </div>

              <div className="relative z-10">
                <h4 className={`text-xs sm:text-sm font-extrabold tracking-tight ${activeTab === key ? 'text-navy' : 'text-navy/50'}`}>{item.category}</h4>
                <p className={`text-[9px] font-bold ${activeTab === key ? 'text-primary' : 'text-slate-400'}`}>{item.subtext}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Column: Story content */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-center">
          
          {/* Decorative Stylized Icon (Top Right) */}
          <div className="absolute -top-4 -right-4 text-primary/5 transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-110">
             <div className="relative">
                <Plus size={120} strokeWidth={0.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus size={40} strokeWidth={0.5} className="rotate-45" />
                </div>
             </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h3 className="text-lg md:text-xl font-black text-navy mb-2 leading-tight max-w-xl">{story.title}</h3>
              
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex gap-0.5 text-yellow-500">
                  {[...Array(story.rating)].map((_, i) => (
                    <span key={i} className="text-base">★</span>
                  ))}
                </div>
                <div className="w-1 h-1 bg-navy/10 rounded-full" />
                <p className="text-[9px] font-black text-navy uppercase tracking-[0.15em]">{story.author}</p>
              </div>

              <p className="text-sm md:text-base text-text-muted leading-relaxed font-medium">
                "{story.quote}"
              </p>

              <div className="mt-6 flex justify-between items-end">
                <div className="flex -space-x-1.5">
                   {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-[3px] border-white bg-navy/5 flex items-center justify-center text-[6px] font-black text-navy/20 overflow-hidden">
                         <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                           {story.id[0]}
                         </div>
                      </div>
                   ))}
                </div>

                <MagneticWrapper>
                  <button className="w-12 h-12 rounded-full border-2 border-navy/5 flex items-center justify-center hover:bg-navy hover:text-white transition-all duration-500 group/btn">
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </MagneticWrapper>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


const InstitutionalTrust = () => {
  const items = [
    { label: "Data Integrity", value: "SOC2 Type II", desc: "Military-grade service transparency." },
    { label: "Privacy Standard", value: "HIPAA & GDPR", desc: "Global medical data sovereignty." },
    { label: "Clinical Excellence", value: "Board-Led", desc: "Research-driven medical governance." },
    { label: "Information Security", value: "ISO 27001", desc: "Unmatched network resilience." }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge">Scientific Authority</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-2">
            Built on verified excellence.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            We adhere to the world's most rigorous medical and security standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <BadgeCheck size={20} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">{item.label}</span>
              <h3 className="text-base font-extrabold text-navy mb-1">{item.value}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const App = () => {
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'pharmacy'>('patient');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Interactive UI States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'join'>('join');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ message, type });
  };

  const handleOpenAuth = (mode: 'signin' | 'join') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="noise-overlay" />
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

      {/* 1. Hero Section - Minimalist Modern */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 bg-white overflow-hidden relative grid-pattern">
        {/* Subtle background ambient light */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent blur-[120px] rounded-full pointer-events-none"
        />

        <div className="container max-w-4xl mx-auto text-center relative z-10 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Minimalist Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-navy text-xs font-bold shadow-2xs mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Next-Gen Healthcare Intelligence</span>
            </div>

            {/* Refined Headline (Smaller, Crisp & Minimalist) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy leading-[1.18] tracking-tight mb-5 max-w-3xl">
              Healthcare, <span className="text-gradient-navy italic">reimagined</span> for modern precision.
            </h1>

            {/* Refined Subtitle (Smaller & Sleek) */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-sans mb-8">
              Seamless access to 24/7 AI triage, top 1% global specialists, and hardware-encrypted medical records—all in one unified platform.
            </p>

            {/* Minimal Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14 w-full sm:w-auto">
              <MagneticWrapper>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleOpenAuth('join')}
                  className="bg-navy text-white hover:bg-primary text-xs uppercase font-black tracking-widest px-7 py-3.5 rounded-full shadow-lg shadow-navy/15 hover:shadow-primary/30 transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight size={15} className="text-secondary" />
                </motion.button>
              </MagneticWrapper>

              <MagneticWrapper>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-slate-100 hover:bg-slate-200/80 text-navy border border-slate-200/90 text-xs uppercase font-extrabold tracking-widest px-7 py-3.5 rounded-full transition-all cursor-pointer w-full sm:w-auto"
                >
                  Explore Ecosystem
                </motion.button>
              </MagneticWrapper>
            </div>

            {/* Minimalist Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 pt-8 border-t border-slate-200/60 w-full max-w-3xl">
              {[
                { value: "99.4%", label: "AI Precision Rate" },
                { value: "30 Min", label: "Pharmacy Dispatch" },
                { value: "AES-256", label: "Vault Encryption" },
                { value: "Top 1%", label: "Verified Doctors" },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-black text-navy tracking-tight">{stat.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>

          </motion.div>
        </div>

        {/* Global Curve Divider */}
        <div className="curve-divider curve-down" />
      </section>

      {/* 2. Trust Section (Elite Institutional Partners) */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container">
          <p className="text-center font-black text-navy/40 mb-14 uppercase tracking-[0.4em] text-[10px]">
            Strategically Partnered with Global Excellence
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 px-4">
            {['Johns Hopkins', 'Mayo Clinic', 'Harvard Health', 'Cleveland Clinic', 'NHS Verified'].map((name, i) => (
              <span 
                key={i} 
                className="text-lg sm:text-xl font-black tracking-tighter text-navy/40 grayscale hover:opacity-100 hover:text-primary transition-all duration-300 cursor-default select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Elite Ecosystem (Dynamic Role Switcher) */}
      <section id="features" className="py-16 md:py-24 bg-off-white relative border-t border-slate-100">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge">Elite Ecosystem</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-2">
              Designed for every side of care.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Unified workflows tailored for Patients, Doctors, and Pharmacies.
            </p>

            {/* Role Switcher Toggle */}
            <div className="flex justify-center mt-6 overflow-x-auto pb-2 px-2">
              <div className="inline-flex p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs relative">
                {['patient', 'doctor', 'pharmacy'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role as any)}
                    className={`relative z-10 px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition-all duration-300 rounded-xl whitespace-nowrap cursor-pointer ${activeRole === role ? 'text-white' : 'text-navy/50 hover:text-navy'}`}
                  >
                    {activeRole === role && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-navy rounded-xl shadow-xs"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-2">
                       {role === 'patient' && <User size={13} />}
                       {role === 'doctor' && <Stethoscope size={13} />}
                       {role === 'pharmacy' && <Database size={13} />}
                       {role}
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
              className="grid lg:grid-cols-3 gap-6"
            >
              {activeRole === 'patient' && [
                { title: 'Global Specialist Access', desc: "Direct access to the world's leading medical minds. Search by specialty and real-time availability.", icon: Calendar, color: 'text-primary', bg: 'bg-primary/5', tag: 'Expert Care' },
                { title: 'WhatsApp Companion', desc: 'Receive prescription alerts, appointment reminders, and quick-chat support directly on WhatsApp.', icon: Bot, color: 'text-secondary', bg: 'bg-secondary/5', tag: 'AI Guardian' },
                { title: 'QR-Verified Health Vault', desc: 'Your medical history and prescriptions stored securely with biometric-linked sharing cards.', icon: Activity, color: 'text-accent', bg: 'bg-accent/5', tag: 'Private Care' }
              ].map((f, i) => <FeatureCard key={i} {...f} />)}

              {activeRole === 'doctor' && (
                <>
                  <div className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-6 h-full">
                      <FeatureCard title="Clinical MD-Panel" desc="A command center designed for precision archiving, schedule settings, and license-verified trust." icon={LayoutDashboard} color="text-primary" bg="bg-primary/5" tag="MD Commands" />
                      <FeatureCard title="QR-Verified E-Prescribe" desc="Generate digital prescriptions with secure sharing logic and expiry tracking in seconds." icon={FileText} color="text-secondary" bg="bg-secondary/5" tag="Digital Flow" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center p-4">
                       <img src={doctorBookingImg} alt="Doctor Panel" className="h-full object-contain" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-navy/40 mb-1 block">Institutional</span>
                        <h3 className="text-base sm:text-lg font-extrabold text-navy leading-tight">Elite Patient History Vault</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">Instant clinical forensics with biometric authorization.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-primary font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mt-4 cursor-pointer hover:underline">View MD Specs <ArrowRight size={13} /></button>
                      </MagneticWrapper>
                    </div>
                  </div>
                </>
              )}

              {activeRole === 'pharmacy' && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="h-32 bg-gradient-to-br from-secondary/10 to-transparent flex items-center justify-center p-4">
                       <img src={pharmacyDeliveryImg} alt="Pharmacy Logistics" className="h-full object-contain" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-navy/40 mb-1 block">Supply Chain</span>
                        <h3 className="text-base sm:text-lg font-extrabold text-navy leading-tight">Unified Order Ledger</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">Track prescriptions from doctor to patient with algorithmic dispatch.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-secondary font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mt-4 cursor-pointer hover:underline">Register Hub <ArrowRight size={13} /></button>
                      </MagneticWrapper>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-6 h-full">
                      <FeatureCard title="Verified QR Check" desc="Instant verification of sharing cards through our distributed clinical ledger. Avoid expiry issues." icon={Lock} color="text-accent" bg="bg-accent/5" tag="Fraud Protection" />
                      <FeatureCard title="Global Stock Monitoring" desc="Optimize routes for ultra-fast pharmaceutical dispatching based on real-time drug availability." icon={MapPin} color="text-primary" bg="bg-primary/5" tag="Supply Network" />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 4.5 Institutional Authority */}
      <InstitutionalTrust />

      {/* 5. How It Works */}
      <section id="how-it-works" ref={containerRef} className="py-16 md:py-24 bg-white relative overflow-hidden border-t border-slate-100">
        <LogisticsLedger progress={scrollYProgress} />
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="badge">Elite Process</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-2">Vetted care in 4 precise steps</h2>
            <p className="text-xs sm:text-sm text-slate-600">The Medicata journey from initial consulting to localized pharmacy fulfillment.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            {[
              {
                id: '01',
                title: 'Expert Consult',
                desc: 'Speak with top-tier specialists via video, audio, or chat. Medi AI assists with symptom check baseline.',
                color: 'bg-primary',
                icon: Bot
              },
              {
                id: '02',
                title: 'Bespoke Alignment',
                desc: 'Your doctor generates a digital prescription card with QR-verification and secure expiry tracking.',
                color: 'bg-secondary',
                icon: CheckCircle
              },
              {
                id: '03',
                title: 'Priority Dispatch',
                desc: 'Choose from our vetted pharmacy network for pickup or ultra-fast home delivery.',
                color: 'bg-accent',
                icon: PhoneCall
              },
              {
                id: '04',
                title: 'Localized Fulfillment',
                desc: 'Track your order status live until it reaches your doorstep through your dedicated WhatsApp advocate.',
                color: 'bg-navy',
                icon: MapPin
              },
            ].map((step, index) => (
              <JourneyStep key={step.id} step={step} index={index} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Medi AI Section (Elite Conversational UI) */}
      <section id="medi-ai" className="section-padding bg-navy relative overflow-hidden text-white">
        {/* Elite Background Decor */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary/10 blur-[120px] rounded-full animate-float" />

        <div className="container grid lg:grid-cols-2 gap-24 items-center z-10 relative">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="badge border-white/20 text-white bg-white/5 mb-8">AI Companion</div>
            <h2 className="text-white text-5xl md:text-6xl font-black mb-8 leading-tight">
              A friend who <br />
              <span className="text-gradient-gold">actually listens.</span>
            </h2>
            <p className="text-xl text-blue-100/70 mb-12 leading-relaxed max-w-xl">
              Medi isn’t just a bot. She’s an advanced AI companion designed to understand your symptoms, feelings, and health history with elite accuracy.
            </p>

            <div className="space-y-6 max-w-md">
              {!isSimulating ? (
                <>
                  {[
                    { type: 'bot', text: "Hi! I noticed your sleep data was a bit off last night. How are you feeling today?", icon: Bot },
                    { type: 'user', text: "A bit tired, actually. My head feels a little heavy.", icon: CheckCircle },
                    { type: 'bot', text: "I understand. Let's do a quick check-in together.", icon: Bot },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.3 + 0.5 }}
                      viewport={{ once: true }}
                      className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.type === 'bot' && (
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                          <Bot size={22} className="text-navy" />
                        </div>
                      )}
                      <div className={`p-5 rounded-[24px] ${msg.type === 'bot' ? 'bg-white/10 rounded-tl-none border border-white/10' : 'bg-primary rounded-tr-none shadow-xl'}`}>
                        <p className="text-sm font-medium text-white">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    {simStep === 0 && (
                      <motion.div 
                        key="step0"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-10"
                      >
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Activity size={32} className="text-primary animate-pulse" />
                        </div>
                        <h4 className="text-xl font-bold mb-4">Initializing Vital-Scan</h4>
                        <p className="text-blue-100/60 text-sm">Synchronizing with your biometric perimeter...</p>
                      </motion.div>
                    )}
                    {simStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-10"
                      >
                        <div className="w-24 h-24 border-4 border-dashed border-primary/40 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin-slow">
                           <ShieldCheck size={40} className="text-primary" />
                        </div>
                        <h4 className="text-xl font-bold mb-4">Analyzing Symptoms</h4>
                        <p className="text-blue-100/60 text-sm italic">"Neural mapping in progress. Cross-referencing 40M+ cases."</p>
                      </motion.div>
                    )}
                    {simStep === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[24px] p-6 text-navy"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary">Specialist Referral</p>
                            <h4 className="text-lg font-black tracking-tight">Johns Hopkins Specialist</h4>
                          </div>
                        </div>
                        <p className="text-sm opacity-70 mb-6">"Analysis suggests localized muscle tension. I've prepositioned a consultation with our top neurologist for 14:00 today."</p>
                        <button className="w-full btn btn-primary py-3">Confirm Alignment</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="mt-12 flex gap-4">
              <MagneticWrapper>
                <button 
                  onClick={() => {
                    setIsSimulating(true);
                    setSimStep(0);
                    setTimeout(() => setSimStep(1), 2000);
                    setTimeout(() => setSimStep(2), 5000);
                  }}
                  disabled={isSimulating}
                  className={`btn ${isSimulating ? 'bg-white/10 text-white/40 border-white/5 cursor-not-allowed' : 'btn-outline border-white/30 text-white hover:bg-white hover:text-navy'} px-10`}
                >
                  {isSimulating ? "Medi is Thinking..." : "Live Simulator Test"}
                </button>
              </MagneticWrapper>
              {isSimulating && (
                <button onClick={() => setIsSimulating(false)} className="text-xs uppercase font-black tracking-widest opacity-60 hover:opacity-100 underline">Reset</button>
              )}
            </div>
          </motion.div>

          <div className="flex justify-center relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 blur-[100px] rounded-full"
            />
            <motion.img
              animate={{
                y: [0, -20, 0],
                rotate: [0, 1, -1, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              src={mediMascot}
              alt="Medi Mascot"
              className="w-full max-w-[450px] drop-shadow-[0_35px_35px_rgba(37,114,217,0.3)] relative z-10"
            />
          </div>
        </div>
      </section>

      {/* 8. Safety & Trust (Elite Security Transformation) */}
      <section id="safety" className="section-padding bg-white relative">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-125 animate-pulse-subtle"></div>
              <div className="relative z-10 w-full max-w-lg mx-auto">
                <SecurityMap />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <ScrollReveal>
                <h2 className="text-5xl font-black mt-6 leading-tight">Your data is <br /><span className="text-gradient-navy">vault-grade secure.</span></h2>
                <p className="text-xl text-text-muted mt-8 leading-relaxed">
                  We use military-grade end-to-end encryption to ensure that your private medical data stays exactly where it belongs: with you.
                </p>

                <div className="mt-12 space-y-10">
                  {[
                    { icon: ShieldCheck, title: "End-to-End Encryption", desc: "Every message and record is encrypted at the source, meaning only you have the key.", color: "text-primary", bg: "bg-primary/5" },
                    { icon: Lock, title: "Multi-Factor Mastery", desc: "Biometric authentication and real-time alerts prevent any unauthorized access attempt.", color: "text-secondary", bg: "bg-secondary/5" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-[24px] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                        <item.icon size={30} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-navy mb-3">{item.title}</h3>
                        <p className="text-lg text-text-muted leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
      {/* 9. Elite Member Insights (Redesigned Success Stories) */}
      <section className="section-padding bg-off-white relative overflow-hidden">
        <div className="container relative z-10">
          <SuccessStories />
        </div>
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* 10. FAQ Section */}
      <FAQ />

      {/* 9. App Preview Section (Elite Pocket Experience) */}
      <section className="section-padding overflow-hidden bg-navy relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-150 animate-float" />
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <ScrollReveal>
              <div className="relative z-10">
                <div className="badge bg-secondary/10 text-secondary border-secondary/20 font-black mb-8">Seamless Mobile</div>
                <h2 className="text-white text-5xl md:text-6xl font-black mb-8 leading-tight">
                  Healthcare in <br />
                  <span className="text-gradient-gold">your pocket.</span>
                </h2>
                <p className="text-xl text-blue-100/70 mb-12 leading-relaxed max-w-xl">
                  Whether you're on iOS or Android, Medicata brings elite healthcare tools directly to your fingertips. Manage records, chat with Medi, and consult doctors on the go.
                </p>

                <div className="flex flex-wrap gap-6">
                  <MagneticWrapper>
                    <div className="group bg-white/10 hover:bg-white text-white hover:text-navy px-10 py-5 rounded-[24px] flex items-center gap-4 transition-all border border-white/10 hover:border-white shadow-xl cursor-not-allowed">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Coming Soon</p>
                        <p className="text-lg font-black tracking-tighter">App Store</p>
                      </div>
                    </div>
                  </MagneticWrapper>
                  <MagneticWrapper>
                    <div className="group bg-white/10 hover:bg-white text-white hover:text-navy px-10 py-5 rounded-[24px] flex items-center gap-4 transition-all border border-white/10 hover:border-white shadow-xl cursor-not-allowed">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Coming Soon</p>
                        <p className="text-lg font-black tracking-tighter">Google Play</p>
                      </div>
                    </div>
                  </MagneticWrapper>
                </div>
              </div>
            </ScrollReveal>
            <div className="relative">
              <ScrollReveal>
                <div className="bg-secondary/20 absolute inset-0 blur-[150px] rounded-full scale-125 animate-pulse-subtle"></div>
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotateX: [15, 12, 15],
                    rotateY: [-15, -12, -15],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 perspective-[1000px]"
                >
                  {/* Digital App Mockup (Generated UI) */}
                  <div className="w-[260px] sm:w-[320px] h-[520px] sm:h-[640px] bg-navy rounded-[32px] sm:rounded-[48px] border-[6px] sm:border-[8px] border-white/20 shadow-2xl mx-auto overflow-hidden relative group">
                    {/* App Header */}
                    <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-6 border-b border-white/10">
                      <div className="flex justify-between items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                           <CheckCircle size={14} className="text-white" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
                          <div className="w-6 h-1.5 sm:w-8 sm:h-2 rounded-full bg-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="space-y-1 sm:space-y-2">
                         <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Good Morning</p>
                         <h4 className="text-xl sm:text-2xl font-black text-white">Hello, Sarah</h4>
                      </div>

                      {/* Health Stat Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                         <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <Activity size={16} className="text-secondary" />
                            <span className="text-[8px] sm:text-[10px] font-bold text-white/40">Real-time</span>
                         </div>
                         <div className="flex items-end gap-1.5 sm:gap-2">
                            <span className="text-3xl sm:text-4xl font-black text-white">72</span>
                            <span className="text-[10px] sm:text-xs font-bold text-white/60 pb-1">BPM</span>
                         </div>
                         <div className="mt-3 sm:mt-4 flex gap-1 items-end h-6 sm:h-8">
                            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.6].map((h, i) => (
                              <motion.div 
                                key={i} 
                                animate={{ height: [`${h*100}%`, `${(h*0.5)*100}%`, `${h*100}%`] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                className="flex-1 bg-secondary/40 rounded-full" 
                              />
                            ))}
                         </div>
                      </div>

                      {/* Action Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                         {[
                           { label: 'Consult', icon: Bot, bg: 'bg-primary' },
                           { label: 'Vault', icon: Lock, bg: 'bg-navy-light' },
                           { label: 'Pharmacy', icon: MapPin, bg: 'bg-secondary' },
                           { label: 'Records', icon: FileText, bg: 'bg-white/10' }
                         ].map((btn, i) => (
                           <div key={i} className={`${btn.bg} p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col gap-2 sm:gap-3 hover:scale-105 transition-transform`}>
                              <btn.icon size={16} className="text-white" />
                              <span className="text-[8px] sm:text-[10px] font-black uppercase text-white/80">{btn.label}</span>
                           </div>
                         ))}
                      </div>

                      {/* Bottom Nav Simulation */}
                      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 h-12 sm:h-14 bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-around">
                         <User size={16} className="text-white" />
                         <Calendar size={16} className="text-white/40" />
                         <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center -mt-6 sm:-mt-8 shadow-xl">
                            <Plus size={16} className="text-white" />
                         </div>
                         <Activity size={16} className="text-white/40" />
                         <Globe size={16} className="text-white/40" />
                      </div>
                    </div>
                  </div>

                  {/* Floating App Notifs */}
                  <motion.div
                    animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-1/4 -right-16 glass p-5 rounded-2xl border border-white/60 shadow-2xl hidden lg:block max-w-[200px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-navy uppercase leading-none mb-1">Medi AI</p>
                        <p className="text-[9px] font-bold text-navy/60">Your prescription is ready for dispatch.</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>




      {/* Sleek Minimalist Thin Footer */}
      <footer className="bg-navy text-white py-8 border-t border-white/10 mt-12">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Brand & Copyright */}
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Medicata Icon" className="h-6 w-6 object-contain" />
            <span className="font-display font-black text-sm text-white tracking-tight">MEDICATA</span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] font-medium text-blue-100/50">© 2026 Medicata Ltd. All rights reserved.</span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-[11px] font-bold text-blue-100/60 uppercase tracking-wider">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#medi-ai" className="hover:text-white transition-colors">Medi AI</a>
            <a href="#safety" className="hover:text-white transition-colors">Safety</a>
            <button onClick={() => showToast("24/7 AI Triage System active across 42 global regions.", "success")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span>Status</span>
            </button>
          </div>

          {/* Compact Social Icons */}
          <div className="flex items-center gap-2">
            {[
              { icon: Twitter, href: "#" },
              { icon: Linkedin, href: "#" },
              { icon: Instagram, href: "#" },
              { icon: Facebook, href: "#" }
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                onClick={(e) => { e.preventDefault(); showToast("Opening social channel..."); }}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-colors cursor-pointer"
              >
                <item.icon size={13} className="text-white/70 hover:text-white" />
              </a>
            ))}
          </div>

        </div>
      </footer>
    </div>
  );
};

export default App;
