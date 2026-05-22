import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  AlertCircle,
  Stethoscope,
  Building2,
  Star,
  X,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface PendingDoctor {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  specialty: string | null;
  medical_license_number: string | null;
  years_of_experience: number | null;
  clinic_hospital_affiliation: string | null;
  profile_photo: string | null;
  verification_documents: any;
  verification_status: string | null;
  created_at: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface RejectModal {
  open: boolean;
  doctorId: string;
  doctorName: string;
  reason: string;
}

export default function VerificationsPage() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rejectModal, setRejectModal] = useState<RejectModal>({ open: false, doctorId: '', doctorName: '', reason: '' });
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/pending-doctors');
      setDoctors(response.data);
    } catch (error) {
      showToast('error', 'Failed to load pending doctors. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await api.post(`/admin/verify-doctor/${id}`, { status: 'approved' });
      setDoctors(prev => prev.filter(d => d.id !== id));
      showToast('success', 'Doctor approved successfully! They will be notified.');
    } catch {
      showToast('error', 'Failed to approve doctor. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (doctor: PendingDoctor) => {
    setRejectModal({ open: true, doctorId: doctor.id, doctorName: doctor.full_name, reason: '' });
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('error', 'Please provide a rejection reason.');
      return;
    }
    setProcessing(rejectModal.doctorId);
    try {
      await api.post(`/admin/verify-doctor/${rejectModal.doctorId}`, {
        status: 'rejected',
        reason: rejectModal.reason
      });
      setDoctors(prev => prev.filter(d => d.id !== rejectModal.doctorId));
      setRejectModal({ open: false, doctorId: '', doctorName: '', reason: '' });
      showToast('success', 'Verification rejected. Doctor has been notified.');
    } catch {
      showToast('error', 'Failed to reject. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getDocuments = (docs: any): string[] => {
    if (!docs) return [];
    if (typeof docs === 'string') {
      try { docs = JSON.parse(docs); } catch { return [docs]; }
    }
    if (Array.isArray(docs)) {
      return docs.map((d: any) => (typeof d === 'string' ? d : d?.url || d?.path || '')).filter(Boolean);
    }
    return [];
  };

  const filtered = doctors.filter(d =>
    d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.medical_license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Floating Toasts */}
      <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            "flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm pointer-events-auto animate-in slide-in-from-right-5",
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          )}>
            {t.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(m => ({ ...m, open: false }))} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 z-10">
            <button onClick={() => setRejectModal(m => ({ ...m, open: false }))} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-50 rounded-2xl">
                <XCircle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Reject Verification</h3>
                <p className="text-sm text-slate-500 font-medium">{rejectModal.doctorName}</p>
              </div>
            </div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
            <textarea
              rows={4}
              placeholder="e.g. Invalid license number, Documents unclear, Specialty mismatch..."
              value={rejectModal.reason}
              onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium resize-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 font-medium mt-2">This reason will be sent to the doctor via notification.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRejectModal(m => ({ ...m, open: false }))} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!processing}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-lg shadow-red-200"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Verification</h2>
            {doctors.length > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-black border border-amber-200 animate-pulse">
                {doctors.length} Pending
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium mt-1">Review and verify professional credentials and medical licenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search name, license, specialty..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-72 font-medium text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading pending verifications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
          <ShieldCheck className="mx-auto text-slate-200 mb-4" size={56} />
          <h3 className="text-lg font-black text-slate-700">
            {searchTerm ? 'No results found' : 'All Clear!'}
          </h3>
          <p className="text-slate-400 font-medium text-sm mt-1">
            {searchTerm ? 'Try a different search term.' : 'No doctors are currently awaiting verification.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(doctor => {
            const docs = getDocuments(doctor.verification_documents);
            const isExpanded = expandedDoc === doctor.id;
            return (
              <div key={doctor.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6 flex flex-col lg:flex-row gap-6">
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      {doctor.profile_photo ? (
                        <img src={doctor.profile_photo} alt={doctor.full_name} className="w-14 h-14 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-xl border border-primary/10">
                          {doctor.full_name?.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" title="Pending" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base truncate">{doctor.full_name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{doctor.email}</p>
                      {doctor.phone_number && <p className="text-xs text-slate-400 font-medium">{doctor.phone_number}</p>}
                    </div>
                  </div>

                  {/* Doctor Details */}
                  <div className="flex flex-wrap gap-3 items-start flex-[2]">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <Stethoscope size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">{doctor.specialty || 'Specialty N/A'}</span>
                    </div>
                    {doctor.years_of_experience != null && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
                        <Star size={14} className="text-purple-500" />
                        <span className="text-xs font-bold text-purple-700">{doctor.years_of_experience} yrs exp</span>
                      </div>
                    )}
                    {doctor.clinic_hospital_affiliation && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Building2 size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[160px]">{doctor.clinic_hospital_affiliation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        Applied {new Date(doctor.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openRejectModal(doctor)}
                      disabled={processing === doctor.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(doctor.id)}
                      disabled={processing === doctor.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                    >
                      {processing === doctor.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                  </div>
                </div>

                {/* License + Documents */}
                <div className="px-6 pb-6 flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 w-full sm:w-auto">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">License:</span>
                    <span className="font-mono text-sm font-black text-slate-800">{doctor.medical_license_number || 'Not provided'}</span>
                  </div>

                  {docs.length > 0 ? (
                    <div className="flex-1">
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : doctor.id)}
                        className="flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                      >
                        <FileText size={14} />
                        {docs.length} Document{docs.length > 1 ? 's' : ''} Uploaded
                        <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                      </button>
                      {isExpanded && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {docs.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl text-primary font-bold text-xs hover:bg-primary/10 transition-all"
                            >
                              <FileText size={12} />
                              Document {i + 1}
                              <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                      <AlertCircle size={14} />
                      No verification documents uploaded
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
