import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import { 
  pauseWorkerNode, 
  restartWorkerNode, 
  terminateWorkerNode 
} from '../redux/crawlerSlice';
import { toast } from 'react-hot-toast';
import { 
  Cpu, 
  Zap, 
  Play, 
  Pause, 
  RotateCw, 
  Trash2, 
  Server, 
  ShieldAlert, 
  Clock, 
  HardDrive 
} from 'lucide-react';

export default function Workers({ user, logout }) {
  const dispatch = useDispatch();
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch('/api/admin/workers', {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setWorkers(data.workers);
        }
      } catch (err) {
        console.error('Failed to fetch workers:', err);
      }
    };

    fetchWorkers();
    const interval = setInterval(fetchWorkers, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePause = (id, name) => {
    dispatch(pauseWorkerNode(id));
    toast.success(`Node [${name}] successfully paused.`);
  };

  const handleRestart = (id, name) => {
    dispatch(restartWorkerNode(id));
    toast.success(`Node [${name}] successfully restarted.`);
  };

  const handleTerminate = (id, name) => {
    dispatch(terminateWorkerNode(id));
    toast.error(`Node [${name}] has been TERMINATED.`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return {
          text: 'ACTIVE FETCHING',
          color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-500 animate-pulse'
        };
      case 'idle':
        return {
          text: 'IDLE (STANDBY)',
          color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-500'
        };
      case 'robots_check':
        return {
          text: 'ROBOTS SCAN',
          color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          dot: 'bg-blue-500 animate-pulse'
        };
      default:
        return {
          text: 'OFFLINE',
          color: 'bg-slate-800/60 border-slate-700/20 text-slate-500',
          dot: 'bg-slate-700'
        };
    }
  };

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="text-cyan-400 w-7 h-7" />
            <span>Distributed Crawler Workers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor and coordinate computing resources across global sitemaps fetcher nodes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Mesh Status:</span>
          <span className="text-emerald-400 font-bold">STABLE</span>
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {workers.map((worker) => {
          const badge = getStatusBadge(worker.status);
          const isOffline = worker.status === 'offline';
          const isIdle = worker.status === 'idle';

          return (
            <div 
              key={worker.id}
              className={`card-premium p-6 border transition-all flex flex-col justify-between gap-5 ${
                isOffline ? 'opacity-65 grayscale-[30%] border-slate-900' : 'border-slate-800/80 hover:border-cyan-800/30'
              }`}
            >
              
              {/* Top Section: Worker Brand and status badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${
                    isOffline ? 'bg-slate-950/60 border-slate-900 text-slate-600' : 'bg-cyan-950/40 border-cyan-800/30 text-cyan-400'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{worker.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono font-medium">{worker.ip}</p>
                  </div>
                </div>

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border bg-slate-900/40 flex items-center gap-1.5 ${badge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                  <span>{badge.text}</span>
                </span>
              </div>

              {/* URL and speeds stats */}
              <div className="space-y-2 text-xs font-semibold text-slate-400">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-950/40">
                  <span className="text-slate-500">Crawl Speed:</span>
                  <span className={`text-slate-200 flex items-center gap-1 font-mono ${isOffline ? 'text-slate-600' : ''}`}>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    {worker.rate || 0} pages/s
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-1.5 border-b border-slate-950/40">
                  <span className="text-slate-500">URLs Downloaded:</span>
                  <span className={`text-slate-200 font-mono ${isOffline ? 'text-slate-600' : ''}`}>
                    {(worker.processedCount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1 text-[11px]">
                  <span className="text-slate-500">Active URL Frontier Target:</span>
                  {!isOffline && worker.currentUrl ? (
                    <span 
                      className="text-cyan-400 font-mono truncate hover:text-cyan-300 font-semibold select-all" 
                      title={worker.currentUrl}
                    >
                      {worker.currentUrl}
                    </span>
                  ) : (
                    <span className="text-slate-600 italic">None - Node Sleep</span>
                  )}
                </div>
              </div>

              {/* Telemetry Hardware: CPU & RAM Loads */}
              <div className="space-y-3 pt-2 border-t border-slate-950/40">
                
                {/* CPU load */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Node CPU Load:</span>
                    <span className={`font-mono font-bold ${worker.cpu > 80 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                      {Number(worker.cpu).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${
                        worker.cpu > 80 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${worker.cpu}%` }}
                    ></div>
                  </div>
                </div>

                {/* Memory load */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">VRAM / Buffer Memory:</span>
                    <span className={`font-mono font-bold ${worker.memory > 80 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                      {Number(worker.memory).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${
                        worker.memory > 80 ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${worker.memory}%` }}
                    ></div>
                  </div>
                </div>

              </div>

              {/* Node controls panel */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-950/60 pt-4 mt-1">
                
                {/* Pause / Resume Button */}
                {worker.status === 'running' || worker.status === 'robots_check' ? (
                  <button
                    onClick={() => handlePause(worker.id, worker.name)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
                    title="Pause crawler threads"
                  >
                    <Pause className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestart(worker.id, worker.name)}
                    disabled={isOffline}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                    title="Resume threads"
                  >
                    <Play className="w-4 h-4 mb-1 text-emerald-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Resume</span>
                  </button>
                )}

                {/* Restart Node Button */}
                <button
                  onClick={() => handleRestart(worker.id, worker.name)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Force restart downloader thread"
                >
                  <RotateCw className="w-4 h-4 mb-1 text-cyan-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Restart</span>
                </button>

                {/* Terminate Button */}
                <button
                  onClick={() => handleTerminate(worker.id, worker.name)}
                  disabled={isOffline}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                  title="Kill process thread"
                >
                  <Trash2 className="w-4 h-4 mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Kill</span>
                </button>

              </div>

            </div>
          );
        })}
      </div>

      {/* Helpful Warning indicator */}
      <div className="card-premium p-4 mt-6 border border-amber-900/20 bg-amber-950/5 flex items-start gap-3">
        <ShieldAlert className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enterprise Cluster Safety Notice</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Terminated (Killed) nodes release socket descriptors, local DNS resolutions, sitemap pools, and file handles automatically. 
            Restarting a node forces sitemap caching resets. Politely pause nodes to inspect targeted robots.txt limits safely.
          </p>
        </div>
      </div>

    </MainLayout>
  );
}