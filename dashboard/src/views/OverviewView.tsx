import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  ArrowRight,
  Video,
  Clock,
  QrCode,
  HeartPulse,
  Droplets,
  Thermometer
} from 'lucide-react';
import type { VitalSign, Appointment, Prescription, HealthRecord } from '../types';

interface OverviewViewProps {
  vitals: VitalSign[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  records: HealthRecord[];
  onNavigateTab: (tab: any) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  vitals,
  appointments,
  prescriptions,
  records,
  onNavigateTab,
  showToast
}) => {
  const upcomingAppointment = appointments.find(a => a.status === 'Confirmed');
  const activePrescription = prescriptions.find(p => p.status === 'Active');

  const getVitalVisuals = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('heart') || l.includes('pulse')) {
      return {
        icon: HeartPulse,
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40 text-rose-550 dark:text-rose-400',
        dot: 'bg-rose-450 dark:bg-rose-500'
      };
    }
    if (l.includes('oxygen') || l.includes('spo2')) {
      return {
        icon: Droplets,
        bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/40 text-sky-550 dark:text-sky-400',
        dot: 'bg-sky-450 dark:bg-sky-500'
      };
    }
    if (l.includes('pressure') || l.includes('bp')) {
      return {
        icon: Activity,
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-550 dark:text-indigo-400',
        dot: 'bg-indigo-450 dark:bg-indigo-500'
      };
    }
    return {
      icon: Thermometer,
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 text-amber-550 dark:text-amber-400',
      dot: 'bg-amber-450 dark:bg-amber-500'
    };
  };

  // Shared 3D Physical Card Classes
  const card3dClass = `bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 border-slate-200/80 dark:border-b-slate-950/80 dark:border-r-slate-950/80 rounded-2xl p-4 shadow-sm hover:border-b-2 hover:border-r-1 hover:translate-y-[1.5px] transition-all duration-200 cursor-pointer text-left`;
  
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      
      {/* 4 Live Vitals Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity size={13.5} />
            </div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
              Biometric Telemetry Stream
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Synced with Apple Health</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {vitals.map((v) => {
            const visual = getVitalVisuals(v.label);
            const VitalIcon = visual.icon;

            return (
              <motion.div
                key={v.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => showToast(`Telemetry: ${v.label} is ${v.value} ${v.unit} (${v.status}).`, 'info')}
                className={card3dClass}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${visual.bg}`}>
                    <VitalIcon size={14} />
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${visual.dot}`} />
                </div>
                <div className="mb-1">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">{v.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-100 font-sans">{v.value}</span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-550">{v.unit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 mt-1.5">
                  <span className="font-semibold text-emerald-650 bg-emerald-50/50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20">
                    Optimal
                  </span>
                  <span>{v.lastUpdated}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dual Highlights: Upcoming Appointment & Active Prescription */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Upcoming Appointment Banner (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 border-slate-200/80 dark:border-b-slate-950/80 dark:border-r-slate-950/80 rounded-2xl p-4.5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Calendar size={14} />
                </div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">Next Consultation</h4>
              </div>
              <span className="text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                Confirmed
              </span>
            </div>

            {upcomingAppointment ? (
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <img
                    src={upcomingAppointment.doctor.avatar}
                    alt={upcomingAppointment.doctor.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-semibold text-slate-700 dark:text-slate-100 leading-tight">{upcomingAppointment.doctor.name}</h5>
                    <p className="text-primary dark:text-sky-400 font-semibold mt-0.5">{upcomingAppointment.doctor.specialty}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{upcomingAppointment.doctor.hospital}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/40 text-[10px]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <div className="w-5.5 h-5.5 rounded bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Clock size={11} />
                    </div>
                    <span>{upcomingAppointment.date} · {upcomingAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <div className="w-5.5 h-5.5 rounded bg-emerald-100/50 dark:bg-emerald-905/30 border border-emerald-200/50 dark:border-emerald-900/20 flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={11} />
                    </div>
                    <span>256-Bit Encrypted Video</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 py-6 text-center">No upcoming consultations.</p>
            )}
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
            >
              View Doctors
            </button>
            <button
              onClick={() => {
                showToast("Entering Encrypted Video Waiting Room...", "success");
                onNavigateTab('appointments');
              }}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[10px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-primary/20"
            >
              <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center">
                <Video size={11} />
              </div>
              <span>Join HD Room</span>
            </button>
          </div>
        </div>

        {/* Active Prescription Token (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 border-slate-200/80 dark:border-b-slate-950/80 dark:border-r-slate-950/80 rounded-2xl p-4.5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Pill size={14} />
                </div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">Active E-Prescription</h4>
              </div>
              <span className="text-[9px] font-mono font-bold text-primary dark:text-sky-400 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 px-1.5 py-0.5 rounded">
                ZK-VERIFIED
              </span>
            </div>

            {activePrescription ? (
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{activePrescription.token}</span>
                  <h5 className="font-semibold text-slate-700 dark:text-slate-100 leading-tight mt-0.5">{activePrescription.medication}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activePrescription.instructions}</p>
                </div>

                <div className="p-2 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/60 dark:border-indigo-900/20 text-[10px] flex items-center justify-between">
                  <span className="font-medium text-slate-450 dark:text-slate-400">Refills Remaining:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-450">{activePrescription.refillsRemaining} Left</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 py-6 text-center">No active prescriptions.</p>
            )}
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('prescriptions')}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
            >
              Manage Rx
            </button>
            <button
              onClick={() => {
                showToast("Requesting express 30-min courier dispatch...", "success");
                onNavigateTab('prescriptions');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-[10px] font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border border-slate-700/30"
            >
              <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center">
                <QrCode size={11} />
              </div>
              <span>Express Delivery</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Health Records Table Preview */}
      <div className="bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 border-slate-200/80 dark:border-b-slate-950/80 dark:border-r-slate-950/80 rounded-2xl p-4.5 shadow-sm text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText size={14} />
            </div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">Recent Diagnostic Vault Records</h4>
          </div>
          <button
            onClick={() => onNavigateTab('records')}
            className="text-[10px] font-semibold text-primary dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>View Records</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-850/60">
          {records.slice(0, 3).map((rec) => (
            <div key={rec.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20 text-blue-650 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText size={13} />
                </div>
                <div className="text-[11px]">
                  <h5 className="font-semibold text-slate-700 dark:text-slate-200">{rec.title}</h5>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{rec.provider} · {rec.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 px-1.5 py-0.5 rounded">
                  {rec.hash}
                </span>
                <button
                  onClick={() => showToast(`Decrypted and loaded ${rec.title}.`, "info")}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary dark:hover:text-white text-slate-600 dark:text-slate-350 text-[10px] font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
