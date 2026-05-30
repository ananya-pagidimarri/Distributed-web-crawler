import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, LogIn, Lock, Mail } from 'lucide-react';
import Navbar from '../components/common/Navbar';

export default function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Call login with expectedRole = 'admin'
    const result = await onLogin(email, password, 'admin');
    if (!result.success) {
      setError(result.message);
    } else {
      navigate('/admin/dashboard'); // Redirect to admin dashboard on success
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      <Navbar />
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex p-4 bg-cyan-950/50 border border-cyan-800/50 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <Network className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CrawlX Auth</h1>
            <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Restricted Administrator Access
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-center text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crawlx.io"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-[0.98] transition-all cursor-pointer mt-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Initialize Session</span>
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 text-center text-xs text-slate-500 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            For demo purposes, default admin is:<br/>
            <span className="text-cyan-400 font-mono mt-1 block">admin@crawlx.io / admin</span>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
