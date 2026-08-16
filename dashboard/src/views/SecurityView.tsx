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

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-navy">Security & Biometric Enclave</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hardware Isolated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your hardware enclave credentials, zero-knowledge cryptographic keys, and active device authorizations.
            </p>
          </div>
        </div>

        <button
          onClick={handleRotateKey}
          disabled={isRotating}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
            <RotateCcw size={12} className={isRotating ? 'animate-spin' : ''} />
          </div>
          <span>{isRotating ? 'Rotating Shards...' : 'Rotate Key Pair'}</span>
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
            <Smartphone size={20} />
          </div>
          <h4 className="text-sm font-bold text-navy">Client Enclave</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Private decryption keys reside solely in your device hardware. Medicata engineers have zero plaintext access.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>CIPHER</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">AES-256-GCM</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
            <Lock size={20} />
          </div>
          <h4 className="text-sm font-bold text-navy">Medicata HSM Sharding</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Distributed hardware security modules validate zero-knowledge proofs with instant tamper zeroization.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>STANDARDS</span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60">FIPS 140-2 L3</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <h4 className="text-sm font-bold text-navy">Compliance & Audit</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Independently audited under HIPAA Security Rule and SOC2 Type II compliance standards for healthcare data.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>AUDIT STATUS</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">100% Certified</span>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
          Active Authorized Devices
        </h3>

        <div className="divide-y divide-slate-100">
          {activeSessions.map((s, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-navy">{s.device}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">IP: {s.ip} &bull; {s.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIPAA Export Box */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-navy">Export Personal Health Record (HIPAA Formatted)</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Download your full immutable diagnostic brief and prescription ledger in a cryptographically signed archive.
          </p>
        </div>
        <button
          onClick={() => showToast("Exporting signed HIPAA health archive...", "success")}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-navy transition-colors cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Download size={14} />
          <span>Export Full Archive</span>
        </button>
      </div>

    </div>
  );
};
