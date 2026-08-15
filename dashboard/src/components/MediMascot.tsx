import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';

export type MediEmotion = 'idle' | 'happy' | 'thinking' | 'shy' | 'protect' | 'celebrate' | 'wink';

interface MediMascotProps {
  emotion?: MediEmotion;
  isPasswordFocused?: boolean;
  isTransitioning?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  onMascotClick?: () => void;
}

const MEDI_CLICK_QUOTES = [
  "Tee-hee! That tickles! 😄",
  "I'm Medi! Always here to protect your medical vault 🛡️",
  "Zero-knowledge encryption is my superpower! 🔒",
  "Need help? You can ask me anytime during triage! ✨",
  "Looking sharp today! Let's get you set up 🚀",
  "All your vitals and prescriptions remain 100% private 🩺"
];

export const MediMascot: React.FC<MediMascotProps> = ({
  emotion: propEmotion = 'idle',
  isPasswordFocused = false,
  isTransitioning = false,
  message: propMessage,
  size = 'md',
  onMascotClick
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [clickedEffect, setClickedEffect] = useState(false);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const activeMessage = customQuote || propMessage || '';
  const [displayedText, setDisplayedText] = useState(activeMessage);
  const [isTyping, setIsTyping] = useState(false);

  // Fast typewriter writing animation like ChatGPT
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
    }, 14); // Fast, lively ChatGPT-style streaming

    return () => clearInterval(interval);
  }, [activeMessage]);

  // Periodic natural blinking (disabled during password focus or step transitions)
  useEffect(() => {
    if (isPasswordFocused || isTransitioning) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPasswordFocused, isTransitioning]);

  // Spawn flight sparkles continuously when transitioning like a bird
  useEffect(() => {
    if (isTransitioning) {
      const interval = setInterval(() => {
        setParticles(prev => [
          ...prev.slice(-6),
          {
            id: Date.now() + Math.random(),
            x: (Math.random() - 0.5) * 60,
            y: -15 - Math.random() * 35
          }
        ]);
      }, 240);
      return () => clearInterval(interval);
    }
  }, [isTransitioning]);

  const handleCharacterClick = () => {
    setClickedEffect(true);
    const nextQuote = MEDI_CLICK_QUOTES[clickCount % MEDI_CLICK_QUOTES.length];
    setCustomQuote(nextQuote);
    setClickCount(prev => prev + 1);

    // Spawn floating sparkles
    const newParticles = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -20 - Math.random() * 30
    }));
    setParticles(newParticles);

    if (onMascotClick) onMascotClick();

    setTimeout(() => setClickedEffect(false), 700);
    setTimeout(() => {
      setCustomQuote(null);
      setParticles([]);
    }, 3800);
  };

  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.15 : 1;

  // Active emotion
  const emotion: MediEmotion = isTransitioning
    ? 'celebrate'
    : clickedEffect
    ? 'celebrate'
    : isPasswordFocused
    ? 'shy'
    : propEmotion;

  const isEyesClosed = (isPasswordFocused || emotion === 'shy' || isBlinking) && !isTransitioning;
  const isHappy = emotion === 'happy' || emotion === 'celebrate' || clickedEffect || isTransitioning;
  const isWink = emotion === 'wink';

  return (
    <div className="flex flex-col items-center select-none relative my-1">
      
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
            onClick={handleCharacterClick}
          >
            {/* Bubble Glass Surface */}
            <div className="px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl rounded-bl-sm border border-slate-200/90 dark:border-slate-700/80 shadow-none text-center transition-all duration-200 min-h-[38px] flex items-center justify-center">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-relaxed tracking-normal">
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
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 dark:bg-slate-900/90 border-r border-b border-slate-200/90 dark:border-slate-700/80 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles on Click / Transition Flight */}
      <div className="relative pointer-events-none">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.25, x: p.x, y: p.y - 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 text-amber-400"
            >
              {p.id % 2 === 0 ? <Sparkles size={13} /> : <Heart size={13} className="text-rose-400 fill-rose-400" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3D Bubble Body Container with Live Bird Flight Animation */}
      <motion.div
        onClick={handleCharacterClick}
        whileHover={{ scale: scale * 1.05 }}
        whileTap={{ scale: scale * 0.92 }}
        animate={
          isTransitioning
            ? {
                scale: [scale, scale * 1.16, scale * 1.2, scale * 1.14, scale * 1.18, scale * 1.05, scale],
                y: [0, -36, -50, -28, -40, -12, 0],
                x: [0, 26, -22, 18, -10, 4, 0],
                rotate: [0, 16, -14, 12, -8, 2, 0]
              }
            : clickedEffect
            ? {
                scale: [scale, scale * 1.22, scale * 0.94, scale * 1.08, scale],
                rotate: [0, -10, 10, -5, 0],
                y: [0, -12, 2, -4, 0]
              }
            : {
                y: isPasswordFocused ? [0, -2, 0] : [0, -6, 0],
                rotate: isPasswordFocused ? [0, -1, 1, 0] : [0, 1.2, -1.2, 0]
              }
        }
        transition={
          isTransitioning
            ? { duration: 2.2, ease: [0.34, 1.1, 0.64, 1] }
            : clickedEffect
            ? { duration: 0.6, ease: 'easeOut' }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transform: `scale(${scale})` }}
        className="relative w-24 h-24 flex items-center justify-center cursor-pointer group"
        title="Click Medi to interact!"
      >
        {/* Soft Ambient Shadow Underneath (fades during flight) */}
        <motion.div
          animate={{
            scale: isTransitioning ? [1, 0.6, 0.5, 0.7, 0.6, 0.9, 1] : 1,
            opacity: isTransitioning ? [0.2, 0.05, 0.02, 0.08, 0.04, 0.15, 0.2] : 0.2
          }}
          transition={isTransitioning ? { duration: 2.2, ease: 'easeInOut' } : { duration: 0.3 }}
          className="absolute -bottom-2 w-16 h-3.5 bg-primary/20 rounded-full blur-md group-hover:bg-primary/35 transition-all duration-300"
        />

        {/* Cute Bird Wing Left (Flaps live during flight!) */}
        <motion.div
          animate={
            isTransitioning
              ? {
                  rotate: [-35, 45, -35],
                  scaleY: [0.7, 1.25, 0.7],
                  scaleX: [1, 1.15, 1],
                  opacity: 1
                }
              : {
                  rotate: [0, 3, 0],
                  opacity: isPasswordFocused ? 0 : 0.85
                }
          }
          transition={
            isTransitioning
              ? { duration: 0.18, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute -left-2 top-7 w-4 h-6 rounded-full bg-gradient-to-tr from-[#1E6FD9] to-[#7EC0FF] border border-white/50 origin-top-right pointer-events-none z-0 shadow-2xs"
        />

        {/* Cute Bird Wing Right (Flaps live during flight!) */}
        <motion.div
          animate={
            isTransitioning
              ? {
                  rotate: [35, -45, 35],
                  scaleY: [0.7, 1.25, 0.7],
                  scaleX: [1, 1.15, 1],
                  opacity: 1
                }
              : {
                  rotate: [0, -3, 0],
                  opacity: isPasswordFocused ? 0 : 0.85
                }
          }
          transition={
            isTransitioning
              ? { duration: 0.18, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute -right-2 top-7 w-4 h-6 rounded-full bg-gradient-to-tl from-[#1E6FD9] to-[#7EC0FF] border border-white/50 origin-top-left pointer-events-none z-0 shadow-2xs"
        />

        {/* 3D Spherical Main Bubble Body */}
        <div className="relative w-20 h-20 rounded-full shadow-[inset_0_-8px_16px_rgba(15,23,42,0.35),inset_0_4px_12px_rgba(255,255,255,0.8)] overflow-hidden bg-gradient-to-br from-[#70B4FF] via-[#2F80ED] to-[#1351B4] flex items-center justify-center transition-all z-10">
          
          {/* 3D Glass / Bubble Gloss Highlight Layer */}
          <div className="absolute top-1 left-2 w-9 h-5 bg-white/55 rounded-full blur-[0.8px] rotate-[-25deg] pointer-events-none" />
          <div className="absolute top-2 left-4 w-3.5 h-2 bg-white/85 rounded-full pointer-events-none" />
          <div className="absolute bottom-2 right-2.5 w-6 h-3 bg-cyan-300/35 rounded-full blur-[2px] pointer-events-none" />

          {/* Sleek Medical Cross Badge (Clean, subtle white satin) */}
          <div className="absolute top-2.5 right-3.5 w-3.5 h-3.5 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-white rounded-full absolute" />
            <div className="h-2 w-0.5 bg-white rounded-full absolute" />
          </div>

          {/* Glowing Blush Cheeks */}
          <div className="absolute left-2.5 top-11 w-3.5 h-2 bg-rose-400/60 rounded-full blur-[1px]" />
          <div className="absolute right-2.5 top-11 w-3.5 h-2 bg-rose-400/60 rounded-full blur-[1px]" />

          {/* Face Elements */}
          <div className="relative z-10 flex flex-col items-center justify-center pt-2">
            
            {/* Eyes */}
            <div className="flex items-center gap-4 mb-1">
              
              {/* Left Eye */}
              <div className="w-3.5 h-3.5 flex items-center justify-center relative">
                {isEyesClosed ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-3.5 h-1 border-b-2 border-slate-900 rounded-full"
                  />
                ) : isHappy ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-3.5 h-2 border-t-2 border-slate-900 rounded-t-full"
                  />
                ) : isWink ? (
                  <div className="w-3.5 h-1 border-b-2 border-slate-900 rounded-full" />
                ) : (
                  <div className="w-3.5 h-4 bg-slate-900 rounded-full relative overflow-hidden">
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/80 rounded-full" />
                  </div>
                )}
              </div>

              {/* Right Eye */}
              <div className="w-3.5 h-3.5 flex items-center justify-center relative">
                {isEyesClosed ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-3.5 h-1 border-b-2 border-slate-900 rounded-full"
                  />
                ) : isHappy ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-3.5 h-2 border-t-2 border-slate-900 rounded-t-full"
                  />
                ) : (
                  <div className="w-3.5 h-4 bg-slate-900 rounded-full relative overflow-hidden">
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/80 rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Mouth */}
            <div className="w-4 h-2 flex items-center justify-center">
              {isEyesClosed ? (
                <div className="w-2 h-1 border-b-2 border-slate-900 rounded-full" />
              ) : isHappy ? (
                <div className="w-3 h-2 bg-rose-500 rounded-b-full border border-slate-900 overflow-hidden relative">
                  <div className="w-2 h-1 bg-rose-300 rounded-full absolute -bottom-0.5 left-0.5" />
                </div>
              ) : (
                <div className="w-1.5 h-1 border-b-2 border-slate-900 rounded-full" />
              )}
            </div>
          </div>

          {/* 3D Cute Bubble Hands (Cover eyes during password entry!) */}
          <motion.div
            animate={{
              y: isPasswordFocused ? 18 : 45,
              opacity: isPasswordFocused ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="absolute inset-x-0 bottom-0 flex justify-between px-3 z-20 pointer-events-none"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#1E6FD9] to-[#7EC0FF] border border-white/50 transform -rotate-12" />
            <div className="w-5 h-5 rounded-full bg-gradient-to-tl from-[#1E6FD9] to-[#7EC0FF] border border-white/50 transform rotate-12" />
          </motion.div>

        </div>

        {/* Sleek, Professional Fitted Medical Capsule on Top of Head (No bright light, seamless fit) */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
          <div className="w-4.5 h-2 rounded-full border border-white/70 shadow-xs flex overflow-hidden -rotate-6 bg-slate-900/40 backdrop-blur-xs">
            {/* Left half of capsule: Primary medical tone */}
            <div className="w-1/2 h-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8]" />
            {/* Right half of capsule: Clean satin white */}
            <div className="w-1/2 h-full bg-gradient-to-b from-white to-slate-200" />
          </div>
        </div>

      </motion.div>
    </div>
  );
};
