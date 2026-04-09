import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
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
  Heart,
  Pill,
  Thermometer,
  Microscope,
  Baby,
  Syringe,
  Brain
} from 'lucide-react';

const SingleBubble = ({ bubble }: { bubble: any }) => {
  return (
    <motion.div
      key={bubble.id}
      initial={{ opacity: 0.4, x: `${bubble.x}vw`, y: `${bubble.y}vh` }}
      style={{
        position: 'absolute',
        width: bubble.size,
        height: bubble.size,
        left: 0,
        top: 0
      }}
      animate={{
        opacity: 0.4,
        x: [
          `${bubble.x}vw`, 
          `${bubble.x + (Math.random() * 2 - 1)}vw`, 
          `${bubble.x}vw`
        ],
        y: [
          `${bubble.y}vh`, 
          `${bubble.y + (Math.random() * 2 - 1)}vh`, 
          `${bubble.y}vh`
        ],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.05, 0.95, 1]
      }}
      transition={{
        duration: bubble.duration,
        repeat: Infinity,
        delay: bubble.delay,
        ease: "easeInOut"
      }}
      className="flex items-center justify-center text-[#2572D9]"
    >
      <bubble.icon size={bubble.size} strokeWidth={1.5} />
    </motion.div>
  );
};

const HeartBubbles = () => {
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number; icon: React.ElementType }[]>([]);

  const icons = [Heart, Activity, Pill, Stethoscope, Thermometer, Microscope, Baby, Syringe, Brain];

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const bubbleCount = isMobile ? 6 : 15;
    
    const newBubbles = Array.from({ length: bubbleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (isMobile ? (35 - 20) + 20 : (45 - 25) + 25),
      duration: Math.random() * (6 - 4) + 4,
      delay: Math.random() * 5,
      icon: icons[Math.floor(Math.random() * icons.length)]
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[10]">
      {bubbles.map((bubble) => (
        <SingleBubble key={bubble.id} bubble={bubble} />
      ))}
    </div>
  );
};

