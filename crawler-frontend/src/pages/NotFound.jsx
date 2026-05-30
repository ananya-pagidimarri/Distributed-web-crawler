import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Network } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="max-w-md w-full space-y-6 card-premium p-10 border border-slate-900 shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl"></div>

        {/* Icon */}
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full w-fit mx-auto glow-active">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-extrabold text-white font-mono tracking-wider">404</h1>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Robots Exclusions Detected</h2>
          <p className="text-xs text-slate-400 leading-relaxed pt-2 font-medium">
            The requested crawl path is disallowed by the sitemaps configuration. 
            Orchestrator core refused to parse this route.
          </p>
        </div>

        {/* Action back to home */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer relative z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

      </div>
    </div>
  );
}
