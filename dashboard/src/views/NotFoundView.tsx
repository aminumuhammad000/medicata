import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface NotFoundViewProps {
  onNavigateHome: () => void;
  onNavigateTriage: () => void;
  onNavigateAppointments: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onNavigateHome,
  onNavigateTriage,
  onNavigateAppointments
}) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 text-left sm:text-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-md space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>ERROR 404 · CLINICAL RECORD NOT FOUND</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
          Endpoint Restricted or Missing
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-sans">
          The patient record, diagnostic telemetry, or consultation room you requested does not exist or requires renewed biometric hardware authorization.
        </p>

        {/* Quick Navigation Action Grid */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onNavigateHome}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-navy transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold group shadow-2xs"
          >
            <LayoutDashboard size={18} className="text-primary group-hover:text-white transition-colors" />
            <span>Dashboard Home</span>
          </button>

          <button
            onClick={onNavigateTriage}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-navy transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold group shadow-2xs"
          >
            <Bot size={18} className="text-primary group-hover:text-white transition-colors" />
            <span>Medi AI Triage</span>
          </button>

          <button
            onClick={onNavigateAppointments}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-navy transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold group shadow-2xs"
          >
            <Calendar size={18} className="text-primary group-hover:text-white transition-colors" />
            <span>Specialists</span>
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Need assistance? Contact our 24/7 Concierge at support@medicata.ai</span>
        </div>
      </motion.div>
    </div>
  );
};
