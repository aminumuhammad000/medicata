import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Bot,
  FileText,
  Video,
  Bell,
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
  Facebook
} from 'lucide-react';

// Assets
import heroImage from './assets/hero.png';
import mediMascot from './assets/medi.png';
import medicalTeam from './assets/team.png';
import testimonialPatient from './assets/testimonial.png';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-4 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <CheckCircle className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary">Medicata</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 font-medium text-text-muted">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#medi-ai" className="hover:text-primary transition-colors">Medi AI</a>
          <a href="#safety" className="hover:text-primary transition-colors">Safety</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="btn btn-outline btn-sm">Sign In</button>
          <button className="btn btn-primary btn-sm">Get Started</button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border-color absolute top-full left-0 right-0 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6 font-medium">
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</a>
              <a href="#medi-ai" onClick={() => setIsMenuOpen(false)}>Medi AI</a>
              <a href="#safety" onClick={() => setIsMenuOpen(false)}>Safety</a>
              <div className="flex flex-col gap-3 pt-4">
                <button className="btn btn-outline w-full">Sign In</button>
                <button className="btn btn-primary w-full">Get Started</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    className="card"
  >
    <div className="feature-icon-wrapper">
      <Icon size={28} />
    </div>
    <h3>{title}</h3>
    <p className="text-muted">{description}</p>
  </motion.div>
);

