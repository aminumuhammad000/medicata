import { useState, useEffect, useCallback } from 'react';
import { 
  Beaker, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface LabTest {
  id: string;
  patient_name: string;
  doctor_name: string;
  test_name: string;
  status: 'pending' | 'completed' | 'cancelled';
  result_url?: string;
  created_at: string;
}

interface LabTestsStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

interface LabTestsResponse {
  tests: LabTest[];
  total: number;
  page: number;
  per_page: number;
  stats: LabTestsStats;
}

export default function LabTestsPage() {
  const [data, setData] = useState<LabTestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await api.get(`/admin/lab-tests?${params}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  const exportCSV = () => {
    if (!data || data.tests.length === 0) return;
    const headers = ['Test ID', 'Patient', 'Doctor', 'Test Name', 'Status', 'Date Ordered', 'Result URL'];
    const rows = data.tests.map(t => [
      t.id.split('-')[0].toUpperCase(),
      t.patient_name,
      t.doctor_name,
      t.test_name,
      t.status,
      new Date(t.created_at).toLocaleString(),
      t.result_url || 'N/A'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata-lab-tests-audit-page${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Diagnostic <span className="text-primary not-italic">Oversight</span>
          </h1>
          <p className="text-slate-500 font-medium">Monitor all laboratory investigations and diagnostic tests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTests}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={exportCSV}
            disabled={!data || data.tests.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Download size={18} className="text-primary" />
            Full Diagnostics Audit
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Investigations', val: stats?.total ?? '—', icon: Beaker, color: 'bg-primary' },
          { label: 'Pending Results', val: stats?.pending ?? '—', icon: Clock, color: 'bg-amber-500' },
          { label: 'Completed', val: stats?.completed ?? '—', icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Cancelled', val: stats?.cancelled ?? '—', icon: AlertCircle, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4 shadow-sm">
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

      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search patient, test name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-slate-700"
            />
          </div>
          <div className="relative w-full max-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-12 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm text-slate-600 shadow-sm cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Diagnostic Investigation</th>
                <th className="px-8 py-5">Patient Details</th>
                <th className="px-8 py-5">Assigned Physician</th>
                <th className="px-8 py-5">Date Ordered</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Result Artifact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-8"><div className="h-6 bg-slate-50 rounded-xl" /></td>
                  </tr>
                ))
              ) : data && data.tests.length > 0 ? (
                data.tests.map((test) => (
                  <tr key={test.id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm flex-shrink-0">
                          <Beaker size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{test.test_name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border bg-white px-1.5 py-0.5 rounded w-fit mt-1 text-mono">
                            {test.id.split('-')[0]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User size={16} className="text-primary flex-shrink-0" />
                        <span className="font-bold text-sm truncate max-w-[120px]">{test.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Stethoscope size={16} className="text-emerald-500 flex-shrink-0" />
                        <span className="font-bold text-sm truncate max-w-[120px]">Dr. {test.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-slate-500">
                        {new Date(test.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase w-fit border",
                        test.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        test.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                        "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {test.status === 'completed' ? <CheckCircle2 size={12} /> : 
                         test.status === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                        {test.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {test.result_url ? (
                        <a 
                          href={test.result_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-md"
                        >
                          <FileText size={14} />
                          Result Document
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">No Artifact</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-bold text-lg">No diagnostic investigations found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data && data.total > perPage && (
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing page {page} of {totalPages}
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
    </div>
  );
}
