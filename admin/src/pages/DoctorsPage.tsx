import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  Mail,
  Calendar,
  Stethoscope,
  Activity,
  RefreshCw,
  Download,
  Award,
  X,
  UserCircle2,
  FileText,
  MapPin,
  Trash2,
  Filter
} from 'lucide-react';
import api from '../services/api';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  medical_license_number: string | null;
  is_verified: boolean;
  created_at: string;
}

interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  per_page: number;
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-green-100 text-green-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-teal-100 text-teal-600',
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow ${colorClass}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function DoctorDetailPanel({ doctor, onClose, onDelete }: { doctor: Doctor; onClose: () => void; onDelete: (id: string) => void }) {
  const joinDate = new Date(doctor.created_at);
  const daysAgo = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-black text-slate-900 text-lg">Doctor Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar name={doctor.full_name} size={20} />
            <div>
              <h2 className="text-xl font-black text-slate-900">{doctor.full_name}</h2>
              <p className="text-sm text-slate-500 font-medium">{doctor.specialty || 'General Practitioner'}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              doctor.is_verified ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {doctor.is_verified ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
              {doctor.is_verified ? 'Verified Practitioner' : 'Verification Pending'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Info</h4>
            <div className="flex items-center gap-3 text-sm">
              <FileText size={16} className="text-slate-400" />
              <span className="font-bold text-slate-700">License: {doctor.medical_license_number || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Award size={16} className="text-slate-400" />
              <span className="font-semibold text-slate-700">{doctor.specialty || 'General Practice'}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Account</h4>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-400" />
              <span className="font-semibold text-slate-700">{doctor.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">{joinDate.toLocaleDateString()}</p>
                <p className="text-xs text-slate-400 font-medium">Joined {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => window.location.href = `/verifications?q=${encodeURIComponent(doctor.full_name)}`}
              className="w-full py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              View Credentials
            </button>
            <button 
              onClick={() => onDelete(doctor.id)}
              className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
              Delete Practitioner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const [data, setData] = useState<DoctorsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const perPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (specialtyFilter) params.set('specialty', specialtyFilter);

      const res = await api.get(`/admin/doctors?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, specialtyFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this doctor's account? This action cannot be undone and will fail if they have active appointments or patients assigned.")) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting practitioner");
    }
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Management</h2>
            <p className="text-slate-500 font-medium mt-0.5">
              {data ? <><span className="font-bold text-primary">{data.total}</span> professionals registered</> : 'Loading directory...'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDoctors}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              disabled={!data || data.doctors.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm shadow-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by name, license or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
          
          <div className="relative hidden md:block">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified Practices</option>
              <option value="unverified">Pending Reviews</option>
            </select>
          </div>

          <div className="relative hidden lg:block">
            <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={specialtyFilter}
              onChange={(e) => { setSpecialtyFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm max-w-[200px] truncate"
            >
              <option value="">All Specialties</option>
              <option value="General Practice">General Practice</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
              <option value="Psychiatry">Psychiatry</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Specialty</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">License</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-10 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-10 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-10 w-24 bg-slate-100 rounded" /></td>
                    </tr>
                  ))
                ) : data && data.doctors.length > 0 ? (
                  data.doctors.map((doctor) => (
                    <tr 
                      key={doctor.id} 
                      onClick={() => setSelectedDoctor(doctor)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={doctor.full_name} />
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{doctor.full_name}</p>
                            <p className="text-xs text-slate-400 font-medium font-mono">{doctor.id.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Stethoscope size={14} className="text-primary" />
                          {doctor.specialty || 'General Practice'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {doctor.medical_license_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          doctor.is_verified ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {doctor.is_verified ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                          {doctor.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(doctor.created_at).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Users className="mx-auto text-slate-200 mb-3" size={48} />
                      <p className="text-slate-500 font-semibold">No doctors found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > perPage && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{(page-1)*perPage+1}-{Math.min(page*perPage, data.total)}</span> of <span className="font-bold text-slate-700">{data.total}</span> doctors
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {selectedDoctor && (
        <DoctorDetailPanel doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} onDelete={handleDeleteDoctor} />
      )}
    </>
  );
}
