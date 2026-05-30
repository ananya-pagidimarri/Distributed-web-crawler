import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart, CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const COLORS = ['#f43f5e', '#f59e0b', '#ec4899', '#64748b', '#3b82f6'];

export default function Analytics({ user, logout }) {
  const [analytics, setAnalytics] = useState(null);
  const [healthData, setHealthData] = useState([]);
  const [crawlTimeSeries, setCrawlTimeSeries] = useState([]);
  const [queueTimeSeries, setQueueTimeSeries] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.analytics);
          
          const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          setCrawlTimeSeries(prev => {
            const next = [...prev, { time: timeLabel, crawled: data.analytics.totalIndexed, indexed: data.analytics.totalIndexed }];
            return next.slice(-15);
          });
          
          setQueueTimeSeries(prev => {
            const next = [...prev, { time: timeLabel, frontier: data.analytics.totalQueue, limit: 12000 }];
            return next.slice(-15);
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/admin/index-health', {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) setHealthData(data.health.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })));
      } catch (err) {}
    };

    fetchAnalytics();
    fetchHealth();
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const CRAWL_GROWTH_DATA = crawlTimeSeries.length > 0 ? crawlTimeSeries : [{ time: 'Now', crawled: 0, indexed: 0 }];
  const QUEUE_DEPTH_DATA = queueTimeSeries.length > 0 ? queueTimeSeries : [{ time: 'Now', frontier: 0, limit: 12000 }];
  const TOP_DOMAINS_DATA = (analytics?.topDomains || []).map(d => ({ name: d._id[0] || 'unknown', count: d.count }));
  const SEARCH_ANALYTICS_DATA = (analytics?.trendingSearches || []).map(s => ({ name: s._id, count: s.count }));

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-cyan-400 w-7 h-7" />
            <span>Crawl Telemetry Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical telemetry indices covering download volumes, frontier saturation, failures, and speeds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Real-time Analytics Feed Active</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cumulative Crawl vs Index Growth */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Crawl & Index Cumulative Growth</span>
            </h3>
            <p className="text-[11px] text-slate-500">Cumulative HTML sitemap crawler records fetched vs successfully indexed pages.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CRAWL_GROWTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrawled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIndexed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                /><Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                <Area type="monotone" dataKey="crawled" name="Pages Crawled" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCrawled)" />
                <Area type="monotone" dataKey="indexed" name="Pages Indexed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIndexed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frontier Buffer Saturation composed */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>URL Frontier Saturation & Buffers</span>
            </h3>
            <p className="text-[11px] text-slate-500">Active sitemaps scheduled backlog vs maximum host buffer limits.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={QUEUE_DEPTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                <Area type="monotone" dataKey="frontier" name="Queue Saturation" fill="#06b6d4" stroke="#06b6d4" fillOpacity={0.15} />
                <Line type="monotone" dataKey="limit" name="Max Buffer Capacity" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top domains index count */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Top Crawled Domains Rank</span>
            </h3>
            <p className="text-[11px] text-slate-500">Domains sorted by total sitemaps processed page quantities.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_DOMAINS_DATA} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                <Bar dataKey="count" name="Indexed Documents" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Searches */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Trending Search Keywords</span>
            </h3>
            <p className="text-[11px] text-slate-500">Most frequently searched terms across the platform ({analytics?.totalSearches || 0} total queries).</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SEARCH_ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="count" name="Search Volume" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Index Health Dashboard pie */}
        <div className="card-premium p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-emerald-500" />
              <span>Index Health Dashboard</span>
            </h3>
            <p className="text-[11px] text-slate-500">HTTP status response distributions across all crawled pages.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-6 h-60">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs w-full md:w-1/3">
              {healthData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 font-bold">{item.value} pages</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </MainLayout>
  );
}