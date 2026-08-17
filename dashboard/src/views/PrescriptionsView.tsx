import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pill,
  QrCode,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  Download
} from 'lucide-react';
import type { Prescription } from '../types';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
  onRefillRequest: (id: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  prescriptions,
  onRefillRequest,
  showToast
}) => {
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(prescriptions[0] || null);
  const [isRequestingCourier, setIsRequestingCourier] = useState(false);

  const handleDispatchCourier = () => {
    setIsRequestingCourier(true);
    setTimeout(() => {
      setIsRequestingCourier(false);
      showToast("Courier dispatched! Estimated 30-min delivery window.", "success");
    }, 1500);
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4 transition-all duration-200 text-left`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={`${card3dClass} flex flex-col md:flex-row md:items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Pill size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Cryptographic E-Prescriptions</h2>
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                ZK-Signed
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
              Biometrically authorized by board physicians with instant pharmacy verification and courier routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <div className="w-4.5 h-4.5 rounded bg-indigo-55/60 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-450">
              <Lock size={10} />
            </div>
            <span>Sealed Pass</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Active Prescription Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Pill size={11} />
            </div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Active Medications & Regimens
            </h3>
          </div>

          {prescriptions.map((rx) => {
            const isSelected = selectedRx?.id === rx.id;

            return (
              <motion.div
                key={rx.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRx(rx)}
                className={`${card3dClass} ${
                  isSelected ? 'ring-2 ring-primary/20 border-primary dark:border-primary' : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Pill size={14} />
                    </div>
                    <div className="text-xs">
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 font-bold">{rx.token}</span>
                      <h4 className="font-semibold text-slate-700 dark:text-slate-100 leading-tight mt-0.5">{rx.medication}</h4>
                      <p className="text-[10px] text-primary dark:text-sky-400 font-semibold">{rx.genericName}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                    {rx.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-550 dark:text-slate-450 leading-relaxed font-sans mb-3 bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100/60 dark:border-slate-800/40">
                  {rx.instructions}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 mb-3 font-medium">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">Prescribed By</span>
                    <strong className="text-slate-700 dark:text-slate-200">{rx.prescribedBy}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">Valid Until</span>
                    <strong className="text-slate-700 dark:text-slate-200">{rx.validUntil}</strong>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-indigo-650 dark:text-indigo-400 bg-indigo-50/55 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                    {rx.refillsRemaining} Refills Left
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefillRequest(rx.id);
                      showToast(`Refill requested for ${rx.medication}.`, "info");
                    }}
                    className="text-[10px] font-semibold text-primary dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw size={10} />
                    <span>Request Refill</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Digital Prescription Pass & Express Courier (5 cols) */}
        {selectedRx && (
          <div className={`${card3dClass} lg:col-span-5 p-5 space-y-4`}>
            <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450 flex items-center justify-center mx-auto mb-2">
                <Pill size={18} />
              </div>
              <h4 className="text-xs font-semibold text-slate-750 dark:text-slate-100">{selectedRx.medication}</h4>
              <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{selectedRx.token}</p>
            </div>

            {/* Simulated QR Code */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/40 text-center space-y-2">
              <div className="w-28 h-28 bg-white dark:bg-white p-2 rounded-lg mx-auto border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <QrCode size={90} className="text-slate-850" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">HASH: {selectedRx.qrHash}</p>
                <p className="text-[10px] text-emerald-650 dark:text-emerald-450 font-semibold flex items-center justify-center gap-1 mt-1">
                  <ShieldCheck size={11.5} />
                  <span>Enclave Verified</span>
                </p>
              </div>
            </div>

            {/* Courier Dispatch Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handleDispatchCourier}
                disabled={isRequestingCourier}
                className="w-full py-2.5 bg-primary hover:bg-[#1f60b5] text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Truck size={13.5} />
                <span>{isRequestingCourier ? 'Dispatching...' : 'Order 30-Min Courier'}</span>
              </button>

              <button
                onClick={() => showToast(`Downloaded cryptographic token PDF for ${selectedRx.medication}.`, "success")}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-700"
              >
                <Download size={12} />
                <span>Download Verified PDF</span>
              </button>
            </div>

            <div className="p-2.5 bg-blue-50/50 dark:bg-slate-950/20 rounded-xl border border-blue-100/60 dark:border-slate-800/40 text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-300 font-semibold block mb-0.5">Zero Plaintext Guarantee</strong>
              This cryptographic token is accepted at over 40,000 partner pharmacies across the US & UK without paper slips.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