// Assets
import heroImage from './assets/medicata_hero_new_1775487056003.png';
import mediMascot from './assets/medi.png';
import doctorBookingImg from './assets/doctor_booking_elite.png';
import pharmacyDeliveryImg from './assets/pharmacy_delivery_elite.png';
import eliteMobileImg from './assets/medicata_mobile_mockup_new.jpg';

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

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

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

  return (
    <div className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-6 pointer-events-none">
      <nav className={`nav-pill transition-all duration-500 pointer-events-auto flex items-center px-4 py-1 sm:py-2 md:px-10 md:py-1 gap-4 sm:gap-10 bg-white/95 backdrop-blur-md border border-navy/10 shadow-xl max-w-[98vw] sm:max-w-7xl w-full sm:w-auto`}>
        {/* Logo & Brand */}
        <div className="flex items-center border-r border-navy/10 pr-3 sm:pr-8 mr-1 sm:mr-4">
          <div className="flex items-center">
            <div className="w-20 h-20 sm:w-20 sm:h-20 flex items-center justify-center">
              <img src="/logo.png" alt="Medicata Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
              }
            }
          }}
          className={`hidden md:flex items-center gap-6 font-bold text-xs uppercase tracking-widest text-navy/60`}
        >
          {[
            { id: 'features', label: 'Features' },
            { id: 'how-it-works', label: 'How it Works' },
            { id: 'medi-ai', label: 'Medi AI' },
            { id: 'safety', label: 'Safety' },
          ].map((link) => (
            <motion.div
              key={link.id}
              variants={{
                hidden: { opacity: 0, y: -10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <MagneticWrapper>
                <a
                  href={`#${link.id}`}
                  className={`hover:text-primary transition-all ${activeSection === link.id ? 'text-primary nav-link-active' : ''}`}
                >
                  {link.label}
                </a>
              </MagneticWrapper>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-4 ml-2 pl-6 border-l border-navy/10">
          <button className={`hidden sm:block text-[10px] font-black uppercase tracking-widest text-navy/60 hover:text-primary transition-colors`}>Sign In</button>
          <MagneticWrapper>
            <button className={`btn btn-sm text-[10px] uppercase font-black tracking-widest px-6 btn-accent text-navy`}>
              Join Now
            </button>
          </MagneticWrapper>
        </div>

        {/* Mobile Toggle - Moved to Right */}
        <button className="md:hidden ml-auto text-navy" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Scroll Progress Line */}
        <motion.div className="nav-progress-line" style={{ scaleX }} />
      </nav>

      {/* Mobile Menu (Floating) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 10 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="md:hidden glass border border-white/40 absolute top-full left-6 right-6 p-6 rounded-3xl shadow-2xl z-[60]"
          >
            <div className="flex flex-col gap-6 font-black text-sm uppercase tracking-widest text-navy">
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</a>
              <a href="#medi-ai" onClick={() => setIsMenuOpen(false)}>Medi AI</a>
              <a href="#safety" onClick={() => setIsMenuOpen(false)}>Safety</a>
              <div className="flex flex-col gap-3 pt-4">
                <button className="btn btn-outline w-full py-4 uppercase font-black tracking-widest">Sign In</button>
                <button className="btn btn-primary w-full py-4 uppercase font-black tracking-widest">Join Now</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border-color last:border-0">
      <button
        className="w-full py-6 flex items-center justify-between text-left hover:text-secondary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-bold">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-muted leading-relaxed">
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
    <section id="faq" className="section-padding bg-white">
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <div className="badge">Got Questions?</div>
          <h2>Everything you need to know</h2>
        </div>
        <div className="glass rounded-3xl p-8 border border-border-color shadow-sm">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ScrollReveal = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    viewport={{ once: true, margin: "-100px" }}
  >
    {children}
  </motion.div>
);



const DynamicTypewriter = () => {
  const sentences = [
    "Hey, I'm Medi.",
    "How can I help?",
    "Elite health companion.",
    "Find top specialists.",
    "Order prescriptions fast.",
    "Secure medical records.",
    "24/7 wellness support.",
    "Book an appointment.",
    "Ready to assist.",
    "Professional care network.",
    "Global health vault.",
    "Symptom check assistant.",
    "Refill prescriptions now.",
    "Healthy habits helper.",
    "Your health matters.",
    "Safe data storage.",
    "Connect with doctors.",
    "Real-time AI support.",
    "Manage family health.",
    "Welcome to Medicata."
  ];

  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === sentences[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 3000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % sentences.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 25 : 50, Math.random() * 75));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <div className="min-h-[60px]">
      <p className="font-black text-lg text-navy leading-tight mb-2 tracking-tight">
        &quot;{sentences[index].substring(0, subIndex)}<span className="animate-pulse bg-primary w-1 h-5 inline-block align-middle ml-1" />&quot;
      </p>
      <p className="text-xs text-text-muted font-bold leading-relaxed">
        Medi is online & ready to assist your global health journey.
      </p>
    </div>
  );
};

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
    <div className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24 mb-32 last:mb-0 w-full`}>
      {/* Visual Indicator (The Node) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20 flex flex-col items-center">
        <motion.div
          style={{ scale: useSpring(progress as any, { stiffness: 100, damping: 30 }) }}
          className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(37,114,217,0.6)] border-4 border-white"
        />
        <div className="w-px h-full bg-navy/5 absolute top-4 -z-10" />
      </div>

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`w-full lg:w-[45%] ${isEven ? 'lg:text-right' : 'lg:text-left'} group`}
      >
        <div className="relative inline-block mb-6">
          <span className="text-8xl font-black text-navy/5 absolute -top-12 -left-6 lg:left-auto lg:-right-6 select-none font-display">
            {step.id}
          </span>
          <motion.div
            whileHover={{ scale: 1.1, rotate: isEven ? -5 : 5 }}
            className={`w-20 h-20 ${step.color} rounded-[32px] flex items-center justify-center shadow-2xl relative z-10 mx-auto ${isEven ? 'lg:ml-auto lg:mr-0' : 'lg:mr-auto lg:ml-0'}`}
          >
            <step.icon size={32} className="text-white" />
          </motion.div>
        </div>
        <h3 className="text-3xl font-black mb-4 text-navy tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
        <p className="text-xl text-text-muted leading-relaxed opacity-80">{step.desc}</p>
      </motion.div>

      {/* Spacing for the other side */}
      <div className="hidden lg:block lg:w-[45%]" />
    </div>
  );
};

const SecurityMap = () => {
  return (
    <div className="relative w-full h-[400px] bg-white rounded-[48px] border border-border-color overflow-hidden shadow-2xl flex items-center justify-center p-8 group">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,27,61,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,27,61,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* User to Vault Line */}
        <motion.path 
          d="M 20 50 L 50 50" 
          stroke="rgba(13, 27, 61, 0.1)" 
          strokeWidth="0.5" 
          strokeDasharray="1 1"
        />
        <motion.path 
          d="M 20 50 L 50 50" 
          stroke="#5AC8FA" 
          strokeWidth="0.5" 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Vault to Server Line */}
        <motion.path 
          d="M 50 50 L 80 50" 
          stroke="rgba(34, 197, 94, 0.1)" 
          strokeWidth="0.5" 
          strokeDasharray="1 1"
        />
        <motion.path 
          d="M 50 50 L 80 50" 
          stroke="#22c55e" 
          strokeWidth="0.5" 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
        />
      </svg>

      {/* Nodes Container */}
      <div className="absolute inset-0 flex items-center justify-between px-[10%]">
        
        {/* User Node */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
          <div className="w-16 h-16 rounded-2xl bg-white border border-navy/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(37,114,217,0.15)]">
            <Smartphone className="text-navy" size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-navy/60 whitespace-nowrap">User Node</span>
        </div>

        {/* Vault Node (Middle) */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 20px rgba(90,200,250,0.1)", "0 0 50px rgba(90,200,250,0.3)", "0 0 20px rgba(90,200,250,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/20 backdrop-blur-xl flex items-center justify-center relative shadow-sm"
          >
            <Shield className="text-primary" size={40} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-3xl border-2 border-dashed border-primary/20"
            />
            {/* Encryption Lock */}
            <div className="absolute -bottom-3 w-8 h-8 rounded-full bg-white border border-primary flex items-center justify-center shadow-lg">
              <Lock className="text-primary" size={14} />
            </div>
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 whitespace-nowrap">Prietech Vault</span>
        </div>

        {/* Server Node */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-24">
          <div className="w-16 h-16 rounded-2xl bg-white border border-navy/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <Database className="text-green-500" size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-600/80 whitespace-nowrap">Global Server</span>
        </div>

      </div>

      {/* Floating Status UI */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 border border-border-color shadow-sm flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-[pulse_1s_ease-in-out_infinite]" />
        <span className="text-[9px] font-black text-navy uppercase tracking-[0.2em] hidden sm:block">Data Encrypted</span>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, color, bg, tag }: any) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/40 group h-full flex flex-col justify-between"
  >
    <div>
      <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={30} />
      </div>
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 mb-2 block">{tag}</span>
        <h3 className="text-2xl font-black text-navy leading-tight">{title}</h3>
      </div>
      <p className="text-lg text-text-muted leading-relaxed opacity-80">{desc}</p>
    </div>
    <div className="mt-10">
      <MagneticWrapper>
        <button className="text-primary font-black uppercase text-[9px] tracking-[0.3em] flex items-center gap-3">
          Explore <ArrowRight size={16} />
        </button>
      </MagneticWrapper>
    </div>
  </motion.div>
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
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-navy mb-3 tracking-tight">Our Success Stories</h2>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-navy/40">Say This</span>
          <div className="w-12 h-[2px] bg-navy/10" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vertical Tabs */}
        <div className="lg:col-span-4 space-y-3">
          {Object.entries(stories).map(([key, item]) => (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key)}
              whileHover={{ x: 5 }}
              className={`w-full flex items-center gap-4 p-4 rounded-[28px] transition-all duration-500 text-left relative overflow-hidden ${activeTab === key ? 'bg-white shadow-[0_15px_40px_rgba(37,114,217,0.08)]' : 'hover:bg-white/50'}`}
            >
              {/* Active Highlight Bar */}
              {activeTab === key && (
                <motion.div 
                  layoutId="activeStoryBar"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary z-20"
                />
              )}
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 shrink-0 ${activeTab === key ? 'bg-primary text-white shadow-md' : 'bg-navy/5 text-navy/40'}`}>
                {key === 'patients' && <User size={20} />}
                {key === 'doctors' && <Stethoscope size={20} />}
                {key === 'pharmacy' && <Database size={20} />}
                {key === 'institutions' && <Globe size={20} />}
              </div>

              <div className="relative z-10">
                <h4 className={`text-base font-black tracking-tight ${activeTab === key ? 'text-navy' : 'text-navy/40'}`}>{item.category}</h4>
                <p className={`text-[10px] font-bold ${activeTab === key ? 'text-primary' : 'text-navy/20'}`}>{item.subtext}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Right Column: Story content */}
        <div className="lg:col-span-6 bg-white rounded-[20px] p-4 md:p-6 relative overflow-hidden group shadow-[0_10px_30px_rgba(13,27,61,0.02)] border border-navy/5 min-h-[260px] flex flex-col justify-center">
          
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
  const [activeIndex, setActiveIndex] = useState(0);
  const items = [
    { label: "Data Integrity", value: "SOC2 Type II", desc: "Military-grade service transparency." },
    { label: "Privacy Standard", value: "HIPAA & GDPR", desc: "Global medical data sovereignty." },
    { label: "Clinical Excellence", value: "Board-Led", desc: "Research-driven medical governance." },
    { label: "Information Security", value: "ISO 27001", desc: "Unmatched network resilience." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <section className="section-padding bg-off-white overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="max-w-xl">
            <div className="badge border-navy/10 text-navy/40 bg-navy/5 mb-6">Scientific Authority</div>
            <h2 className="text-5xl font-black text-navy tracking-tighter mb-8 leading-[1.1]">Built on <span className="text-gradient">verified excellence.</span></h2>
            <p className="text-lg text-text-muted font-medium mb-10 leading-relaxed">
              We adhere to the world's most rigorous medical and technical standards to ensure absolute trust and sovereign data security for every user.
            </p>
            <div className="flex gap-4">
              {items.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === i ? 'w-8 bg-primary' : 'w-2 bg-navy/10'}`} 
                />
              ))}
            </div>
          </div>

          <div className="relative h-[280px] sm:h-[400px] flex items-center justify-center lg:justify-end mt-12 lg:mt-0">
            <div className="relative w-full max-w-[280px] sm:max-w-[400px] h-full">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const isFront = i === activeIndex;
                  const position = (i - activeIndex + items.length) % items.length;
                  
                  if (position > 2) return null; // Only show top 3 cards for cleaner look

                  return (
                    <motion.div
                      key={item.value}
                      style={{ zIndex: items.length - position }}
                      initial={{ opacity: 0, scale: 0.8, x: 50 }}
                      animate={{ 
                        opacity: 1 - position * 0.2,
                        scale: 1 - position * 0.05,
                        x: position * 20,
                        y: position * -20,
                        rotate: position * 2
                      }}
                      exit={{ opacity: 0, x: -100, scale: 0.9, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute inset-0"
                    >
                      <div className={`bg-white p-12 rounded-[48px] shadow-2xl border border-navy/5 h-full flex flex-col justify-between group transition-colors duration-500 ${isFront ? 'hover:bg-navy hover:text-white' : ''}`}>
                        <div>
                          <BadgeCheck size={48} className={`mb-8 transition-colors ${isFront ? 'text-primary group-hover:text-accent' : 'text-primary/20'}`} />
                          <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-3 ${isFront ? 'text-navy/30 group-hover:text-white/40' : 'text-navy/10'}`}>{item.label}</p>
                          <h4 className="text-3xl font-black mb-6 tracking-tighter">{item.value}</h4>
                        </div>
                        <p className={`text-base font-medium leading-relaxed ${isFront ? 'opacity-60' : 'opacity-20'}`}>{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
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

  // Automatically cycle through roles every 5 seconds
  useEffect(() => {
    const roles: ('patient' | 'doctor' | 'pharmacy')[] = ['patient', 'doctor', 'pharmacy'];
    const interval = setInterval(() => {
      setActiveRole((current) => {
        const nextIndex = (roles.indexOf(current) + 1) % roles.length;
        return roles[nextIndex];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeartBubbles />
      <div className="noise-overlay" />
      <Navbar />

      {/* 1. Hero Section */}
      <section className="section-padding pt-32 md:pt-40 lg:pt-[180px] bg-white overflow-hidden relative grid-pattern">
        {/* Animated background elements - Elite blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [90, 0, 90] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-secondary/5 blur-[150px] rounded-full"
        />

        <div className="container grid lg:grid-cols-2 gap-12 sm:gap-20 items-center relative z-10 pt-20 lg:pt-0">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center lg:text-left"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
          >

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] sm:leading-[1.05] tracking-tight mb-6"
            >
              Healthcare, <br />
              <span className="text-gradient-navy italic">reimagined.</span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-lg sm:text-xl md:text-2xl text-text-muted mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-display"
            >
              Your health journey shouldn't be a struggle. Meet <span className="text-primary font-black">Medi</span> your personal 24/7 companion for a healthier, happier you.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
              className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5 items-center justify-center lg:justify-start"
            >
              <MagneticWrapper>
                <button className="btn btn-accent btn-lg text-[#0D1B3D] w-full sm:w-auto px-10 shadow-xl hover:shadow-accent/30 flex items-center justify-center gap-3">
                  Start Your Journey <ArrowRight size={22} className="animate-pulse" />
                </button>
              </MagneticWrapper>

              <div className="flex -space-x-3 items-center">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                  </div>
                ))}
                <div className="ml-4 pl-4 border-l border-border-color">
                  <p className="text-sm font-black text-navy tracking-tight">4.9/5 Global Rating</p>
                  <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] font-black">Vetted by elite professionals</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 p-4 bg-white/20 backdrop-blur-2xl rounded-[48px] shadow-2xl border border-white/40">
              <img src={heroImage} alt="Medicata Experience" className="rounded-[40px] shadow-inner" />
            </div>

            {/* Elite Floating Elements */}
            <motion.div
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 sm:-top-12 -right-4 sm:-right-8 glass p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl z-20 flex items-center gap-2 sm:gap-4 border border-white/60"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
                <CheckCircle className="text-white" size={16} />
              </div>
              <div>
                <p className="font-black text-[10px] sm:text-sm text-navy uppercase tracking-tighter">Verified</p>
                <p className="text-[8px] sm:text-xs text-text-muted font-bold">Clinic: St. Mary's</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-1 sm:-bottom-10 -left-1 sm:-left-12 glass p-1 sm:p-6 rounded sm:rounded-3xl shadow-2xl z-20 flex items-center gap-1 sm:gap-5 max-w-[100px] sm:max-w-sm border border-white/60"
            >
              <div className="relative shrink-0">
                <img src={mediMascot} alt="Medi AI" className="w-4 h-4 sm:w-20 sm:h-20 object-contain drop-shadow-xl" />
                <div className="absolute top-0 right-0 w-0.5 h-0.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border border-white heartbeat-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
              <div className="max-w-[65px] sm:max-w-[200px]">
                <div className="text-[4px] sm:text-xs leading-[1.0] font-black tracking-tight text-navy/90 break-words">
                  <DynamicTypewriter />
                </div>
              </div>
            </motion.div>
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
          <div className="relative flex overflow-hidden group mask-horizontal">
            <div className="animate-marquee flex gap-24 whitespace-nowrap pause-on-hover px-12">
              {[...Array(2)].map((_, groupIndex) => (
                <React.Fragment key={groupIndex}>phone
                  {['Johns Hopkins', 'Mayo Clinic', 'Harvard Health', 'Cleveland Clinic', 'NHS Verified'].map((name, i) => (
                    <span 
                      key={`${groupIndex}-${i}`} 
                      className="text-2xl font-black tracking-tighter text-navy opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:text-primary transition-all duration-500 cursor-default select-none"
                    >
                      {name}
                    </span>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Elite Ecosystem (Dynamic Role Switcher) */}
      <section id="features" className="section-padding bg-off-white relative">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="badge bg-primary/10 text-primary border border-primary/20"
            >
              Elite Ecosystem
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black tracking-tighter mb-12"
            >
              Designed for every <br />
              <span className="text-gradient">side of care.</span>
            </motion.h2>

            {/* Role Switcher Toggle */}
            <div className="flex justify-center mb-16 overflow-x-auto pb-4 px-4 mask-fade-right">
              <div className="inline-flex p-1.5 bg-white/50 backdrop-blur-xl border border-navy/5 rounded-[32px] shadow-2xl relative">
                {['patient', 'doctor', 'pharmacy'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role as any)}
                    className={`relative z-10 px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 rounded-[24px] whitespace-nowrap ${activeRole === role ? 'text-white' : 'text-navy/40 hover:text-navy'}`}
                  >
                    {activeRole === role && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-navy rounded-[24px] shadow-xl shadow-navy/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-2">
                       {role === 'patient' && <User size={14} />}
                       {role === 'doctor' && <Stethoscope size={14} />}
                       {role === 'pharmacy' && <Database size={14} />}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {activeRole === 'patient' && [
                { title: 'Global Specialist Access', desc: "Direct access to the world's leading medical minds. Search by specialty and real-time availability.", icon: Calendar, color: 'text-primary', bg: 'bg-primary/5', tag: 'Expert Care' },
                { title: 'WhatsApp Companion', desc: 'Receive prescription alerts, appointment reminders, and quick-chat support directly on WhatsApp.', icon: Bot, color: 'text-secondary', bg: 'bg-secondary/5', tag: 'AI Guardian' },
                { title: 'QR-Verified Health Vault', desc: 'Your medical history and prescriptions stored securely with biometric-linked sharing cards.', icon: Activity, color: 'text-accent', bg: 'bg-accent/5', tag: 'Private Care' }
              ].map((f, i) => <FeatureCard key={i} {...f} />)}

              {activeRole === 'doctor' && (
                <>
                  <div className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-8 h-full">
                      <FeatureCard title="Clinical MD-Panel" desc="A command center designed for precision archiving, schedule settings, and license-verified trust." icon={LayoutDashboard} color="text-primary" bg="bg-primary/5" tag="MD Commands" />
                      <FeatureCard title="QR-Verified E-Prescribe" desc="Generate digital prescriptions with secure sharing logic and expiry tracking in seconds." icon={FileText} color="text-secondary" bg="bg-secondary/5" tag="Digital Flow" />
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 overflow-hidden flex flex-col"
                  >
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center p-6">
                       <img src={doctorBookingImg} alt="Doctor Panel" className="h-full object-contain drop-shadow-xl" />
                    </div>
                    <div className="p-10 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 mb-2 block">Institutional</span>
                        <h3 className="text-2xl font-black text-navy leading-tight">Elite Patient History Vault</h3>
                        <p className="text-text-muted mt-4 font-medium italic">Instant clinical forensics with biometric authorization.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-primary font-black uppercase text-[9px] tracking-[0.3em] flex items-center gap-3 mt-8">View MD Specs <ArrowRight size={16} /></button>
                      </MagneticWrapper>
                    </div>
                  </motion.div>
                </>
              )}

              {activeRole === 'pharmacy' && (
                <>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 overflow-hidden flex flex-col"
                  >
                    <div className="h-48 bg-gradient-to-br from-secondary/10 to-transparent flex items-center justify-center p-6">
                       <img src={pharmacyDeliveryImg} alt="Pharmacy Logistics" className="h-full object-contain drop-shadow-xl" />
                    </div>
                    <div className="p-10 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 mb-2 block">Supply Chain</span>
                        <h3 className="text-2xl font-black text-navy leading-tight">Unified Order Ledger</h3>
                        <p className="text-text-muted mt-4 font-medium italic">Track prescriptions from doctor to patient with algorithmic dispatch and stock-logic.</p>
                      </div>
                      <MagneticWrapper>
                        <button className="text-secondary font-black uppercase text-[9px] tracking-[0.3em] flex items-center gap-3 mt-8">Register Hub <ArrowRight size={16} /></button>
                      </MagneticWrapper>
                    </div>
                  </motion.div>
                  <div className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-8 h-full">
                      <FeatureCard title="Verified QR Check" desc="Instant verification of sharing cards through our distributed clinical ledger. Avoid expiry issues." icon={Lock} color="text-accent" bg="bg-accent/5" tag="Fraud Protection" />
                      <FeatureCard title="Global Stock Monitoring" desc="Optimize routes for ultra-fast pharmaceutical dispatching based on real-time drug availability." icon={MapPin} color="text-primary" bg="bg-primary/5" tag="Supply Network" />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Bottom Curve Divider for Section Transition */}
      </section>


      {/* 4.7 Institutional Trust (Global Authority) */}
      <InstitutionalTrust />

      {/* 5. How It Works (Elite Step Journey Redesign) */}
      <section id="how-it-works" ref={containerRef} className="section-padding bg-white relative overflow-hidden">
        <LogisticsLedger progress={scrollYProgress} />
        {/* Animated Path Background */}
        <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[200px] bottom-[100px] w-px bg-navy/5">
          <motion.div
            style={{ scaleY: scrollYProgress, originY: 0 }}
            className="w-1 h-full bg-gradient-to-b from-primary via-secondary to-accent shadow-[0_0_15px_rgba(90,200,250,0.3)] rounded-full"
          />
        </div>

        <div className="container relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-32">
            <div className="badge">Elite Process</div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">Vetted care in <span className="text-gradient-gold">4 precise steps</span></h2>
            <p className="mt-8 text-xl md:text-2xl text-text-muted leading-relaxed">The Medicata journey—from initial consulting to localized pharmacy fulfillment.</p>
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


      {/* 12. Final CTA & Recommendation (Elite Invitation) */}
      <section className="section-padding bg-off-white text-center relative overflow-hidden">
        <div className="container max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-12">
              Step into the future of <br />
              <span className="text-gradient-gold italic">your health.</span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-16">
              <MagneticWrapper>
                <button className="btn btn-primary btn-lg w-full sm:w-auto px-12 py-6 sm:py-8 text-lg sm:text-xl shadow-2xl hover:shadow-primary/30">Get Invited Now</button>
              </MagneticWrapper>
              <MagneticWrapper>
                <button className="btn btn-outline btn-lg w-full sm:w-auto px-12 py-6 sm:py-8 text-lg sm:text-xl">Our Vision</button>
              </MagneticWrapper>
            </div>

          </motion.div>
        </div>
        {/* Elite Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary blur-3xl rounded-full" />
          <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-secondary blur-3xl rounded-full" />
        </div>
      </section>

      {/* 11. Elite Command Footer */}
      <footer className="relative bg-navy text-white pt-32 pb-12 overflow-hidden mt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-navy to-navy pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
            
            {/* Brand & Mission */}
            <div className="lg:col-span-5 lg:pr-8">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center">
                  <img src="/logo.png" alt="Medicata Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <p className="text-blue-100/60 text-lg leading-relaxed mb-10 max-w-sm">
                Engineering the future of global healthcare. Absolute privacy, algorithmic precision, and world-class care—delivered instantly.
              </p>
              
              {/* Newsletter Terminal */}
              <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center max-w-sm backdrop-blur-md focus-within:border-primary/50 focus-within:bg-white/10 transition-all duration-500">
                <div className="pl-4">
                  <Globe size={18} className="text-primary/70" />
                </div>
                <input 
                  type="email" 
                  placeholder="Join the exclusive network..." 
                  className="bg-transparent border-none text-white focus:outline-none w-full px-4 text-sm font-medium placeholder:text-white/30"
                />
                <button className="bg-white text-navy px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-colors h-full">Join</button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="font-black text-xs uppercase tracking-[0.3em] text-white mb-8 border-b border-white/10 pb-4 inline-block">Ecosystem</h4>
                <ul className="space-y-4">
                  {['Specialist Booking', 'Prietech Vault', 'Medi AI Engine', 'Global Pharmacy'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-blue-100/50 hover:text-primary hover:-translate-y-0.5 transition-all inline-block text-sm font-medium">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-[0.3em] text-white mb-8 border-b border-white/10 pb-4 inline-block">Organization</h4>
                <ul className="space-y-4">
                  {['The Vision', 'Board of Directors', 'Clinical Guidelines', 'Careers'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-blue-100/50 hover:text-secondary hover:-translate-y-0.5 transition-all inline-block text-sm font-medium">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1 border-t md:border-t-0 border-white/10 pt-8 md:pt-0">
                <h4 className="font-black text-xs uppercase tracking-[0.3em] text-white mb-8 border-b border-white/10 pb-4 inline-block">Support</h4>
                <ul className="space-y-4">
                  {['24/7 Concierge', 'Help Center', 'API Documentation', 'System Status'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-blue-100/50 hover:text-white transition-colors inline-block text-sm font-bold flex items-center gap-2 group">
                        {item === 'System Status' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />}
                        <span className="group-hover:underline underline-offset-4 decoration-primary/50">{item}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center text-center pt-8 border-t border-white/10 gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/40">© 2026 Medicata Global</span>
              <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
              <div className="flex gap-4">
                <a href="#" className="text-[10px] font-bold text-blue-100/40 hover:text-white uppercase tracking-wider transition-colors">Privacy</a>
                <a href="#" className="text-[10px] font-bold text-blue-100/40 hover:text-white uppercase tracking-wider transition-colors">Terms</a>
              </div>
            </div>
            
            <div className="flex gap-3">
              {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                  <Icon size={16} className="text-white/60 group-hover:text-white scale-90 group-hover:scale-100 transition-transform" />
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
