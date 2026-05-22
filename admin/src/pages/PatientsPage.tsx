import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldOff,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  ShoppingBag,
  Activity,
  RefreshCw,
  Download,
  UserCircle2,
  Trash2,
  Filter
} from 'lucide-react';
import api from '../services/api';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  profile_photo: string | null;
  is_verified: boolean;
  created_at: string;
  total_consultations: number;
  total_orders: number;
}

interface PatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  per_page: number;
}

function Avatar({ name, photo, size = 10 }: { name: string; photo?: string | null; size?: number }) {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-green-100 text-green-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-teal-100 text-teal-600',
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white shadow`}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow ${colorClass}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
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

function PatientDetailPanel({ patient, onClose, onDelete }: { patient: Patient; onClose: () => void; onDelete: (id: string) => void }) {
  const joinDate = new Date(patient.created_at);
  const daysAgo = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const navigate = useNavigate();


  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-black text-slate-900 text-lg">Patient Profile</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Identity */}
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar name={patient.full_name} photo={patient.profile_photo} size={20} />
            <div>
              <h2 className="text-xl font-black text-slate-900">{patient.full_name}</h2>
              <p className="text-sm text-slate-500 font-medium">Patient Account</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                patient.is_verified
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {patient.is_verified ? (
                <ShieldCheck size={12} />
              ) : (
                <ShieldOff size={12} />
              )}
              {patient.is_verified ? 'Verified Account' : 'Unverified'}
            </span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <Stethoscope className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-2xl font-black text-slate-900">{patient.total_consultations}</p>
              <p className="text-xs text-slate-500 font-semibold">Consultations</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
              <ShoppingBag className="mx-auto text-purple-500 mb-1" size={20} />
              <p className="text-2xl font-black text-slate-900">{patient.total_orders}</p>
              <p className="text-xs text-slate-500 font-semibold">Orders</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Details</h4>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-700 break-all">{patient.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-700">
                {patient.phone_number || <span className="text-slate-400 italic">Not provided</span>}
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Info</h4>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">
                  {joinDate.toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-400">
                  Joined {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <UserCircle2 size={16} className="text-slate-400" />
              <span className="font-mono text-xs text-slate-500">{patient.id}</span>
            </div>
          </div>

        {/* Activity Summary with Deep Linking */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} /> Activity Summary
          </h4>
          <button 
            onClick={() => navigate(`/appointments?q=${encodeURIComponent(patient.full_name)}`)}
            className="w-full flex items-center justify-between text-sm py-2 border-b border-slate-100 hover:bg-white/50 px-2 rounded-lg transition-colors group"
          >
            <span className="text-slate-500 font-medium group-hover:text-primary transition-colors">Total Consultations</span>
            <span className="font-black text-blue-600 underline decoration-blue-200 underline-offset-4 group-hover:decoration-blue-500 transition-all">{patient.total_consultations}</span>
          </button>
          <button 
            onClick={() => navigate(`/orders?q=${encodeURIComponent(patient.full_name)}`)}
            className="w-full flex items-center justify-between text-sm py-2 hover:bg-white/50 px-2 rounded-lg transition-colors group"
          >
            <span className="text-slate-500 font-medium group-hover:text-primary transition-colors">Total Orders Placed</span>
            <span className="font-black text-purple-600 underline decoration-purple-200 underline-offset-4 group-hover:decoration-purple-500 transition-all">{patient.total_orders}</span>
          </button>
        </div>

        {/* Administrative Actions */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={() => onDelete(patient.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all group border border-red-100"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
            Delete Patient Account
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

export default function PatientsPage() {
  const [data, setData] = useState<PatientsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const perPage = 15;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await api.get(`/admin/patients?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this patient's account? This action cannot be undone and will fail if they have active orders or consultations.")) return;
    try {
      await api.delete(`/admin/patients/${id}`);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting patient");
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Name', 'Email', 'Phone', 'Verified', 'Consultations', 'Orders', 'Joined'];
    const rows = data.patients.map((p) => [
      p.full_name,
      p.email,
      p.phone_number || '',
      p.is_verified ? 'Yes' : 'No',
      p.total_consultations,
      p.total_orders,
      new Date(p.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicata-patients-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Patient Management</h2>
            <p className="text-slate-500 font-medium mt-0.5">
              {data ? (
                <>
                  <span className="font-bold text-primary">{data.total.toLocaleString()}</span> total patients registered
                </>
              ) : (
                'Loading patient registry...'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPatients}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={exportCSV}
              disabled={!data || data.patients.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm shadow-sm disabled:opacity-40"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Patients"
            value={data?.total?.toLocaleString() ?? '—'}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            sub="All time"
          />
          <StatCard
            label="This Page"
            value={data?.patients?.length ?? '—'}
            icon={Activity}
            color="bg-purple-50 text-purple-600"
            sub={`Page ${page} of ${totalPages}`}
          />
          <StatCard
            label="Verified"
            value={data ? data.patients.filter((p) => p.is_verified).length : '—'}
            icon={ShieldCheck}
            color="bg-green-50 text-green-600"
            sub="On this page"
          />
          <StatCard
            label="Unverified"
            value={data ? data.patients.filter((p) => !p.is_verified).length : '—'}
            icon={ShieldOff}
            color="bg-amber-50 text-amber-600"
            sub="On this page"
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
          {debouncedSearch && (
            <span className="text-sm text-slate-500 font-medium">
              {data?.total ?? 0} result{data?.total !== 1 ? 's' : ''} for "{debouncedSearch}"
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Consultations</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Orders</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full" />
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-32" />
                            <div className="h-2.5 bg-slate-100 rounded w-24" />
                          </div>
                        </div>
                      </td>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 bg-slate-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data && data.patients.length > 0 ? (
                  data.patients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Patient Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.full_name} photo={patient.profile_photo} />
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                              {patient.full_name}
                            </p>
                            <p className="text-xs text-slate-400 font-medium font-mono">
                              {patient.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{patient.email}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          {patient.phone_number || <span className="italic">No phone</span>}
                        </p>
                      </td>

                      {/* Verified */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            patient.is_verified
                              ? 'bg-green-50 text-green-600 border border-green-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}
                        >
                          {patient.is_verified ? (
                            <ShieldCheck size={11} />
                          ) : (
                            <ShieldOff size={11} />
                          )}
                          {patient.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>

                      {/* Consultations */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-blue-600">
                          <Stethoscope size={14} className="text-blue-400" />
                          {patient.total_consultations}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-purple-600">
                          <ShoppingBag size={14} className="text-purple-400" />
                          {patient.total_orders}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(patient.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {new Date(patient.created_at).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Users className="mx-auto text-slate-200 mb-3" size={48} />
                      <p className="text-slate-500 font-semibold">
                        {debouncedSearch ? `No patients found for "${debouncedSearch}"` : 'No patients registered yet.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > perPage && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-700">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)}
                </span>{' '}
                of <span className="font-bold text-slate-700">{data.total.toLocaleString()}</span> patients
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        pageNum === page
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Panel */}
      {selectedPatient && (
        <PatientDetailPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} onDelete={handleDeletePatient} />
      )}
    </>
  );
}
