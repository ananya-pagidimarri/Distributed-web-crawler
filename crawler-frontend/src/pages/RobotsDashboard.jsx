import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Clock, Globe } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { formatDistanceToNow } from 'date-fns';

export default function RobotsDashboard({ user, logout }) {
  const [robots, setRobots] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRaw, setSelectedRaw] = useState(null);

  const fetchData = async () => {
    try {
      const [robotsRes, blockedRes] = await Promise.all([
        fetch('/api/admin/robots', { headers: { 'Authorization': `Bearer ${user?.token}` } }),
        fetch('/api/admin/robots/blocked', { headers: { 'Authorization': `Bearer ${user?.token}` } })
      ]);
      const rData = await robotsRes.json();
      const bData = await blockedRes.json();
      if (rData.success) setRobots(rData.robots);
      if (bData.success) setBlocked(bData.blocked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const int = setInterval(fetchData, 10000);
    return () => clearInterval(int);
  }, [user]);

  return (
    <MainLayout user={user} logout={logout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-cyan-400 w-7 h-7" />
          Robots.txt Compliance Audits
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor domain crawl delays and intercepted URLs enforcing crawler politeness.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Policies */}
        <div className="card-premium p-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Domain Policies
          </h2>
          {loading && !robots.length ? <div className="text-slate-500">Loading...</div> : null}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {robots.map((r) => (
              <div key={r._id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{r.domain}</span>
                  <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded-md">
                    {r.crawlDelay ? `Delay: ${r.crawlDelay}s` : 'No Delay Limit'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Fetched {formatDistanceToNow(new Date(r.fetchedAt))} ago
                  </span>
                  <button 
                    onClick={() => setSelectedRaw(r)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    View Raw Policy
                  </button>
                </div>
              </div>
            ))}
            {!robots.length && !loading && (
              <div className="text-center py-8 text-slate-500 text-sm">No domains tracked yet.</div>
            )}
          </div>
        </div>

        {/* Blocked Intercepts */}
        <div className="card-premium p-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Politeness Intercepts
          </h2>
          {loading && !blocked.length ? <div className="text-slate-500">Loading...</div> : null}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {blocked.map((b) => (
              <div key={b._id} className="bg-slate-900/80 border border-rose-900/30 border-l-2 border-l-rose-500 p-3 rounded-xl flex justify-between items-center">
                <div className="truncate max-w-[70%]">
                  <div className="text-xs font-semibold text-rose-400 mb-0.5">Disallowed by robots.txt</div>
                  <div className="text-sm text-slate-300 truncate">{b.url}</div>
                </div>
                <span className="text-[10px] text-slate-500">
                  {formatDistanceToNow(new Date(b.timestamp || Date.now()))} ago
                </span>
              </div>
            ))}
            {!blocked.length && !loading && (
              <div className="text-center py-8 text-slate-500 text-sm">No URLs have been blocked recently.</div>
            )}
          </div>
        </div>
      </div>

      {/* Raw View Modal */}
      {selectedRaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedRaw(null)}></div>
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Raw robots.txt - {selectedRaw.domain}</h3>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 overflow-x-auto max-h-[50vh] overflow-y-auto border border-slate-800">
              {selectedRaw.rawText || '# No specific rules or empty file.'}
            </pre>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedRaw(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
