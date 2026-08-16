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

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-navy">Account & Clinical Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal profile, connected biometric wearables, and emergency contact details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Patient Identification</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-navy uppercase tracking-wider">Age</label>
                {formData.age > 0 && (
                  <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-primary"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, age: Math.max(1, (formData.age || 1) - 1) })}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, age: Math.min(120, (formData.age || 0) + 1) })}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">Blood Type</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {bloodTypes.map(bt => {
                  const isSelected = formData.bloodType === bt;
                  return (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setFormData({ ...formData, bloodType: bt })}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      <Droplet size={11} className={isSelected ? 'fill-white text-white' : 'text-rose-500'} />
                      <span>{bt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <HeartPulse size={16} />
            </div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Emergency Contact</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Contact Name</label>
              <input
                type="text"
                value={formData.emergencyName}
                onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Relationship</label>
              <input
                type="text"
                value={formData.emergencyRel}
                onChange={e => setFormData({ ...formData, emergencyRel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Connected Wearables */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Smartphone size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Connected Health Wearables</h3>
          </div>

          <div className="space-y-3">
            {wearables.map((w, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy">{w.name}</h4>
                  <p className="text-[11px] text-slate-500">{w.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWearables(prev => prev.map((item, i) => i === idx ? { ...item, connected: !item.connected } : item));
                    showToast(w.connected ? `Disconnected ${w.name}` : `Paired ${w.name}`, "info");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    w.connected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {w.connected ? 'Active & Synced' : 'Connect Device'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
