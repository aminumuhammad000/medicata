import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2, Info, X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@medicata.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('medicata_admin_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('medicata_admin_remember_email', email);
      } else {
        localStorage.removeItem('medicata_admin_remember_email');
      }
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/90 relative flex flex-col items-center justify-center p-4 sm:p-5 overflow-hidden select-none">
      {/* Ambient background soft lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-[360px] relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-lg shadow-slate-200/60 border border-slate-100">
          
          {/* Header & Compact Logo */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center mb-2.5 p-1.5 bg-slate-50/80 rounded-xl border border-slate-100 shadow-2xs">
              <img 
                src="/logo.png" 
                alt="Medicata Logo" 
                className="h-7 w-auto object-contain max-w-[110px]" 
              />
            </div>
            
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Admin Sign In
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-md">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Enter credentials to access the console
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5 block">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="admin@medicata.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5 block">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-9 py-2.5 bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help Options */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-primary accent-primary focus:ring-primary/30 cursor-pointer transition-all"
                />
                <span className="group-hover:text-slate-900 transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 text-[11px] font-bold animate-shake">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs tracking-wide shadow-sm shadow-primary/20 hover:bg-primary/95 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Card Footer with Security & Product Attribution */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5 text-center">
            <div className="inline-flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Restricted Access • Authorized Personnel Only</span>
            </div>

            <div className="text-[11px] font-medium text-slate-500">
              Product of <span className="font-bold text-slate-800">Pioneers Ltd</span>
            </div>
          </div>
        </div>

        {/* Outer bottom copyright */}
        <p className="mt-4 text-center text-[10px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Medicata System. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-50 text-primary rounded-xl">
                <Info size={18} />
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Reset Admin Password
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              For security compliance, administrator password resets cannot be done self-service. Please reach out directly to the Super Admin or IT Security team at Pioneers Ltd.
            </p>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
