import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  User,
  Store,
  Calendar,
  RefreshCw,
  Hash,
  ArrowRight,
  Filter,
  DollarSign,
  Download,
  X,
  Package,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';

interface Order {
  id: string;
  patient_name: string;
  pharmacy_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  items_count: number;
}

interface OrdersStats {
  total: number;
  revenue: number;
  processing: number;
  delivered: number;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  per_page: number;
  stats: OrdersStats;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CreditCard },
  processing: { label: 'Processing', color: 'bg-sky-50 text-sky-600 border-sky-100', icon: RefreshCw },
  shipped: { label: 'Shipped', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
};

export default function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateRange !== 'all') params.set('date_range', dateRange);

      const res = await api.get(`/admin/orders?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amt / 100);
  };

  const exportCSV = () => {
    if (!data || data.orders.length === 0) return;
    const headers = ['Order ID', 'Patient', 'Pharmacy', 'Total Amount', 'Status', 'Payment Status', 'Items', 'Date'];
    const rows = data.orders.map(o => [
      o.id.slice(-8).toUpperCase(),
      o.patient_name,
      o.pharmacy_name,
      formatCurrency(o.total_amount),
      o.status,
      o.payment_status,
      o.items_count,
      new Date(o.created_at).toLocaleString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata-orders-page${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cancelOrder = async (id: string) => {
    if (!window.confirm(`FORCE CANCEL & REFUND order #${id.slice(-8).toUpperCase()}?\n\nThis will mark the order as cancelled and the payment as refunded. This action cannot be undone.`)) return;
    try {
      await api.patch(`/admin/orders/${id}/cancel`);
      alert('Order has been forcefully cancelled and marked for refund.');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error cancelling order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Transaction Registry</h2>
          <p className="text-slate-500 font-medium">Tracking all pharmacy orders and payment flows across the network.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!data || data.orders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm shadow-sm disabled:opacity-40"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Quick Look — now wired to real backend data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
               <ShoppingBag size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Orders</p>
               <h4 className="text-xl font-black text-slate-900">{stats?.total.toLocaleString() ?? '—'}</h4>
            </div>
         </div>
         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
               <DollarSign size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue Volume</p>
               <h4 className="text-xl font-black text-slate-900">{stats ? formatCurrency(stats.revenue) : '—'}</h4>
            </div>
         </div>
         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processing</p>
               <h4 className="text-xl font-black text-slate-900">{stats?.processing.toLocaleString() ?? '—'}</h4>
            </div>
         </div>
         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
               <Package size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivered</p>
               <h4 className="text-xl font-black text-slate-900">{stats?.delivered.toLocaleString() ?? '—'}</h4>
            </div>
         </div>
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search Order ID, Patient, or Pharmacy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        <div className="relative w-full max-w-[180px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="relative w-full max-w-[180px]">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 animate-pulse space-y-4">
               <div className="h-6 bg-slate-50 rounded w-1/4" />
               <div className="h-10 bg-slate-50 rounded" />
            </div>
          ))
        ) : data && data.orders.length > 0 ? (
          data.orders.map((order) => {
            const status = statusConfig[order.status.toLowerCase()] || statusConfig.pending;
            const StatusIcon = status.icon;
            
            return (
              <div key={order.id} className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* ID & Date */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                        <Hash size={14} />
                      </span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Order ID</span>
                      <span className="text-sm font-black text-slate-900">...{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-bold italic">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Flow: Patient -> Pharmacy */}
                  <div className="flex-1 flex items-center justify-center gap-4 lg:gap-8 px-4">
                     <div className="text-right flex-1 min-w-0">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient</span>
                          <User size={12} className="text-slate-300" />
                        </div>
                        <h5 className="font-black text-slate-900 truncate">{order.patient_name}</h5>
                     </div>
                     
                     <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <ArrowRight size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{order.items_count} items</span>
                     </div>

                     <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center justify-start gap-2 mb-1">
                          <Store size={12} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pharmacy</span>
                        </div>
                        <h5 className="font-black text-slate-900 truncate">{order.pharmacy_name}</h5>
                     </div>
                  </div>

                  {/* Pricing & Status */}
                  <div className="flex items-center justify-end gap-6 lg:border-l border-slate-100 lg:pl-8">
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(order.total_amount)}</h4>
                     </div>

                     <div className="flex flex-col items-end gap-2 min-w-[120px]">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2 border ${status.color}`}>
                           <StatusIcon size={12} />
                           {status.label}
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded italic ${order.payment_status === 'paid' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                           Payment: {order.payment_status.toUpperCase()}
                        </div>
                     </div>
                  </div>
                </div>

                {/* Hover Action — NOW WIRED */}
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => setSelectedOrder(order)}
                     className="p-2 bg-primary text-white rounded-xl shadow-sm hover:scale-105 transition-all"
                   >
                     <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
               <ShoppingBag size={40} />
             </div>
             <h3 className="font-black text-slate-900 text-xl tracking-tight">Orders Ledger Empty</h3>
             <p className="text-slate-500 font-medium max-w-xs mx-auto text-sm mt-1">No transactions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > perPage && (
        <div className="flex items-center justify-center gap-2 pt-4">
           <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
             <ChevronLeft size={20} />
           </button>
           <div className="px-6 py-2 bg-white border border-slate-200 rounded-2xl font-black text-sm shadow-sm flex items-center gap-1">
             {page} <span className="text-slate-300 font-medium">of</span> {totalPages}
           </div>
           <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
             <ChevronRight size={20} />
           </button>
        </div>
      )}

      {/* Order Detail + Admin Override Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-md animate-in zoom-in-95 duration-200">
             <button onClick={() => setSelectedOrder(null)} className="absolute right-6 top-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition">
               <X size={18} />
             </button>

             <h3 className="text-xl font-black text-slate-900 mb-1">Order Details</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">#{selectedOrder.id}</p>

             <div className="mt-8 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-sm font-bold text-slate-500 mb-3">Transaction Participants</div>
                   <div className="flex items-center gap-3 mb-2">
                      <User size={16} className="text-blue-500" />
                      <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</span>
                        <p className="font-black text-slate-900">{selectedOrder.patient_name}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <Store size={16} className="text-indigo-500" />
                      <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pharmacy</span>
                        <p className="font-black text-slate-900">{selectedOrder.pharmacy_name}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</div>
                      <div className="text-lg font-black text-slate-900">{formatCurrency(selectedOrder.total_amount)}</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Items</div>
                      <div className="text-lg font-black text-slate-900">{selectedOrder.items_count} SKUs</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order Status</div>
                      <div className="text-sm font-black text-slate-900 uppercase">{selectedOrder.status}</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment</div>
                      <div className={`text-sm font-black uppercase ${selectedOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedOrder.payment_status}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created</div>
                   <div className="text-sm font-black text-slate-900">
                     {new Date(selectedOrder.created_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition"
                >
                   Dismiss
                </button>
                {selectedOrder.status.toLowerCase() !== 'cancelled' && selectedOrder.status.toLowerCase() !== 'delivered' && (
                  <button 
                    onClick={() => cancelOrder(selectedOrder.id)}
                    className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 shadow-md transition flex items-center justify-center gap-2"
                  >
                     <AlertTriangle size={18} />
                     Force Cancel & Refund
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
