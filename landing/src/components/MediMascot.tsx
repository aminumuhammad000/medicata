import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, Music } from 'lucide-react';

export type MediEmotion =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'shy'
  | 'protect'
  | 'celebrate'
  | 'wink'
  | 'blessed'
  | 'bonked'
  | 'blush'
  | 'pout'
  | 'laugh'
  | 'shocked'
  | 'wing_happy'
  | 'belly_poke';

interface MediMascotProps {
  emotion?: MediEmotion;
  isPasswordFocused?: boolean;
  isTransitioning?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  onMascotClick?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'sparkle' | 'heart' | 'star' | 'music' | 'drop' | 'knock';
  color?: string;
}

export const MediMascot: React.FC<MediMascotProps> = ({
  emotion: propEmotion = 'idle',
  isPasswordFocused = false,
  isTransitioning = false,
  message: propMessage,
  size = 'md',
  onMascotClick
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [activeZoneReaction, setActiveZoneReaction] = useState<MediEmotion | null>(null);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isKnockedShake, setIsKnockedShake] = useState(false);
  const [isLaughWiggle, setIsLaughWiggle] = useState(false);
  const [isBlessedFloat, setIsBlessedFloat] = useState(false);
  const [isSadPoutWobble, setIsSadPoutWobble] = useState(false);

  // Mouse gaze tracking state & ref
  const mascotRef = useRef<HTMLDivElement>(null);
  const latestMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [eyeGaze, setEyeGaze] = useState({ x: 0, y: 0 });

  // Press timer for long-press vs quick tap detection
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef(false);
  const pressStartTime = useRef<number>(0);

  const activeMessage = customQuote || propMessage || '';
  const [displayedText, setDisplayedText] = useState(activeMessage);
  const [isTyping, setIsTyping] = useState(false);

  // Fast typewriter writing animation
  useEffect(() => {
    if (!activeMessage) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    let index = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      index += 1;
      setDisplayedText(activeMessage.slice(0, index));

      if (index >= activeMessage.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [activeMessage]);

  // Periodic natural blinking
  useEffect(() => {
    if (isPasswordFocused || isTransitioning || activeZoneReaction) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPasswordFocused, isTransitioning, activeZoneReaction]);

  // Active Emotion computation
  const activeEmotion: MediEmotion = isTransitioning
    ? 'celebrate'
    : activeZoneReaction
    ? activeZoneReaction
    : isPasswordFocused
    ? 'shy'
    : propEmotion;

  const isEyesClosed =
    (isPasswordFocused || activeEmotion === 'shy' || isBlinking || activeEmotion === 'blessed') &&
    !isTransitioning &&
    activeEmotion !== 'bonked' &&
    activeEmotion !== 'shocked';

  const isHappy =
    activeEmotion === 'celebrate' ||
    activeEmotion === 'blessed' ||
    activeEmotion === 'blush' ||
    activeEmotion === 'laugh' ||
    activeEmotion === 'wing_happy' ||
    activeEmotion === 'belly_poke' ||
    isTransitioning;

  const isBonked = activeEmotion === 'bonked';
  const isPout = activeEmotion === 'pout';
  const isShocked = activeEmotion === 'shocked';
  const isLaugh = activeEmotion === 'laugh';
  const isBlessed = activeEmotion === 'blessed';

  // Eyes are open in idle, happy, and protect states — always track mouse
  // Only closed when: blinking, password-focused (shy), blessed, transitioning (celebrate), bonked, shocked, pout
  const isEyesOpen =
    !isEyesClosed &&
    !isBonked &&
    !isShocked &&
    !isPout &&
    !isBlinking &&
    !isTransitioning &&
    !isPasswordFocused &&
    activeEmotion !== 'shy' &&
    activeEmotion !== 'celebrate';

  // Helper to calculate eye gaze vector toward cursor
  const updateGaze = useCallback((clientX: number, clientY: number) => {
    if (!mascotRef.current) return;

    const rect = mascotRef.current.getBoundingClientRect();
    const mascotCenterX = rect.left + rect.width / 2;
    const mascotCenterY = rect.top + rect.height / 2;

    const dx = clientX - mascotCenterX;
    const dy = clientY - mascotCenterY;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      setEyeGaze({ x: 0, y: 0 });
      return;
    }

    // Maximum pupil offset inside eye socket
    const maxOffset = 3.5;
    const factor = Math.min(dist / 320, 1);
    const offsetX = (dx / dist) * maxOffset * factor;
    const offsetY = (dy / dist) * maxOffset * factor;

    setEyeGaze({ x: offsetX, y: offsetY });
  }, []);

  // Keep a stable ref to isEyesOpen so the mouse listener doesn't re-register on every blink
  const isEyesOpenRef = useRef(isEyesOpen);
  useEffect(() => {
    isEyesOpenRef.current = isEyesOpen;
  }, [isEyesOpen]);

  // Register the mousemove listener once on mount — uses the ref so it always has the latest value
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      latestMousePosRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (isEyesOpenRef.current) {
        updateGaze(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [updateGaze]); // stable — only re-registers if updateGaze changes (it's memoized)

  // When eyes open, immediately snap gaze to current mouse position; when closed, reset
  useEffect(() => {
    if (isEyesOpen) {
      if (latestMousePosRef.current) {
        updateGaze(latestMousePosRef.current.clientX, latestMousePosRef.current.clientY);
      }
    } else {
      setEyeGaze({ x: 0, y: 0 });
    }
  }, [isEyesOpen, updateGaze]);

  // Transition particles
  useEffect(() => {
    if (isTransitioning) {
      const interval = setInterval(() => {
        setParticles(prev => [
          ...prev.slice(-6),
          {
            id: Date.now() + Math.random(),
            x: (Math.random() - 0.5) * 60,
            y: -15 - Math.random() * 35,
            type: 'sparkle',
            color: '#38BDF8'
          }
        ]);
      }, 240);
      return () => clearInterval(interval);
    }
  }, [isTransitioning]);

  // Clear active interaction state after duration
  const triggerReaction = (
    reaction: MediEmotion,
    quote: string,
    particleType: Particle['type'],
    particleColor: string,
    durationMs: number = 3600
  ) => {
    setActiveZoneReaction(reaction);
    setCustomQuote(quote);

    // Spawn themed particles
    const newParticles: Particle[] = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 70,
      y: -20 - Math.random() * 35,
      type: particleType,
      color: particleColor
    }));
    setParticles(newParticles);

    if (reaction === 'bonked') {
      setIsKnockedShake(true);
      setTimeout(() => setIsKnockedShake(false), 800);
    } else if (reaction === 'laugh') {
      setIsLaughWiggle(true);
      setTimeout(() => setIsLaughWiggle(false), 1200);
    } else if (reaction === 'blessed') {
      setIsBlessedFloat(true);
      setTimeout(() => setIsBlessedFloat(false), 1500);
    } else if (reaction === 'pout' || reaction === 'shocked') {
      setIsSadPoutWobble(true);
      setTimeout(() => setIsSadPoutWobble(false), 1000);
    }

    if (onMascotClick) onMascotClick();

    setTimeout(() => {
      setActiveZoneReaction(null);
      setCustomQuote(null);
      setParticles([]);
    }, durationMs);
  };

  // ── Touch / Pointer Zone Handlers ──────────────────────────────────────────

  // Zone: HEAD
  const handleHeadStart = () => {
    isLongPressTriggered.current = false;
    pressStartTime.current = Date.now();
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      // LONG PRESS on HEAD: Knocking / Bonk reaction (Sad/Dizzy/Ouch)
      isLongPressTriggered.current = true;
      const bonkQuotes = [
        "Ouch! Don't knock on my head so hard! 😵💫",
        "Bonk! My cranial sensors are spinning! 🤕⚡",
        "Knock-knock! Who's there? A dizzy AI! (｡>﹏<｡)💫",
        "Hey, my zero-knowledge brain is delicate! (•ˋ _ ˊ•)💢"
      ];
      const q = bonkQuotes[Math.floor(Math.random() * bonkQuotes.length)];
      triggerReaction('bonked', q, 'knock', '#F59E0B', 3800);
    }, 360);
  };

  const handleHeadEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (!isLongPressTriggered.current && Date.now() - pressStartTime.current < 360) {
      // QUICK TAP on HEAD: Blessing reaction (Happy/Angelic/Serene)
      const blessQuotes = [
        "Aww, thank you for the blessing! (✿◠‿◠) ✨",
        "Medi feels blessed and energized! 🌟💖",
        "Headpats are my favorite! Warm clinical love! (˘◡˘)✨",
        "May good health and peace protect you too! 🕊️✨"
      ];
      const q = blessQuotes[Math.floor(Math.random() * blessQuotes.length)];
      triggerReaction('blessed', q, 'star', '#FBBF24', 3800);
    }
  };

  // Zone: CHEEKS
  const handleCheekStart = (_side: 'left' | 'right') => {
    isLongPressTriggered.current = false;
    pressStartTime.current = Date.now();
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      // LONG PRESS on CHEEKS: Pinch / Squish (Sad/Pouty reaction)
      isLongPressTriggered.current = true;
      const poutQuotes = [
        "Aww, you're squishing my cheeks too tight! (｡•́︿•̀｡)💦",
        "No pinching my rosy cheeks, it makes me pout! 🥺",
        "Please don't squish me... Medi is sensitive! (◞‸◟)💔",
        "Puffed cheek protest mode activated! (๑•́o•̀๑)"
      ];
      const q = poutQuotes[Math.floor(Math.random() * poutQuotes.length)];
      triggerReaction('pout', q, 'drop', '#FB7185', 3800);
    }, 360);
  };

  const handleCheekEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (!isLongPressTriggered.current && Date.now() - pressStartTime.current < 360) {
      // QUICK TAP on CHEEKS: Tickle Poke / Blush (Happy/Cute reaction)
      const blushQuotes = [
        "Eep! My cheeks are getting warm! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) 💖",
        "Hehe, ticklish cheek poke! 🥰",
        "Aww, you're making Medi blush! (｡♥‿♥｡)",
        "Tee-hee! That tickles my rosy cheeks! 😊✨"
      ];
      const q = blushQuotes[Math.floor(Math.random() * blushQuotes.length)];
      triggerReaction('blush', q, 'heart', '#F43F5E', 3600);
    }
  };

  // Zone: NECK / CHIN
  const handleNeckStart = () => {
    isLongPressTriggered.current = false;
    pressStartTime.current = Date.now();
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      // LONG PRESS on NECK: Too tight hold (Sad/Shocked reaction)
      isLongPressTriggered.current = true;
      const shockQuotes = [
        "Aaa! That's too tight on my neck! (╥﹏╥)💦",
        "Eep! Gently please, that tickles into a choke! 🥺",
        "Medi needs space to breathe! (｡ŏ﹏ŏ)",
        "Telemetry alert: neck pressure too high! (⊙_⊙;)"
      ];
      const q = shockQuotes[Math.floor(Math.random() * shockQuotes.length)];
      triggerReaction('shocked', q, 'drop', '#60A5FA', 3800);
    }, 360);
  };

  const handleNeckEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (!isLongPressTriggered.current && Date.now() - pressStartTime.current < 360) {
      // QUICK TAP on NECK: Tickle Spot Giggles (Super Happy/Laugh reaction)
      const laughQuotes = [
        "Hahaha! That tickles my neck so much! 😆✨",
        "Hehehe, stop that's my tickle spot! 🤭💫",
        "Giggles! My haptic sensors are overjoyed! (≧▽≦)🎉",
        "Kyahaha! That tickles! (≧◡≦)✨"
      ];
      const q = laughQuotes[Math.floor(Math.random() * laughQuotes.length)];
      triggerReaction('laugh', q, 'music', '#8B5CF6', 3600);
    }
  };

  // Zone: WINGS / HANDS
  const handleWingClick = () => {
    const wingQuotes = [
      "High five! Wing team ready! 🪽✨",
      "Flap flap! Ready to soar through your health records! 🚀",
      "Aww you're holding my little wing! Best friends! 🤝💖"
    ];
    const q = wingQuotes[Math.floor(Math.random() * wingQuotes.length)];
    triggerReaction('wing_happy', q, 'sparkle', '#38BDF8', 3200);
  };

  // Zone: BELLY
  const handleBellyClick = () => {
    const bellyQuotes = [
      "Tee-hee! Tummy poke! 🫧😄",
      "Rubbing my belly brings good health telemetry! 🍀✨",
      "I'm Medi! Always protecting your healthcare vault 🛡️"
    ];
    const q = bellyQuotes[Math.floor(Math.random() * bellyQuotes.length)];
    triggerReaction('belly_poke', q, 'sparkle', '#10B981', 3200);
  };

  const cancelPressTimer = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.15 : 1;

  return (
    <div className="flex flex-col items-center select-none relative my-1" ref={mascotRef}>
      
      {/* Modern iOS/Glassmorphic Chat Bubble with Typewriter Effect */}
      <AnimatePresence mode="wait">
        {activeMessage && (
          <motion.div
            key={activeMessage}
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="mb-4 relative max-w-[290px] z-30 group cursor-pointer"
            onClick={handleBellyClick}
          >
            {/* Bubble Glass Surface */}
            <div className="px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl rounded-bl-sm border border-slate-200/90 dark:border-slate-700/80 shadow-md text-center transition-all duration-200 min-h-[38px] flex items-center justify-center">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed tracking-normal">
                {displayedText}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-1.5 h-3 ml-0.5 bg-primary rounded-xs align-middle"
                  />
                )}
              </p>
            </div>

            {/* Bubble Pointer / Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-r border-b border-slate-200/90 dark:border-slate-700/80 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles (Sparkles, Hearts, Stars, Music Notes, Tears, Knock stars) */}
      <div className="relative pointer-events-none">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.35, x: p.x, y: p.y - 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 z-40"
              style={{ color: p.color || '#F59E0B' }}
            >
              {p.type === 'heart' && <Heart size={14} className="fill-current" />}
              {p.type === 'star' && <Star size={14} className="fill-current" />}
              {p.type === 'music' && <Music size={14} />}
              {p.type === 'knock' && <Star size={15} className="fill-amber-400 text-amber-500 animate-spin" />}
              {p.type === 'drop' && <span className="text-xs font-bold text-sky-400">💧</span>}
              {p.type === 'sparkle' && <Sparkles size={14} />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3D Mascot Container with Live Shake / Wiggle / Float animations */}
      <motion.div
        whileHover={{ scale: scale * 1.04 }}
        animate={
          isKnockedShake
            ? {
                x: [-6, 6, -5, 5, -3, 3, 0],
                y: [0, 4, -3, 3, 0],
                rotate: [-8, 8, -6, 6, 0]
              }
            : isLaughWiggle
            ? {
                y: [0, -8, 0, -8, 0, -4, 0],
                rotate: [-4, 4, -4, 4, 0]
              }
            : isBlessedFloat
            ? {
                y: [0, -12, -16, -10, 0],
                scale: [scale, scale * 1.08, scale * 1.05, scale]
              }
            : isSadPoutWobble
            ? {
                y: [0, 3, 1, 4, 0],
                rotate: [-2, 2, -1, 1, 0]
              }
            : isTransitioning
            ? {
                scale: [scale, scale * 1.16, scale * 1.2, scale * 1.14, scale * 1.18, scale * 1.05, scale],
                y: [0, -36, -50, -28, -40, -12, 0],
                x: [0, 26, -22, 18, -10, 4, 0],
                rotate: [0, 16, -14, 12, -8, 2, 0]
              }
            : {
                y: (isPasswordFocused || activeEmotion === 'shy') ? [0, -2, 0] : [0, -6, 0],
                rotate: (isPasswordFocused || activeEmotion === 'shy') ? [0, -1, 1, 0] : [0, 1.2, -1.2, 0]
              }
        }
        transition={
          isKnockedShake
            ? { duration: 0.6, ease: 'easeInOut' }
            : isLaughWiggle
            ? { duration: 0.8, ease: 'easeInOut' }
            : isBlessedFloat
            ? { duration: 1.4, ease: 'easeInOut' }
            : isSadPoutWobble
            ? { duration: 0.8, ease: 'easeInOut' }
            : isTransitioning
            ? { duration: 2.2, ease: [0.34, 1.1, 0.64, 1] }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transform: `scale(${scale})` }}
        className="relative w-28 h-28 flex items-center justify-center select-none group"
      >
        {/* Soft Ambient Ground Shadow */}
        <motion.div
          animate={{
            scale: isTransitioning ? [1, 0.6, 0.5, 0.7, 0.6, 0.9, 1] : 1,
            opacity: isTransitioning ? [0.2, 0.05, 0.02, 0.08, 0.04, 0.15, 0.2] : 0.25
          }}
          transition={isTransitioning ? { duration: 2.2, ease: 'easeInOut' } : { duration: 0.3 }}
          className="absolute -bottom-2.5 w-18 h-4 bg-primary/25 rounded-full blur-md group-hover:bg-primary/40 transition-all duration-300 pointer-events-none"
        />

        {/* Angelic Glowing Halo for Blessed Emotion */}
        <AnimatePresence>
          {isBlessed && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center justify-center"
            >
              <div className="w-12 h-3.5 rounded-full border-2 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.85)] bg-amber-200/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comic Knock Stars for Bonked Emotion */}
        <AnimatePresence>
          {isBonked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2"
            >
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <Star size={12} className="text-amber-300 fill-amber-300" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cute Bird Wing Left (Covers eye during password typing) */}
        <motion.div
          animate={
            (isPasswordFocused || activeEmotion === 'shy')
              ? {
                  rotate: 68,
                  x: 32,
                  y: -14,
                  scale: 1.35,
                  scaleX: 1.15,
                  opacity: 1,
                  zIndex: 35
                }
              : isTransitioning
              ? {
                  rotate: [-35, 45, -35],
                  scaleY: [0.7, 1.25, 0.7],
                  scaleX: [1, 1.15, 1],
                  x: 0,
                  y: 0,
                  opacity: 1,
                  zIndex: 10
                }
              : activeEmotion === 'wing_happy'
              ? {
                  rotate: [-40, 20, -40, 20, 0],
                  scaleY: [1, 1.3, 1],
                  x: 0,
                  y: 0,
                  opacity: 0.95,
                  zIndex: 10
                }
              : {
                  rotate: [0, 4, 0],
                  x: 0,
                  y: 0,
                  opacity: 0.95,
                  zIndex: 10
                }
          }
          transition={
            (isPasswordFocused || activeEmotion === 'shy')
              ? { type: 'spring', stiffness: 450, damping: 24 }
              : isTransitioning
              ? { duration: 0.18, repeat: Infinity, ease: 'easeInOut' }
              : activeEmotion === 'wing_happy'
              ? { duration: 0.6 }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute -left-2.5 top-8 w-5 h-8 rounded-full bg-gradient-to-tr from-[#1E6FD9] via-[#3B82F6] to-[#93C5FD] border-2 border-white/80 origin-top-right shadow-md cursor-pointer"
          onClick={handleWingClick}
          title="Left Wing: Click for high five! 🪽"
        />

        {/* Cute Bird Wing Right (Covers eye during password typing) */}
        <motion.div
          animate={
            (isPasswordFocused || activeEmotion === 'shy')
              ? {
                  rotate: -68,
                  x: -32,
                  y: -14,
                  scale: 1.35,
                  scaleX: 1.15,
                  opacity: 1,
                  zIndex: 35
                }
              : isTransitioning
              ? {
                  rotate: [35, -45, 35],
                  scaleY: [0.7, 1.25, 0.7],
                  scaleX: [1, 1.15, 1],
                  x: 0,
                  y: 0,
                  opacity: 1,
                  zIndex: 10
                }
              : activeEmotion === 'wing_happy'
              ? {
                  rotate: [40, -20, 40, -20, 0],
                  scaleY: [1, 1.3, 1],
                  x: 0,
                  y: 0,
                  opacity: 0.95,
                  zIndex: 10
                }
              : {
                  rotate: [0, -4, 0],
                  x: 0,
                  y: 0,
                  opacity: 0.95,
                  zIndex: 10
                }
          }
          transition={
            (isPasswordFocused || activeEmotion === 'shy')
              ? { type: 'spring', stiffness: 450, damping: 24 }
              : isTransitioning
              ? { duration: 0.18, repeat: Infinity, ease: 'easeInOut' }
              : activeEmotion === 'wing_happy'
              ? { duration: 0.6 }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute -right-2.5 top-8 w-5 h-8 rounded-full bg-gradient-to-tl from-[#1E6FD9] via-[#3B82F6] to-[#93C5FD] border-2 border-white/80 origin-top-left shadow-md cursor-pointer"
          onClick={handleWingClick}
          title="Right Wing: Click for high five! 🪽"
        />

        {/* 3D Spherical Main Mascot Body */}
        <div className="relative w-22 h-22 rounded-full shadow-[inset_0_-8px_16px_rgba(15,23,42,0.38),inset_0_4px_14px_rgba(255,255,255,0.85)] overflow-hidden bg-gradient-to-br from-[#70B4FF] via-[#2F80ED] to-[#1351B4] flex items-center justify-center z-20 border border-white/40">
          
          {/* 3D Glass / Bubble Gloss Highlights */}
          <div className="absolute top-1 left-2.5 w-10 h-5 bg-white/60 rounded-full blur-[0.8px] rotate-[-25deg] pointer-events-none" />
          <div className="absolute top-2 left-4 w-4 h-2.5 bg-white/90 rounded-full pointer-events-none" />
          <div className="absolute bottom-2.5 right-3 w-7 h-3.5 bg-cyan-300/40 rounded-full blur-[2px] pointer-events-none" />

          {/* Medical Cross Badge */}
          <div className="absolute top-2.5 right-3.5 w-4 h-4 rounded-full bg-white/35 backdrop-blur-xs flex items-center justify-center pointer-events-none border border-white/50">
            <div className="w-2.5 h-0.5 bg-white rounded-full absolute" />
            <div className="h-2.5 w-0.5 bg-white rounded-full absolute" />
          </div>

          {/* Glowing Blush Cheeks (Vibrant & Animated in both Light and Dark mode) */}
          <motion.div
            animate={{
              scale: (activeEmotion === 'blush' || activeEmotion === 'shy' || isPasswordFocused) ? [1, 1.4, 1.25] : 1,
              opacity: (activeEmotion === 'blush' || activeEmotion === 'shy' || isPasswordFocused) ? 1 : isPout ? 0.4 : 0.75
            }}
            transition={{ duration: 0.4 }}
            className="absolute left-2.5 top-11.5 w-4.5 h-3 bg-rose-400 rounded-full blur-[0.6px] pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.95)]"
          />
          <motion.div
            animate={{
              scale: (activeEmotion === 'blush' || activeEmotion === 'shy' || isPasswordFocused) ? [1, 1.4, 1.25] : 1,
              opacity: (activeEmotion === 'blush' || activeEmotion === 'shy' || isPasswordFocused) ? 1 : isPout ? 0.4 : 0.75
            }}
            transition={{ duration: 0.4 }}
            className="absolute right-2.5 top-11.5 w-4.5 h-3 bg-rose-400 rounded-full blur-[0.6px] pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.95)]"
          />

          {/* Tear Drop for Pout / Shocked */}
          <AnimatePresence>
            {(isPout || isShocked) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 10 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="absolute right-3.5 top-12 w-1.5 h-2 bg-sky-300 rounded-full blur-[0.3px] pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Face Elements */}
          <div className="relative z-10 flex flex-col items-center justify-center pt-2 pointer-events-none">
            
            {/* Eyes */}
            <div className="flex items-center gap-4 mb-1">
              
              {/* Left Eye */}
              <div className="w-4 h-4 flex items-center justify-center relative">
                {isBonked ? (
                  // Bonked / Dizzy Spiral squint
                  <div className="text-xs font-black text-slate-950">✕</div>
                ) : isPout ? (
                  // Sad pouty teary eyes
                  <div className="w-3.5 h-3.5 bg-slate-950 rounded-full relative overflow-hidden border border-slate-900">
                    <div className="absolute top-1 left-0.5 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-sky-300 rounded-full" />
                  </div>
                ) : isShocked ? (
                  // Shocked wide circle eyes
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 bg-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  </div>
                ) : isEyesClosed ? (
                  // Blissful / Shy closed happy curve
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-4 h-2 border-b-[2.5px] border-slate-950 rounded-full"
                  />
                ) : isHappy ? (
                  // Cheerful smiling arc (static & peaceful)
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-4 h-2 border-t-[2.5px] border-slate-950 rounded-t-full"
                  />
                ) : (
                  // Normal cute glossy eyes tracking mouse cursor!
                  <div className="w-3.5 h-4.5 bg-slate-950 rounded-full relative overflow-hidden border border-slate-900 shadow-inner">
                    <motion.div
                      animate={{
                        x: isEyesOpen ? eyeGaze.x : 0,
                        y: isEyesOpen ? eyeGaze.y : 0
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute inset-0"
                    >
                      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
                      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/90 rounded-full" />
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Right Eye */}
              <div className="w-4 h-4 flex items-center justify-center relative">
                {isBonked ? (
                  <div className="text-xs font-black text-slate-950">✕</div>
                ) : isPout ? (
                  <div className="w-3.5 h-3.5 bg-slate-950 rounded-full relative overflow-hidden border border-slate-900">
                    <div className="absolute top-1 left-0.5 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-sky-300 rounded-full" />
                  </div>
                ) : isShocked ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 bg-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  </div>
                ) : isEyesClosed ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-4 h-2 border-b-[2.5px] border-slate-950 rounded-full"
                  />
                ) : isHappy ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-4 h-2 border-t-[2.5px] border-slate-950 rounded-t-full"
                  />
                ) : (
                  // Normal cute glossy eyes tracking mouse cursor!
                  <div className="w-3.5 h-4.5 bg-slate-950 rounded-full relative overflow-hidden border border-slate-900 shadow-inner">
                    <motion.div
                      animate={{
                        x: isEyesOpen ? eyeGaze.x : 0,
                        y: isEyesOpen ? eyeGaze.y : 0
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute inset-0"
                    >
                      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
                      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/90 rounded-full" />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Mouth */}
            <div className="w-5 h-2.5 flex items-center justify-center">
              {isBonked ? (
                // Wobbly bonked mouth
                <div className="w-3.5 h-1 border-t-[2.5px] border-slate-950 rounded-full -rotate-6" />
              ) : isPout ? (
                // Sad pouty mouth
                <div className="w-3 h-1.5 border-t-[2.5px] border-slate-950 rounded-t-full" />
              ) : isShocked ? (
                // Shocked little 'o' mouth
                <div className="w-2.5 h-3 rounded-full border-2 border-slate-950 bg-slate-900" />
              ) : isLaugh ? (
                // Big joyful open laughing mouth
                <div className="w-4.5 h-3 bg-rose-500 rounded-b-full border-2 border-slate-950 overflow-hidden relative shadow-inner">
                  <div className="w-3 h-2 bg-rose-300 rounded-full absolute -bottom-0.5 left-0.5" />
                </div>
              ) : isEyesClosed || isBlessed ? (
                // Gentle peaceful smile
                <div className="w-3 h-1.5 border-b-[2.5px] border-slate-950 rounded-full" />
              ) : isHappy ? (
                // Sweet smile
                <div className="w-3.5 h-2 bg-rose-500 rounded-b-full border-2 border-slate-950 overflow-hidden relative">
                  <div className="w-2.5 h-1 bg-rose-300 rounded-full absolute -bottom-0.5 left-0.5" />
                </div>
              ) : (
                <div className="w-3 h-1.5 border-b-[2.5px] border-slate-950 rounded-full" />
              )}
            </div>
          </div>

          {/* 3D Cute Bubble Hands (Cover eyes during shy / password entry) */}
          <motion.div
            animate={{
              y: (isPasswordFocused || activeEmotion === 'shy') ? 14 : 52,
              opacity: (isPasswordFocused || activeEmotion === 'shy') ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="absolute inset-x-0 bottom-0 flex justify-between px-3 z-30 pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1E6FD9] via-[#3B82F6] to-[#93C5FD] border-2 border-white shadow-md transform -rotate-12 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/70" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tl from-[#1E6FD9] via-[#3B82F6] to-[#93C5FD] border-2 border-white shadow-md transform rotate-12 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/70" />
            </div>
          </motion.div>

        </div>

        {/* Medical Capsule on Top of Head */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center">
          <div className="w-5 h-2.5 rounded-full border border-white/80 shadow-xs flex overflow-hidden -rotate-6 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-1/2 h-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8]" />
            <div className="w-1/2 h-full bg-gradient-to-b from-white to-slate-200" />
          </div>
        </div>

        {/* ── INTERACTIVE TOUCH HITBOX ZONES ─────────────────────────────────── */}
        
        {/* Zone 1: HEAD (Tap to bless, Long press to knock) */}
        <div
          onMouseDown={handleHeadStart}
          onMouseUp={handleHeadEnd}
          onTouchStart={handleHeadStart}
          onTouchEnd={handleHeadEnd}
          onMouseLeave={cancelPressTimer}
          className="absolute top-0 inset-x-2 h-9 z-30 rounded-t-full cursor-pointer hover:bg-white/10 active:bg-white/20 transition-colors"
          title="Head: Tap to bless ✨ | Hold to knock 🤕"
        />

        {/* Zone 2: LEFT CHEEK (Tap to blush, Long press to squish/pout) */}
        <div
          onMouseDown={() => handleCheekStart('left')}
          onMouseUp={handleCheekEnd}
          onTouchStart={() => handleCheekStart('left')}
          onTouchEnd={handleCheekEnd}
          onMouseLeave={cancelPressTimer}
          className="absolute top-9 left-1 w-8 h-8 z-30 rounded-full cursor-pointer hover:bg-rose-400/20 active:bg-rose-400/30 transition-colors"
          title="Left Cheek: Tap to tickle 🥰 | Hold to pinch 🥺"
        />

        {/* Zone 3: RIGHT CHEEK (Tap to blush, Long press to squish/pout) */}
        <div
          onMouseDown={() => handleCheekStart('right')}
          onMouseUp={handleCheekEnd}
          onTouchStart={() => handleCheekStart('right')}
          onTouchEnd={handleCheekEnd}
          onMouseLeave={cancelPressTimer}
          className="absolute top-9 right-1 w-8 h-8 z-30 rounded-full cursor-pointer hover:bg-rose-400/20 active:bg-rose-400/30 transition-colors"
          title="Right Cheek: Tap to tickle 🥰 | Hold to pinch 🥺"
        />

        {/* Zone 4: NECK / CHIN (Tap to laugh/tickle, Long press to choke/hold) */}
        <div
          onMouseDown={handleNeckStart}
          onMouseUp={handleNeckEnd}
          onTouchStart={handleNeckStart}
          onTouchEnd={handleNeckEnd}
          onMouseLeave={cancelPressTimer}
          className="absolute bottom-1.5 inset-x-5 h-7 z-30 rounded-b-full cursor-pointer hover:bg-purple-400/20 active:bg-purple-400/30 transition-colors"
          title="Neck: Tap to tickle 😆 | Hold to grip 🥺"
        />

      </motion.div>
    </div>
  );
};
