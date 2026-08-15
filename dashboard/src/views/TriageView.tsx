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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Triage Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy">Medi AI Clinical Triage</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Protocol
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              40M+ clinical guidelines &bull; Zero plaintext exposure &bull; Sub-second differential matching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
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
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col h-[580px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-left">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot size={16} />
                </div>
              )}

              <div className={`max-w-xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 text-navy border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Attached Vitals Chip if user sent them */}
                  {msg.vitalsData && (
                    <div className="mt-2.5 pt-2 border-t border-white/20 text-[10px] flex items-center gap-2 font-mono">
                      <HeartPulse size={12} />
                      <span>Vitals: {msg.vitalsData.heartRate} BPM &bull; {msg.vitalsData.spo2}% SpO2 &bull; BP {msg.vitalsData.bp}</span>
                    </div>
                  )}
                </div>

                {/* AI Triage Diagnostic Card */}
                {msg.triageReport && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border border-blue-200 shadow-xs space-y-3 w-full"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-navy">
                        <Activity size={14} className="text-primary" />
                        <span>Differential Assessment</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        msg.triageReport.riskLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {msg.triageReport.riskLevel} Priority
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-navy">{msg.triageReport.primaryVector}</p>
                      <p className="text-[11px] text-slate-600 mt-1">{msg.triageReport.recommendedAction}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <BadgeCheck size={13} />
                        {msg.triageReport.suggestedSpecialist}
                      </span>
                      <button
                        onClick={() => {
                          showToast(`Fast-tracking to ${msg.triageReport?.suggestedSpecialist}...`, "success");
                          onBookSpecialist(msg.triageReport?.suggestedSpecialist || "Neurology");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar size={12} />
                        <span>Fast-Track Consult</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isAnalyzing && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Evaluating clinical vectors across 40M+ protocols...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Symptom Suggesters */}
        <div className="px-4 sm:px-6 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="font-bold text-slate-500 shrink-0">Quick Intake:</span>
          {quickSymptoms.map((sym, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sym)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 hover:border-primary text-slate-600 hover:text-primary transition-all shrink-0 cursor-pointer font-medium"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={() => setIncludeVitals(!includeVitals)}
              title={includeVitals ? "Vitals attached" : "Attach vitals"}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                includeVitals
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <HeartPulse size={16} className={includeVitals ? "text-emerald-600 animate-pulse" : ""} />
              <span className="hidden sm:inline">{includeVitals ? "Vitals Linked" : "Attach Vitals"}</span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Describe your current symptoms, pain level, or duration..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isAnalyzing}
              className={`p-3 rounded-xl text-white transition-all ${
                !inputVal.trim() || isAnalyzing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-[#1f60b5] shadow-md shadow-primary/25 cursor-pointer'
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
