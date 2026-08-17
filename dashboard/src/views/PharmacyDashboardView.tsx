import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Truck,
  Building2
} from 'lucide-react';
import type { PharmacyOrder, DrugStockItem } from '../types';

interface PharmacyDashboardViewProps {
  activeSection: 'overview' | 'inventory';
  orders: PharmacyOrder[];
  stock: DrugStockItem[];
  onAddDrug: (drug: Omit<DrugStockItem, 'id'>) => void;
  onUpdateOrderStatus: (id: string, status: PharmacyOrder['status']) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const PharmacyDashboardView: React.FC<PharmacyDashboardViewProps> = ({
  activeSection,
  orders,
  stock,
  onAddDrug,
  onUpdateOrderStatus,
  showToast
}) => {
  // Inventory form states
  const [drugName, setDrugName] = useState('');
  const [drugCategory, setDrugCategory] = useState('Antibiotics');
  const [drugBrand, setDrugBrand] = useState('Emzor');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-08-17');

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 transition-all duration-200 text-left`;

  // Stats calculation
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const completedOrders = orders.filter(o => ['completed', 'picked_up', 'delivered'].includes(o.status)).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  const formatCurrency = (amountKobo: number) => {
    return `₦${(amountKobo / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleAddDrugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    const parsedQty = parseInt(quantity);
    if (!drugName || isNaN(parsedPrice) || isNaN(parsedQty) || parsedPrice <= 0 || parsedQty < 0) {
      showToast("Please enter valid drug listing details.", "info");
      return;
    }

    onAddDrug({
      drug_name: drugName,
      drug_category: drugCategory,
      drug_brand: drugBrand,
      price: Math.round(parsedPrice * 100),
      quantity: parsedQty,
      expiry_date: expiryDate,
      is_available: parsedQty > 0
    });

    setDrugName('');
    setPrice('');
    setQuantity('');
    showToast("Medication successfully registered in Pharmacy Stock.", "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 size={14} />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">
            {activeSection === 'overview' && "Fulfillment Operations Desk"}
            {activeSection === 'inventory' && "Real-Time Pharmacy Drug Stock"}
          </h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
          {activeSection === 'overview' && "Manage incoming prescription drug orders, dispatch couriers, and track fulfillment status."}
          {activeSection === 'inventory' && "Log medication inventory levels, update unit pricing, and track lot expiry periods."}
        </p>
      </div>

      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Unfulfilled Orders</span>
              <span className={`text-xl font-bold ${pendingOrders > 0 ? 'text-amber-500' : 'text-slate-850 dark:text-slate-100'}`}>
                {pendingOrders} Pending
              </span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">In Processing</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{processingOrders} Orders</span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Total Dispatched</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{completedOrders} Fulfilled</span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Incoming Orders Ledger</h3>
            
            <div className="space-y-2.5">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{ord.patient_name}</span>
                        <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500">#{ord.id}</span>
                        <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          ord.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20' :
                          ord.status === 'processing' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20' :
                          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      {/* Order Items */}
                      <div className="mt-2 space-y-1">
                        {ord.items.map((item, index) => (
                          <div key={index} className="text-[10.5px] text-slate-550 dark:text-slate-400 font-medium">
                            {item.name} &bull; <span className="font-semibold">Qty {item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[9.5px] text-slate-400 mt-2 block">
                        Ordered: {new Date(ord.created_at).toLocaleDateString()} at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-end md:self-stretch">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                      {formatCurrency(ord.total_amount)}
                    </span>
                    
                    <div className="flex gap-2">
                      {ord.status === 'pending' && (
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(ord.id, 'processing');
                            showToast("Order status updated to Processing.", "info");
                          }}
                          className="h-8 px-3 rounded-lg bg-primary hover:bg-[#1a64bf] text-white text-[10.5px] font-semibold cursor-pointer transition-colors"
                        >
                          Fulfill Order
                        </button>
                      )}
                      {ord.status === 'processing' && (
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(ord.id, 'completed');
                            showToast("Order completed & couriers dispatched.", "success");
                          }}
                          className="h-8 px-3 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white text-[10.5px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Truck size={12} />
                          Dispatch Courier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Inventory Table (7 cols) */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3 overflow-hidden">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider mb-2">Stock Inventory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider text-left font-bold">
                    <th className="pb-2">Drug Info</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {stock.map((item) => (
                    <tr key={item.id} className="text-slate-700 dark:text-slate-200">
                      <td className="py-2.5 pr-2">
                        <span className="font-bold block leading-tight">{item.drug_name}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{item.drug_brand} &bull; {item.drug_category}</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold font-mono">{formatCurrency(item.price)}</td>
                      <td className="py-2.5 text-right font-medium">{item.quantity} units</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                          item.quantity > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100/50'
                        }`}>
                          {item.quantity > 0 ? "IN STOCK" : "OUT"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Drug Listing Form (5 cols) */}
          <div className={`${card3dClass} md:col-span-5`}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package size={13.5} className="text-primary" />
              Register New Drug
            </h3>

            <form onSubmit={handleAddDrugSubmit} className="space-y-3">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Insulin Glargine"
                  value={drugName}
                  onChange={e => setDrugName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={drugCategory}
                    onChange={e => setDrugCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics (Pain Relief)">Analgesics</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Manufacturer</label>
                  <select
                    value={drugBrand}
                    onChange={e => setDrugBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  >
                    <option value="Emzor">Emzor</option>
                    <option value="Pfizer">Pfizer</option>
                    <option value="GSK">GSK</option>
                    <option value="Fidson">Fidson</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Price (NGN)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Initial Qty</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 mt-2 cursor-pointer"
              >
                Register Medication
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
