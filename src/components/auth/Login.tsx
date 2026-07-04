import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Compass } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo credentials (offline mode when backend is not running)
  const DEMO_USERS: Record<string, { password: string; user: any; token: string }> = {
    'admin@metrologix.com': {
      password: 'admin123',
      token: 'demo-token-admin',
      user: { id: 'usr_1', email: 'admin@metrologix.com', name: 'Alex Morgan', role: 'Admin', companyId: 'company_1' }
    },
    'manager@metrologix.com': {
      password: 'manager123',
      token: 'demo-token-manager',
      user: { id: 'usr_2', email: 'manager@metrologix.com', name: 'Sarah Chen', role: 'Manager', companyId: 'company_1' }
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Try real API first
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      login(data.accessToken, data.user);

    } catch (err: any) {
      // Fallback: demo offline mode
      const demo = DEMO_USERS[email.toLowerCase()];
      if (demo && demo.password === password) {
        login(demo.token, demo.user);
        return;
      }
      if (err.name === 'TimeoutError' || err.message?.includes('fetch')) {
        setError('Backend offline. Use demo credentials below.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Visual decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-purple-500" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shadow-inner mb-4">
            <Compass className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MetroLogix</h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">Enterprise Telemetry Platform</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Corporate Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="admin@metrologix.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Access Token / Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : 'Secure Login'}
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div className="mt-6 relative z-10 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Demo Access Credentials</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-300 font-mono">admin@metrologix.com</p>
                <p className="text-[10px] text-slate-600 font-mono">Password: admin123</p>
              </div>
              <button
                type="button"
                onClick={() => { setEmail('admin@metrologix.com'); setPassword('admin123'); }}
                className="text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-2.5 py-1 rounded-lg font-bold transition-all"
              >
                Quick Fill
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-300 font-mono">manager@metrologix.com</p>
                <p className="text-[10px] text-slate-600 font-mono">Password: manager123</p>
              </div>
              <button
                type="button"
                onClick={() => { setEmail('manager@metrologix.com'); setPassword('manager123'); }}
                className="text-[10px] bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 px-2.5 py-1 rounded-lg font-bold transition-all"
              >
                Quick Fill
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 relative z-10 flex flex-col items-center gap-2 text-xs font-mono text-slate-600">
          <p>AUTHORIZED PERSONNEL ONLY</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </div>
        </div>
      </div>
    </div>
  );
};
