import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import Navbar from '../components/common/Navbar';

export default function Register({ onRegister }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await onRegister(name, email, password);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1c] text-white font-sans relative overflow-hidden">
      
      {/* Dynamic Background Effects matching Home.jsx & Login.jsx */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-indigo-500/5 blur-[100px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 w-full relative z-10">
        <div className="w-full max-w-[450px]">

          {/* Glassmorphism Card */}
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="select-none text-4xl font-bold tracking-tight" style={{ fontFamily: "'Product Sans', 'Inter', sans-serif" }}>
                <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">C</span>
                <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">r</span>
                <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">a</span>
                <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">w</span>
                <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">l</span>
                <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">X</span>
              </div>
            </div>

            <h1 className="text-2xl font-medium text-center mb-2 text-white">
              Create Account
            </h1>

            <div className="text-center mb-8">
              <p className="text-slate-400">Join CrawlX to start searching</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-6 text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                  placeholder="Full Name"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                  placeholder="Email Address"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3.5 pl-12 pr-12 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                  placeholder="Confirm Password"
                />
              </div>

              <div className="flex justify-between items-center mt-8 pt-4">
                <Link to="/login" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors py-2 pr-2">
                  Sign in instead
                </Link>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none rounded-full px-8 py-2.5 text-sm font-medium cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95"
                >
                  Register
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 mt-6 text-xs text-slate-500">
            <div>English (United States)</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Help</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
