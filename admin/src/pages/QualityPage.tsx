import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Star, 
  Search, 
  MessageCircle, 
  User, 
  Stethoscope, 
  AlertTriangle,
  Flag,
  CheckCircle2,
  ThumbsDown
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface QualityReport {
  id: string;
  reviewer_name: string;
  doctor_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function QualityPage() {
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/quality-reports');
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching quality reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter(r => 
    filter === 'critical' ? r.rating <= 2 : 
    filter === 'good' ? r.rating >= 4 : true
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Quality <span className="text-primary not-italic">Control Hub</span>
          </h1>
          <p className="text-slate-500 font-medium">Monitoring platform trust and professional performance through patient feedback</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm">
            {[
                { id: 'all', label: 'All Reviews' },
                { id: 'critical', label: 'Critical (1-2★)' },
                { id: 'good', label: 'Excellent (4-5★)' },
            ].map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => setFilter(btn.id)}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        filter === btn.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    {btn.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border border-white space-y-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Critical Alerts</h3>
            <p className="text-sm font-medium text-slate-500">Found {reports.filter(r => r.rating <= 2).length} reviews requiring immediate administrative investigation.</p>
        </div>
        <div className="glass p-8 rounded-[2.5rem] border border-white space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Patient Trust Rate</h3>
            <h4 className="text-3xl font-black text-slate-900">98.4%</h4>
        </div>
        <div className="glass p-8 rounded-[2.5rem] border border-white space-y-4">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <Star size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Total Feedbacks</h3>
            <h4 className="text-3xl font-black text-slate-900">{reports.length}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-100 rounded-[2.5rem] animate-pulse" />)
        ) : filtered.map((report) => (
          <div key={report.id} className={cn(
            "p-8 rounded-[2.5rem] border transition-all hover:scale-[1.01]",
            report.rating <= 2 ? "bg-red-50/50 border-red-100" : "bg-white border-slate-100 shadow-sm"
          )}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black",
                        report.rating <= 2 ? "bg-red-500 shadow-lg shadow-red-200" : "bg-primary shadow-lg shadow-primary/20"
                    )}>
                        {report.reviewer_name[0]}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 tracking-tight">{report.reviewer_name}</h4>
                        <div className="flex items-center gap-1">
                            {Array(5).fill(0).map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={12} 
                                    className={cn(i < report.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(report.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <Stethoscope size={20} className="text-slate-400" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Consulted Doctor</p>
                        <h5 className="font-bold text-slate-700">{report.doctor_name}</h5>
                    </div>
                </div>

                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                    "{report.comment || "Patient did not leave a written comment for this consultation."}"
                </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:border-primary hover:text-primary transition-all">
                    <MessageCircle size={14} />
                    View Call Context
                </button>
                <button className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    report.rating <= 2 ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}>
                    <Flag size={14} />
                    {report.rating <= 2 ? 'Investigate Incident' : 'Archive'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
