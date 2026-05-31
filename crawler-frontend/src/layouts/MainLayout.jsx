import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalStatus } from '../redux/crawlerSlice';

import useSocketToasts from '../hooks/useSocketToasts';
import Sidebar from '../components/common/Sidebar';
import { Menu, Play, Pause, AlertCircle, Cpu } from 'lucide-react';

export default function MainLayout({ children, user, logout }) {
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const globalStatus = useSelector((state) => state.crawler.globalStatus);
  const socketConnected = useSelector((state) => state.crawler.socketConnected);
  const stats = useSelector((state) => state.crawler.stats);


  // Initialize Socket.IO real-time toasts
  useSocketToasts();

  const toggleCrawlState = async () => {
    try {
      const endpoint = globalStatus === 'crawling' ? '/api/crawler/stop' : '/api/crawler/start';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setGlobalStatus(data.status));
      }
    } catch (err) {
      console.error('Failed to toggle crawler state:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-400">
      
      {/* Sidebar - Desktop (Static) */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar user={user} logout={logout} />
      </div>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          ></div>
          
          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 animate-slide-right">
            <Sidebar onClose={() => setMobileOpen(false)} user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">CrawlX</span>
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mt-1">OPS</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic System Ticker / Global Controls Banner */}
        <div className="bg-slate-900/60 border-b border-slate-900/80 px-4 py-2.5 sm:px-8 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                globalStatus === 'crawling' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}></span>
              <span className="text-slate-400 font-medium">Crawl Engine:</span>
              <span className={`font-semibold uppercase tracking-wider ${
                globalStatus === 'crawling' ? 'text-emerald-400' : 'text-amber-400'
              }`}>{globalStatus}</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Telemetry Saturation:</span>
              <span className="font-semibold text-slate-300">{stats.cpuUsage}% CPU</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Frontier Backlog:</span>
              <span className="font-semibold text-cyan-400">{stats.queueSize.toLocaleString()} URLs</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden lg:inline-block">System Host Controls:</span>
            <button
              onClick={toggleCrawlState}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${
                globalStatus === 'crawling'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'
              }`}
            >
              {globalStatus === 'crawling' ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Crawlers</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Crawlers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Children Render Outlet */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}