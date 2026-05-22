import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Pill, 
  Settings, 
  LogOut,
  ShieldCheck,
  Activity,
  ShoppingBag,
  Building2,
  Wallet,
  Beaker,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  ShieldAlert,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';


const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShieldCheck, label: 'Verifications', path: '/verifications' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: UserSquare2, label: 'Doctors', path: '/doctors' },
  { icon: Pill, label: 'Inventory', path: '/inventory' },
  { icon: Building2, label: 'Pharmacies', path: '/pharmacies' },
  { icon: Calendar, label: 'Appointments', path: '/appointments' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: Beaker, label: 'Diagnostics', path: '/lab-tests' },
  { icon: Layers, label: 'Specialties', path: '/specialties' },
  { icon: FileText, label: 'Prescriptions', path: '/audit-prescriptions' },
  { icon: ShieldAlert, label: 'Quality Hub', path: '/quality' },
  { icon: Activity, label: 'Revenue', path: '/revenue' },
  { icon: Wallet, label: 'Settlements', path: '/payouts' },
  { icon: Sparkles, label: 'Medi AI', path: '/medi' },
  { icon: History, label: 'Audit Logs', path: '/audit-logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'issue' | 'checking'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/health');
        setSystemStatus('healthy');
      } catch {
        setSystemStatus('issue');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 h-screen glass fixed left-0 top-0 flex flex-col border-r border-slate-200">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <img src="/icon.png" alt="Medicata Icon" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-primary tracking-tighter italic">
            MEDICATA<span className="text-slate-900 text-xs align-top ml-1 not-italic font-bold">Admin</span>
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pb-8">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-0.5",
              isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-slate-500 hover:text-primary hover:bg-primary/5"
            )}
          >
            <item.icon size={18} className={cn("transition-colors", "group-hover:text-primary")} />
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-4">
        {/* System Status Widget */}
        <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {systemStatus === 'healthy' ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : systemStatus === 'checking' ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            ) : (
              <AlertCircle size={18} className="text-red-500" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 leading-tight">System Status</span>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-black",
                systemStatus === 'healthy' ? "text-emerald-600" :
                systemStatus === 'checking' ? "text-slate-500" : "text-red-600"
              )}>
                {systemStatus === 'healthy' ? 'Operational' :
                 systemStatus === 'checking' ? 'Checking...' : 'Degraded API'}
              </span>
            </div>
          </div>
          {systemStatus === 'healthy' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
