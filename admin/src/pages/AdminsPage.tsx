import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  Crown,
  Users,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  is_verified: boolean;
}

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/managers');
      setAdmins(res.data);
      setError(null);
    } catch {
      setError('Failed to load administrators. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      await api.post('/admin/managers', form);
      setCreateSuccess(`Admin "${form.full_name}" provisioned successfully!`);
      setForm({ full_name: '', email: '', password: '' });
      fetchAdmins();
      setTimeout(() => { setShowModal(false); setCreateSuccess(null); }, 2000);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Failed to create administrator.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/managers/${deleteTarget.id}`);
      setAdmins(prev => prev.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to terminate administrator.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
              Admin <span className="text-primary not-italic">Management</span>
            </h1>
            <p className="text-slate-500 font-medium">Manage platform access, roles, and administrative privileges</p>
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); setCreateError(null); setCreateSuccess(null); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-md hover:bg-primary/90 transition-all group"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Create Administrator
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-7 rounded-[2rem] border border-slate-200 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users size={90} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Total Admins
          </p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{admins.length}</p>
        </div>
        <div className="glass p-7 rounded-[2rem] border border-slate-200 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle2 size={90} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Verified Accounts
          </p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {admins.filter(a => a.is_verified).length}
          </p>
        </div>
        <div className="glass p-7 rounded-[2rem] border border-slate-200 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Crown size={90} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Logged-in Session
          </p>
          <p className="text-lg font-black text-slate-900 tracking-tighter line-clamp-1">{user?.full_name || '—'}</p>
        </div>
      </div>

      {/* Admin Directory */}
      <div className="glass rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 italic uppercase">
            Administrator <span className="text-primary not-italic">Directory</span>
          </h3>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
            {admins.length} accounts
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
            <AlertTriangle size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={fetchAdmins} className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm">Retry</button>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <ShieldCheck size={48} className="opacity-20" />
            <p className="font-bold text-sm">No administrators found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {admins.map((admin, i) => (
              <div key={admin.id} className={cn(
                "flex items-center justify-between px-8 py-5 hover:bg-slate-50/70 transition-all group",
                admin.id === user?.id && "bg-primary/3"
              )}>
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0",
                    i === 0 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700"
                      : "bg-gradient-to-br from-primary/10 to-indigo-100 text-primary"
                  )}>
                    {admin.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 group-hover:text-primary transition-colors">{admin.full_name}</h4>
                      {admin.id === user?.id && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full">You</span>
                      )}
                      {admin.is_verified && (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Mail size={10} />
                        {admin.email}
                      </span>
                      {admin.phone_number && (
                        <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                          <Phone size={10} />
                          {admin.phone_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Since {new Date(admin.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                  {admin.id !== user?.id ? (
                    <button
                      onClick={() => setDeleteTarget(admin)}
                      className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Terminate administrator"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <div className="w-10" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md p-10 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                  New <span className="text-primary not-italic">Administrator</span>
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Provision a new system admin account</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                <X size={20} />
              </button>
            </div>

            {createSuccess ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-emerald-500">
                <CheckCircle2 size={48} />
                <p className="font-black text-center">{createSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Security"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="admin@medicata.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Temporary Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all pr-14"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {createError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
                    <AlertTriangle size={16} />
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-black shadow-md hover:bg-primary/90 transition-all disabled:opacity-60"
                  >
                    {creating ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    {creating ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm p-10 space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-[1.5rem] flex items-center justify-center text-red-500 mx-auto">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Terminate Account</h3>
              <p className="text-slate-500 font-medium mt-2 text-sm">
                Permanently remove <strong className="text-slate-900">{deleteTarget.full_name}</strong> from the administrative team? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 transition-all shadow-md disabled:opacity-60"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {deleting ? 'Terminating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
