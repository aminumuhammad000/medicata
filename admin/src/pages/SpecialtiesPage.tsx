import { useState, useEffect, useMemo } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Trash2, 
  Heart, 
  Baby, 
  User, 
  Bone, 
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Activity,
  Trees,
  Search,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
  doctor_count: number;
}

interface SpecialtiesResponse {
  specialties: Specialty[];
  total: number;
  total_doctors_assigned: number;
}

export default function SpecialtiesPage() {
  const [data, setData] = useState<SpecialtiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSpec, setNewSpec] = useState({ name: '', icon: 'Stethoscope', description: '' });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ALL_ICONS = ['Heart', 'Baby', 'User', 'Bone', 'Stethoscope', 'Sparkles', 'Eye', 'Activity', 'Trees'];

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/specialties');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching specialties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newSpec.name.trim()) return alert("Specialty name is required");
    
    try {
      if (editingId) {
        await api.put(`/admin/specialties/${editingId}`, newSpec);
      } else {
        await api.post('/admin/specialties', newSpec);
      }
      closeModal();
      fetchSpecialties();
    } catch (err) {
      alert(`Failed to ${editingId ? 'update' : 'add'} specialty`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/specialties/${id}`);
      setDeletingId(null);
      fetchSpecialties();
    } catch (err) {
      alert("Failed to delete specialty. Ensure no doctors are actively assigned to it.");
    }
  };

  const openEditModal = (spec: Specialty) => {
    setEditingId(spec.id);
    setNewSpec({ name: spec.name, icon: spec.icon || 'Stethoscope', description: spec.description || '' });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewSpec({ name: '', icon: 'Stethoscope', description: '' });
  };

  const getIcon = (name: string) => {
    const iconMap: any = {
      'Heart': <Heart size={20} />,
      'Baby': <Baby size={20} />,
      'User': <User size={20} />,
      'Bone': <Bone size={20} />,
      'Stethoscope': <Stethoscope size={20} />,
      'Sparkles': <Sparkles size={20} />,
      'Eye': <Eye size={20} />,
      'Activity': <Activity size={20} />,
      'Trees': <Trees size={20} />,
    };
    return iconMap[name] || <Stethoscope size={20} />;
  };

  const exportCSV = () => {
    if (!data?.specialties) return;
    const headers = ['ID', 'Name', 'Description', 'Doctor Count'];
    const rows = data.specialties.map(s => [
      s.id, s.name, s.description || 'N/A', s.doctor_count
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicata_specialties_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSpecialties = useMemo(() => {
    if (!data) return [];
    return data.specialties.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Medical <span className="text-primary not-italic">Taxonomy</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage specialties and platform medical departments</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} className="text-primary" />
            Export Taxonomy
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all"
          >
            <Plus size={20} />
            Create Department
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-4 rounded-2xl text-white shadow-lg bg-indigo-500">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Specialties</p>
            <h3 className="text-2xl font-black text-slate-900">{data?.total ?? '—'}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-4 rounded-2xl text-white shadow-lg bg-emerald-500">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Doctors Matched</p>
            <h3 className="text-2xl font-black text-slate-900">{data?.total_doctors_assigned ?? '—'}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-4 rounded-2xl text-white shadow-lg bg-amber-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Status</p>
            <h3 className="text-2xl font-black text-slate-900">Synchronized</h3>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden border border-white shadow-xl shadow-slate-200/20 p-6 flex flex-col md:flex-row gap-4">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search medical departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-slate-700 shadow-sm"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse" />
            ))
        ) : filteredSpecialties.map((spec) => (
          <div key={spec.id} className="glass p-8 rounded-[2.5rem] border border-white hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setDeletingId(spec.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors -z-10" />
            
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                {getIcon(spec.icon)}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic truncate">{spec.name}</h3>
            
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 flex-grow line-clamp-3">
                {spec.description || `Specialized medical services focusing on comprehensive ${spec.name.toLowerCase()} care and patient diagnostics.`}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <User size={12} className="text-emerald-500" />
                      Assigned Experts
                  </span>
                  <span className="text-lg font-black text-slate-700">{spec.doctor_count}</span>
                </div>
                
                <button onClick={() => openEditModal(spec)} className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-widest hover:gap-3 transition-all bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10">
                    Edit
                    <ChevronRight size={14} />
                </button>
            </div>
          </div>
        ))}
        {filteredSpecialties.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
             <p className="text-slate-400 text-lg font-bold">No specialties matched your search</p>
          </div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Specialty?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">This action cannot be undone. Are you sure you want to remove this medical department?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeletingId(null)} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} className="px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit Department' : 'New Medical Specialty'}</h2>
                        <p className="text-slate-500 font-bold text-sm italic">Define a category for doctor searches</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Specialty Name</label>
                        <input 
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-primary outline-none transition-all"
                            placeholder="e.g. Neurology"
                            value={newSpec.name}
                            onChange={e => setNewSpec({...newSpec, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assign Icon</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {ALL_ICONS.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewSpec({...newSpec, icon})}
                                    className={cn(
                                        "p-3 rounded-2xl flex flex-col items-center gap-2 transition-all",
                                        newSpec.icon === icon ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-slate-200"
                                    )}
                                >
                                    {getIcon(icon)}
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea 
                            rows={3}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-primary outline-none transition-all resize-none"
                            placeholder="A brief overview of this medical department..."
                            value={newSpec.description}
                            onChange={e => setNewSpec({...newSpec, description: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                    <button 
                        onClick={closeModal}
                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        {editingId ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
