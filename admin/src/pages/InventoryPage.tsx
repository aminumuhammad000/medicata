import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Camera,
  Activity,
  Pencil,
  Save,
  Download,
  Upload,
  Filter,
  Building2,
  Layers,
  CalendarPlus,
  Hash,
} from 'lucide-react';
import api from '../services/api';

interface Drug {
  id: string;
  name: string;
  brand_name: string | null;
  category: string | null;
  strength: string | null;
  image_url: string | null;
  pharmacy_count: number;
}

interface InventoryStats {
  total: number;
  categories: number;
  new_this_week: number;
  pharmacies_stocking: number;
}

interface InventoryResponse {
  drugs: Drug[];
  total: number;
  page: number;
  per_page: number;
  stats: InventoryStats;
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CATEGORIES = [
  'Analgesics', 'Antibiotics', 'Antivirals', 'Antifungals', 'Antiparasitics',
  'Cardiovascular', 'Dermatology', 'Diabetes', 'Gastroenterology', 'Neurology',
  'Oncology', 'Ophthalmology', 'Pediatrics', 'Psychiatry', 'Pulmonology',
  'Vitamins & Supplements', 'General',
];

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedDrugId, setSelectedDrugId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const [formContent, setFormContent] = useState({
    name: '', brand_name: '', category: '', strengths: '', image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const perPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await api.get(`/admin/inventory?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormContent({ name: '', brand_name: '', category: '', strengths: '', image_url: '' });
    setSelectedDrugId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (drug: Drug) => {
    setModalMode('edit');
    setFormContent({
      name: drug.name,
      brand_name: drug.brand_name || '',
      category: drug.category || '',
      strengths: drug.strength || '',
      image_url: drug.image_url || ''
    });
    setSelectedDrugId(drug.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formContent, strengths: formContent.strengths ? [formContent.strengths] : [] };
      if (modalMode === 'add') {
        await api.post('/admin/inventory', payload);
      } else {
        await api.put(`/admin/inventory/${selectedDrugId}`, payload);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error('Operation failed:', err);
      alert('Error saving item to inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDrug = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the global catalog?`)) return;
    try {
      await api.delete(`/admin/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      alert('Error deleting drug');
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Name', 'Brand', 'Category', 'Strength', 'Pharmacies Stocking'];
    const rows = data.drugs.map(d => [
      d.name, d.brand_name || '', d.category || '', d.strength || '', d.pharmacy_count
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicata-inventory-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIdx = headers.findIndex(h => h === 'name');
      const brandIdx = headers.findIndex(h => h.includes('brand'));
      const catIdx = headers.findIndex(h => h.includes('category') || h.includes('cat'));
      const strIdx = headers.findIndex(h => h.includes('strength'));
      if (nameIdx === -1) { alert('CSV must have a "Name" column'); return; }

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (!cols[nameIdx]) continue;
        try {
          await api.post('/admin/inventory', {
            name: cols[nameIdx] || '',
            brand_name: brandIdx > -1 ? cols[brandIdx] : '',
            category: catIdx > -1 ? cols[catIdx] : 'General',
            strengths: strIdx > -1 && cols[strIdx] ? [cols[strIdx]] : [],
            image_url: ''
          });
          imported++;
        } catch (_) { /* skip duplicates or errors */ }
      }
      alert(`Successfully imported ${imported} items!`);
      fetchInventory();
    } catch (err) {
      alert('Failed to parse CSV. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (csvImportRef.current) csvImportRef.current.value = '';
    }
  };

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Global Inventory</h2>
          <p className="text-slate-500 font-medium mt-0.5">Master catalog management for medicines and supplies.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchInventory} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm" title="Refresh">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCSV} disabled={!data || data.drugs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm shadow-sm disabled:opacity-40">
            <Download size={16} /> Export CSV
          </button>
          <label className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm shadow-sm cursor-pointer ${isImporting ? 'opacity-60 pointer-events-none' : ''}`}>
            {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            {isImporting ? 'Importing...' : 'Bulk Import'}
            <input ref={csvImportRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold text-sm shadow-lg shadow-primary/20">
            <Plus size={18} /> Register Item
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats?.total.toLocaleString() ?? '—'} icon={Hash} color="bg-blue-50 text-blue-600" sub="In master catalog" />
        <StatCard label="Drug Categories" value={stats?.categories ?? '—'} icon={Layers} color="bg-purple-50 text-purple-600" sub="Unique classifications" />
        <StatCard label="New This Week" value={stats?.new_this_week ?? '—'} icon={CalendarPlus} color="bg-green-50 text-green-600" sub="Added in last 7 days" />
        <StatCard label="Stocking Pharmacies" value={stats?.pharmacies_stocking ?? '—'} icon={Building2} color="bg-amber-50 text-amber-600" sub="Active across network" />
      </div>

      {/* Search & Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by name, brand, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 tracking-tighter ml-auto">
          <Activity size={14} className="text-primary" /> {data?.total ?? 0} items
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Strength</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Pharmacies Stocking</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                        <div className="h-3 bg-slate-100 rounded w-32" />
                      </div>
                    </td>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    ))}
                    <td className="px-6 py-4"><div className="h-3 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data && data.drugs.length > 0 ? (
                data.drugs.map((drug) => (
                  <tr key={drug.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Item */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {drug.image_url ? (
                            <img src={drug.image_url} alt={drug.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package size={18} className="text-slate-300" />
                          )}
                        </div>
                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{drug.name}</p>
                      </div>
                    </td>
                    {/* Brand */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 font-medium italic">{drug.brand_name || <span className="text-slate-300 not-italic">Generic</span>}</p>
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black uppercase text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                        {drug.category || 'Medication'}
                      </span>
                    </td>
                    {/* Strength */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 font-mono">{drug.strength || <span className="text-slate-300 font-normal not-italic">N/A</span>}</p>
                    </td>
                    {/* Pharmacies Stocking */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        drug.pharmacy_count > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        <Building2 size={11} />
                        {drug.pharmacy_count} {drug.pharmacy_count === 1 ? 'Pharmacy' : 'Pharmacies'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(drug)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteDrug(drug.id, drug.name)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                        <Package size={32} className="text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-500">No items found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {debouncedSearch || categoryFilter ? 'Try adjusting your filters.' : 'Register the first item to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > perPage && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)}</span> of{' '}
              <span className="font-bold text-slate-700">{data.total.toLocaleString()}</span> items
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${pageNum === page ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {modalMode === 'add' ? 'Register New Item' : 'Modify Item Details'}
                  </h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Global Inventory Hub</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1">Drug Name <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="e.g. Paracetamol"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300"
                    value={formContent.name} onChange={e => setFormContent({ ...formContent, name: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1">Brand Name</label>
                    <input type="text" placeholder="e.g. Panadol"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      value={formContent.brand_name} onChange={e => setFormContent({ ...formContent, brand_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1">Category</label>
                    <select
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                      value={formContent.category} onChange={e => setFormContent({ ...formContent, category: e.target.value })}>
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1">Strength / Dosage</label>
                  <input type="text" placeholder="e.g. 500mg, 10ml, 5%"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    value={formContent.strengths} onChange={e => setFormContent({ ...formContent, strengths: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1">Image URL</label>
                  <div className="flex gap-2">
                    <input type="url" placeholder="https://..."
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all truncate"
                      value={formContent.image_url} onChange={e => setFormContent({ ...formContent, image_url: e.target.value })} />
                    <button type="button" className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                      <Camera size={20} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
                    Dismiss
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-[2] py-4 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : modalMode === 'add' ? (
                      <><Plus size={20} /> Commit to Catalog</>
                    ) : (
                      <><Save size={20} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
