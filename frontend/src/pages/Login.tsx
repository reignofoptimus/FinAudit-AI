import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('admin@finaudit.ai');
  const [password, setPassword] = useState('AdminPass123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password });
      addToast('success', 'Authentication Successful', 'Welcome to FinAudit AI.');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      addToast('error', 'Login Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (userType: 'admin' | 'auditor') => {
    if (userType === 'admin') {
      setEmail('admin@finaudit.ai');
      setPassword('AdminPass123!');
    } else {
      setEmail('auditor@finaudit.ai');
      setPassword('AuditorPass123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinAudit AI</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise AI-Powered Financial Audit Assistant</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick Demo Access (One-Click)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Admin Partner</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@finaudit.ai</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('auditor')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Forensic Auditor</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">auditor@finaudit.ai</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
