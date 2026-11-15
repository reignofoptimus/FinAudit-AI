import React, { useState } from 'react';
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
      addToast('success', 'Session Established', 'Welcome to FinAudit Assurance Platform.');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
      addToast('error', 'Authentication Failed', err.message);
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
    <div className="min-h-screen bg-[#08090B] flex flex-col justify-center items-center p-6 relative overflow-hidden select-none text-[#F5F3EF]">
      {/* Subtle fixed ambient highlights strictly in #FFC900 and white/opacity over #08090B */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-[#FFC900]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Main Frosted Dark Glass Login Card */}
      <div className="w-full max-w-md glass-card p-8 sm:p-10 relative z-10 shadow-2xl border border-white/15">
        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Golden Yellow Logo Mark holding a Midnight Black Sun Icon */}
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#FFC900] items-center justify-center shadow-lg shadow-[#FFC900]/25 mb-4">
            <svg className="w-7 h-7 text-[#08090B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-[#F5F3EF] tracking-tight">FinAudit</h1>
          <p className="text-xs text-[#F5F3EF]/60 mt-1 font-sans">Institutional Financial & Ledger Assurance</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/40 text-xs flex items-center gap-2 font-mono">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F5F3EF] mb-1.5 font-sans">
              Authorized Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5F3EF]/40">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.com"
                className="w-full h-11 rounded-2xl glass-input pl-10 pr-4 text-xs font-sans text-[#F5F3EF] placeholder-[#F5F3EF]/40 border border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F3EF] mb-1.5 font-sans">
              Access Key / Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5F3EF]/40">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 rounded-2xl glass-input pl-10 pr-4 text-xs font-sans text-[#F5F3EF] placeholder-[#F5F3EF]/40 border border-white/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-12 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying Ledger Key...' : 'Sign In to Workspace'}</span>
            <span className="font-mono text-sm">→</span>
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 text-center mb-3">
            Quick Institutional Access
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin')}
              className="p-3 rounded-2xl glass-pill text-left transition-all border border-white/10 hover:border-[#FFC900]"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#F5F3EF]">
                <span className="w-2 h-2 rounded-full bg-[#FFC900]" />
                <span>Lead Partner</span>
              </div>
              <p className="text-[10px] font-mono text-[#F5F3EF]/60 mt-0.5 truncate">admin@finaudit.ai</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('auditor')}
              className="p-3 rounded-2xl glass-pill text-left transition-all border border-white/10 hover:border-[#FFC900]"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#F5F3EF]">
                <span className="w-2 h-2 rounded-full bg-[#F5F3EF]" />
                <span>Senior Auditor</span>
              </div>
              <p className="text-[10px] font-mono text-[#F5F3EF]/60 mt-0.5 truncate">auditor@finaudit.ai</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
