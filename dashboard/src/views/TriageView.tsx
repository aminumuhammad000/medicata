import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  User,
  Activity,
  HeartPulse,
  BadgeCheck,
  RefreshCw,
  Calendar
} from 'lucide-react';
import type { PatientProfile, TriageMessage } from '../types';

interface TriageViewProps {
  profile: PatientProfile;
  onBookSpecialist: (specialty: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const TriageView: React.FC<TriageViewProps> = ({
  profile,
  onBookSpecialist,
  showToast
}) => {
  const [messages, setMessages] = useState<TriageMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      content: `Hello ${profile.name.split(' ')[0]}. I am Medi AI, your 24/7 clinical triage assistant. I evaluate your symptoms against 40M+ peer-reviewed medical protocols. What symptoms or health changes are you experiencing right now?`,
      timestamp: 'Just now'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [includeVitals, setIncludeVitals] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const quickSymptoms = [
    "Cranial tension with light sensitivity for 2 days",
    "Resting palpitations and mild dizziness",
    "Seasonal allergies & dry persistent cough",
    "Skin irritation / localized rash on forearm"
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isAnalyzing) return;

    const userMsg: TriageMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: 'Just now',
      vitalsData: includeVitals ? { heartRate: 72, spo2: 99, bp: '118/76', temp: 98.4 } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsAnalyzing(true);

    setTimeout(() => {
      let aiResponseContent = '';
      let triageReport: TriageMessage['triageReport'] = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('head') || lower.includes('cranial') || lower.includes('migraine')) {
        aiResponseContent = "Based on symptom vectors and normal hemodynamics (72 BPM, 99% SpO2), symptoms indicate classic benign tension cephalalgia / migraine aura without acute neurological red flags. I have prepared your clinical summary.";
        triageReport = {
          riskLevel: 'Moderate',
          primaryVector: 'Tension Cephalalgia / Migraine without Complication',
          clinicalConfidence: '99.4% Diagnostic Precision',
          suggestedSpecialist: 'Dr. Sarah Chen, MD (Neurology)',
          recommendedAction: 'Schedule priority video consult for preventative regimen assessment.'
        };
      } else if (lower.includes('heart') || lower.includes('palpitation') || lower.includes('chest') || lower.includes('dizz')) {
        aiResponseContent = "Telemetry indicates resting sinus rhythm (72 BPM). While immediate hemodynamics appear stable, cardiac symptoms warrant thorough evaluation by a cardiologist.";
        triageReport = {
          riskLevel: 'Moderate',
          primaryVector: 'Transient Cardiac Palpitation Vector',
          clinicalConfidence: '98.8% Diagnostic Precision',
          suggestedSpecialist: 'Dr. Marcus Vance, MD (Cardiovascular)',
          recommendedAction: 'Fast-track to Board-Certified Cardiologist for ECG review.'
        };
      } else {
        aiResponseContent = "I have ingested your symptom brief and cross-referenced with your profile (allergies: " + profile.allergies.join(', ') + "). Clinical telemetry indicates stable physiological balance.";
        triageReport = {
          riskLevel: 'Low',
          primaryVector: 'General Clinical Ingestion Vector',
          clinicalConfidence: '99.1% Diagnostic Precision',
          suggestedSpecialist: 'Dr. Emily Al-Mansoor, MD (Internal Medicine)',
          recommendedAction: 'Routine physician consultation recommended.'
        };
      }

      const aiMsg: TriageMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: aiResponseContent,
        timestamp: 'Just now',
        triageReport
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsAnalyzing(false);
      showToast("Medi AI Triage Brief Synthesized.", "success");
    }, 1600);
  };

