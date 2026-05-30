import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import { clearLogs, addLog } from '../redux/crawlerSlice';
import { toast } from 'react-hot-toast';
import { 
  Terminal, 
  Trash2, 
  Download, 
  Pause, 
  Play, 
  Sliders, 
  Search, 
  Filter,
  Check 
} from 'lucide-react';

export default function Logs({ user, logout }) {
  const workers = useSelector((state) => state.crawler.workers);

  const [levelFilter, setLevelFilter] = useState('All');
  const [workerFilter, setWorkerFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const [liveLogs, setLiveLogs] = useState([]);
  const [localLogs, setLocalLogs] = useState([]);
  const terminalEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?limit=200', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLiveLogs(data.logs.reverse()); // Reverse because API sends newest first, terminal wants oldest top
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Keep local logs synchronized unless paused
  useEffect(() => {
    if (!isPaused) {
      setLocalLogs(liveLogs);
    }
  }, [liveLogs, isPaused]);

  // Scroll to bottom helper
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localLogs, autoScroll]);

  const handleClear = async () => {
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLiveLogs([]);
        setLocalLogs([]);
        toast.error('Terminal logs cleared from server.');
      }
    } catch (err) {
      toast.error('Failed to clear logs.');
    }
  };

  const handleDownload = () => {
    if (localLogs.length === 0) {
      toast.error('No logs available to download.');
      return;
    }
    const logText = localLogs
      .map(log => `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(logText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `crawl_logs_export_${Date.now()}.log`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Successfully downloaded log session.');
  };

  // Perform terminal filters
  const filteredLogs = localLogs.filter(log => {
    const matchesLevel = levelFilter === 'All' || log.level === levelFilter;
    const matchesWorker = workerFilter === 'All' || log.workerId.toString() === workerFilter.toString();
    const matchesSearch = searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesWorker && matchesSearch;
  });

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="text-cyan-400 w-7 h-7" />
            <span>Cyber-Terminal Live Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sitemap parsing updates, bloom filters triggers, sitemap crawl indexes, and server logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 hover:text-white transition-all">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-800 focus:ring-cyan-500 focus:ring-2 accent-cyan-500"
            />
            <span>Auto-Scroll Output</span>
          </label>
        </div>
      </div>

      {/* Terminal Filters Toolbelt */}
      <div className="card-premium p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        
        {/* Search matchers */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Grep match log lines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-500 font-medium"
          />
        </div>

        {/* Severity level filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">Level:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2 text-xs focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="All">All Severity Levels</option>
            <option value="info">Info (Blue)</option>
            <option value="success">Success (Green)</option>
            <option value="warn">Warning (Yellow)</option>
            <option value="error">Critical (Red)</option>
          </select>
        </div>

        {/* Worker Node restrict filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">Worker:</span>
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2 text-xs focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="All">All Cluster Nodes</option>
            <option value="System">System Orchestrator</option>
            <option value="Frontier">URL Frontier</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Terminal operations controls */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
              isPaused 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{isPaused ? 'Resume Terminal' : 'Pause Terminal'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-cyan-400 hover:border-cyan-950 text-slate-400 transition-all cursor-pointer active:scale-95"
            title="Download log session"
          >
            <Download className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-rose-400 hover:border-rose-950 text-slate-400 transition-all cursor-pointer active:scale-95"
            title="Clear terminal output"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>

      {/* Modern cyber terminal screen */}
      <div className="terminal-window shadow-2xl flex flex-col h-[520px] overflow-hidden">
        
        {/* Mock window control titles bar */}
        <div className="terminal-header flex items-center justify-between">
          <div className="flex items-center gap-1.5 select-none">
            <span className="terminal-dot bg-rose-500"></span>
            <span className="terminal-dot bg-amber-500"></span>
            <span className="terminal-dot bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">googlebot-cluster-ops@root:~</span>
          <div className="w-10"></div>
        </div>

        {/* Live streaming terminal panel body */}
        <div className="terminal-body flex-1 bg-slate-950/95 font-mono p-4 overflow-y-auto space-y-2 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic text-center py-20 text-xs select-none">
              No active log packets matched the current filters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const levelColor = {
                info: 'text-blue-400',
                success: 'text-emerald-400 font-semibold',
                warn: 'text-amber-400',
                error: 'text-rose-400 font-bold animate-pulse'
              };

              return (
                <div 
                  key={log.id} 
                  className={`text-xs py-0.5 border-b border-transparent hover:bg-slate-900/15 font-medium ${
                    levelColor[log.level] || 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 font-semibold mr-2 select-none">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef}></div>
        </div>

      </div>

    </MainLayout>
  );
}