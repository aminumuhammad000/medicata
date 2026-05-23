import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  Mail,
  Store,
  Box,
  RefreshCw,
  Download,
  MapPin,
  Phone,
  LayoutGrid,
  List,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import api from '../services/api';

interface Pharmacy {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
  stock_count: number;
}

interface PharmaciesStats {
  total: number;
  verified: number;
  pending: number;
  total_skus: number;
}

interface PharmaciesResponse {
  pharmacies: Pharmacy[];
  total: number;
  page: number;
  per_page: number;
  stats: PharmaciesStats;
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const colors = [
    'bg-indigo-100 text-indigo-600',
    'bg-sky-100 text-sky-600',
    'bg-emerald-100 text-emerald-600',
    'bg-rose-100 text-rose-600',
    'bg-amber-100 text-amber-600',
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-2xl flex items-center justify-center font-black text-sm ring-2 ring-white shadow-sm ${colorClass}`}>
      {name.substring(0,2).toUpperCase()}
    </div>
  );
}

export default function PharmaciesPage() {
  const [data, setData] = useState<PharmaciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const perPage = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPharmacies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await api.get(`/admin/pharmacies?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  const exportCSV = () => {
    if (!data || data.pharmacies.length === 0) return;
    const headers = ['Pharmacy Name', 'Email', 'Phone', 'Address', 'Status', 'SKUs in Stock', 'Date Onboarded'];
    const rows = data.pharmacies.map(p => [
      p.full_name,
      p.email,
      p.phone || 'N/A',
      p.address || 'Location Hidden',
      p.is_verified ? 'Verified' : 'Pending',
      p.stock_count,
      new Date(p.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata-pharmacies-page${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeletePharmacy = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name} from the network? This action cannot be undone and will fail if they have processed historical orders.`)) return;
    try {
      await api.delete(`/admin/pharmacies/${id}`);
      fetchPharmacies();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting pharmacy");
    }
  };

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Pharmacies Network</h2>
          <p className="text-slate-500 font-medium">Monitoring and management of registered dispensing partners.</p>
        </div>

        <div className="flex items-center gap-2">
           <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
              >
               <LayoutGrid size={18} />
             </button>
             <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
              >
               <List size={18} />
             </button>
           </div>
          <button
            onClick={fetchPharmacies}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!data || data.pharmacies.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm shadow-sm disabled:opacity-40"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Partners" value={stats?.total.toLocaleString() ?? '—'} icon={Store} color="bg-blue-50 text-blue-600" sub="Registered pharmacies" />
        <StatCard label="Verified Pharmacies" value={stats?.verified.toLocaleString() ?? '—'} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" sub="Fully active accounts" />
        <StatCard label="Pending Approval" value={stats?.pending.toLocaleString() ?? '—'} icon={Clock} color="bg-amber-50 text-amber-600" sub="Waiting for verification" />
        <StatCard label="Total Network Inventory" value={stats?.total_skus.toLocaleString() ?? '—'} icon={Package} color="bg-purple-50 text-purple-600" sub="Unique SKUs stocked" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
        
        <div className="relative w-full max-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified Partners</option>
            <option value="unverified">Pending Reviews</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto">
           <div className="flex items-center gap-1.5"><Store size={14} className="text-primary" /> {data?.total ?? 0} Partners</div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-4 animate-pulse shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-20 bg-slate-50 rounded-2xl" />
              </div>
            ))
          ) : data && data.pharmacies.length > 0 ? (
            data.pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={pharmacy.full_name} size={14} />
                    <div>
                      <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors">{pharmacy.full_name}</h3>
                      <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        pharmacy.is_verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {pharmacy.is_verified ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                        {pharmacy.is_verified ? 'Verified Partner' : 'Verification Needed'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePharmacy(pharmacy.id, pharmacy.full_name)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Pharmacy Account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-6 space-y-3 flex-grow">
                   <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <MapPin size={16} className="text-slate-400 mt-0.5" />
                      <p className="text-xs font-bold text-slate-600 leading-relaxed italic">{pharmacy.address || 'Location Hidden'}</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                         <Phone size={14} className="text-slate-400" />
                         <span className="text-[10px] font-black text-slate-700 truncate">{pharmacy.phone || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Box size={14} className="text-primary" />
                           <span className="text-[10px] font-black text-slate-700">{pharmacy.stock_count}</span>
                         </div>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Stock</span>
                      </div>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-400 lowercase truncate">{pharmacy.email}</span>
                   </div>
                   <button 
                     onClick={() => window.location.href = `/orders?q=${encodeURIComponent(pharmacy.full_name)}`}
                     className="text-[10px] flex-shrink-0 font-black text-primary hover:underline underline-offset-4 decoration-2"
                   >
                     View Orders
                   </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
               <Store size={48} className="text-slate-200 mb-2" />
               <h3 className="font-black text-slate-900">No Partners Found</h3>
               <p className="text-slate-500 text-sm">No pharmacies matches your current search criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Pharmacy</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Stock Items</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-8 bg-slate-50 rounded-xl" /></td>
                  </tr>
                ))
              ) : data?.pharmacies.map(pharmacy => (
                <tr key={pharmacy.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <Avatar name={pharmacy.full_name} size={10} />
                       <span className="font-bold text-slate-900">{pharmacy.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 italic max-w-xs truncate">{pharmacy.address || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg font-black text-xs">{pharmacy.stock_count} SKUs</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black">
                     <span className={pharmacy.is_verified ? 'text-emerald-500 flex items-center gap-1.5' : 'text-amber-500 flex items-center gap-1.5'}>
                        {pharmacy.is_verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                        {pharmacy.is_verified ? 'VERIFIED' : 'PENDING'}
                     </span>
                  </td>
                  <td className="px-6 py-4 space-x-3 text-right">
                    <button 
                      onClick={() => window.location.href = `/orders?q=${encodeURIComponent(pharmacy.full_name)}`}
                      className="text-xs font-black text-primary hover:underline underline-offset-4 decoration-2"
                    >
                      View Orders
                    </button>
                    <button 
                      onClick={() => handleDeletePharmacy(pharmacy.id, pharmacy.full_name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 inline-flex align-middle"
                      title="Delete Pharmacy Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {data && data.pharmacies.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No pharmacies match the given criteria.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > perPage && (
        <div className="flex items-center justify-center gap-2 pt-4">
           <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
             <ChevronLeft size={20} />
           </button>
           <div className="px-6 py-2 bg-white border border-slate-200 rounded-2xl font-black text-sm shadow-sm">
             Page {page} <span className="text-slate-300 mx-2">/</span> {totalPages}
           </div>
           <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
             <ChevronRight size={20} />
           </button>
        </div>
      )}
    </div>
  );
}
