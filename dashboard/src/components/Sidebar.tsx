import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  ExternalLink
} from 'lucide-react';
import type { PatientProfile } from '../types';

export type DashboardTab = 'overview' | 'triage' | 'appointments' | 'prescriptions' | 'records' | 'security' | 'settings' | '404';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  profile: PatientProfile;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onResetOnboarding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  isOpenMobile,
  setIsOpenMobile,
  onResetOnboarding
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'triage', label: 'Medi AI Triage', icon: Bot, badge: 'Active' },
    { id: 'appointments', label: 'Specialists & Video', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'records', label: 'Health Vault', icon: FileText },
    { id: 'security', label: 'Security & Enclave', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.png" alt="Medicata" className="w-7 h-7 object-contain" />
              <span className="font-display font-bold text-base text-navy tracking-tight">
                MEDICATA <span className="text-[9px] font-black text-primary px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 ml-0.5">PORTAL</span>
              </span>
            </div>
          </div>

          {/* Quick Enclave Status Pill */}
          <div className="px-4 pt-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700 truncate">Biometric Enclave</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">
                ZK-AES256
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as DashboardTab);
                    setIsOpenMobile(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-primary transition-colors'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout / Landing Link */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* User Preview */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-9 h-9 rounded-lg object-cover border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-navy truncate">{profile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile.bloodType}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <a
              href="https://medicata.ng"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1 font-medium text-[11px]"
            >
              <ExternalLink size={12} />
              <span>Public Landing</span>
            </a>

            <button
              onClick={onResetOnboarding}
              title="Reset Profile & Onboarding"
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            >
              <LogOut size={12} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
