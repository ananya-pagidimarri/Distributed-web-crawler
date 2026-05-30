import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1c] text-white font-sans relative overflow-hidden">
      
      {/* Dynamic Background Effects matching Home.jsx */}
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
              {step === 1 ? 'Sign in' : 'Welcome back'}
            </h1>

            <div className="text-center mb-8">
              {step === 1 ? (
                <p className="text-slate-400">Continue to CrawlX Dashboard</p>
              ) : (
                <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full py-1.5 px-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-medium text-white">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300">{email}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
              {step === 1 ? (
                <div className="mb-2">
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all peer"
                      placeholder=" "
                      autoFocus
                      id="email-input"
                    />
                    <label
                      htmlFor="email-input"
                      className="absolute left-4 top-3.5 text-slate-400 text-base transition-all duration-200 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-focus:bg-slate-900 peer-focus:px-1 peer-[&:not(:placeholder-shown)]:-top-2.5 peer-[&:not(:placeholder-shown)]:left-3 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:bg-slate-900 peer-[&:not(:placeholder-shown)]:px-1"
                    >
                      Email address
                    </label>
                  </div>
                  <div className="mt-3">
                    <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Forgot email?
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-2">
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3.5 pr-12 text-white outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all peer"
                      placeholder=" "
                      autoFocus
                      id="password-input"
                    />
                    <label
                      htmlFor="password-input"
                      className="absolute left-4 top-3.5 text-slate-400 text-base transition-all duration-200 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:text-cyan-400 peer-focus:bg-slate-900 peer-focus:px-1 peer-[&:not(:placeholder-shown)]:-top-2.5 peer-[&:not(:placeholder-shown)]:left-3 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:bg-slate-900 peer-[&:not(:placeholder-shown)]:px-1"
                    >
                      Enter your password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-3">
                    <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Forgot password?
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-8">
                {step === 1 ? (
                  <Link to="/register" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors py-2 pr-2">
                    Create account
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setPassword(''); }}
                    className="text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors py-2 pr-2"
                  >
                    ← Back
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none rounded-full px-8 py-2.5 text-sm font-medium cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95"
                >
                  {step === 1 ? 'Next' : 'Sign in'}
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
