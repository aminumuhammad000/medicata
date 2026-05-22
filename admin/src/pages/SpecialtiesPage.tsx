import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Trash2, 
  Heart, 
  Baby, 
  User, 
  Bone, 
  Sparkles,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpec, setNewSpec] = useState({ name: '', icon: 'Stethoscope', description: '' });

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/specialties');
      setSpecialties(res.data);
    } catch (err) {
      console.error('Error fetching specialties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.post('/admin/specialties', newSpec);
      setShowAddModal(false);
      fetchSpecialties();
    } catch (err) {
      alert('Failed to add specialty');
    }
  };

  const getIcon = (name: string) => {
    const iconMap: any = {
      'Heart': <Heart size={20} />,
      'Baby': <Baby size={20} />,
      'User': <User size={20} />,
      'Bone': <Bone size={20} />,
      'Stethoscope': <Stethoscope size={20} />,
      'Sparkles': <Sparkles size={20} />,
    };
    return iconMap[name] || <Stethoscope size={20} />;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Medical <span className="text-primary not-italic">Taxonomy</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage specialties and platform medical departments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-3xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Create New Specialty
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse" />
            ))
        ) : specialties.map((spec) => (
          <div key={spec.id} className="glass p-8 rounded-[2.5rem] border border-white hover:border-primary/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors" />
            
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                {getIcon(spec.icon)}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">{spec.name}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                {spec.description || `Specialized medical services focusing on comprehensive ${spec.name.toLowerCase()} care and patient diagnostics.`}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Layers size={12} />
                    Active Dept
                </div>
                <button className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                    Edit Details
                    <ChevronRight size={14} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Medical Specialty</h2>
                        <p className="text-slate-500 font-bold text-sm italic">Define a new category for doctor searches</p>
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
                        <div className="grid grid-cols-4 gap-4">
                            {['Heart', 'Baby', 'User', 'Bone', 'Stethoscope', 'Sparkles'].map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewSpec({...newSpec, icon})}
                                    className={cn(
                                        "p-4 rounded-2xl flex flex-col items-center gap-2 transition-all",
                                        newSpec.icon === icon ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-slate-100"
                                    )}
                                >
                                    {getIcon(icon)}
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{icon}</span>
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
                        onClick={() => setShowAddModal(false)}
                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="px-8 py-4 bg-primary text-white rounded-3xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Save Department
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
