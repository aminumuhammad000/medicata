import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Bot,
  X
} from 'lucide-react';
import type { PatientProfile, NotificationItem } from '../types';

interface HeaderProps {
  profile: PatientProfile;
  notifications: NotificationItem[];
  onOpenMobileMenu: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenTriage: () => void;
  onClearNotification: (id: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notifications,
  onOpenMobileMenu,
  onNavigateTab,
  onOpenTriage,
  onClearNotification,
  showToast
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Active Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-navy">Priority Tier Active</span>
          <span className="text-slate-400">·</span>
          <span>Encrypted Gateway</span>
        </div>
      </div>

      {/* Right: Quick Actions & Notification Bell */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Launch AI Triage Button */}
        <button
          onClick={onOpenTriage}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Bot size={15} />
          <span className="hidden xs:inline sm:inline">Launch Medi AI</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Clinical Alerts</h4>
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
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-navy">{item.title}</span>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{item.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 text-center">
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

        {/* Profile Avatar Button */}
        <button
          onClick={() => onNavigateTab('settings')}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
          />
        </button>
      </div>
    </header>
  );
};
