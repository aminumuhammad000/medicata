import { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  Save, 
  RefreshCcw,
  Zap,
  ShieldCheck,
  Code,
  LineChart,
  Terminal,
  Bot,
  Send,
  User
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface SystemSettings {
  id: string;
  platform_name: string;
  commission_rate_percentage: number;
  min_withdrawal_amount: number;
  support_email: string;
  emergency_contact: string;
  maintenance_mode: boolean;
  ai_model: string;
  ai_api_key: string;
  ai_system_prompt: string;
}

interface ChatPreview {
  role: 'user' | 'assistant';
  content: string;
}

export default function MediPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'simulator' | 'analytics'>('config');
  
  // Simulator state
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatPreview[]>([]);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system-settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await api.patch('/system-settings', settings);
      alert('AI Configuration updated successfully!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!input.trim() || simulating) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSimulating(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.assistant_message.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: AI engine unreachable. Check API keys." }]);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-primary font-black">Loading Medi Engine...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-md">
            <Bot size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
              Medi <span className="text-primary not-italic">Engine Control</span>
            </h1>
            <p className="text-slate-500 font-medium">Configure and audit the platform’s artificial intelligence core</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
            <Zap size={14} />
            Engine Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
            <button 
                onClick={() => setActiveTab('config')}
                className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
                    activeTab === 'config' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
                )}
            >
                <Settings size={20} />
                Configuration
            </button>
            <button 
                onClick={() => setActiveTab('simulator')}
                className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
                    activeTab === 'simulator' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
                )}
            >
                <Terminal size={20} />
                AI Simulator
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
                    activeTab === 'analytics' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
                )}
            >
                <LineChart size={20} />
                Usage Analytics
            </button>

            <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Security Audit</span>
                </div>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                    API Keys are encrypted at rest. We recommend using scoped keys for Gemini or OpenAI to maintain HIPPA isolation.
                </p>
            </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-white h-full">
            {activeTab === 'config' && settings && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" />
                      Inference Model
                    </label>
                    <select 
                      value={settings.ai_model}
                      onChange={(e) => setSettings({...settings, ai_model: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold tracking-tight focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                    >
                      <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Default)</option>
                      <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                      <option value="gpt-4o">OpenAI GPT-4o</option>
                      <option value="internal-heuristic">Internal Heuristic Engine</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Code size={14} className="text-primary" />
                      External API Key
                    </label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••••••••••••••••••••"
                      value={settings.ai_api_key || ''}
                      onChange={(e) => setSettings({...settings, ai_api_key: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                        <User size={14} className="text-primary" />
                        Medi Persona (System Prompt)
                    </label>
                    <textarea 
                        rows={6}
                        value={settings.ai_system_prompt}
                        onChange={(e) => setSettings({...settings, ai_system_prompt: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                    />
                </div>

                <div className="flex justify-end pt-4 gap-4">
                  <button 
                    onClick={fetchSettings}
                    className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    <RefreshCcw size={20} />
                    Revert
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Save size={20} />
                    {saving ? 'Syncing...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'simulator' && (
                <div className="h-[600px] flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <Bot size={48} className="opacity-10 animate-bounce" />
                                <p className="font-bold tracking-tight italic">AI Simulator Ready. Begin testing your configuration.</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", m.role === 'user' ? "bg-slate-900 text-white" : "bg-primary text-white")}>
                                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={cn("p-4 rounded-2xl text-xs font-bold leading-relaxed", m.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border rounded-tl-none")}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {simulating && <div className="text-[10px] font-black text-primary animate-pulse ml-11 uppercase italic tracking-widest">Generating Inference...</div>}
                    </div>

                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Test Medi with a prompt..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                            className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all pr-20"
                        />
                        <button 
                            onClick={handleSimulate}
                            disabled={simulating || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Inferences</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">1,284</h4>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Latency</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">842ms</h4>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Token Efficiency</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter text-emerald-500">92%</h4>
                        </div>
                    </div>
                    
                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                            <Sparkles size={16} className="text-primary" />
                            AI Insight Log
                        </h4>
                        <div className="space-y-4">
                            {[
                                { t: '2m ago', e: 'Patient asked about headache medication', s: 'Verified' },
                                { t: '15m ago', e: 'Doctor search initiated via Medi', s: 'Successful' },
                                { t: '1h ago', e: 'System prompt updated by Admin', s: 'Synced' },
                            ].map((log, i) => (
                                <div key={i} className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{log.t}</span>
                                    <span className="font-medium">{log.e}</span>
                                    <span className="text-primary font-black uppercase tracking-widest text-[9px]">{log.s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