const App = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="section-padding pt-[160px] bg-off-white overflow-hidden">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="badge">Welcome to the future of care</div>
            <h1>Healthcare, <span className="text-gradient">simplified.</span></h1>
            <p className="text-xl text-muted mb-10 max-w-lg">
              Book doctors, find pharmacies, and get professional health guidance from Medi — all in one powerful place.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">
                Get Started <ArrowRight size={20} />
              </button>
              <button className="btn btn-outline">
                <Bot size={20} /> Talk to Medi
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="hero-image-container"
          >
            <img src={heroImage} alt="Medicata Experience" className="animate-float" />
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 glass p-6 rounded-2xl shadow-xl hidden lg:flex items-center gap-4 max-w-xs border border-white/50"
            >
              <img src={mediMascot} alt="Medi AI" className="w-16 h-16 object-contain" />
              <div>
                <p className="font-bold text-sm">"Hello! I'm Medi."</p>
                <p className="text-xs text-muted">How can I help you feel better today?</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Trust Section */}
      <section className="py-12 border-y border-border-color bg-white">
        <div className="container">
          <p className="text-center font-semibold text-text-light mb-8 uppercase tracking-widest text-sm">
            Trusted by the best healthcare providers
          </p>
          <div className="flex flex-wrap justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            {['General Hospital', 'HealthPlus', 'MedPlus', 'Verified Doctors', 'NCDC Approved'].map((name) => (
              <span key={name} className="text-xl font-bold tracking-tight text-text-muted">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Problem -> Solution Section */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="badge">Why Medicata?</div>
            <h2>Say goodbye to healthcare stress</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card bg-gray-50 border-dashed">
              <h3 className="text-red-600 flex items-center gap-2">
                <X size={24} /> The Old Way
              </h3>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3 text-muted">
                  <div className="mt-1 text-red-400">•</div>
                  Hours of waiting in crowded hospitals
                </li>
                <li className="flex items-start gap-3 text-muted">
                  <div className="mt-1 text-red-400">•</div>
                  Confusion about prescriptions and dosages
                </li>
                <li className="flex items-start gap-3 text-muted">
                  <div className="mt-1 text-red-400">•</div>
                  Losing physical records when you need them most
                </li>
              </ul>
            </div>
            <div className="card border-primary bg-primary-soft shadow-xl">
              <h3 className="text-primary flex items-center gap-2">
                <CheckCircle size={24} /> The Medicata Way
              </h3>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle size={20} className="text-secondary shrink-0" />
                  Instant booking with verified professionals
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle size={20} className="text-secondary shrink-0" />
                  Smart AI guidance for clear clarity
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle size={20} className="text-secondary shrink-0" />
                  All your health records in your pocket
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="section-padding bg-off-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge">Everything you need</div>
            <h2>Designed for your well-being</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Calendar}
              title="Doctor Booking"
              description="Schedule appointments with top specialists in minutes, not days."
            />
            <FeatureCard
              icon={MapPin}
              title="Pharmacy Access"
              description="Find and order medication from verified pharmacies near you."
            />
            <FeatureCard
              icon={Bot}
              title="Medi AI Assistant"
              description="24/7 smart health companion for symptom checking and advice."
            />
            <FeatureCard
              icon={FileText}
              title="Health Records"
              description="Securely store and access your medical history anytime."
            />
            <FeatureCard
              icon={Video}
              title="Telemedicine"
              description="Consult with world-class doctors from the comfort of your home."
            />
            <FeatureCard
              icon={Bell}
              title="Smart Reminders"
              description="Never miss a pill or an appointment with automated alerts."
            />
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="section-padding bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="badge">Getting Started</div>
            <h2>Quality care in 3 simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { id: '01', title: 'Meet Medi', desc: 'Sign up and introduce yourself to your new AI assistant.' },
              { id: '02', title: 'Find Care', desc: 'Browse verified doctors or pharmacies based on your needs.' },
              { id: '03', title: 'Get Better', desc: 'Consult instantly and get your care plan delivered.' },
            ].map((step) => (
              <div key={step.id} className="step-card">
                <div className="step-number">{step.id}</div>
                <h3>{step.title}</h3>
                <p className="text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Medi AI Section */}
      <section id="medi-ai" className="section-padding bg-primary py-[160px] relative overflow-hidden text-white">
        <div className="container grid md:grid-cols-2 gap-16 items-center z-10 relative">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-white">Meet Medi — your health companion</h2>
            <p className="text-xl text-blue-100 mb-10">
              Our advanced AI assistant listens, understands, and guides you to the right care. It's like having a doctor's wisdom in your pocket, 24/7.
            </p>
            <div className="glass p-6 rounded-2xl border-white/20">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                  <Bot size={24} className="text-primary" />
                </div>
                <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none">
                  <p className="text-white">Hi there! How are you feeling today?</p>
                </div>
              </div>
              <div className="flex gap-4 justify-end">
                <div className="bg-white p-4 rounded-2xl rounded-tr-none text-primary">
                  <p>I have a slight headache since morning.</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={24} className="text-white" />
                </div>
              </div>
            </div>
          </motion.div>
          <div className="flex justify-center">
            <motion.img
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              src={mediMascot}
              alt="Medi Mascot"
              className="w-full max-w-sm drop-shadow-2xl"
            />
          </div>
        </div>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 blur-[120px] -mr-64 -mt-64 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-400/20 blur-[100px] -ml-32 -mb-32 rounded-full"></div>
      </section>

      {/* 7. Customer Story */}
      <section className="section-padding bg-off-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <img src={testimonialPatient} alt="Patient Story" className="rounded-3xl shadow-2xl" />
            </div>
            <div className="order-1 md:order-2">
              <div className="badge">Success Story</div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl font-bold mb-8 italic leading-tight">
                  "Medicata changed everything for me. I can now manage my diabetes appointments and get my medication delivered right to my door without the stress of the city traffic."
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-primary"></div>
                  <div>
                    <p className="font-bold text-xl">Mrs. Amma Sani</p>
                    <p className="text-muted">Gratified Patient from Kano</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Safety & Trust */}
      <section id="safety" className="section-padding bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge">Security First</div>
            <h2>Your data is safe with us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3>Data Privacy</h3>
              <p className="text-muted">End-to-end encryption for all your health data and messages.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-50 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3>Secure Portals</h3>
              <p className="text-muted">Multi-factor authentication protects your account from unauthorized access.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-orange-50 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3>Verified Professionals</h3>
              <p className="text-muted">Every doctor and pharmacy is thoroughly vetted by our medical board.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Emergency Section */}
      <section className="section-padding">
        <div className="container">
          <div className="card bg-red-50 border-red-100 p-12 overflow-hidden relative">
            <div className="md:flex justify-between items-center z-10 relative">
              <div className="max-w-2xl mb-8 md:mb-0">
                <h2 className="text-red-900 mb-4">Emergency Support</h2>
                <p className="text-red-800 text-lg">
                  Need urgent help? Our rapid response team and emergency ambulance partners are available 24/7.
                </p>
              </div>
              <button className="btn bg-red-600 text-white hover:bg-red-700 animate-pulse">
                <PhoneCall size={24} /> Call Emergency
              </button>
            </div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-200/30 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="section-padding bg-off-white text-center">
        <div className="container max-w-4xl">
          <div className="badge">Join Medicata Today</div>
          <h2 className="mb-8">Take control of your health with the world's most human-centered health platform</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn btn-primary btn-lg">Download the App</button>
            <button className="btn btn-outline btn-lg">Partner with Us</button>
          </div>
          <p className="mt-8 text-muted">Available on iOS and Android. Coming soon to Web.</p>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="py-20 bg-white border-t border-border-color">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">Medicata</span>
              </div>
              <p className="text-muted mb-6">
                Modernizing healthcare for the African continent, one patient at a time.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-off-white rounded-lg hover:text-primary transition-all"><Twitter size={20} /></a>
                <a href="#" className="p-2 bg-off-white rounded-lg hover:text-primary transition-all"><Linkedin size={20} /></a>
                <a href="#" className="p-2 bg-off-white rounded-lg hover:text-primary transition-all"><Instagram size={20} /></a>
                <a href="#" className="p-2 bg-off-white rounded-lg hover:text-primary transition-all"><Facebook size={20} /></a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-muted">
                <li><a href="#" className="hover:text-primary transition-all block">Doctor Booking</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Medi AI Chat</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Health Records</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Pharmacy Locator</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-muted">
                <li><a href="#" className="hover:text-primary transition-all block">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Press Kit</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-muted">
                <li><a href="#" className="hover:text-primary transition-all block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-all block">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border-color text-muted text-sm">
            <p>© 2026 Medicata Health Technologies. All rights reserved.</p>
            <p>Made with ❤️ for a healthier future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
