import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Sun,
  Moon,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Fingerprint,
  User,
  Stethoscope,
  Building2,
  BadgeCheck,
  Plus,
  X,
  Activity,
  Sparkles,
  MapPin,
  CornerDownLeft
} from 'lucide-react';
import { MediMascot, type MediEmotion } from './MediMascot';
import { MedicalWallpaper } from './MedicalWallpaper';
import type { PatientProfile } from '../types';

type UserRole = 'patient' | 'doctor' | 'pharmacy';

interface OnboardingFlowProps {
  onComplete: (profile: PatientProfile) => void;
  initialProfile: PatientProfile;
}

// Scalloped / Zigzag-rounded verified blue tick badge
const ZigzagCheckBadge: React.FC<{ size?: string; className?: string }> = ({ size = "w-5 h-5", className = "" }) => (
  <motion.div
    initial={{ scale: 0, rotate: -25 }}
    animate={{ scale: 1, rotate: 0 }}
    exit={{ scale: 0, rotate: 25 }}
    transition={{ type: 'spring', stiffness: 520, damping: 22 }}
    className={`relative flex items-center justify-center shrink-0 text-primary ${size} ${className}`}
  >
    <svg viewBox="0 0 24 24" className={`${size} fill-current`} xmlns="http://www.w3.org/2000/svg">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </motion.div>
);

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, initialProfile }) => {
  const [mode, setMode] = useState<'onboarding' | 'login'>('onboarding');
  const [isDark, setIsDark] = useState(false);
  const [role, setRole] = useState<UserRole>('patient');
  
  // Step 1: Role -> Step 2: Name -> Step 3: Email -> Step 4: Phone -> Step 5+: Role specific
  const [step, setStep] = useState(1);

  // Focus state for password (triggers Medi covering eyes)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Enclave key state
  const [isPairing, setIsPairing] = useState(false);
  const [isPaired, setIsPaired] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState(initialProfile.email || 'alex.rivera@medicata.health');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Patient onboarding state
  const [patientData, setPatientData] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    phone: initialProfile.phone || '',
    age: initialProfile.age || 32,
    gender: initialProfile.gender || 'Non-Binary',
    bloodType: initialProfile.bloodType || 'O+',
    allergies: initialProfile.allergies && initialProfile.allergies.length > 0 ? initialProfile.allergies : ['Penicillin'],
    emergencyPhone: initialProfile.emergencyContact?.phone || ''
  });

  // Doctor onboarding state
  const [doctorData, setDoctorData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialty: 'Cardiology',
    hospitalAffiliation: 'Mount Sinai Health Network',
    consultationFee: '$120'
  });

  // Pharmacy onboarding state
  const [pharmacyData, setPharmacyData] = useState({
    pharmacyName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: '',
    deliveryType: 'Express Courier & In-Store Pickup'
  });

  const [allergyInput, setAllergyInput] = useState('');

  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const ageOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  const specialties = ['Cardiology', 'Neurology', 'General Practice', 'Pediatrics', 'Dermatology', 'Psychiatry', 'Orthopedics'];

  // Total single-question steps
  const totalSteps = role === 'patient' ? 7 : 6;

  // Step transition states & swap direction
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);

  const goToStep = (targetStep: number) => {
    if (targetStep === step || isStepTransitioning) return;
    setDirection(targetStep > step ? 1 : -1);
    setIsStepTransitioning(true);

    // Live bird flight animation runs for ~2.2s; step changes mid-flight and new card swipes slowly
    setTimeout(() => {
      setStep(targetStep);
    }, 1300);

    setTimeout(() => {
      setIsStepTransitioning(false);
    }, 2200);
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    goToStep(2);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handlePairEnclave = () => {
    setIsPairing(true);
    setTimeout(() => {
      setIsPairing(false);
      setIsPaired(true);
    }, 850);
  };

  const handleAddAllergy = () => {
    const val = allergyInput.trim();
    if (val && !patientData.allergies.includes(val)) {
      setPatientData(prev => ({ ...prev, allergies: [...prev.allergies, val] }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setPatientData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== item)
    }));
  };

  // Realtime Input Validations
  const isEmailValid = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim());
  const isNameValid = (nm: string) => nm.trim().length >= 2;
  const isPhoneValid = (ph: string) => ph.replace(/\D/g, '').length >= 7;
  const isLicenseValid = (lic: string) => lic.trim().length >= 3;

  const currentName = role === 'doctor' ? doctorData.name : role === 'pharmacy' ? pharmacyData.pharmacyName : patientData.name;
  const currentEmail = role === 'doctor' ? doctorData.email : role === 'pharmacy' ? pharmacyData.email : patientData.email;
  const currentPhone = role === 'doctor' ? doctorData.phone : role === 'pharmacy' ? pharmacyData.phone : patientData.phone;

  const isCurrentNameValid = isNameValid(currentName);
  const isCurrentEmailValid = isEmailValid(currentEmail);
  const isCurrentPhoneValid = isPhoneValid(currentPhone);
  const isDoctorLicenseValid = isLicenseValid(doctorData.licenseNumber);
  const isDoctorHospitalValid = doctorData.hospitalAffiliation.trim().length >= 2;
  const isPharmacyLicenseValid = isLicenseValid(pharmacyData.licenseNumber);
  const isPharmacyAddressValid = pharmacyData.address.trim().length >= 4;
  const isEmergencyPhoneValid = isPhoneValid(patientData.emergencyPhone);

  // Dynamic Medi speech message & emotion (Reacts in real-time when inputs are correct)
  const getMediState = (): { emotion: MediEmotion; message: string } => {
    if (mode === 'login') {
      if (isPasswordFocused) {
        return { emotion: 'shy', message: "I'm looking away! Your password is safe 🙈" };
      }
      if (isLoggingIn || isBiometricScanning) {
        return { emotion: 'thinking', message: "Unlocking your secure vault..." };
      }
      if (isEmailValid(loginEmail)) {
        return { emotion: 'happy', message: `Great! Enter your credentials to unlock your ${role} portal 🔐` };
      }
      return { emotion: 'happy', message: `Welcome back! Ready to unlock your ${role} portal?` };
    }

    if (step === 1) return { emotion: 'happy', message: "Are you joining as a Patient, Doctor, or Pharmacy?" };

    if (step === 2) {
      if (isCurrentNameValid) {
        return {
          emotion: 'happy',
          message: role === 'pharmacy'
            ? `Great name! Setting up registry for ${currentName.trim()} 🏥`
            : `Nice to meet you, ${currentName.trim().split(' ')[0]}! 😊`
        };
      }
      return { emotion: 'idle', message: role === 'pharmacy' ? "What's the name of your pharmacy?" : "What should I call you?" };
    }

    if (step === 3) {
      if (isCurrentEmailValid) {
        return { emotion: 'happy', message: "That's a valid email address! Looking great ✨" };
      }
      return { emotion: 'idle', message: "What's your email address?" };
    }

    if (step === 4) {
      if (isCurrentPhoneValid) {
        return { emotion: 'happy', message: "Phone number verified for instant 2FA login! 📱" };
      }
      return { emotion: 'idle', message: "What's your mobile phone number?" };
    }

    if (role === 'patient') {
      if (step === 5) return { emotion: 'happy', message: "Vitals baseline ready! Let's continue 🩺" };
      if (step === 6) return { emotion: patientData.allergies.length > 0 ? 'happy' : 'protect', message: patientData.allergies.length > 0 ? "Allergy profile recorded & safeguarded 🛡️" : "Any allergies I should know about?" };
      if (step === 7) return { emotion: isPaired ? 'celebrate' : isEmergencyPhoneValid ? 'happy' : 'idle', message: isPaired ? "Vault paired! You're ready to enter 🚀" : isEmergencyPhoneValid ? "Emergency contact set! Ready to pair your key ✨" : "Let's link an emergency contact & pair your biometric key." };
    }

    if (role === 'doctor') {
      if (step === 5) return { emotion: isDoctorLicenseValid ? 'happy' : 'protect', message: isDoctorLicenseValid ? "Valid medical credentials registered 🩺" : "What's your Medical License or NPI number?" };
      if (step === 6) return { emotion: isDoctorHospitalValid ? 'happy' : 'celebrate', message: isDoctorHospitalValid ? "Affiliation saved! Ready to launch your portal 🚀" : "What is your clinical specialty & hospital?" };
    }

    if (role === 'pharmacy') {
      if (step === 5) return { emotion: isPharmacyLicenseValid ? 'happy' : 'protect', message: isPharmacyLicenseValid ? "DEA & State dispensary license verified 💊" : "What's your Pharmacy License or DEA number?" };
      if (step === 6) return { emotion: isPharmacyAddressValid ? 'happy' : 'celebrate', message: isPharmacyAddressValid ? "Dispensary address confirmed! 📦" : "Where is your dispensary located?" };
    }

    return { emotion: 'idle', message: "Let's get your health portal ready ✨" };
  };

  const mediStatus = getMediState();

  const handleFinishOnboarding = () => {
    let completedProfile: PatientProfile;

    if (role === 'doctor') {
      completedProfile = {
        ...initialProfile,
        role: 'doctor',
        name: doctorData.name || 'Dr. Sarah Jenkins, MD',
        email: doctorData.email || 'dr.jenkins@medicata.health',
        phone: doctorData.phone || '+1 (555) 492-3810',
        licenseNumber: doctorData.licenseNumber || 'MED-NY-89104',
        specialty: doctorData.specialty,
        hospitalAffiliation: doctorData.hospitalAffiliation,
        consultationFee: doctorData.consultationFee,
        enclaveKey: '0x8f2a...9b41-ZK-AES256',
        isEnclaveVerified: true,
        isOnboarded: true
      };
    } else if (role === 'pharmacy') {
      completedProfile = {
        ...initialProfile,
        role: 'pharmacy',
        name: pharmacyData.pharmacyName || 'Apex MediCare Hub',
        pharmacyName: pharmacyData.pharmacyName || 'Apex MediCare Hub',
        email: pharmacyData.email || 'rx.apex@medicata.health',
        phone: pharmacyData.phone || '+1 (555) 782-9011',
        licenseNumber: pharmacyData.licenseNumber || 'RX-DE-99401',
        address: pharmacyData.address || '742 Evergreen Blvd, New York, NY',
        enclaveKey: '0x8f2a...9b41-ZK-AES256',
        isEnclaveVerified: true,
        isOnboarded: true
      };
    } else {
      completedProfile = {
        ...initialProfile,
        role: 'patient',
        name: patientData.name || 'Alex Rivera',
        email: patientData.email || 'alex.rivera@medicata.health',
        phone: patientData.phone || '+1 (555) 389-2049',
        age: Number(patientData.age),
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        allergies: patientData.allergies,
        chronicConditions: initialProfile.chronicConditions || ['Migraine with Aura'],
        emergencyContact: {
          name: 'Emergency Contact',
          phone: patientData.emergencyPhone || '+1 (555) 891-2311',
          relationship: 'Emergency Contact'
        },
        enclaveKey: '0x8f2a...9b41-ZK-AES256',
        isEnclaveVerified: true,
        isOnboarded: true
      };
    }

    onComplete(completedProfile);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!loginEmail) {
      setErrorMsg('Please enter your email.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      onComplete({
        ...initialProfile,
        role,
        email: loginEmail,
        name: role === 'doctor' ? 'Dr. Sarah Jenkins, MD' : role === 'pharmacy' ? 'Apex MediCare Hub' : (initialProfile.name || 'Alex Rivera'),
        isOnboarded: true,
        isEnclaveVerified: true
      });
    }, 600);
  };

  const handleBiometricAuth = () => {
    setErrorMsg('');
    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      onComplete({
        ...initialProfile,
        role,
        isOnboarded: true,
        isEnclaveVerified: true
      });
    }, 850);
  };

  const handleQuickDemo = (demoRole: UserRole) => {
    setRole(demoRole);
    if (demoRole === 'doctor') {
      setLoginEmail('dr.jenkins@medicata.health');
    } else if (demoRole === 'pharmacy') {
      setLoginEmail('rx.apex@medicata.health');
    } else {
      setLoginEmail('alex.rivera@medicata.health');
    }
    handleLogin();
  };

  // Swapping page animation variants (slow, smooth swiped card effect)
  const stepVariants: Variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 55 : -55,
      scale: 0.975
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const
      }
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -55 : 55,
      scale: 0.975,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1] as const
      }
    })
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans antialiased transition-colors duration-500 relative overflow-hidden ${
      isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      
      {/* Calm Modern Layered Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* WhatsApp-style Healthcare Doodle Wallpaper Texture */}
        <MedicalWallpaper isDark={isDark} />

        {/* Soft upper calming aura */}
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full blur-3xl transition-all duration-1000 ${
          isDark
            ? 'bg-gradient-to-b from-blue-900/20 via-indigo-950/15 to-transparent'
            : 'bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-transparent'
        }`} />

        {/* Calm subtle left light glow */}
        <div className={`absolute top-1/4 -left-28 w-72 h-72 rounded-full blur-3xl transition-opacity duration-1000 ${
          isDark ? 'bg-primary/5' : 'bg-sky-200/25'
        }`} />

        {/* Calm subtle right light glow */}
        <div className={`absolute top-1/2 -right-28 w-72 h-72 rounded-full blur-3xl transition-opacity duration-1000 ${
          isDark ? 'bg-indigo-600/5' : 'bg-blue-100/35'
        }`} />
      </div>

      {/* Floating Individual Island Header Elements Spanning Across Page */}
      <header className="w-full px-6 sm:px-12 pt-6 pb-2 flex items-center justify-between z-30">
        
        {/* Left Island: Medicata Logo ONLY Card (No text, No shadow) */}
        <motion.div
          whileHover={{ scale: 1.06, rotate: 6 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={`p-2.5 rounded-2xl border backdrop-blur-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isDark
              ? 'bg-slate-900/60 border-white/10'
              : 'bg-white/70 border-white/80'
          }`}
          title="Medicata Health"
        >
          <img
            src="/favicon.png"
            alt="Medicata"
            className="w-5 h-5 object-contain"
          />
        </motion.div>

        {/* Center Island: Standalone Step Dots Card (When in Onboarding Mode, No shadow) */}
        {mode === 'onboarding' ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-2xl border backdrop-blur-2xl flex items-center gap-2 transition-all duration-300 ${
              isDark
                ? 'bg-slate-900/60 border-white/10'
                : 'bg-white/70 border-white/80'
            }`}
          >
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => {
              const isCurrent = s === step;
              const isPast = s < step;
              return (
                <motion.button
                  key={s}
                  type="button"
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (isPast) goToStep(s); }}
                  disabled={!isPast && !isCurrent}
                  title={`Step ${s} of ${totalSteps}${isPast ? ' (Click to review)' : ''}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer disabled:cursor-default flex items-center justify-center ${
                    isCurrent
                      ? 'w-5 h-1.5 bg-primary rounded-full'
                      : isPast
                      ? 'w-1.5 h-1.5 bg-primary/60 hover:bg-primary rounded-full'
                      : isDark ? 'w-1.5 h-1.5 bg-slate-800 rounded-full' : 'w-1.5 h-1.5 bg-slate-200 rounded-full'
                  }`}
                />
              );
            })}
          </motion.div>
        ) : (
          <div className="hidden sm:block" />
        )}

        {/* Right Islands: Standalone Switcher Card + Standalone Theme Toggle Card (No shadow) */}
        <div className="flex items-center gap-2.5">
          {/* Standalone Signup / Login Switcher Card */}
          <div className={`p-1 rounded-2xl border backdrop-blur-2xl flex items-center transition-all duration-300 ${
            isDark
              ? 'bg-slate-900/60 border-white/10'
              : 'bg-white/70 border-white/80'
          }`}>
            <button
              type="button"
              onClick={() => { setMode('onboarding'); setStep(1); setErrorMsg(''); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'onboarding'
                  ? 'bg-primary text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-primary text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Standalone Dark / Light Mode Toggle Card */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88, rotate: 20 }}
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-2xl border backdrop-blur-2xl transition-all duration-300 cursor-pointer flex items-center justify-center ${
              isDark
                ? 'bg-slate-900/60 border-white/10 text-amber-300 hover:bg-slate-850'
                : 'bg-white/70 border-white/80 text-slate-600 hover:bg-white'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>
        </div>
      </header>

      {/* Main Flat Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-xl mx-auto w-full py-6 z-10">
        
        {/* Medi Mascot */}
        <div className="mb-6 flex justify-center">
          <MediMascot
            emotion={mediStatus.emotion}
            isPasswordFocused={isPasswordFocused}
            isTransitioning={isStepTransitioning}
            message={mediStatus.message}
            size="md"
          />
        </div>

        {/* Dynamic Step Content */}
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ======================================================== */}
            {/* FLAT LOGIN MODE */}
            {/* ======================================================== */}
            {mode === 'login' && (
              <motion.div
                key="flat-login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Role Switcher Pills */}
                <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border transition-all ${
                  isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-100/90 border-slate-200/80'
                }`}>
                  {(['patient', 'doctor', 'pharmacy'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        if (r === 'doctor') setLoginEmail('dr.jenkins@medicata.health');
                        else if (r === 'pharmacy') setLoginEmail('rx.apex@medicata.health');
                        else setLoginEmail('alex.rivera@medicata.health');
                      }}
                      className={`py-1.5 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                        role === r
                          ? 'bg-primary text-white shadow-xs font-bold'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium"
                  >
                    {errorMsg}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  {/* Email Field */}
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
                    <div className="relative group flex items-center">
                      <Mail size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        onFocus={() => setIsPasswordFocused(false)}
                        placeholder="user@medicata.health"
                        className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                            : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                        }`}
                      />
                      <div className="absolute right-3.5 flex items-center pointer-events-none">
                        <AnimatePresence>
                          {isEmailValid(loginEmail) && <ZigzagCheckBadge />}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                      <button
                        type="button"
                        onClick={() => alert("Check your enrolled hardware passkey device.")}
                        className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group flex items-center">
                      <Lock size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        placeholder="••••••••••••"
                        className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                            : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={isLoggingIn || isBiometricScanning}
                      className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-primary/20 disabled:opacity-70"
                    >
                      {isLoggingIn ? (
                        <>
                          <Activity size={14} className="animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Sign In</span>
                      )}
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleBiometricAuth}
                      disabled={isLoggingIn || isBiometricScanning}
                      className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 ${
                        isDark
                          ? 'bg-slate-850 border-slate-800 text-slate-200 hover:bg-slate-800'
                          : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      {isBiometricScanning ? (
                        <>
                          <Activity size={14} className="animate-spin text-primary" />
                          <span>Verifying Biometrics...</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint size={15} className="text-primary" />
                          <span>Sign in with Touch ID / Passkey</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Demo Shortcut */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(role)}
                    className="text-[11px] font-medium text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    Quick demo sign in as {role === 'doctor' ? 'Dr. Sarah Jenkins' : role === 'pharmacy' ? 'Apex MediCare' : 'Alex Rivera'} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 1 (SELECT USER TYPE) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 1 && (
              <motion.div
                key="step-1-role"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-2.5"
              >
                <div className="space-y-2.5">
                  {/* Patient Option */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1.5, scale: 0.995 }}
                    onClick={() => handleSelectRole('patient')}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer flex items-center gap-3.5 group relative backdrop-blur-xl ${
                      isDark
                        ? 'bg-slate-850/80 hover:bg-slate-800/90 text-white'
                        : 'bg-white/80 hover:bg-white/95 text-slate-900'
                    }`}
                  >
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isDark
                        ? 'bg-slate-800/90 text-primary'
                        : 'bg-sky-50 text-primary'
                    }`}>
                      <User size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Patient</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Personal health record, AI triage & telemedicine</p>
                    </div>
                    {role === 'patient' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                        className="relative flex items-center justify-center shrink-0 w-5.5 h-5.5 text-primary"
                      >
                        <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <path d="m9 12 2 2 4-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    ) : (
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </motion.button>

                  {/* Doctor Option */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1.5, scale: 0.995 }}
                    onClick={() => handleSelectRole('doctor')}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer flex items-center gap-3.5 group relative backdrop-blur-xl ${
                      isDark
                        ? 'bg-slate-850/80 hover:bg-slate-800/90 text-white'
                        : 'bg-white/80 hover:bg-white/95 text-slate-900'
                    }`}
                  >
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isDark
                        ? 'bg-slate-800/90 text-primary'
                        : 'bg-sky-50 text-primary'
                    }`}>
                      <Stethoscope size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Doctor / Provider</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Clinical provider, e-prescribing & consults</p>
                    </div>
                    {role === 'doctor' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                        className="relative flex items-center justify-center shrink-0 w-5.5 h-5.5 text-primary"
                      >
                        <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <path d="m9 12 2 2 4-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    ) : (
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </motion.button>

                  {/* Pharmacy Option */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1.5, scale: 0.995 }}
                    onClick={() => handleSelectRole('pharmacy')}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer flex items-center gap-3.5 group relative backdrop-blur-xl ${
                      isDark
                        ? 'bg-slate-850/80 hover:bg-slate-800/90 text-white'
                        : 'bg-white/80 hover:bg-white/95 text-slate-900'
                    }`}
                  >
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isDark
                        ? 'bg-slate-800/90 text-primary'
                        : 'bg-sky-50 text-primary'
                    }`}>
                      <Building2 size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pharmacy</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Prescription fulfillment & courier dispatch</p>
                    </div>
                    {role === 'pharmacy' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                        className="relative flex items-center justify-center shrink-0 w-5.5 h-5.5 text-primary"
                      >
                        <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <path d="m9 12 2 2 4-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    ) : (
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 2 (FULL NAME) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 2 && (
              <motion.div
                key="step-2-name"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {role === 'pharmacy' ? "Pharmacy / Facility Name" : "Full legal name"}
                    </label>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>Enter</span>
                      <CornerDownLeft size={10} />
                    </span>
                  </div>
                  <div className="relative group flex items-center">
                    <input
                      type="text"
                      autoFocus
                      value={role === 'doctor' ? doctorData.name : role === 'pharmacy' ? pharmacyData.pharmacyName : patientData.name}
                      onChange={e => {
                        if (role === 'doctor') setDoctorData({ ...doctorData, name: e.target.value });
                        else if (role === 'pharmacy') setPharmacyData({ ...pharmacyData, pharmacyName: e.target.value });
                        else setPatientData({ ...patientData, name: e.target.value });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = role === 'doctor' ? doctorData.name : role === 'pharmacy' ? pharmacyData.pharmacyName : patientData.name;
                          if (val.trim()) goToStep(3);
                        }
                      }}
                      placeholder={role === 'doctor' ? "Dr. Sarah Jenkins, MD" : role === 'pharmacy' ? "Apex MediCare Hub" : "Alex Rivera"}
                      className={`w-full pl-4.5 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                          : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                      }`}
                    />
                    <div className="absolute right-3.5 flex items-center pointer-events-none">
                      <AnimatePresence>
                        {isCurrentNameValid && <ZigzagCheckBadge />}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(1)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={!(role === 'doctor' ? doctorData.name : role === 'pharmacy' ? pharmacyData.pharmacyName : patientData.name).trim()}
                    onClick={() => goToStep(3)}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 3 (EMAIL ADDRESS) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 3 && (
              <motion.div
                key="step-3-email"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email address</label>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>Enter</span>
                      <CornerDownLeft size={10} />
                    </span>
                  </div>
                  <div className="relative group flex items-center">
                    <Mail size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      autoFocus
                      value={role === 'doctor' ? doctorData.email : role === 'pharmacy' ? pharmacyData.email : patientData.email}
                      onChange={e => {
                        if (role === 'doctor') setDoctorData({ ...doctorData, email: e.target.value });
                        else if (role === 'pharmacy') setPharmacyData({ ...pharmacyData, email: e.target.value });
                        else setPatientData({ ...patientData, email: e.target.value });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = role === 'doctor' ? doctorData.email : role === 'pharmacy' ? pharmacyData.email : patientData.email;
                          if (val.trim()) goToStep(4);
                        }
                      }}
                      placeholder="alex@example.com"
                      className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                          : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                      }`}
                    />
                    <div className="absolute right-3.5 flex items-center pointer-events-none">
                      <AnimatePresence>
                        {isCurrentEmailValid && <ZigzagCheckBadge />}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(2)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={!(role === 'doctor' ? doctorData.email : role === 'pharmacy' ? pharmacyData.email : patientData.email).trim()}
                    onClick={() => goToStep(4)}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 4 (PHONE NUMBER) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 4 && (
              <motion.div
                key="step-4-phone"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Mobile phone (2FA)</label>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>Enter</span>
                      <CornerDownLeft size={10} />
                    </span>
                  </div>
                  <div className="relative group flex items-center">
                    <Phone size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="tel"
                      autoFocus
                      value={role === 'doctor' ? doctorData.phone : role === 'pharmacy' ? pharmacyData.phone : patientData.phone}
                      onChange={e => {
                        if (role === 'doctor') setDoctorData({ ...doctorData, phone: e.target.value });
                        else if (role === 'pharmacy') setPharmacyData({ ...pharmacyData, phone: e.target.value });
                        else setPatientData({ ...patientData, phone: e.target.value });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') goToStep(5);
                      }}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                          : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                      }`}
                    />
                    <div className="absolute right-3.5 flex items-center pointer-events-none">
                      <AnimatePresence>
                        {isCurrentPhoneValid && <ZigzagCheckBadge />}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(3)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => goToStep(5)}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 5 (ROLE SPECIFIC) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 5 && (
              <motion.div
                key={`step-5-${role}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Patient: Age & Blood Type */}
                {role === 'patient' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Age</label>
                      <select
                        value={patientData.age}
                        onChange={e => setPatientData({ ...patientData, age: Number(e.target.value) })}
                        className={`w-full px-3.5 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all ${
                          isDark ? 'bg-slate-900/95 text-white shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]' : 'bg-slate-100/90 text-slate-900 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11)]'
                        }`}
                      >
                        {ageOptions.map(a => (
                          <option key={a} value={a}>
                            {a} {a === 1 ? 'yr' : 'yrs'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Blood type</label>
                      <select
                        value={patientData.bloodType}
                        onChange={e => setPatientData({ ...patientData, bloodType: e.target.value })}
                        className={`w-full px-3.5 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all ${
                          isDark ? 'bg-slate-900/95 text-white shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]' : 'bg-slate-100/90 text-slate-900 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11)]'
                        }`}
                      >
                        {bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Doctor: Medical License / NPI */}
                {role === 'doctor' && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Medical License / NPI Number</label>
                    <div className="relative group flex items-center">
                      <BadgeCheck size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        autoFocus
                        value={doctorData.licenseNumber}
                        onChange={e => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                        placeholder="MED-NY-89104"
                        className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                            : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                        }`}
                      />
                      <div className="absolute right-3.5 flex items-center pointer-events-none">
                        <AnimatePresence>
                          {isDoctorLicenseValid && <ZigzagCheckBadge />}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pharmacy: License / DEA # */}
                {role === 'pharmacy' && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Pharmacy License / DEA Reg #</label>
                    <div className="relative group flex items-center">
                      <input
                        type="text"
                        autoFocus
                        value={pharmacyData.licenseNumber}
                        onChange={e => setPharmacyData({ ...pharmacyData, licenseNumber: e.target.value })}
                        placeholder="RX-DE-99401"
                        className={`w-full pl-4.5 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                            : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                        }`}
                      />
                      <div className="absolute right-3.5 flex items-center pointer-events-none">
                        <AnimatePresence>
                          {isPharmacyLicenseValid && <ZigzagCheckBadge />}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(4)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => goToStep(6)}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 6 (ROLE SPECIFIC) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 6 && (
              <motion.div
                key={`step-6-${role}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Patient: Allergies */}
                {role === 'patient' && (
                  <div className="space-y-2">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Known allergies</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={allergyInput}
                        onChange={e => setAllergyInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(); } }}
                        placeholder="e.g. Penicillin, Latex..."
                        className={`flex-1 px-4.5 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-slate-900/90 via-slate-850/90 to-slate-800/80 text-white placeholder-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.05)] focus:ring-2 focus:ring-primary/40'
                            : 'bg-gradient-to-b from-slate-100/90 via-slate-50/90 to-white text-slate-900 placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),inset_0_-1px_2px_rgba(255,255,255,0.9)] focus:ring-2 focus:ring-primary/30'
                        }`}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddAllergy}
                        className={`px-4 py-3 rounded-2xl border-none font-semibold text-xs cursor-pointer flex items-center gap-1 transition-all shadow-xs ${
                          isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </motion.button>
                    </div>

                    {patientData.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {patientData.allergies.map(item => (
                          <motion.span
                            key={item}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              isDark ? 'bg-slate-850 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-800 border border-slate-200/80'
                            }`}
                          >
                            <span>{item}</span>
                            <button type="button" onClick={() => handleRemoveAllergy(item)} className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors">
                              <X size={11} />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Doctor: Specialty & Affiliation */}
                {role === 'doctor' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Primary specialty</label>
                      <select
                        value={doctorData.specialty}
                        onChange={e => setDoctorData({ ...doctorData, specialty: e.target.value })}
                        className={`w-full px-3.5 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all ${
                          isDark ? 'bg-slate-850 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]' : 'bg-slate-100/90 text-slate-900 shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)]'
                        }`}
                      >
                        {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Hospital / Clinic affiliation</label>
                      <div className="relative group flex items-center">
                        <input
                          type="text"
                          value={doctorData.hospitalAffiliation}
                          onChange={e => setDoctorData({ ...doctorData, hospitalAffiliation: e.target.value })}
                          placeholder="Mount Sinai Health Network"
                          className={`w-full pl-4.5 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                              : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                          }`}
                        />
                        <div className="absolute right-3.5 flex items-center pointer-events-none">
                          <AnimatePresence>
                            {isDoctorHospitalValid && <ZigzagCheckBadge />}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pharmacy: Address & Fulfillment */}
                {role === 'pharmacy' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dispensary physical address</label>
                      <div className="relative group flex items-center">
                        <MapPin size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={pharmacyData.address}
                          onChange={e => setPharmacyData({ ...pharmacyData, address: e.target.value })}
                          placeholder="742 Evergreen Blvd, New York, NY"
                          className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                              : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                          }`}
                        />
                        <div className="absolute right-3.5 flex items-center pointer-events-none">
                          <AnimatePresence>
                            {isPharmacyAddressValid && <ZigzagCheckBadge />}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fulfillment modes</label>
                      <select
                        value={pharmacyData.deliveryType}
                        onChange={e => setPharmacyData({ ...pharmacyData, deliveryType: e.target.value })}
                        className={`w-full px-3.5 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all ${
                          isDark ? 'bg-slate-900/95 text-white shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]' : 'bg-slate-100/90 text-slate-900 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11)]'
                        }`}
                      >
                        <option value="Express Courier & In-Store Pickup">Express Courier & In-Store Pickup</option>
                        <option value="Express 30-Min Courier Handover Only">Express 30-Min Courier Handover Only</option>
                        <option value="In-Store Pickup Only">In-Store Pickup Only</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(5)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>

                  {role === 'patient' ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => goToStep(7)}
                      className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Security</span>
                      <ArrowRight size={13} />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleFinishOnboarding}
                      className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Complete & Launch</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* ONBOARDING: STEP 7 (PATIENT FINAL ENCLAVE & EMERGENCY) */}
            {/* ======================================================== */}
            {mode === 'onboarding' && step === 7 && role === 'patient' && (
              <motion.div
                key="step-7-final"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Emergency contact phone</label>
                  <div className="relative group flex items-center">
                    <Phone size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="tel"
                      autoFocus
                      value={patientData.emergencyPhone}
                      onChange={e => setPatientData({ ...patientData, emergencyPhone: e.target.value })}
                      placeholder="+1 (555) 891-2311"
                      className={`w-full pl-10 pr-11 py-3 rounded-2xl border-none text-sm font-medium focus:outline-none transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-900/95 text-white placeholder-slate-500 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-primary/40'
                          : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 shadow-[inset_0_3px_5px_rgba(15,23,42,0.11),inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.85)] focus:ring-2 focus:ring-primary/30'
                      }`}
                    />
                    <div className="absolute right-3.5 flex items-center pointer-events-none">
                      <AnimatePresence>
                        {isEmergencyPhoneValid && <ZigzagCheckBadge />}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Enclave Key Pairing */}
                <div className="pt-0.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handlePairEnclave}
                    disabled={isPairing || isPaired}
                    className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isPaired
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : isDark
                        ? 'bg-slate-850/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className={isPaired ? "text-emerald-500" : "text-slate-400"} />
                      <span>{isPaired ? "Biometric Hardware Enclave Paired" : "Pair Biometric Enclave Key"}</span>
                    </div>
                    {isPairing ? <Activity size={13} className="animate-spin text-primary" /> : isPaired ? <Check size={14} className="text-emerald-500" /> : <span className="text-xs text-primary font-bold">Pair</span>}
                  </motion.button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(6)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200/90 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={15} />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleFinishOnboarding}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Launch Patient Portal</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

    </div>
  );
};
