import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Tag, 
  User, 
  Stethoscope, 
  Activity, 
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye
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

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/prescriptions');
      setPrescriptions(res.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = prescriptions.filter(p => 
    p.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Prescription <span className="text-primary not-italic">Ledger</span>
          </h1>
          <p className="text-slate-500 font-medium">Global audit trail for all digital prescriptions issued on platform</p>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by patient, drug or doctor..."
            className="pl-14 pr-8 py-4 w-96 bg-white border-2 border-slate-100 rounded-[2rem] font-bold focus:border-primary outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass rounded-[2.5rem] border border-white overflow-hidden shadow-xl shadow-slate-200/50">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-white">
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
          <tbody className="divide-y divide-slate-50">
            {loading ? (
                <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-300 font-bold animate-pulse uppercase tracking-widest">Fetching Prescription Records...</td>
                </tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-white/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <FileText size={16} />
                    </div>
                    <span className="font-mono text-xs text-slate-400 font-black">#{p.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="font-bold text-slate-900">{p.patient_name}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID Verified</div>
                </td>
                <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                        <Tag size={14} className="text-primary" />
                        <span className="font-black text-slate-700 italic uppercase italic">{p.medication_name}</span>
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
                        <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
                            <Eye size={16} />
                        </button>
                        <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
                            <Download size={16} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
            <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <Activity size={32} />
                </div>
                <p className="text-slate-400 font-bold italic">No prescriptions found for "{searchTerm}"</p>
            </div>
        )}
      </div>
    </div>
  );
}
