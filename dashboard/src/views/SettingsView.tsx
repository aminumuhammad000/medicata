import React, { useState } from 'react';
import {
  User,
  HeartPulse,
  Smartphone,
  Save,
  Droplet
} from 'lucide-react';
import type { PatientProfile } from '../types';

interface SettingsViewProps {
  profile: PatientProfile;
  onUpdateProfile: (profile: PatientProfile) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  showToast
}) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    age: profile.age,
    bloodType: profile.bloodType,
    emergencyName: profile.emergencyContact.name,
    emergencyPhone: profile.emergencyContact.phone,
    emergencyRel: profile.emergencyContact.relationship
  });

  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const [wearables, setWearables] = useState([
    { name: 'Apple Health Enclave', type: 'Continuous HR & SpO2', connected: true },
    { name: 'Garmin Connect / ECG', type: 'Sleep & HRV Telemetry', connected: true },
    { name: 'Oura Ring Gen 3', type: 'Body Temperature & Recovery', connected: false }
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PatientProfile = {
      ...profile,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      age: Number(formData.age),
      bloodType: formData.bloodType,
      emergencyContact: {
        name: formData.emergencyName,
        phone: formData.emergencyPhone,
        relationship: formData.emergencyRel
      }
    };
    onUpdateProfile(updated);
    showToast("Profile and clinical preferences updated.", "success");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4 transition-all duration-200 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={card3dClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Account & Clinical Settings</h2>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
          Manage your personal profile, connected biometric wearables, and emergency contact details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Profile Card */}
        <div className={`${card3dClass} space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <User size={13.5} />
            </div>
            <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-250">Patient Identification</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Age</label>
                {formData.age > 0 && (
                  <span className="text-[8px] font-bold text-primary px-1 rounded bg-primary/10">
                    Born ~{new Date().getFullYear() - formData.age}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setFormData({ ...formData, age: isNaN(val) ? 0 : Math.min(120, Math.max(0, val)) });
                  }}
                  placeholder="e.g. 32"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, age: Math.max(1, (formData.age || 1) - 1) })}
                    className="w-5.5 h-5.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 flex items-center justify-center font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, age: Math.min(120, (formData.age || 0) + 1) })}
                    className="w-5.5 h-5.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-350 flex items-center justify-center font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Blood Type</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {bloodTypes.map(bt => {
                  const isSelected = formData.bloodType === bt;
                  return (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setFormData({ ...formData, bloodType: bt })}
                      className={`py-1.5 px-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-750'
                      }`}
                    >
                      <Droplet size={10} className={isSelected ? 'fill-white text-white' : 'text-rose-500'} />
                      <span>{bt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className={`${card3dClass} space-y-3`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/20 flex items-center justify-center text-rose-550 dark:text-rose-400">
              <HeartPulse size={13.5} />
            </div>
            <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-250">Emergency Contact</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.emergencyName}
                onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Relationship</label>
              <input
                type="text"
                value={formData.emergencyRel}
                onChange={e => setFormData({ ...formData, emergencyRel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium text-slate-700 dark:text-slate-150 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Connected Wearables */}
        <div className={`${card3dClass} space-y-3`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <Smartphone size={13.5} className="text-primary" />
            <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-250">Connected Health Wearables</h3>
          </div>

          <div className="space-y-2.5">
            {wearables.map((w, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/60 dark:border-slate-800/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{w.name}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{w.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWearables(prev => prev.map((item, i) => i === idx ? { ...item, connected: !item.connected } : item));
                    showToast(w.connected ? `Disconnected ${w.name}` : `Paired ${w.name}`, "info");
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer border ${
                    w.connected
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border-emerald-200/50 dark:border-emerald-900/20'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-300 dark:hover:bg-slate-750 border-slate-300/40 dark:border-slate-700'
                  }`}
                >
                  {w.connected ? 'Synced' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-primary/20"
          >
            <Save size={13} />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
