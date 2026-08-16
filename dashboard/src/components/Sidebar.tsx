import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  Settings
} from 'lucide-react';
import type { PatientProfile } from '../types';

export type DashboardTab = 'overview' | 'triage' | 'appointments' | 'prescriptions' | 'records' | 'security' | 'settings' | '404';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  profile: PatientProfile;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isDark: boolean;
  isSidebarCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  isOpenMobile,
  setIsOpenMobile,
  isDark,
  isSidebarCollapsed
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'triage', label: 'Medi AI Triage', icon: Bot, badge: 'Active' },
    { id: 'appointments', label: 'Video Consult', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'records', label: 'Health Vault', icon: FileText },
    { id: 'security', label: 'Enclave Lock', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-navy/20 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Sidebar Panel - Collapsible to 16 (4rem) on desktop */}
      <aside
        className={`fixed top-3 bottom-3 left-3 z-50 flex flex-col justify-between transition-all duration-300 rounded-tr-3xl rounded-br-3xl shadow-[5px_0_25px_rgba(0,0,0,0.02),0_8px_32px_rgba(31,38,135,0.04)] ${
          isOpenMobile ? 'translate-x-0 w-52' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-16 w-16' : 'lg:w-52 w-52'
        } ${
          isDark 
            ? 'bg-slate-900/90 border-y border-r border-slate-800/40 text-slate-100 backdrop-blur-xl' 
            : 'bg-white/95 border-y border-r border-slate-200/60 text-slate-800 backdrop-blur-md'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className={`h-16 px-4 flex items-center border-b ${
            isDark ? 'border-slate-800/30' : 'border-slate-100/50'
          } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="Medicata" className="w-5.5 h-5.5 object-contain" />
              {!isSidebarCollapsed && (
                <span className="font-display font-bold text-xs tracking-wider uppercase">
                  Medicata <span className="text-[8px] font-black text-primary px-1 py-0.5 rounded-full bg-primary/10 border border-primary/20">Hub</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Enclave Status Pill */}
          <div className="px-3 pt-3">
            <div className={`p-2 rounded-xl border flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isDark ? 'bg-slate-950/40 border-slate-800/30' : 'bg-slate-100/40 border-slate-200/50'
            }`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                {!isSidebarCollapsed && (
                  <span className={`text-[9px] font-semibold truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>Biometric HSM</span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className={`text-[8px] font-mono font-bold px-1 rounded shrink-0 ${
                  isDark ? 'bg-emerald-950/40 text-emerald-350 border border-emerald-800/20' : 'bg-emerald-100/40 text-emerald-800 border border-emerald-250/20'
                }`}>
                  ZK-AES
                </span>
              )}
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-2 mt-2 space-y-1.5">
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
                  className={`w-full relative py-2 rounded-xl text-[10.5px] font-semibold transition-all flex items-center cursor-pointer group ${
                    isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {/* Sliding 3D Recessed Indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className={`absolute inset-0 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02)] ${
                        isDark 
                          ? 'bg-slate-950/90' 
                          : 'bg-slate-100/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_1px_1.5px_rgba(255,255,255,0.9)]'
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 z-10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-slate-900 text-sky-400 border border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                          : 'bg-white text-primary border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)]'
                        : isDark
                          ? 'bg-slate-800/40 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary border border-slate-700/20'
                          : 'bg-slate-100/60 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary border border-slate-200/30'
                    }`}>
                      <Icon size={14} className={isSelected ? 'scale-105 transition-transform' : 'group-hover:scale-105 transition-transform'} />
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`font-semibold tracking-tight transition-colors ${
                        isSelected 
                          ? isDark ? 'text-sky-350' : 'text-primary' 
                          : isDark ? 'text-slate-350 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                      }`}>{item.label}</span>
                    )}
                  </div>
                  
                  {!isSidebarCollapsed && item.badge && (
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md z-10 shrink-0 ${
                      isSelected 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : isDark
                          ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Button */}
        <div className={`p-3 border-t space-y-2 flex flex-col items-center ${
          isDark ? 'border-slate-800/30' : 'border-slate-100/50'
        }`}>
          {/* User Preview */}
          <div className={`flex items-center rounded-xl border w-full ${
            isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-2.5 p-2'
          } ${
            isDark ? 'bg-slate-950/30 border-slate-800/20' : 'bg-slate-100/30 border-slate-250/20'
          }`}>
            <img
              src={profile.avatar}
              alt={profile.name}
              className={`w-7.5 h-7.5 rounded-lg object-cover border ${
                isDark ? 'border-slate-800/50' : 'border-slate-200/70'
              }`}
            />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate leading-snug">{profile.name}</p>
                <p className={`text-[8.5px] font-semibold truncate leading-snug ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>{profile.bloodType}</p>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
};
