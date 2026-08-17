import React, { useState } from 'react';
import {
  Menu,
  Bell,
  X,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import type { PatientProfile, NotificationItem } from '../types';
import { MediMascot } from './MediMascot';

interface HeaderProps {
  profile: PatientProfile;
  notifications: NotificationItem[];
  onOpenMobileMenu: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenTriage: () => void;
  onClearNotification: (id: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  onResetOnboarding: () => void;
  isDark: boolean;
  onToggleSidebar: () => void;
  onToggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notifications,
  onOpenMobileMenu,
  onNavigateTab,
  onOpenTriage,
  onClearNotification,
  showToast,
  onResetOnboarding,
  isDark,
  onToggleSidebar,
  onToggleDark
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`h-16 mt-3 mr-3 lg:ml-0 ml-3 px-4 sm:px-6 flex items-center justify-between transition-all duration-300 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.01),0_8px_32px_rgba(31,38,135,0.03)] border sticky top-3 z-40 ${
      isDark
        ? 'bg-slate-900/90 border-slate-800/40 text-slate-100 backdrop-blur-xl'
        : 'bg-white/95 border-slate-200/60 text-slate-800 backdrop-blur-md'
    }`}>
      {/* Left: Mobile Menu Toggle & Active Status */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onOpenMobileMenu}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-700 hover:bg-slate-200/80 lg:hidden flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors border hidden lg:flex ${
            isDark
              ? 'bg-slate-800/40 border-slate-700/30 text-slate-300 hover:bg-slate-800/80'
              : 'bg-slate-100/80 border-slate-200/80 text-slate-700 hover:bg-slate-200/80'
          }`}
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Right: Quick Actions & Notification Bell */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Launch AI Triage Button */}
        <button
          onClick={onOpenTriage}
          title="Launch Medi AI Triage"
          className="w-9 h-9 transition-all flex items-center justify-center cursor-pointer overflow-visible relative bg-transparent border-none outline-none shadow-none hover:scale-110"
        >
          <div className="w-9 h-9 flex items-center justify-center relative overflow-visible shrink-0">
            <div className="scale-[0.22] origin-center absolute">
              <MediMascot emotion="idle" />
            </div>
          </div>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleDark}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
            isDark
              ? 'bg-slate-800/40 border-slate-700/30 text-slate-300 hover:bg-slate-850'
              : 'bg-slate-100 border-slate-200/90 text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer border ${
              isDark
                ? 'bg-slate-800/40 border-slate-700/30 text-slate-300 hover:bg-slate-850'
                : 'bg-slate-100 border-slate-200/90 text-slate-600 hover:bg-slate-200/80'
            }`}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl border p-4 z-50 text-left ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white shadow-black/40'
                : 'bg-white border-slate-200 text-slate-850 shadow-slate-200/50'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-slate-850' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider">Clinical Alerts</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No active clinical notifications.</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'appointment') onNavigateTab('appointments');
                        if (item.type === 'prescription') onNavigateTab('prescriptions');
                        if (item.type === 'security') onNavigateTab('security');
                        onClearNotification(item.id);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                        isDark
                          ? 'bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850/50'
                          : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{item.title}</span>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className={`pt-3 border-t mt-3 text-center ${isDark ? 'border-slate-850' : 'border-slate-100'}`}>
                <button
                  onClick={() => {
                    showToast("All clinical notifications marked as read.", "info");
                    setShowNotifications(false);
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Mark all as verified
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-2 p-1 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
            }`}
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
          </button>

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border p-2 z-[100] text-left ${
              isDark
                ? 'bg-slate-905 border-slate-800 text-white shadow-black/40'
                : 'bg-white border-slate-200 text-slate-850 shadow-slate-205/50'
            }`}>
              <div className={`px-3 py-2 border-b text-xs ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                <p className="font-bold truncate">{profile.name}</p>
                <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{profile.email}</p>
              </div>

              <div className="mt-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    onNavigateTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    onResetOnboarding();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isDark ? 'hover:bg-rose-950/40 text-rose-450' : 'hover:bg-rose-50 text-rose-600'
                  }`}
                >
                  <LogOut size={12} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
