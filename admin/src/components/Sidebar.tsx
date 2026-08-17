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
  Beaker,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  UserPlus,
  Megaphone
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';


const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShieldCheck, label: 'Verifications', path: '/verifications' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: UserSquare2, label: 'Doctors', path: '/doctors' },
  { icon: Pill, label: 'Inventory', path: '/inventory' },
  { icon: Building2, label: 'Pharmacies', path: '/pharmacies' },
  { icon: Calendar, label: 'Appointments', path: '/appointments' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: Beaker, label: 'Lab Tests', path: '/lab-tests' },
  { icon: Layers, label: 'Specialties', path: '/specialties' },
  { icon: FileText, label: 'Prescriptions', path: '/audit-prescriptions' },
  { icon: Activity, label: 'Revenue', path: '/revenue' },
  { icon: Sparkles, label: 'Medi AI', path: '/medi' },
  { icon: Megaphone, label: 'Broadcast', path: '/broadcast' },
  { icon: UserPlus, label: 'Admins', path: '/admins' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-60 fixed left-3 top-3 bottom-3 z-50 flex flex-col glass border-y border-r border-slate-200/60 rounded-tr-3xl rounded-br-3xl overflow-hidden shadow-[5px_0_25px_rgba(0,0,0,0.02),0_8px_32px_rgba(31,38,135,0.04)]">
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

      <div className="p-4 border-t border-slate-200">
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