  const card3dClass = `bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 border-slate-200/80 dark:border-b-slate-950/80 dark:border-r-slate-950/80 rounded-2xl p-4 shadow-sm transition-all duration-200 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      
      {/* Triage Header Card */}
      <div className={`${card3dClass} flex flex-col md:flex-row md:items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Medi AI Clinical Triage</h2>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30">
                Active Protocol
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
              40M+ clinical guidelines &bull; Zero plaintext exposure &bull; Sub-second differential matching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'm1',
                  sender: 'ai',
                  content: `Hello ${profile.name.split(' ')[0]}. Session reset. What symptoms would you like to evaluate?`,
                  timestamp: 'Just now'
                }
              ]);
              showToast("Triage session cleared.", "info");
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-[10px] font-semibold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={11} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Chat Container Card */}
      <div className={`${card3dClass} p-0 flex flex-col h-[500px] overflow-hidden`}>
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot size={14} />
                </div>
              )}

              <div className={`max-w-lg space-y-2.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-[11px] leading-relaxed font-sans ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-250 border border-slate-150 dark:border-slate-850 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Attached Vitals Chip if user sent them */}
                  {msg.vitalsData && (
                    <div className="mt-2 pt-1.5 border-t border-white/20 text-[9px] flex items-center gap-1.5 font-mono">
                      <HeartPulse size={11} />
                      <span>Vitals: {msg.vitalsData.heartRate} BPM &bull; {msg.vitalsData.spo2}% SpO2 &bull; BP {msg.vitalsData.bp}</span>
                    </div>
                  )}
                </div>

                {/* AI Triage Diagnostic Card */}
                {msg.triageReport && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/20 via-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-blue-100 dark:border-slate-800 shadow-2xs space-y-2 w-full text-xs"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-100/60 dark:border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-250">
                        <Activity size={13} className="text-primary" />
                        <span>Differential Assessment</span>
                      </div>
                      <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        msg.triageReport.riskLevel === 'Low'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30'
                      }`}>
                        {msg.triageReport.riskLevel} Priority
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-100">{msg.triageReport.primaryVector}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 leading-normal">{msg.triageReport.recommendedAction}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-[9.5px] font-semibold text-primary dark:text-sky-400 flex items-center gap-0.5">
                        <BadgeCheck size={11.5} />
                        {msg.triageReport.suggestedSpecialist.split(',')[0]}
                      </span>
                      <button
                        onClick={() => {
                          showToast(`Fast-tracking to ${msg.triageReport?.suggestedSpecialist}...`, "success");
                          onBookSpecialist(msg.triageReport?.suggestedSpecialist || "Neurology");
                        }}
                        className="px-2.5 py-1 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[9.5px] font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer border border-primary/20"
                      >
                        <Calendar size={11} />
                        <span>Fast-Track</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span>Evaluating clinical vectors across 40M+ protocols...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Symptom Suggesters */}
        <div className="px-3.5 py-1.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-805/60 flex items-center gap-1.5 overflow-x-auto text-[10px]">
          <span className="font-semibold text-slate-400 dark:text-slate-500 shrink-0">Quick Intake:</span>
          {quickSymptoms.map((sym, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sym)}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-550 dark:text-slate-350 hover:border-primary dark:hover:border-primary transition-all shrink-0 cursor-pointer font-medium"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-805/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setIncludeVitals(!includeVitals)}
              title={includeVitals ? "Vitals attached" : "Attach vitals"}
              className={`p-2 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                includeVitals
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/35 text-emerald-600 dark:text-emerald-450 shadow-2xs'
                  : 'bg-slate-55/60 dark:bg-slate-800 border-slate-200 dark:border-slate-705 text-slate-400 dark:text-slate-500 hover:text-slate-650'
              }`}
            >
              <HeartPulse size={14} className={includeVitals ? "text-emerald-600 animate-pulse" : ""} />
              <span className="hidden sm:inline">{includeVitals ? "Vitals Linked" : "Attach Vitals"}</span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Describe your current symptoms, pain level, or duration..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-205 placeholder-slate-450 focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isAnalyzing}
              className={`p-2 rounded-xl text-white transition-all shrink-0 ${
                !inputVal.trim() || isAnalyzing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-primary hover:bg-[#1f60b5] shadow-xs cursor-pointer border border-primary/20'
              }`}
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
