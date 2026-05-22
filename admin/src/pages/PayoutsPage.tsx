import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Payout {
  id: string;
  pharmacy_name: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_name: string;
  account_number: string;
  account_name: string;
  reference?: string;
  created_at: string;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  // eslint-disable-next-line @typescript_external/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/payouts');
      setPayouts(response.data);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const reference = status === 'completed' ? `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined;
      await api.patch(`/admin/payouts/${id}`, { status, reference });
      fetchPayouts();
    } catch (err) {
      console.error('Error updating payout:', err);
    }
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.account_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'processing': return <Clock size={16} className="text-blue-500 animate-pulse" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Financial <span className="text-primary not-italic">Settlements</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage pharmacy payouts and platform commissions</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} className="text-primary" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0))}
              </h3>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completed</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(payouts.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0))}
              </h3>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(payouts.reduce((acc, p) => acc + p.amount, 0))}
              </h3>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Commission</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(payouts.reduce((acc, p) => acc + p.amount, 0) * 0.1)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border border-white shadow-xl shadow-slate-200/20">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search pharmacy or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-primary transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Pharmacy</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Bank Details</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black">
                        {payout.pharmacy_name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{payout.pharmacy_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-900">{formatCurrency(payout.amount)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        <CreditCard size={14} className="text-slate-400" />
                        {payout.bank_name || 'N/A'}
                      </div>
                      <div className="text-xs font-medium text-slate-500 tracking-tight">{payout.account_number || 'No Account'}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit border capitalize",
                      payout.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      payout.status === 'processing' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      payout.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {payout.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus(payout.id, 'processing')}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-all"
                        >
                          Process
                        </button>
                      )}
                      {payout.status === 'processing' && (
                        <button 
                          onClick={() => updateStatus(payout.id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all"
                        >
                          Complete
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-400 font-bold tracking-tight">No settlement records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
