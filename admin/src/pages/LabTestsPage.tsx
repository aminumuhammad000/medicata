import { useState, useEffect } from 'react';
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
  Stethoscope
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

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/lab-tests');
      setTests(response.data);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(t => 
    t.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.test_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Diagnostic <span className="text-primary not-italic">Oversight</span>
          </h1>
          <p className="text-slate-500 font-medium">Monitor all laboratory investigations and diagnostic tests</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} className="text-primary" />
            Full Diagnostics Audit
          </button>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border border-white shadow-xl shadow-slate-200/20">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search patient or test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all">
            <Filter size={18} className="text-primary" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Diagnostic Investigation</th>
                <th className="px-8 py-5">Patient Details</th>
                <th className="px-8 py-5">Assigned Physician</th>
                <th className="px-8 py-5">Current Status</th>
                <th className="px-8 py-5 text-right">Result Artifact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTests.map((test) => (
                <tr key={test.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                        <Beaker size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase italic tracking-tight">{test.test_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{test.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User size={16} className="text-primary" />
                      <span className="font-bold">{test.patient_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Stethoscope size={16} className="text-emerald-500" />
                      <span className="font-bold">Dr. {test.doctor_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit border capitalize",
                      test.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      test.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {test.status === 'completed' ? <CheckCircle2 size={14} /> : 
                       test.status === 'pending' ? <Clock size={14} /> : <AlertCircle size={14} />}
                      {test.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {test.result_url ? (
                      <a 
                        href={test.result_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200"
                      >
                        <FileText size={14} />
                        View Result
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 italic">No Result Uploaded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTests.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-bold">No diagnostic investigations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
