import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Mail, 
  Phone, 
  Percent, 
  Save, 
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  User,
  Megaphone,
  Send
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SystemSettings {
  commission_rate_percentage: number;
  min_withdrawal_amount: number;
  platform_name: string;
  support_email: string;
  emergency_contact: string;
  maintenance_mode: boolean;
}

interface UserSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  dark_mode: boolean;
  language: string;
}

export default function SettingsPage() {
  const { token } = useAuth(); // Just ensuring auth context is available if needed
  const [activeTab, setActiveTab] = useState<'platform' | 'preferences' | 'security' | 'broadcast'>('platform');
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  // Broadcast state
  const [broadcast, setBroadcast] = useState({ scope: 'all', title: '', message: '' });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [sysRes, userRes] = await Promise.all([
        api.get('/system-settings'),
        api.get('/settings')
      ]);
      setSystemSettings(sysRes.data);
      setUserSettings(userRes.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    if (!systemSettings) return;
    try {
      setSaving(true);
      await api.patch('/system-settings', systemSettings);
      setMessage({ type: 'success', text: 'Platform settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save platform settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const saveUserSettings = async () => {
    if (!userSettings) return;
    try {
      setSaving(true);
      await api.patch('/settings', userSettings);
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) {
      setMessage({ type: 'error', text: 'Please fill in all broadcast fields' });
      return;
    }
    try {
      setSendingBroadcast(true);
      const res = await api.post('/admin/broadcast', broadcast);
      setMessage({ type: 'success', text: `Broadcast sent to ${res.data.recipients_count} recipients!` });
      setBroadcast({ scope: 'all', title: '', message: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to dispatch broadcast' });
    } finally {
      setSendingBroadcast(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Control <span className="text-primary not-italic">Center</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage platform parameters and preferences</p>
        </div>
        <div className="flex gap-3">
          {message && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm animate-in zoom-in duration-300",
              message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
            )}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {message.text}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('platform')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
              activeTab === 'platform' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
            )}
          >
            <Settings size={20} />
            Platform
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
              activeTab === 'preferences' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
            )}
          >
            <Bell size={20} />
            Preferences
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
              activeTab === 'security' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
            )}
          >
            <Shield size={20} />
            Security
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
              activeTab === 'broadcast' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-slate-500 hover:bg-white hover:text-primary"
            )}
          >
            <Megaphone size={20} />
            Broadcast
          </button>
          
          <div className="mt-8 p-6 glass rounded-3xl space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <RefreshCcw size={14} />
              System Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium tracking-tight">API Server</span>
                <span className="text-emerald-500 font-bold">Operational</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium tracking-tight">PostgreSQL</span>
                <span className="text-emerald-500 font-bold">Connected</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium tracking-tight">VTStack API</span>
                <span className="text-emerald-500 font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="glass p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-white">
            {activeTab === 'platform' && systemSettings && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Globe size={14} className="text-primary" />
                      Platform Name
                    </label>
                    <input 
                      type="text" 
                      value={systemSettings.platform_name}
                      onChange={(e) => setSystemSettings({...systemSettings, platform_name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Percent size={14} className="text-primary" />
                      Commission Rate (%)
                    </label>
                    <input 
                      type="number" 
                      value={systemSettings.commission_rate_percentage}
                      onChange={(e) => setSystemSettings({...systemSettings, commission_rate_percentage: parseFloat(e.target.value)})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      Support Email
                    </label>
                    <input 
                      type="email" 
                      value={systemSettings.support_email}
                      onChange={(e) => setSystemSettings({...systemSettings, support_email: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Phone size={14} className="text-primary" />
                      Emergency Contact
                    </label>
                    <input 
                      type="text" 
                      value={systemSettings.emergency_contact}
                      onChange={(e) => setSystemSettings({...systemSettings, emergency_contact: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      systemSettings.maintenance_mode ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      <Database size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 capitalize tracking-tight">Maintenance Mode</h4>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Restrict users from accessing the platform</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSystemSettings({...systemSettings, maintenance_mode: !systemSettings.maintenance_mode})}
                    className={cn(
                      "relative inline-flex h-8 w-14 items-center rounded-full transition-colors outline-none",
                      systemSettings.maintenance_mode ? "bg-red-500" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                      systemSettings.maintenance_mode ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={saveSystemSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Platform Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && userSettings && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 italic uppercase">Notification <span className="text-primary not-italic">Settings</span></h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'push_notifications', label: 'Push Notifications', desc: 'Real-time alerts via browser' },
                      { key: 'email_notifications', label: 'Email Reports', desc: 'Daily and weekly revenue summaries' },
                      { key: 'sms_notifications', label: 'SMS Alerts', desc: 'Critical system failure alerts' },
                    ].map((item) => (
                      <div key={item.key} className="p-6 hover:bg-slate-50 rounded-3xl flex items-center justify-between transition-colors border border-transparent hover:border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900">{item.label}</h4>
                          <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => setUserSettings({...userSettings, [item.key]: !userSettings[item.key as keyof UserSettings]})}
                          className={cn(
                            "relative inline-flex h-8 w-14 items-center rounded-full transition-colors outline-none",
                            userSettings[item.key as keyof UserSettings] ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                            userSettings[item.key as keyof UserSettings] ? "translate-x-7" : "translate-x-1"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={saveUserSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Update Preferences'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                    <Shield size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-blue-900 text-lg uppercase italic tracking-tight">Security Protocol <span className="text-blue-500 not-italic">Enforced</span></h4>
                    <p className="text-blue-700/70 font-medium leading-relaxed">Your administrative account is protected by industry-standard encryption. Ensure you rotate your credentials periodically.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <User size={14} className="text-primary" />
                      Administrator Full Name
                    </label>
                    <input 
                      type="text" 
                      value="Medicata Master Admin"
                      disabled
                      className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-medium cursor-not-allowed opacity-70"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Lock size={14} className="text-primary" />
                      Change Password
                    </label>
                    <button className="w-full px-5 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                      <RefreshCcw size={18} />
                      Initialize Password Reset Sequence
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'broadcast' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <Megaphone size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-900 text-lg uppercase italic tracking-tight">System-Wide <span className="text-amber-500 not-italic">Broadcast</span></h4>
                    <p className="text-amber-700/70 font-medium leading-relaxed">Dispatch critical alerts or updates to your ecosystem. Once sent, notifications are pushed in real-time to the selected target group.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Target Audience</label>
                    <div className="flex gap-4">
                      {['all', 'doctors', 'patients', 'pharmacies'].map((scope) => (
                        <button 
                          key={scope}
                          onClick={() => setBroadcast({...broadcast, scope})}
                          className={cn(
                            "px-6 py-3 rounded-xl font-bold text-sm capitalize transition-all border",
                            broadcast.scope === scope ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-500 border-slate-200 hover:border-primary"
                          )}
                        >
                          {scope}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Announcement Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. System Maintenance Update"
                      value={broadcast.title}
                      onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Message Body</label>
                    <textarea 
                      rows={4}
                      placeholder="Enter your message here..."
                      value={broadcast.message}
                      onChange={(e) => setBroadcast({...broadcast, message: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleBroadcast}
                    disabled={sendingBroadcast}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Send size={20} />
                    {sendingBroadcast ? 'Dispatching...' : 'Dispatch Broadcast'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
