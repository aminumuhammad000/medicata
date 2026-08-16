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

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
            <Pill size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-navy">Cryptographic E-Prescriptions</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                ZK-Signed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Biometrically authorized by board physicians with instant pharmacy verification and courier routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Lock size={12} />
            </div>
            <span>Hardware HSM Sealed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Prescription Cards (Left) & QR Digital Token Display (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Active Prescription Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Pill size={13} />
            </div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Active Medications & Regimens
            </h3>
          </div>

          {prescriptions.map((rx) => {
            const isSelected = selectedRx?.id === rx.id;

            return (
              <motion.div
                key={rx.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedRx(rx)}
                className={`p-6 rounded-3xl transition-all cursor-pointer bg-white border text-left ${
                  isSelected
                    ? 'border-primary shadow-md ring-2 ring-primary/20'
                    : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                      <Pill size={18} />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{rx.token}</span>
                      <h4 className="text-base font-bold text-navy leading-tight mt-0.5">{rx.medication}</h4>
                      <p className="text-xs text-primary font-semibold">{rx.genericName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {rx.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {rx.instructions}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Prescribed By</span>
                    <strong className="text-navy">{rx.prescribedBy}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valid Until</span>
                    <strong className="text-navy">{rx.validUntil}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                    {rx.refillsRemaining} Refills Available
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefillRequest(rx.id);
                      showToast(`Refill requested for ${rx.medication}.`, "info");
                    }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Request Refill</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Digital Prescription Pass & Express Courier (5 cols) */}
        {selectedRx && (
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md space-y-6">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Pill size={24} />
              </div>
              <h4 className="text-base font-bold text-navy">{selectedRx.medication}</h4>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedRx.token}</p>
            </div>

            {/* Simulated QR Code */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <QrCode size={110} className="text-slate-800" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400">HASH: {selectedRx.qrHash}</p>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1 mt-1">
                  <ShieldCheck size={13} />
                  <span>Biometric Enclave Verified</span>
                </p>
              </div>
            </div>

            {/* Courier Dispatch Actions */}
            <div className="space-y-3">
              <button
                onClick={handleDispatchCourier}
                disabled={isRequestingCourier}
                className="w-full py-3.5 bg-primary hover:bg-[#1f60b5] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck size={16} />
                <span>{isRequestingCourier ? 'Dispatching Courier...' : 'Order 30-Min Local Courier'}</span>
              </button>

              <button
                onClick={() => showToast(`Downloaded cryptographic token PDF for ${selectedRx.medication}.`, "success")}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-navy rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Verified PDF Token</span>
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-navy font-bold block mb-0.5">Zero Plaintext Guarantee</strong>
              This cryptographic token is accepted at over 40,000 partner pharmacies across the US & UK without paper slips.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
