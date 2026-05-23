import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Megaphone,
  Send,
  Users,
  UserSquare2,
  Pill,
  Shield,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  X,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface BroadcastRecord {
  title: string;
  scope: string;
  recipients: number;
  sentAt: string;
}

const SCOPE_OPTIONS = [
  { key: 'all', label: 'All Users', icon: Users, color: 'indigo' },
  { key: 'doctors', label: 'Doctors Only', icon: UserSquare2, color: 'blue' },
  { key: 'patients', label: 'Patients Only', icon: Shield, color: 'emerald' },
  { key: 'pharmacies', label: 'Pharmacies Only', icon: Pill, color: 'amber' },
  { key: 'individual', label: 'Individual User', icon: Search, color: 'rose' },
];

export default function BroadcastPage() {
  const [scope, setScope] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Individual user targeting
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // History log (client-side only for this session)
  const [history, setHistory] = useState<BroadcastRecord[]>([]);

  useEffect(() => {
    if (scope !== 'individual') {
      setSelectedUser(null);
      setUserQuery('');
      setUserResults([]);
    }
  }, [scope]);

  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get(`/admin/patients?q=${encodeURIComponent(userQuery)}&per_page=6`);
        const patients: UserOption[] = (res.data.patients || []).map((u: any) => ({
          id: u.id, full_name: u.full_name, email: u.email, role: u.role || 'patient'
        }));
        setUserResults(patients);
        setShowDropdown(true);
      } catch {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Please fill in both the title and the message.' });
      return;
    }
    if (scope === 'individual' && !selectedUser) {
      setFeedback({ type: 'error', text: 'Please select a recipient user.' });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const payload: any = { scope, title, message };
      if (scope === 'individual' && selectedUser) {
        payload.user_id = selectedUser.id;
        payload.scope = 'individual';
      }
      const res = await api.post('/admin/broadcast', payload);
      const count = res.data.recipients_count ?? 1;
      setFeedback({ type: 'success', text: `Broadcast dispatched to ${count} recipient${count !== 1 ? 's' : ''}!` });
      setHistory(prev => [
        { title, scope, recipients: count, sentAt: new Date().toISOString() },
        ...prev.slice(0, 9),
      ]);
      setTitle('');
      setMessage('');
      setSelectedUser(null);
      setUserQuery('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Failed to dispatch broadcast.' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const activeScope = SCOPE_OPTIONS.find(s => s.key === scope)!;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-amber-400/30">
            <Megaphone size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
              Broadcast <span className="text-primary not-italic">Center</span>
            </h1>
            <p className="text-slate-500 font-medium tracking-tight">Dispatch notifications to groups or individual users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 text-xs font-black uppercase tracking-widest">
          <Radio size={14} className="animate-pulse" />
          System Broadcaster Online
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Compose Panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Scope Selector */}
          <div className="glass p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Step 1 — Select Target Audience</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {SCOPE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setScope(opt.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 font-bold text-xs text-center transition-all",
                    scope === opt.key
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.04]"
                      : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  <opt.icon size={20} />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Individual user picker */}
            {scope === 'individual' && (
              <div className="relative mt-2 animate-in fade-in duration-300">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Search Recipient</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type a name or email..."
                    value={selectedUser ? selectedUser.full_name : userQuery}
                    onChange={e => { setUserQuery(e.target.value); setSelectedUser(null); }}
                    onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                    className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                  {selectedUser && (
                    <button onClick={() => { setSelectedUser(null); setUserQuery(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                  {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
                </div>

                {showDropdown && userResults.length > 0 && !selectedUser && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                    {userResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setShowDropdown(false); setUserQuery(''); }}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-primary/5 text-left transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{u.full_name}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email} · <span className="capitalize">{u.role}</span></p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="mt-3 flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in duration-300">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{selectedUser.full_name}</p>
                      <p className="text-xs text-slate-400 font-bold">{selectedUser.email}</p>
                    </div>
                    <CheckCircle2 size={18} className="text-primary ml-auto" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="glass p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Step 2 — Compose Message</h3>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Notification Title</label>
              <input
                type="text"
                placeholder="e.g. Scheduled Maintenance Alert"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Message Body</label>
              <textarea
                rows={5}
                placeholder="Write a clear, concise message for your audience..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium leading-relaxed focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
              />
              <p className="text-right text-xs text-slate-400 font-bold">{message.length} characters</p>
            </div>

            {feedback && (
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-2xl text-sm font-bold border animate-in fade-in duration-300",
                feedback.type === 'success'
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-600"
              )}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {feedback.text}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                <activeScope.icon size={14} />
                Sending to: {activeScope.label}
                {selectedUser && scope === 'individual' && ` → ${selectedUser.full_name}`}
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Stats + History */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="glass p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-2xl font-black text-slate-900">{history.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sent</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-2xl font-black text-emerald-500">
                  {history.reduce((a, b) => a + b.recipients, 0)}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reached</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience Groups</p>
              {SCOPE_OPTIONS.filter(s => s.key !== 'individual').map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setScope(opt.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-bold",
                    scope === opt.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <opt.icon size={16} />
                  {opt.label}
                  {scope === opt.key && <ChevronDown size={14} className="ml-auto rotate-[-90deg] text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Session History */}
          <div className="glass p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History size={14} />
              Dispatch History
            </h3>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-300">
                <Megaphone size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-bold text-sm">No broadcasts yet this session.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {history.map((h, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-black text-slate-900 text-sm line-clamp-1">{h.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{h.scope} · {h.recipients} delivered</span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {new Date(h.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
