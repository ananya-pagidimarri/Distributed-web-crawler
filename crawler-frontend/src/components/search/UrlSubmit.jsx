import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { submitSeedUrl } from '../../redux/crawlerSlice';
import { toast } from 'react-hot-toast';
import { Send, Settings, Sliders, ShieldCheck } from 'lucide-react';

export default function UrlSubmit() {
  const dispatch = useDispatch();
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState('High');
  const [depth, setDepth] = useState(3);
  const [bypassRobots, setBypassRobots] = useState(false);
  const [extractSitemaps, setExtractSitemaps] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('URL path cannot be empty');
      return;
    }
    
    // Quick regex validation
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        toast.error('URL must begin with http:// or https://');
        return;
      }
    } catch (_) {
      toast.error('Please enter a valid HTTP/HTTPS URL path');
      return;
    }

    dispatch(submitSeedUrl({
      url: url.trim(),
      priority,
      depth: parseInt(depth),
      bypassRobots,
      extractSitemaps
    }));

    toast.success('URL successfully queued in the Frontier Frontier!');
    setUrl('');
  };

  return (
    <div className="card-premium p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Send className="text-cyan-400 w-5 h-5" />
          <h2 className="text-lg font-semibold text-white">Seed URL Frontier</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-800 transition-colors ${
            showAdvanced ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5 animate-spin-slow" />
          Crawl Settings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter domain or sitemap path (e.g. https://wikipedia.org/sitemap.xml)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <span>Inject Seed</span>
            <Send className="w-4 h-4" />
          </button>
        </div>

        {showAdvanced && (
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {/* Priority and Depth */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>TRAVERSAL SCOPE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Queue Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="High">High (Immediate)</option>
                    <option value="Medium">Medium (Balanced)</option>
                    <option value="Low">Low (Background)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Max Crawl Depth</label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1">1 (Single Page)</option>
                    <option value="2">2 (Direct Links)</option>
                    <option value="3">3 (Default Recursive)</option>
                    <option value="4">4 (Deeper Scrape)</option>
                    <option value="5">5 (Aggressive DFS)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Extraction Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>POLITENESS & PARSING RULES</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bypassRobots}
                    onChange={(e) => setBypassRobots(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-800 focus:ring-cyan-500 focus:ring-offset-slate-950 focus:ring-2 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-300">
                    Bypass <span className="font-semibold text-amber-500">robots.txt</span> policy checks
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={extractSitemaps}
                    onChange={(e) => setExtractSitemaps(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-800 focus:ring-cyan-500 focus:ring-offset-slate-950 focus:ring-2 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-300">
                    Parse XML Sitemap links recursively
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}