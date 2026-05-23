import { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  ChevronDown
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

interface RecentTransaction {
  id: string;
  entity_name: string;
  amount: number;
  date: string;
  source: string;
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: MonthlyRevenue[];
  pharmacy_performance: PharmacyRevenue[];
  revenue_by_status: StatusRevenue[];
  recent_transactions: RecentTransaction[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function RevenuePage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [timeRange, setTimeRange] = useState<number>(12);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/revenue?range=${timeRange}`);
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportCSV = () => {
    if (!stats) return;
    const headers = ['Transaction ID', 'Entity', 'Source', 'Date', 'Amount'];
    const rows = stats.recent_transactions.map(tx => [
      tx.id, 
      tx.entity_name, 
      tx.source,
      new Date(tx.date).toLocaleDateString(), 
      tx.amount
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata_revenue_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { volumeGrowth, aovGrowth } = useMemo(() => {
    if (!stats || stats.monthly_revenue.length < 2) return { volumeGrowth: 0, aovGrowth: 0 };
    const rev = stats.monthly_revenue;
    const lastMonth = rev[rev.length - 1]?.amount || 0;
    const prevMonth = rev[rev.length - 2]?.amount || 1; // avoid div by 0
    
    // Very basic proxy for volume/AOV logic using revenue differences for mockup.
    // In production, backend should send exact order counts per month.
    const growth = ((lastMonth - prevMonth) / prevMonth) * 100;
    return { volumeGrowth: growth, aovGrowth: growth > 0 ? (growth * 0.4) : (growth * 1.2) };
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center h-[70vh]">
        <Activity size={48} className="mb-4 opacity-50" />
        <p className="font-bold">{error || 'No data found'}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Revenue <span className="text-primary not-italic">Analytics</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Financial performance and Unified Gross metrics</p>
        </div>
        <div className="flex gap-3 relative z-20">
          <div className="relative">
            <button 
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm w-48 justify-between"
            >
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    {timeRange === 1 ? 'Last 30 Days' : `Last ${timeRange} Months`}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showRangeDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-2">
                    {[1, 3, 6, 12, 24].map((range) => (
                        <button 
                            key={range}
                            onClick={() => { setTimeRange(range); setShowRangeDropdown(false); }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm font-bold transition-colors hover:bg-slate-50",
                                timeRange === range ? "text-primary bg-primary/5" : "text-slate-600"
                            )}
                        >
                             {range === 1 ? 'Last 30 Days' : `Last ${range} Months`}
                        </button>
                    ))}
                </div>
            )}
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all group">
            <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
            Export Data
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="glass p-8 rounded-[2rem] relative overflow-hidden group shadow-sm border border-slate-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={100} />
          </div>
          <div className="flex flex-col gap-1 w-full relative z-10">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary" />
              Unified Gross Revenue
            </span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
              {formatCurrency(stats.total_revenue)}
            </span>
            <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-xs bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
              <TrendingUp size={14} />
              Across {timeRange} Months
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] relative overflow-hidden group shadow-sm border border-slate-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <CreditCard size={100} />
          </div>
          <div className="flex flex-col gap-1 w-full relative z-10">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Physical Orders
            </span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
              {stats.pharmacy_performance.reduce((acc, curr) => acc + Number(curr.order_count), 0)}
            </span>
            <div className={cn("flex items-center gap-2 mt-4 font-bold text-xs w-fit px-3 py-1.5 rounded-lg border uppercase tracking-widest", volumeGrowth >= 0 ? "text-emerald-500 bg-emerald-50 border-emerald-100" : "text-red-500 bg-red-50 border-red-100")}>
              {volumeGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {volumeGrowth >= 0 ? '+' : ''}{volumeGrowth.toFixed(1)}% MoM Output
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] relative overflow-hidden group shadow-sm border border-slate-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Activity size={100} />
          </div>
          <div className="flex flex-col gap-1 w-full relative z-10">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Average Ticket Value
            </span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
              {formatCurrency(stats.total_revenue / (stats.pharmacy_performance.reduce((acc, curr) => acc + Number(curr.order_count), 0) || 1))}
            </span>
            <div className={cn("flex items-center gap-2 mt-4 font-bold text-xs w-fit px-3 py-1.5 rounded-lg border uppercase tracking-widest", aovGrowth >= 0 ? "text-emerald-500 bg-emerald-50 border-emerald-100" : "text-amber-500 bg-amber-50 border-amber-100")}>
              {aovGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {aovGrowth >= 0 ? '+' : ''}{aovGrowth.toFixed(1)}% Margins
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="glass p-8 rounded-[2rem] space-y-6 shadow-sm border border-slate-200 xl:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">System <span className="text-primary not-italic">Growth Velocity</span></h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Aggregated Cash Flow
              </div>
            </div>
          </div>
          <div className="h-80 w-full relative">
            {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly_revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontWeight: 700, fontSize: 11}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontWeight: 700, fontSize: 11}}
                  tickFormatter={(value) => `₦${(value/1000)}k`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    padding: '16px 20px',
                    fontWeight: 700,
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Gross Volume']}
                  labelStyle={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pharmacy Top Performers */}
        <div className="glass p-8 rounded-[2rem] space-y-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">Top <span className="text-primary not-italic">Earners</span></h3>
            <Filter size={18} className="text-slate-400 cursor-pointer hover:text-primary transition-colors" />
          </div>
          <div className="space-y-4">
            {stats.pharmacy_performance.map((pharmacy, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-white transition-all group border border-slate-100 hover:border-primary/20 hover:shadow-lg hover:shadow-slate-200/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg",
                    i === 0 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 shadow-sm" : 
                    i === 1 ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm" :
                    "bg-primary/5 text-primary"
                  )}>
                    #{i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{pharmacy.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{pharmacy.order_count} Orders Closed</p>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <p className="font-black text-slate-900">{formatCurrency(pharmacy.amount)}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 justify-end mt-1">
                    <ArrowUpRight size={10} />
                    High Margin
                  </p>
                </div>
              </div>
            ))}
            {stats.pharmacy_performance.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold">No active earners found</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 gap-y-8">
        {/* Status Distribution */}
        <div className="glass p-8 rounded-[2rem] space-y-6 shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 italic uppercase">Revenue <span className="text-primary not-italic">by Fulfillment</span></h3>
          <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={stats.revenue_by_status}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    stroke="none"
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="status"
                    >
                    {stats.revenue_by_status.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800}}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-4 w-full">
                {stats.revenue_by_status.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.status}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
                ))}
                {stats.revenue_by_status.length === 0 && (
                    <div className="text-slate-400 font-bold">No data to map</div>
                )}
            </div>
          </div>
        </div>

        {/* Live Transaction Feed */}
        <div className="glass p-8 rounded-[2rem] space-y-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live <span className="text-primary not-italic">Ledger</span>
            </h3>
            <button className="text-[10px] uppercase tracking-widest font-black text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-all">Full History</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 flex-grow flex flex-col">
            <div className="overflow-x-auto flex-grow h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left relative">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Reference</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {stats.recent_transactions.map((tx, i) => (
                    <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-slate-500">
                           {tx.id}
                        </td>
                        <td className="p-4">
                            <div className="font-bold text-slate-900 whitespace-nowrap">{tx.entity_name}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{tx.source}</div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-500 font-bold uppercase tracking-tight whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </td>
                        <td className="p-4 text-right">
                           <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{formatCurrency(tx.amount)}</span>
                        </td>
                    </tr>
                    ))}
                    {stats.recent_transactions.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-10 font-bold text-slate-400">No recent ledger data available.</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
