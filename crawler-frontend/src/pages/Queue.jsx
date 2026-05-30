import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import Pagination from '../components/search/Pagination';
import { toast } from 'react-hot-toast';
import UrlSubmit from '../components/common/UrlSubmit';
import { downloadCSV } from '../utils/csvExporter';
import { 
  ListOrdered, 
  Trash2, 
  RotateCcw, 
  Download, 
  AlertTriangle, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';

export default function Queue({ user, logout }) {
  const stats = useSelector((state) => state.crawler.stats);

  const [frontierQueue, setFrontierQueue] = useState([]);
  const [failedUrls, setFailedUrls] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const itemsPerPage = 5;

  const fetchQueueData = async () => {
    try {
      const res = await fetch('/api/admin/queue', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFrontierQueue(data.frontierQueue);
        setFailedUrls(data.failedUrls);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleFlush = async () => {
    if (window.confirm('Are you sure you want to flush all URLs currently scheduled in the URL Frontier?')) {
      try {
        const res = await fetch('/api/admin/queue/flush', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          toast.error(`URL Frontier backlog cleared. ${data.deleted} URLs removed.`);
          setPendingPage(1);
          fetchQueueData();
        }
      } catch (err) {
        toast.error('Failed to flush queue');
      }
    }
  };

  const handleRequeue = async () => {
    if (failedUrls.length === 0) {
      toast.error('No failed URLs to re-queue.');
      return;
    }
    try {
      const res = await fetch('/api/admin/queue/requeue-failed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully re-queued ${data.requeued} failed URLs!`);
        setFailedPage(1);
        fetchQueueData();
      }
    } catch (err) {
      toast.error('Failed to re-queue');
    }
  };

  const handleExport = () => {
    if (!frontierQueue.length) return toast.error('No frontier queue data to export.');
    downloadCSV(frontierQueue, `crawlx_frontier_queue_${Date.now()}.csv`);
    toast.success('Successfully exported URL Frontier queue as CSV.');
  };

  const handleRetrySpecific = async (id) => {
    try {
      const res = await fetch(`/api/admin/queue/retry/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        toast.success('URL re-queued for crawling.');
        fetchQueueData();
      } else {
        const data = await res.json();
        toast.error(`Failed to retry URL: ${data.message}`);
      }
    } catch (err) {
      toast.error('Failed to retry URL.');
    }
  };

  const handleDeleteSpecific = async (id) => {
    if (!window.confirm('Delete this failed URL permanently?')) return;
    try {
      const res = await fetch(`/api/admin/queue/failed/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        toast.success('Failed URL removed.');
        fetchQueueData();
      }
    } catch (err) {
      toast.error('Failed to delete URL.');
    }
  };

  // Pending pagination calculations
  const pendingTotalPages = Math.ceil(frontierQueue.length / itemsPerPage);
  const pendingStartIdx = (pendingPage - 1) * itemsPerPage;
  const paginatedPending = frontierQueue.slice(pendingStartIdx, pendingStartIdx + itemsPerPage);

  // Failed pagination calculations
  const failedTotalPages = Math.ceil(failedUrls.length / itemsPerPage);
  const failedStartIdx = (failedPage - 1) * itemsPerPage;
  const paginatedFailed = failedUrls.slice(failedStartIdx, failedStartIdx + itemsPerPage);

  return (
    <MainLayout user={user} logout={logout}>
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ListOrdered className="text-cyan-400 w-7 h-7" />
            <span>URL Frontier Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Observe the queue depth sitemaps schedule, duplicate exclusions, and retry loops in real time.
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFlush}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-950 transition-all cursor-pointer active:scale-95"
            title="Flush Frontier queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
          
          <button
            onClick={handleRequeue}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-emerald-400 hover:border-emerald-950 transition-all cursor-pointer active:scale-95"
            title="Retry Failed URLs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-queue Failed</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-all cursor-pointer active:scale-95"
            title="Export Scheduled Seeds"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <UrlSubmit user={user} />

      {/* Queue Summary Grid Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="card-premium p-4 flex items-center justify-between border-l-4 border-l-cyan-500">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Seeds</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.queueSize.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <ListOrdered className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="card-premium p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed URLs</span>
            <h3 className="text-2xl font-bold text-white mt-1">{failedUrls.length + (stats.failedCount || 0)}</h3>
          </div>
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="card-premium p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority Weight</span>
            <h3 className="text-2xl font-bold text-white mt-1">
              {frontierQueue.filter(q => q.priority === 'High').length} High
            </h3>
          </div>
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="card-premium p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloom Filter check</span>
            <h3 className="text-2xl font-bold text-white mt-1">99.8% Uptime</h3>
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Seeds Table Section */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Frontier Pending Queue</h3>
            <p className="text-[11px] text-slate-500">URLs scheduled next inside the BFS queue manager.</p>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {frontierQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-slate-600 gap-2">
                <CheckCircle2 className="w-10 h-10 text-slate-600" />
                <span className="text-xs font-semibold">Queue frontier is empty - Crawler Sleeping</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5">Target URL Path</th>
                    <th className="py-2.5 text-center">Depth</th>
                    <th className="py-2.5 text-center">Priority</th>
                    <th className="py-2.5 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {paginatedPending.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 font-mono font-medium truncate max-w-[200px]" title={item.url}>
                        {item.url}
                      </td>
                      <td className="py-3 text-center text-slate-400 font-mono font-semibold">{item.depth}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.priority === 'High' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : item.priority === 'Medium' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 font-mono">
                        {new Date(item.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={pendingPage}
            totalPages={pendingTotalPages}
            onPageChange={setPendingPage}
          />
        </div>

        {/* Failed URLs Table Section */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Crawl Failures & Exclusion Log</h3>
            <p className="text-[11px] text-slate-500">URLs discarded due to HTTP codes or robots exclusions rules.</p>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {failedUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-slate-600 gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
                <span className="text-xs font-semibold text-slate-500">Zero crawling failures encountered. Excellent!</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5">Failure URL Path</th>
                    <th className="py-2.5 text-center">HTTP Code</th>
                    <th className="py-2.5">Failure Reason</th>
                    <th className="py-2.5 text-right">Time</th>
                    <th className="py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {paginatedFailed.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 font-mono font-medium truncate max-w-[200px]" title={item.url}>
                        {item.url}
                      </td>
                      <td className="py-3 text-center text-rose-400 font-mono font-bold">
                        {item.code || 'ERR'}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-bold text-slate-300">
                          {item.error}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleRetrySpecific(item.id)}
                            className="p-1 rounded bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Retry URL"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSpecific(item.id)}
                            className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={failedPage}
            totalPages={failedTotalPages}
            onPageChange={setFailedPage}
          />
        </div>

      </div>

    </MainLayout>
  );
}