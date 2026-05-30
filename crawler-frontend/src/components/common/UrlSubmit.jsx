import  { useState } from 'react';
import { useDispatch } from 'react-redux';
import { submitSeedUrl } from '../../redux/crawlerSlice';
import { toast } from 'react-hot-toast';
import { Link2, Plus } from 'lucide-react';
import axios from 'axios';

export default function UrlSubmit({ user }) {
  const dispatch = useDispatch();
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [priority, setPriority] = useState('High');
  const [bypassRobots, setBypassRobots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return toast.error('URL is required');
    try {
      setIsSubmitting(true);
      // Actual backend submission
      await axios.post('/api/crawler/add-url', {
        url,
        priority,
        depth: parseInt(depth),
        bypassRobots
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      // Trigger crawler to start in case it's paused
      await axios.post('/api/crawler/start', {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      // Update UI optimistically
      dispatch(submitSeedUrl({ url, depth: parseInt(depth), priority }));
      toast.success('Successfully added to Frontier Queue');
      setUrl('');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to submit URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-premium p-6 mb-6 border-l-4 border-l-cyan-500">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          Seed New URL
        </h3>
        <p className="text-[11px] text-slate-500">Inject a new seed URL into the distributed crawler's queue frontier.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target URL</label>
          <input
            type="url"
            required
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="w-full sm:w-32">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Crawl Depth</label>
          <input
            type="number"
            min="1"
            max="10"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="w-full sm:w-32">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="bypassRobots"
            checked={bypassRobots}
            onChange={(e) => setBypassRobots(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20 bg-slate-900/80"
          />
          <label htmlFor="bypassRobots" className="text-xs text-slate-400 font-semibold cursor-pointer select-none">
            Bypass robots.txt
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 w-full sm:w-auto h-9.5"
        >
          <Plus className="w-4 h-4" />
          {isSubmitting ? 'Adding...' : 'Add to Queue'}
        </button>
      </form>
    </div>
  );
}
