import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  History, 
  Search, 
  Terminal, 
  User, 
  Activity, 
  Clock,
  ExternalLink,
  Lock,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface AuditLog {
  id: string;
  admin_name: string;
  action: string;
  target_type: string | null;
  created_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            System <span className="text-primary not-italic">Audit Trail</span>
          </h1>
          <p className="text-slate-500 font-medium">Immutable verification log for all administrative and system-level actions</p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-[2rem] shadow-xl">
            <Zap size={20} className="text-primary animate-pulse" />
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Log Security</p>
                <h4 className="text-sm font-black italic">Active Monitoring</h4>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
             <History size={32} className="text-primary mb-4" />
             <h4 className="text-3xl font-black text-slate-900">100%</h4>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Retention</p>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
             <Lock size={32} className="text-blue-500 mb-4" />
             <h4 className="text-3xl font-black text-slate-900">AES-256</h4>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption Level</p>
          </div>
          <div className="lg:col-span-2 p-8 bg-primary rounded-[2.5rem] text-white flex justify-between items-center overflow-hidden relative">
             <div className="relative z-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-2">Compliance Ready</h3>
                <p className="text-sm font-bold opacity-80 max-w-sm">Every administrative click is timestamped and cryptographically linked to your session ID for full accountability.</p>
             </div>
             <ShieldAlert size={120} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
          </div>
      </div>

      <div className="glass rounded-[2.5rem] border border-white overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-white bg-slate-50/50 flex items-center gap-3">
            <Terminal size={18} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Inbound Event Stream</span>
        </div>
        <table className="w-full text-left">
          <thead className="hidden lg:table-header-group">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Performed</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Resource</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Time</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
                <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold animate-pulse uppercase tracking-widest">Streaming system logs...</td>
                </tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-primary rounded-full group-hover:scale-y-110 transition-transform" />
                    <span className="font-black text-slate-900 tracking-tight italic uppercase">{l.action}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase">
                        {l.admin_name[0]}
                    </div>
                    <span className="font-bold text-slate-600">{l.admin_name}</span>
                  </div>
                </td>
                <td className="px-8 py-6 font-mono text-xs text-slate-400 font-bold">
                    {l.target_type || 'SYSTEM_GLOBAL'}
                </td>
                <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Clock size={14} className="text-slate-300" />
                        {new Date(l.created_at).toLocaleString()}
                    </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-3 text-slate-300 hover:text-primary transition-all">
                    <ExternalLink size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && (
            <div className="p-20 text-center">
                <p className="text-slate-400 font-bold italic">The audit log is currently empty. System actions will appear here in real-time.</p>
            </div>
        )}
      </div>
    </div>
  );
}
