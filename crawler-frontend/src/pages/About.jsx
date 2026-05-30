import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Search, Zap, Shield, Globe, Cpu, ArrowRight, Activity, Code2, Network } from 'lucide-react';

export default function About() {
  const features = [
    { icon: <Globe className="w-6 h-6 text-cyan-400" />, title: 'Distributed Crawling', desc: 'Horizontally scalable architecture capable of processing millions of web pages using distributed worker nodes across global clusters.' },
    { icon: <Activity className="w-6 h-6 text-rose-400" />, title: 'Real-Time Telemetry', desc: 'Live system monitoring and heartbeat tracking with atomic queue concurrency to prevent distributed race conditions.' },
    { icon: <Search className="w-6 h-6 text-amber-400" />, title: 'Advanced Indexing', desc: 'Lightning-fast full-text search with complex heuristics, metadata extraction, and semantic relevance scoring.' },
    { icon: <Database className="w-6 h-6 text-emerald-400" />, title: 'Persistent Storage', desc: 'Highly optimized MongoDB integration for scalable document storage and instantaneous frontier deduplication.' },
    { icon: <Code2 className="w-6 h-6 text-indigo-400" />, title: 'Smart Parsing', desc: 'Intelligent HTML extraction algorithms designed to navigate complex DOM structures and isolate core content.' },
    { icon: <Shield className="w-6 h-6 text-fuchsia-400" />, title: 'Robots.txt Compliance', desc: 'Strict, automated adherence to web scraping standards with built-in domain rate limiting and exclusion protocols.' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-rose-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all group-hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Network className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-100 transition-colors">
              CrawlX
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors group">
            Back to Engine
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center mb-28 animate-[fadeIn_0.8s_ease-out]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <Zap className="w-3.5 h-3.5" /> Next-Gen Architecture
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-[1.1]">
            Mapping the web at <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
              ludicrous speed.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            CrawlX is a hyper-scalable, distributed web crawler and search engine. Engineered for massive throughput, intelligent data extraction, and sub-millisecond query retrieval.
          </p>
        </div>

        {/* Core Infrastructure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 hover:bg-slate-800/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.1}s both` }}
            >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3 tracking-tight group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative rounded-[2.5rem] p-10 sm:p-16 text-center overflow-hidden border border-white/10 shadow-2xl">
          {/* CTA Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          
          {/* Glowing Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to orchestrate?</h2>
            <p className="text-slate-400 mb-10 text-lg">
              Take full control of the distributed cluster. Monitor live telemetry, manage the URL frontier, and analyze index health from the centralized command center.
            </p>
            <Link to="/admin/login" className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95">
              Launch Command Center
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </main>

      <footer className="relative z-10 border-t border-white/5 py-10 mt-20 bg-slate-950/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm font-medium">
          <p>© 2026 CrawlX Technologies. All systems nominal.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Cluster Online</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Documentation</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">API Reference</span>
          </div>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; filter: blur(10px); }
          to { opacity: 1; filter: blur(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}} />
    </div>
  );
}
