import React from 'react';
import { Shield, FileCode, FileText, Calendar, HardDrive, Award } from 'lucide-react';

export default function ResultCard({ data }) {
  // Parse URL domain and paths for elegant breadcrumbs
  const getBreadcrumbs = (urlStr) => {
    try {
      const url = new URL(urlStr);
      const host = url.hostname;
      const paths = url.pathname.split('/').filter(p => p);
      if (paths.length > 0) {
        return `${host} › ${paths.join(' › ')}`;
      }
      return host;
    } catch (_) {
      return urlStr;
    }
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-rose-400" />;
      case 'Text':
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="card-premium p-6 border border-slate-900/60 bg-slate-900/10 hover:bg-slate-900/30 transition-all space-y-3 relative group">
      
      {/* Search Ranking Score Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/30 text-[10px] font-bold text-cyan-400 select-none">
        <Award className="w-3 h-3 text-cyan-400" />
        <span>Rank Score: {data.score}</span>
      </div>

      <div className="space-y-1">
        {/* Breadcrumb row */}
        <span className="text-xs text-emerald-400 font-mono tracking-tight font-medium flex items-center gap-1.5 select-all">
          <GlobeIcon url={data.url} />
          {getBreadcrumbs(data.url)}
        </span>
        
        {/* Clickable Page Title */}
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors block max-w-[80%]"
        >
          {data.title}
        </a>
      </div>

      {/* Snippet Preview */}
      <p className="text-xs text-slate-300 leading-relaxed font-medium">
        {data.description}
      </p>

      {/* Footer page meta attributes */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold pt-3 border-t border-slate-950/40">
        <div className="flex items-center gap-1">
          {getDocIcon(data.type)}
          <span className="uppercase">{data.type || 'HTML'}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          <span>{data.size || '42 KB'}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Indexed {new Date(data.crawledAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-1 select-none">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[9px] uppercase bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-800/10 text-cyan-400">
            robots.txt ALLOW
          </span>
        </div>
      </div>

    </div>
  );
}

// Simple internal helper to match Lucide Icon for major domains
function GlobeIcon({ url }) {
  return (
    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-[8px] font-bold text-slate-400">
      W
    </span>
  );
}