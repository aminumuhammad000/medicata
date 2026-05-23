import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Tag, 
  Stethoscope, 
  Activity, 
  CheckCircle2,
  Clock,
  Download,
  Eye,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  User
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Prescription {
  id: string;
  doctor_name: string;
  patient_name: string;
  medication_name: string;
  status: string;
  created_at: string;
}

interface PrescriptionsStats {
  total: number;
  active: number;
  dispensed: number;
  expired: number;
}

interface PrescriptionsResponse {
  prescriptions: Prescription[];
  total: number;
  page: number;
  per_page: number;
  stats: PrescriptionsStats;
}

export default function PrescriptionsPage() {
  const [data, setData] = useState<PrescriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await api.get(`/admin/prescriptions?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  const exportCSV = () => {
    if (!data || data.prescriptions.length === 0) return;
    const headers = ['Prescription ID', 'Patient', 'Medication', 'Prescribing Doctor', 'Status', 'Date Issued'];
    const rows = data.prescriptions.map(p => [
      `#${p.id.slice(0, 8)}`,
      p.patient_name,
      p.medication_name,
      p.doctor_name,
      p.status,
      new Date(p.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata-prescriptions-audit-page${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Prescription <span className="text-primary not-italic">Ledger</span>
          </h1>
          <p className="text-slate-500 font-medium">Global audit trail for all digital prescriptions issued on platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchPrescriptions}
            className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!data || data.prescriptions.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Issued', val: stats?.total ?? '—', icon: FileText, color: 'bg-primary' },
          { label: 'Active Prescriptions', val: stats?.active ?? '—', icon: Clock, color: 'bg-blue-500' },
          { label: 'Dispensed', val: stats?.dispensed ?? '—', icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Expired', val: stats?.expired ?? '—', icon: AlertTriangle, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white flex items-center gap-4 shadow-sm">
            <div className={cn("p-4 rounded-2xl text-white shadow-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by patient, drug or doctor..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full max-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-12 pr-8 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-primary transition-all shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="dispensed">Dispensed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescription ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescribing Doctor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Issued</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-8 py-8"><div className="h-6 bg-slate-100/50 rounded-xl" /></td>
                  </tr>
                ))
              ) : data && data.prescriptions.length > 0 ? (
                data.prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-white transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <FileText size={16} />
                        </div>
                        <span className="font-mono text-xs text-slate-400 font-black bg-slate-50 px-2 py-1 rounded-md border border-slate-100">#{p.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900">{p.patient_name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-primary flex-shrink-0" />
                        <span className="font-black text-slate-700 italic uppercase text-sm">{p.medication_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-600">{p.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border",
                        p.status.toLowerCase() === 'dispensed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        p.status.toLowerCase() === 'expired' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {p.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedPrescription(p)}
                          className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
                      <Activity size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-900 font-black text-lg">No prescriptions found.</p>
                    <p className="text-slate-400 text-sm mt-1">Try relaxing your search or filter parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > perPage && (
          <div className="px-8 py-4 bg-slate-50/50 border-t border-white flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPrescription(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedPrescription(null)} className="absolute right-6 top-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition">
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">Prescription Details</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">#{selectedPrescription.id}</p>

            <div className="mt-8 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm font-bold text-slate-500 mb-3">Participants</div>
                <div className="flex items-center gap-3 mb-2">
                  <User size={16} className="text-blue-500" />
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</span>
                    <p className="font-black text-slate-900">{selectedPrescription.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Stethoscope size={16} className="text-indigo-500" />
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Doctor</span>
                    <p className="font-black text-slate-900">{selectedPrescription.doctor_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="text-xs font-black text-primary uppercase tracking-widest mb-2">Prescribed Medication</div>
                <p className="font-black text-slate-900 text-lg italic">{selectedPrescription.medication_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                  <div className={cn(
                    "text-sm font-black uppercase",
                    selectedPrescription.status.toLowerCase() === 'dispensed' ? 'text-emerald-600' :
                    selectedPrescription.status.toLowerCase() === 'expired' ? 'text-red-600' : 'text-blue-600'
                  )}>
                    {selectedPrescription.status}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Issued</div>
                  <div className="text-sm font-black text-slate-900">
                    {new Date(selectedPrescription.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setSelectedPrescription(null)}
                className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
