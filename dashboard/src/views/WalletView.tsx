import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  ArrowUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  TrendingUp,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import type { WalletTransaction } from '../types';

interface WalletViewProps {
  balance: number; // in kobo
  transactions: WalletTransaction[];
  onAddFunds: (amountKobo: number) => void;
  onWithdrawFunds: (amountKobo: number) => boolean;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  balance,
  transactions,
  onAddFunds,
  onWithdrawFunds,
  showToast
}) => {
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5000'); // default 5000 Naira
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Sterling Bank');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amountKobo: number) => {
    return `₦${(amountKobo / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('8842091845');
    setCopied(true);
    showToast("Virtual account number copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(topUpAmount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid amount.", "info");
      return;
    }
    const amountKobo = Math.round(parsed * 100);
    onAddFunds(amountKobo);
    setShowTopUpModal(false);
    showToast(`Wallet funded with ${formatCurrency(amountKobo)} via Virtual Account.`, "success");
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(withdrawAmount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid amount.", "info");
      return;
    }
    if (!withdrawAccount || withdrawAccount.length < 10) {
      showToast("Please enter a valid 10-digit account number.", "info");
      return;
    }
    const amountKobo = Math.round(parsed * 100);
    if (amountKobo > balance) {
      showToast("Insufficient balance for withdrawal.", "info");
      return;
    }

    const success = onWithdrawFunds(amountKobo);
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAccount('');
      showToast(`Withdrawal of ${formatCurrency(amountKobo)} initiated successfully.`, "success");
    }
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 transition-all duration-200 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Wallet size={14} />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Patient Enclave Wallet</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
          Manage your funds, route pharmacy prescription payments, and review rewards earned from participating in zero-knowledge clinical telemetry studies.
        </p>
      </div>

      {/* Main Balance Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left Side: Balance Visualizer (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900/95 border-b-4 border-r-1.5 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Available Balance</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                <ShieldCheck size={11} />
                <span className="text-[9px] font-semibold">Secure HSM Escrow</span>
              </div>
            </div>
            
            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-sans">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
            >
              <Plus size={14} />
              Add Money
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-xs border border-slate-200/50 dark:border-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowUp size={14} className="rotate-45" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Right Side: Virtual Bank Details Info (5 cols) */}
        <div className={`${card3dClass} md:col-span-5 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/60 mb-3">
              <Building size={13} className="text-slate-400 dark:text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-250">Virtual Bank Account</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Provider Bank</span>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Sterling Bank PLC</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Account Name</span>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">MEDICATA - Alex Rivera</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50 mt-1">
                <div>
                  <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Account Number</span>
                  <span className="text-sm font-mono font-bold text-slate-850 dark:text-slate-100 tracking-wider">8842091845</span>
                </div>
                <button
                  onClick={handleCopyAccount}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  title="Copy account number"
                >
                  {copied ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 mt-4">
            <Info size={12} className="shrink-0 text-primary/80 mt-0.5" />
            <p className="leading-tight">
              Instantly fund your wallet by making a direct bank transfer to this assigned virtual account number.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-slate-400 dark:text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recent Transactions</h3>
          </div>
          <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-semibold">
            {transactions.length} record{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((tx) => {
              const isDeposit = tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isDeposit
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isDeposit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </div>
                    
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block leading-tight">
                        {tx.description}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold ${
                    isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'
                  }`}>
                    {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">No transaction records found</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Up / Add Money Dialog Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTopUpModal(false)}
              className="absolute inset-0 bg-navy/30 dark:bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl w-full max-w-md p-5 z-10 text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowTopUpModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 cursor-pointer transition-colors border-none"
              >
                <X size={14} />
              </button>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
                <CreditCard size={15} className="text-primary" />
                Fund Wallet Enclave
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mb-4">
                Simulate instant top-up via Bank Transfer. Specify the Naira amount below to load.
              </p>

              <form onSubmit={handleTopUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₦</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1.5">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">Remittance Channel</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Bank Name</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">Sterling Bank</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Account Number</span>
                    <span className="font-mono font-bold text-slate-750 dark:text-slate-200">8842091845</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-primary/10"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Dialog Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-navy/30 dark:bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl w-full max-w-md p-5 z-10 text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 cursor-pointer transition-colors border-none"
              >
                <X size={14} />
              </button>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
                <ArrowUp size={15} className="rotate-45 text-rose-500" />
                Withdraw Funds
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mb-4">
                Transfer money out of your secure wallet enclave.
              </p>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Destination Bank</label>
                  <select
                    value={withdrawBank}
                    onChange={e => setWithdrawBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent dark:bg-slate-850 rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  >
                    <option value="Sterling Bank">Sterling Bank PLC</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="GTBank">Guaranty Trust Bank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="United Bank for Africa">United Bank for Africa (UBA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. 0123456789"
                    value={withdrawAccount}
                    onChange={e => setWithdrawAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary font-mono tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₦</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2000"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Available: {formatCurrency(balance)}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-primary/10"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
