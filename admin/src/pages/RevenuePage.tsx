import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  ArrowUpRight,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '../utils/cn';

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface PharmacyRevenue {
  name: string;
  amount: number;
  order_count: number;
}

interface StatusRevenue {
  status: string;
  amount: number;
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: MonthlyRevenue[];
  pharmacy_performance: PharmacyRevenue[];
  revenue_by_status: StatusRevenue[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function RevenuePage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/revenue');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching revenue stats:', err);
      setError('Failed to load revenue data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Revenue <span className="text-primary not-italic">Analytics</span>
          </h1>
          <p className="text-slate-500 font-medium">Financial performance and growth metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={18} className="text-primary" />
            Last 12 Months
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={80} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Gross Revenue
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {formatCurrency(stats.total_revenue)}
            </span>
            <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-sm bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
              <TrendingUp size={16} />
              +12.5% from last month
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <CreditCard size={80} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Transactions
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {stats.pharmacy_performance.reduce((acc, curr) => acc + Number(curr.order_count), 0)}
            </span>
            <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-sm bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
              <TrendingUp size={16} />
              +8.2% volume increase
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Activity size={80} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Average Order Value
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {formatCurrency(stats.total_revenue / (stats.pharmacy_performance.reduce((acc, curr) => acc + Number(curr.order_count), 0) || 1))}
            </span>
            <div className="flex items-center gap-2 mt-4 text-orange-500 font-bold text-sm bg-orange-50 w-fit px-3 py-1 rounded-full border border-orange-100">
              <TrendingDown size={16} />
              -2.1% slightly down
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">Revenue <span className="text-primary not-italic">Growth</span></h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <div className="w-3 h-3 rounded-full bg-primary" />
                Revenue
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly_revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 12}}
                  tickFormatter={(value) => `₦${(value/1000)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pharmacy Top Performers */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">Top <span className="text-primary not-italic">Pharmacies</span></h3>
            <Filter size={18} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="space-y-4">
            {stats.pharmacy_performance.map((pharmacy, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                    i === 0 ? "bg-amber-100 text-amber-600" : 
                    i === 1 ? "bg-slate-100 text-slate-600" :
                    "bg-primary/10 text-primary"
                  )}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{pharmacy.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{pharmacy.order_count} Orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{formatCurrency(pharmacy.amount)}</p>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1 justify-end">
                    <ArrowUpRight size={12} />
                    High Margin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <div className="glass p-8 rounded-3xl space-y-6 lg:col-span-1">
          <h3 className="text-xl font-black text-slate-900 italic uppercase">Revenue <span className="text-primary not-italic">by Status</span></h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.revenue_by_status}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                  nameKey="status"
                >
                  {stats.revenue_by_status.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {stats.revenue_by_status.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-bold text-slate-500 capitalize">{item.status}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Transactions List Placeholder/Teaser */}
        <div className="glass p-8 rounded-3xl space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">Recent <span className="text-primary not-italic">Earnings</span></h3>
            <button className="text-primary font-bold text-sm hover:underline">View All History</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4">Transaction ID</th>
                  <th className="pb-4">Pharmacy</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-mono text-xs text-slate-400 tracking-tighter">
                      TXN-{(Math.random() * 100000).toFixed(0).padStart(6, '0')}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-slate-900">Partner Pharmacy {i + 1}</div>
                    </td>
                    <td className="py-4 text-sm text-slate-500 font-medium tracking-tight">May {20 - i}, 2026</td>
                    <td className="py-4 text-right">
                      <span className="font-black text-slate-900">{formatCurrency(15000 + (Math.random() * 50000))}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
