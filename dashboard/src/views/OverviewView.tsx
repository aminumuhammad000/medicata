import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  ArrowRight,
  Video,
  Clock,
  QrCode
} from 'lucide-react';
import type { PatientProfile, VitalSign, Appointment, Prescription, HealthRecord } from '../types';

interface OverviewViewProps {
  profile: PatientProfile;
  vitals: VitalSign[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  records: HealthRecord[];
  onNavigateTab: (tab: any) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  vitals,
  appointments,
  prescriptions,
  records,
  onNavigateTab,
  showToast
}) => {
  const upcomingAppointment = appointments.find(a => a.status === 'Confirmed');
  const activePrescription = prescriptions.find(p => p.status === 'Active');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Welcome Banner with Rapid AI Triage CTA */}
      <div className="bg-gradient-to-r from-navy via-[#122858] to-primary rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VAULT-GRADE SECURE · {profile.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {profile.name.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Your biometric telemetry is normal. Need immediate clinical assessment or prescription renewal?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigateTab('triage')}
              className="px-5 py-3 rounded-2xl bg-white text-navy hover:bg-slate-100 text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot size={16} className="text-primary" />
              <span>Start Medi AI Triage</span>
            </button>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar size={16} />
              <span>Book Specialist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Live Vitals Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span>Biometric Telemetry Stream</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Synced with Apple Health Enclave</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {vitals.map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ y: -2 }}
              onClick={() => showToast(`Telemetry: ${v.label} is ${v.value} ${v.unit} (${v.status}).`, 'info')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">{v.label}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-xl sm:text-2xl font-extrabold text-navy font-sans">{v.value}</span>
                <span className="text-xs font-bold text-slate-400">{v.unit}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Optimal
                </span>
                <span>{v.lastUpdated}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dual Highlights: Upcoming Appointment & Active Prescription */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Upcoming Appointment Banner (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Next Confirmed Consultation</h4>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Confirmed
              </span>
            </div>

            {upcomingAppointment ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={upcomingAppointment.doctor.avatar}
                    alt={upcomingAppointment.doctor.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-base font-bold text-navy leading-tight">{upcomingAppointment.doctor.name}</h5>
                    <p className="text-xs text-primary font-semibold mt-0.5">{upcomingAppointment.doctor.specialty}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{upcomingAppointment.doctor.hospital}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Clock size={14} className="text-slate-400" />
                    <span>{upcomingAppointment.date} · {upcomingAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>256-Bit Encrypted WebRTC</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No upcoming consultations scheduled.</p>
            )}
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs font-bold text-slate-600 hover:text-navy cursor-pointer"
            >
              View All Doctors
            </button>
            <button
              onClick={() => {
                showToast("Entering Encrypted Video Waiting Room...", "success");
                onNavigateTab('appointments');
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Video size={14} />
              <span>Join HD Room</span>
            </button>
          </div>
        </div>

        {/* Active Prescription Token (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Active E-Prescription</h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                ZK-VERIFIED
              </span>
            </div>

            {activePrescription ? (
              <div className="space-y-3">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{activePrescription.token}</span>
                  <h5 className="text-base font-bold text-navy leading-tight mt-0.5">{activePrescription.medication}</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activePrescription.instructions}</p>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Refills Remaining:</span>
                  <span className="font-bold text-indigo-700">{activePrescription.refillsRemaining} Refills Left</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No active prescriptions.</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('prescriptions')}
              className="text-xs font-bold text-slate-600 hover:text-navy cursor-pointer"
            >
              Manage Rx & QR
            </button>
            <button
              onClick={() => {
                showToast("Requesting express 30-min courier dispatch...", "success");
                onNavigateTab('prescriptions');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <QrCode size={13} />
              <span>Express Delivery</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Health Records Table Preview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-left">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Recent Diagnostic Vault Records</h4>
          </div>
          <button
            onClick={() => onNavigateTab('records')}
            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {records.slice(0, 3).map((rec) => (
            <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-navy">{rec.title}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">{rec.provider} · {rec.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {rec.hash}
                </span>
                <button
                  onClick={() => showToast(`Decrypted and loaded ${rec.title}.`, "info")}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-navy text-xs font-bold transition-colors cursor-pointer"
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
