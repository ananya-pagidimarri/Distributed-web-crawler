import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateStats } from '../redux/crawlerSlice';
import MainLayout from '../layouts/MainLayout';
import StatsCard from '../components/dashboard/StatsCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Globe, 
  Database, 
  ListOrdered, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Terminal, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({ user, logout }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stats = useSelector((state) => state.crawler.stats);
  const logs = useSelector((state) => state.crawler.logs);
  const globalStatus = useSelector((state) => state.crawler.globalStatus);
  const [workers, setWorkers] = useState([]);

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, workersRes] = await Promise.all([
          fetch('/api/admin/dashboard-stats', { headers: { 'Authorization': `Bearer ${user?.token}` } }),
          fetch('/api/admin/workers', { headers: { 'Authorization': `Bearer ${user?.token}` } })
        ]);
        
        const statsData = await statsRes.json();
        if (statsData.success) {
          dispatch(updateStats(statsData.stats));
        }

        const workersData = await workersRes.json();
        if (workersData.success) {
          setWorkers(workersData.workers);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [user, dispatch]);

  // Maintain a rolling history of crawler rates & queues for live chart
  const [chartHistory, setChartHistory] = useState([]);

  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChartHistory(prev => {
      const next = [...prev, {
        time,
        rate: stats.crawlRate,
        backlog: stats.queueSize
      }];
      if (next.length > 10) next.shift(); // Keep last 10 records
      return next;
    });
  }, [stats.crawlRate, stats.queueSize]);

  const chartData = chartHistory;

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Header section with status overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crawl Control Center</h1>
          <p className="text-xs text-slate-400 mt-1">Googlebot distributed sitemaps crawler and indexer core telemetry.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Robots.txt:</span>
            <span className="font-semibold text-emerald-400">Strict Politeness</span>
          </div>
        </div>
      </div>

      {/* Grid of 8 Telemetry Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Crawled"
          value={stats.pagesCrawled.toLocaleString()}
          icon={Globe}
          color="blue"
          trend={stats.crawlRate > 0 ? `+${(stats.crawlRate * 60).toLocaleString()}/min` : 'Standby'}
          subtitle="Cumulative HTML/PDF pages fetched"
        />
        <StatsCard
          title="Indexed Pages"
          value={stats.pagesIndexed.toLocaleString()}
          icon={Database}
          color="emerald"
          trend={stats.crawlRate > 0 ? `+${(stats.crawlRate * 60).toLocaleString()}/min` : 'Standby'}
          subtitle="Processed & uploaded to Search Index"
        />
        <StatsCard
          title="Frontier Backlog"
          value={stats.queueSize.toLocaleString()}
          icon={ListOrdered}
          color="amber"
          trend="Pending"
          subtitle="URLs in Redis/BullMQ frontier"
        />
        <StatsCard
          title="Running Nodes"
          value={`${workers.filter(w => w.status === 'running').length}/${workers.length}`}
          icon={Cpu}
          color="cyan"
          trend="Active"
          subtitle="Distributed fetcher worker processes"
        />
        <StatsCard
          title="Crawl Throughput"
          value={`${stats.crawlRate} /s`}
          icon={Zap}
          color="cyan"
          trend={globalStatus === 'crawling' ? 'ACTIVE' : 'PAUSED'}
          subtitle="Aggregated download throughput"
        />
        <StatsCard
          title="Telemetry Errors"
          value={stats.failedCount}
          icon={AlertTriangle}
          color="rose"
          trend="Failed"
          subtitle="Sitemap, timeout and 404 blockages"
        />
        <StatsCard
          title="Fetcher Latency"
          value={`${stats.averageLatency} ms`}
          icon={Clock}
          color="blue"
          trend="Optimal"
          subtitle="Average target server fetch response time"
        />
        <StatsCard
          title="Resource Load"
          value={`${workers.length > 0 ? Math.round(workers.reduce((acc, w) => acc + (w.cpu || 0), 0) / workers.length) : 0}%`}
          icon={Activity}
          color={(workers.length > 0 ? workers.reduce((acc, w) => acc + (w.cpu || 0), 0) / workers.length : 0) > 75 ? 'amber' : 'cyan'}
          trend="Buffer"
          subtitle="Distributed aggregate worker CPU"
        />
      </div>

      {/* Analytics Telemetry Chart + Workers Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Real-time speed Area chart */}
        <div className="card-premium p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live System Throughput</h3>
              <p className="text-[11px] text-slate-500">Real-time crawling rate fluctuations vs Redis queue size.</p>
            </div>
            
            <button
              onClick={() => navigate('/admin/analytics')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#22d3ee' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  name="Pages/s"
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#rateGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rolling log stream ticker */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="text-cyan-400 w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Log Stream Ticker</h3>
            </div>
            
            <button
              onClick={() => navigate('/admin/logs')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 max-h-60 overflow-y-auto pr-1">
            {logs.slice(-4).reverse().map((log) => {
              const colors = {
                success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                warn: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                error: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
                info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              };

              return (
                <div 
                  key={log.id} 
                  className={`p-3 rounded-xl border flex flex-col gap-1 ${colors[log.level] || colors.info}`}
                >
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span>{log.workerId === 'System' || log.workerId === 'Frontier' ? 'SYSTEM CORE' : `NODE WORKER ${log.workerId}`}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed break-all font-mono font-medium line-clamp-2">
                    {log.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Active Worker Nodes Mesh Summary */}
      <div className="card-premium p-6 w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Distributed Cluster Mesh</h3>
            <p className="text-[11px] text-slate-500">Active status and resource load of individual Googlebot cluster nodes.</p>
          </div>
          
          <button
            onClick={() => navigate('/admin/workers')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Manage Nodes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((worker) => {
            const statusMap = {
              running: { text: 'ACTIVE', color: 'bg-emerald-500 text-emerald-400 border-emerald-500/20' },
              idle: { text: 'IDLE', color: 'bg-amber-500 text-amber-400 border-amber-500/20' },
              robots_check: { text: 'ROBOTS SCAN', color: 'bg-blue-500 text-blue-400 border-blue-500/20' },
              offline: { text: 'OFFLINE', color: 'bg-slate-700 text-slate-500 border-slate-700/20' }
            };
            const wStatus = statusMap[worker.status] || statusMap.offline;

            return (
              <div 
                key={worker.id} 
                className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:border-cyan-800/30 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{worker.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">{worker.ip}</span>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border bg-slate-900/60 flex items-center gap-1.5 ${wStatus.color.split(' ').slice(1).join(' ')}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${wStatus.color.split(' ')[0]} ${worker.status === 'running' ? 'animate-pulse' : ''}`}></span>
                    {wStatus.text}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Task rate:</span>
                    <span className="font-semibold text-slate-200">{worker.rate || 0} pages/s</span>
                  </div>
                  
                  {worker.status !== 'offline' && worker.currentUrl && (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2">
                      <span>Crawling:</span>
                      <span className="font-semibold text-cyan-400 truncate max-w-[140px] text-right font-mono" title={worker.currentUrl}>
                        {worker.currentUrl}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bars for CPU */}
                <div className="space-y-1.5 pt-1 border-t border-slate-900">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500 font-medium">Node CPU Load:</span>
                    <span className={`font-bold ${worker.cpu > 80 ? 'text-rose-400' : 'text-slate-300'}`}>{worker.cpu}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        worker.cpu > 80 ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${worker.cpu}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </MainLayout>
  );
}