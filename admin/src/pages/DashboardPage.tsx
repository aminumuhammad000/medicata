import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserSquare2, 
  Activity, 
  TrendingUp
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Mon', revenue: 140000, consultations: 24 },
  { name: 'Tue', revenue: 230000, consultations: 38 },
  { name: 'Wed', revenue: 190000, consultations: 29 },
  { name: 'Thu', revenue: 278000, consultations: 45 },
  { name: 'Fri', revenue: 389000, consultations: 52 },
  { name: 'Sat', revenue: 439000, consultations: 68 },
  { name: 'Sun', revenue: 349000, consultations: 48 },
];

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({
    total_patients: 0,
    total_doctors: 0,
    total_pharmacies: 0,
    total_orders: 0,
    total_consultations: 0,
    total_revenue: 0,
    pending_verifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStatsData(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const navigate = useNavigate();

  const stats = [
    { label: 'Total Patients', value: statsData.total_patients.toLocaleString(), icon: Users, color: 'text-blue-500', link: '/patients', trend: '+15.2%', trendUp: true },
    { label: 'Verified Doctors', value: statsData.total_doctors.toLocaleString(), icon: UserSquare2, color: 'text-purple-500', link: '/doctors', trend: '+8.4%', trendUp: true },
    { label: 'Active Pharmacies', value: statsData.total_pharmacies.toLocaleString(), icon: Activity, color: 'text-green-500', link: '/pharmacies', trend: '+12.1%', trendUp: true },
    { label: 'Net Revenue', value: `₦${statsData.total_revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', link: '/revenue', trend: '+22.5%', trendUp: true },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <button 
            key={stat.label} 
            onClick={() => navigate(stat.link)}
            className="stat-card group hover:border-primary/50 transition-all cursor-pointer bg-white shadow-sm border-slate-200 text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-black mt-1 text-slate-900 group-hover:text-primary transition-colors">{isLoading ? '...' : stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform shadow-inner", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className={cn(
              "mt-4 flex items-center gap-2 text-xs font-bold self-start px-2 py-1 rounded-full border w-fit",
              stat.trendUp ? "text-green-600 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"
            )}>
              <TrendingUp size={12} className={cn(!stat.trendUp && "rotate-180")} />
              <span>{stat.trend} from last week</span>
            </div>
          </button>

        ))}
      </div>

      <div className="glass rounded-3xl p-8 shadow-sm col-span-1 lg:col-span-4 mt-8 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Platform Performance</h3>
            <p className="text-sm font-medium text-slate-500">Weekly revenue vs consultation volume</p>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₦${value/1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area yAxisId="right" type="monotone" dataKey="consultations" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" name="Consultations" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

