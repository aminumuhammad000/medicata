import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  RotateCcw,
  Download
} from 'lucide-react';
import type { PatientProfile } from '../types';

interface SecurityViewProps {
  profile: PatientProfile;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  profile: _profile,
  showToast
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [activeSessions] = useState([
    { device: 'MacBook Pro (Chrome)', ip: '192.88.24.12', location: 'New York, US', status: 'Current Session' },
    { device: 'iPhone 15 Pro (Medicata App)', ip: '192.88.24.89', location: 'New York, US', status: 'Biometric Paired' },
    { device: 'Apple Watch Series 9', ip: 'Bluetooth LE', location: 'Nearby', status: 'Continuous Telemetry' }
  ]);

  const handleRotateKey = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
      showToast("Zero-Knowledge Enclave Key rotated and sharded successfully!", "success");
    }, 1600);
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4 transition-all duration-200 text-left`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={`${card3dClass} flex flex-col md:flex-row md:items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400 shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Security & Biometric Enclave</h2>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30">
                Hardware Isolated
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
              Manage your hardware enclave credentials, zero-knowledge cryptographic keys, and active device authorizations.
            </p>
          </div>
        </div>

        <button
          onClick={handleRotateKey}
          disabled={isRotating}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-[10px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-750"
        >
          <div className="w-4.5 h-4.5 rounded bg-white/20 flex items-center justify-center">
            <RotateCcw size={11} className={isRotating ? 'animate-spin' : ''} />
          </div>
          <span>{isRotating ? 'Rotating...' : 'Rotate Key Pair'}</span>
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${card3dClass} space-y-2.5`}>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20 text-blue-650 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Smartphone size={15} />
          </div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-100">Client Enclave</h4>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Private decryption keys reside solely in your device hardware. Medicata engineers have zero plaintext access.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>CIPHER</span>
            <span className="text-emerald-650 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20">AES-256-GCM</span>
          </div>
        </div>

        <div className={`${card3dClass} space-y-2.5`}>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/20 text-indigo-650 dark:text-indigo-455 flex items-center justify-center shadow-xs">
            <Lock size={15} />
          </div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-100">Medicata HSM Sharding</h4>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Distributed hardware security modules validate zero-knowledge proofs with instant tamper zeroization.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>STANDARDS</span>
            <span className="text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/20">FIPS 140-2 L3</span>
          </div>
        </div>

        <div className={`${card3dClass} space-y-2.5`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 text-emerald-650 dark:text-emerald-455 flex items-center justify-center shadow-xs">
            <ShieldCheck size={15} />
          </div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-100">Compliance & Audit</h4>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Independently audited under HIPAA Security Rule and SOC2 Type II compliance standards for healthcare data.
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>AUDIT STATUS</span>
            <span className="text-emerald-650 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20">100% Certified</span>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className={`${card3dClass} p-4 space-y-3`}>
        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-200">
          Active Authorized Devices
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-850/60">
          {activeSessions.map((s, idx) => (
            <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px]">
                <h5 className="font-semibold text-slate-700 dark:text-slate-200">{s.device}</h5>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">IP: {s.ip} &bull; {s.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIPAA Export Box */}
      <div className={`${card3dClass} p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-left">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-250">Export Personal Health Record (HIPAA Formatted)</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Download your full immutable diagnostic brief and prescription ledger in a cryptographically signed archive.
          </p>
        </div>
        <button
          onClick={() => showToast("Exporting signed HIPAA health archive...", "success")}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-[10px] font-semibold text-slate-700 dark:text-slate-250 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Download size={12} />
          <span>Export Full Archive</span>
        </button>
      </div>

    </div>
  );
};
