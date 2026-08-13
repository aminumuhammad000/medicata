import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  CreditCard
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Consultation {
  id: string;
  doctor_name: string;
  patient_name: string;
  status: string;
  fee: number;
  scheduled_at: string;
  created_at: string;
}

interface ConsultationsStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface ConsultationsResponse {
  consultations: Consultation[];
  total: number;
  page: number;
  per_page: number;
  stats: ConsultationsStats;
}

export default function AppointmentsPage() {
  const [data, setData] = useState<ConsultationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (filter !== 'all') params.set('status', filter);

      const res = await api.get('/admin/consultations', { params });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const exportCSV = () => {
    if (!data || data.consultations.length === 0) return;
    const headers = ['ID', 'Doctor', 'Patient', 'Status', 'Fee', 'Scheduled Date', 'Scheduled Time', 'Created At'];
    const rows = data.consultations.map(c => [
      `#${c.id.slice(0, 8)}`,
      c.doctor_name,
      c.patient_name,
      c.status,
      c.fee,
      new Date(c.scheduled_at).toLocaleDateString(),
      new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      new Date(c.created_at).toLocaleString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata-appointments-page${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cancelConsultation = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to FORCE CANCEL appointment #${code}? This will override all doctor controls.`)) return;
    try {
      await api.patch(`/admin/consultations/${id}/cancel`);
      alert("Consultation forcefully cancelled and refunded if applicable.");
      setSelectedConsultation(null);
      fetchConsultations();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error cancelling consultation");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'cancelled': return <XCircle className="text-red-500" size={18} />;
      case 'scheduled': return <Clock className="text-blue-500" size={18} />;
      default: return <AlertCircle className="text-amber-500" size={18} />;
    }
  };

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Platform <span className="text-primary not-italic">Appointments</span>
          </h1>
          <p className="text-slate-500 font-medium">Real-time monitoring of all healthcare consultations</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchConsultations}
            className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!data || data.consultations.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards tied to global backend stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
            { label: 'Total Volume', val: stats?.total ?? '—', icon: Calendar, color: 'bg-primary' },
            { label: 'Active Sessions', val: stats?.scheduled ?? '—', icon: Stethoscope, color: 'bg-blue-500' },
            { label: 'Successful', val: stats?.completed ?? '—', icon: CheckCircle2, color: 'bg-emerald-500' },
            { label: 'Cancelled', val: stats?.cancelled ?? '—', icon: XCircle, color: 'bg-red-500' },
        ].map((stat, i) => (
            <div key={i} className="bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white flex items-center gap-4 shadow-sm">
                <div className={cn("p-4 rounded-2xl text-white", stat.color)}>
                    <stat.icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-900">{stat.val}</h3>
                </div>
            </div>
        ))}
      </div>

      {/* Filtering and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search Patient Name, Doctor, or ID (#123456)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
        <div className="relative w-full max-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select 
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-12 pr-8 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-primary transition-all shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                     <td colSpan={7} className="px-8 py-8"><div className="h-6 bg-slate-100/50 rounded-xl" /></td>
                  </tr>
                ))
              ) : data && data.consultations.length > 0 ? (
                data.consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-white transition-colors group cursor-pointer" onClick={() => setSelectedConsultation(c)}>
                    <td className="px-8 py-6">
                      <span className="font-mono text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        #{c.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                            {c.doctor_name[0]}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{c.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-600">{c.patient_name}</td>
                    <td className="px-8 py-6">
                        <div className="font-bold text-slate-900 text-sm">
                            {new Date(c.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">
                            {new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(c.status)}
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-1 flex items-center rounded-md",
                            c.status.toLowerCase() === 'completed' ? "bg-emerald-50 text-emerald-600" :
                            c.status.toLowerCase() === 'cancelled' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>{c.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900 opacity-90">
                       <div className="flex items-center gap-1.5"><CreditCard size={14} className="text-slate-300"/> ₦{c.fee.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedConsultation(c); }}
                        className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                          <AlertCircle size={24} className="text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-black text-lg">No appointments found.</p>
                      <p className="text-slate-400 text-sm mt-1">Try relaxing your search parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        {data && data.total > perPage && (
          <div className="px-8 py-4 bg-slate-50/50 border-t border-white flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} 
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} 
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Action Modal Overlay */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedConsultation(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
             <button onClick={() => setSelectedConsultation(null)} className="absolute right-6 top-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition">
               <X size={18} />
             </button>
             
             <h3 className="text-xl font-black text-slate-900 mb-1">Appointment Control</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">#{selectedConsultation.id}</p>

             <div className="mt-8 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div className="text-sm font-bold text-slate-500">Scheduled Time</div>
                   <div className="text-sm font-black text-slate-900">
                      {new Date(selectedConsultation.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-sm font-bold text-slate-500 mb-2">Participants</div>
                   <div className="flex items-center gap-2 mb-1">
                      <Stethoscope size={14} className="text-indigo-500" />
                      <span className="text-sm font-black text-slate-900">{selectedConsultation.doctor_name}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-700">{selectedConsultation.patient_name}</span>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setSelectedConsultation(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition"
                >
                   Dismiss
                </button>
                {selectedConsultation.status === 'scheduled' && (
                  <button 
                    onClick={() => cancelConsultation(selectedConsultation.id, selectedConsultation.id.slice(0,8))}
                    className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 shadow-md transition flex items-center justify-center gap-2"
                  >
                     <XCircle size={18} />
                     Force Cancel
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
